import { Worker } from 'bullmq';
import { getRedis } from '@/db/redis';
import { JOB_QUEUE } from '@/features/jobs/queue/job.queue';
import { JobModel } from '@/features/jobs/job.model';
import { jobRepository } from '@/features/jobs/job.repository';
import * as anchor from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { awaitComputationFinalization, RescueCipher, x25519, getComputationAccAddress, getArciumProgram } from '@arcium-hq/client';
import { getComputationAccInfo } from '@arcium-hq/reader';
import axios from 'axios';
import { signHmac } from '@/utils/hmac';
import { env } from '@/config/env';
import { creditService } from '@/features/credits/credit.service';
import { unwrapSecret } from '@/utils/secret-wrap';

export function startResultWorker() {
  const connection = getRedis();
  const worker = new Worker(JOB_QUEUE, async (bullJob) => {
    if (bullJob.name !== 'finalize') return;
    const { jobId } = bullJob.data as { jobId: string };
    const job = await JobModel.findById(jobId).exec();
    if (!job) return;
    if (!job.mxeProgramId || !job.computationOffset) return;

    const rpc = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
    const conn = new Connection(rpc, 'confirmed');
    const secret = process.env.ARCIUM_SOLANA_SECRET_KEY;
    if (!secret) throw new Error('ARCIUM_SOLANA_SECRET_KEY not set');
    const kp = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(secret)));
    const wallet = new anchor.Wallet(kp);
    const provider = new anchor.AnchorProvider(conn, wallet, { commitment: 'confirmed' });
    anchor.setProvider(provider);

    const finalizeSig = await awaitComputationFinalization(
      provider as any,
      new (anchor as any).BN(job.computationOffset),
      new (anchor.web3 as any).PublicKey(job.mxeProgramId),
      'finalized'
    );

    let result: any = null;

    if (job.enc && job.enc.privIvB64 && job.enc.wrappedPrivB64) {
      try {
        const clientPrivKey = unwrapSecret(job.enc.privIvB64, job.enc.wrappedPrivB64);
        const mxePublicKeyBytes = Buffer.from(job.enc.clientPubKeyB64, 'base64');
        const nonce = new Uint8Array(Buffer.from(job.enc.nonceB64, 'base64'));

        const sharedSecret = x25519.getSharedSecret(clientPrivKey, mxePublicKeyBytes);
        const cipher = new RescueCipher(sharedSecret);

        const compAcc = getComputationAccAddress(
          new PublicKey(job.mxeProgramId),
          new (anchor as any).BN(job.computationOffset)
        );

        const arciumProgram = getArciumProgram(provider as any);
        const computationAccount = await getComputationAccInfo(arciumProgram, compAcc, 'confirmed');

        if (computationAccount && computationAccount.output) {
          const output = computationAccount.output as any;

          // Normalize encrypted output into two 16-byte parts of number[] as expected by RescueCipher
          let parts: number[][] | null = null;
          // Common SDK shapes
          if (output?.ct0 && output?.ct1) {
            parts = [Array.from(new Uint8Array(output.ct0)), Array.from(new Uint8Array(output.ct1))];
          } else if (Array.isArray(output?.parts) && output.parts.length >= 2) {
            parts = [Array.from(new Uint8Array(output.parts[0])), Array.from(new Uint8Array(output.parts[1]))];
          } else if (output?.encrypted && Array.isArray(output.encrypted)) {
            const flat = new Uint8Array(output.encrypted.flat());
            if (flat.length >= 32) parts = [Array.from(flat.slice(0, 16)), Array.from(flat.slice(16, 32))];
          } else if (output?.encryptedU8 && Array.isArray(output.encryptedU8)) {
            const flat = new Uint8Array(output.encryptedU8.flat());
            if (flat.length >= 32) parts = [Array.from(flat.slice(0, 16)), Array.from(flat.slice(16, 32))];
          } else if (Array.isArray(output)) {
            const flat = new Uint8Array(output.flat());
            if (flat.length >= 32) parts = [Array.from(flat.slice(0, 16)), Array.from(flat.slice(16, 32))];
          }

          if (parts) {
            const decrypted = (cipher as any).decrypt(parts, nonce);

            // Normalize decrypted into bytes
            let outBytes: Uint8Array = new Uint8Array();
            const toBytesFromBigint = (b: bigint, size = 16) => {
              const hex = b.toString(16);
              const padded = hex.padStart(size * 2, '0');
              return new Uint8Array(Buffer.from(padded, 'hex'));
            };
            if (decrypted instanceof Uint8Array) {
              outBytes = decrypted;
            } else if (Array.isArray(decrypted)) {
              if (decrypted.length && typeof decrypted[0] === 'number') {
                outBytes = new Uint8Array(decrypted as number[]);
              } else if (decrypted.length && typeof decrypted[0] === 'bigint') {
                const chunks = (decrypted as bigint[]).map((bi) => toBytesFromBigint(bi));
                outBytes = new Uint8Array(Buffer.concat(chunks.map((u) => Buffer.from(u))).values() as any);
              } else if (Array.isArray(decrypted[0])) {
                const flat = (decrypted as any[]).flat();
                if (flat.length && typeof flat[0] === 'number') {
                  outBytes = new Uint8Array(flat as number[]);
                } else if (flat.length && typeof flat[0] === 'bigint') {
                  const chunks = (flat as bigint[]).map((bi) => toBytesFromBigint(bi));
                  outBytes = new Uint8Array(Buffer.concat(chunks.map((u) => Buffer.from(u))).values() as any);
                }
              }
            } else if (typeof decrypted === 'string') {
              outBytes = new TextEncoder().encode(decrypted);
            }

            try {
              const str = Buffer.from(outBytes).toString('utf8').replace(/\0/g, '');
              result = JSON.parse(str);
            } catch {
              try {
                const num = Buffer.from(outBytes).readBigUInt64LE(0);
                result = { value: Number(num), encrypted: false };
              } catch {
                result = { value: Buffer.from(outBytes).toString('hex'), encrypted: false };
              }
            }
          }
        }
      } catch (err) {
        console.error('Decryption failed:', err);
        result = { error: 'Failed to decrypt result', encrypted: true };
      }
    }

    const attestation = {
      provider: 'arcium',
      finalize_tx: finalizeSig,
      mxe_program_id: job.mxeProgramId,
      computation_offset: job.computationOffset,
      status: 'finalized',
    };

    const cost = {
      compute_usd: 0.001,
      chain_usd: 0.00001,
      credits_used: 1,
    };

    await creditService.deduct(job.tenantId, 1, 'computation_fee', jobId);
    await jobRepository.setStatus(jobId, 'completed', { result, attestation, cost });

    if (job.callbackUrl) {
      const payload = JSON.stringify({ job_id: job.id, status: 'completed', attestation, result });
      const sig = signHmac(env.WEBHOOK_SECRET, payload);
      try {
        await axios.post(job.callbackUrl, payload, { headers: { 'content-type': 'application/json', 'x-flaek-signature': sig } });
      } catch {}
    }
  }, { connection });

  return worker;
}
