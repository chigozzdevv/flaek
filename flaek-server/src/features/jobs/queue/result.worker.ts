import { Worker } from 'bullmq';
import { getRedis } from '@/db/redis';
import { JOB_QUEUE } from '@/features/jobs/queue/job.queue';
import { JobModel } from '@/features/jobs/job.model';
import { jobRepository } from '@/features/jobs/job.repository';
import * as anchor from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { awaitComputationFinalization, RescueCipher, x25519, getComputationAccAddress, deserializeLE } from '@arcium-hq/client';
import axios from 'axios';
import { signHmac } from '@/utils/hmac';
import { env } from '@/config/env';
import { creditService } from '@/features/credits/credit.service';
import * as crypto from 'crypto';

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

    if (job.enc) {
      try {
        const compAcc = getComputationAccAddress(
          new PublicKey(job.mxeProgramId),
          new (anchor as any).BN(job.computationOffset)
        );

        let encParts: Uint8Array[] | null = null;
        // Try to use Arciu Reader if available
        try {
          const reader: any = await import('@arcium-hq/reader').catch(() => null)
          if (reader) {
            const candidates = ['readComputationResult', 'getComputationResult', 'fetchComputationResult', 'readResult']
            for (const fn of candidates) {
              if (typeof reader[fn] === 'function') {
                const rr = await reader[fn](provider as any, new (anchor as any).BN(job.computationOffset), new PublicKey(job.mxeProgramId))
                if (rr?.ct0 && rr?.ct1) {
                  encParts = [new Uint8Array(rr.ct0), new Uint8Array(rr.ct1)]
                } else if (Array.isArray(rr?.parts) && rr.parts.length >= 2) {
                  encParts = [new Uint8Array(rr.parts[0]), new Uint8Array(rr.parts[1])]
                } else if (rr instanceof Uint8Array || Buffer.isBuffer(rr)) {
                  const buf = Buffer.from(rr as any)
                  if (buf.length >= 32) encParts = [new Uint8Array(buf.slice(0, 16)), new Uint8Array(buf.slice(16, 32))]
                }
                break
              }
            }
          }
        } catch {}

        if (!encParts) {
          const accountInfo = await conn.getAccountInfo(compAcc);
          if (accountInfo && accountInfo.data.length > 0) {
            const data = accountInfo.data;
            const outputOffset = 8 + 32 + 32 + 1 + 1;
            if (data.length > outputOffset + 32) {
              const encryptedOutput = data.slice(outputOffset, outputOffset + 32);
              encParts = [new Uint8Array(encryptedOutput.slice(0, 16)), new Uint8Array(encryptedOutput.slice(16, 32))]
            }
          }
        }

            const clientPubKey = Buffer.from(job.enc.clientPubKeyB64, 'base64');
            const nonce = Buffer.from(job.enc.nonceB64, 'base64');

            // Unwrap the ephemeral private key used at submission time
            const { unwrapSecret } = await import('@/utils/secret-wrap')
            if (!job.enc.privIvB64 || !job.enc.wrappedPrivB64) throw new Error('missing_wrapped_priv')
            const clientPrivKey = Buffer.from(unwrapSecret(job.enc.privIvB64, job.enc.wrappedPrivB64))

            const sharedSecret = x25519.getSharedSecret(clientPrivKey, clientPubKey);
            const cipher = new RescueCipher(sharedSecret);

            const nonceBytes = new Uint8Array(nonce);
            if (!encParts) throw new Error('missing_encrypted_output')
            const decrypted = cipher.decrypt(encParts as any, nonceBytes) as any
            // decrypted may be limbs or bytes depending on SDK; normalize to bytes
            let outBytes: Buffer
            if (Array.isArray(decrypted)) {
              // assume array of Uint8Array
              outBytes = Buffer.concat(decrypted.map((u: Uint8Array) => Buffer.from(u)))
            } else if (decrypted instanceof Uint8Array) {
              outBytes = Buffer.from(decrypted)
            } else {
              // fallback string
              outBytes = Buffer.from(String(decrypted))
            }
            // Try parse JSON, else hex string
            try {
              const parsed = JSON.parse(outBytes.toString('utf8'))
              result = parsed
            } catch {
              result = { bytes_hex: outBytes.toString('hex') }
            }
          }
        }
      } catch (err) {
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
      const payload = JSON.stringify({ job_id: job.id, status: 'completed', attestation });
      const sig = signHmac(env.WEBHOOK_SECRET, payload);
      try {
        await axios.post(job.callbackUrl, payload, { headers: { 'content-type': 'application/json', 'x-flaek-signature': sig } });
      } catch {}
    }
  }, { connection });

  return worker;
}
