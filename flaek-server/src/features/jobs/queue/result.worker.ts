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
    if (bullJob.name !== 'finalize') {
      console.log(`[Result Worker] Wrong job type: ${bullJob.name} (ID: ${bullJob.id}) - requeueing`);
      await bullJob.moveToDelayed(Date.now() + 100, bullJob.token!);
      return;
    }

    const { jobId } = bullJob.data as { jobId: string };
    console.log(`[Result Worker] Processing finalization for job: ${jobId} (BullMQ ID: ${bullJob.id})`);

    const job = await JobModel.findById(jobId).exec();
    if (!job) {
      console.error(`[Result Worker] Job not found in DB: ${jobId}`);
      return;
    }

    // Check if job was cancelled
    if (job.status === 'cancelled') {
      console.log(`[Result Worker] Job ${jobId} was cancelled, skipping finalization`);
      return;
    }

    if (!job.mxeProgramId || !job.computationOffset) {
      console.error(`[Result Worker] Missing Arcium data for job ${jobId}:`, {
        hasMxeProgramId: !!job.mxeProgramId,
        hasComputationOffset: !!job.computationOffset
      });
      await jobRepository.setStatus(jobId, 'failed', {
        error: 'missing_arcium_data',
        details: 'Job missing mxeProgramId or computationOffset'
      });
      return;
    }

    console.log(`[Result Worker] Awaiting computation finalization for job ${jobId}...`);

    const rpc = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
    const conn = new Connection(rpc, 'confirmed');
    const secret = process.env.ARCIUM_SOLANA_SECRET_KEY;
    if (!secret) throw new Error('ARCIUM_SOLANA_SECRET_KEY not set');
    const kp = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(secret)));
    const wallet = new anchor.Wallet(kp);
    const provider = new anchor.AnchorProvider(conn, wallet, { commitment: 'confirmed' });
    anchor.setProvider(provider);

    let finalizeSig: string;
    try {
      const FINALIZATION_TIMEOUT = 5 * 60 * 1000; // 5 minutes
      finalizeSig = await Promise.race([
        awaitComputationFinalization(
          provider as any,
          new (anchor as any).BN(job.computationOffset),
          new (anchor.web3 as any).PublicKey(job.mxeProgramId),
          'finalized'
        ),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Computation finalization timeout after 5 minutes')),
          FINALIZATION_TIMEOUT)
        )
      ]);
      console.log(`[Result Worker] Computation finalized for job ${jobId}, sig: ${finalizeSig}`);
    } catch (error: any) {
      console.error(`[Result Worker] Finalization failed for job ${jobId}:`, error.message);
      await jobRepository.setStatus(jobId, 'failed', {
        error: 'finalization_failed',
        details: error.message
      });
      throw error; // Re-throw to let BullMQ handle retries
    }

    let result: any = null;

    try {
      const compAcc = getComputationAccAddress(
        new PublicKey(job.mxeProgramId),
        new (anchor as any).BN(job.computationOffset)
      );

      const arciumProgram = getArciumProgram(provider as any);
      const computationAccount = await getComputationAccInfo(arciumProgram, compAcc, 'finalized');

      if (computationAccount && computationAccount.output) {
        const output = computationAccount.output as any;

        console.log(`[Result Worker] Returning encrypted result for job ${jobId} (confidential computing)`);

        const ciphertexts: number[][] = [];
        if (output?.ct0 && output?.ct1) {
          ciphertexts.push(Array.from(new Uint8Array(output.ct0)));
          ciphertexts.push(Array.from(new Uint8Array(output.ct1)));
        } else if (Array.isArray(output?.parts) && output.parts.length > 0) {
          for (const p of output.parts) ciphertexts.push(Array.from(new Uint8Array(p)));
        } else if (output?.encrypted && Array.isArray(output.encrypted)) {
          const flat = new Uint8Array(output.encrypted.flat());
          for (let i = 0; i + 32 <= flat.length; i += 32) ciphertexts.push(Array.from(flat.slice(i, i + 32)));
        } else if (output?.encryptedU8 && Array.isArray(output.encryptedU8)) {
          const flat = new Uint8Array(output.encryptedU8.flat());
          for (let i = 0; i + 32 <= flat.length; i += 32) ciphertexts.push(Array.from(flat.slice(i, i + 32)));
        } else if (Array.isArray(output)) {
          const flat = new Uint8Array(output.flat());
          for (let i = 0; i + 32 <= flat.length; i += 32) ciphertexts.push(Array.from(flat.slice(i, i + 32)));
        }

        if (ciphertexts.length > 0) {
          const base: any = {
            encrypted: true,
            ciphertexts,
            nonce: job.enc?.nonceB64 || null,
            client_public_key_b64: job.enc?.clientPubKeyB64 || null,
          };
          if (ciphertexts.length === 2) {
            base.ct0 = ciphertexts[0];
            base.ct1 = ciphertexts[1];
          }
          result = base;
        } else {
          result = { error: 'Could not extract encrypted output from computation', encrypted: false };
        }
      } else {
        result = { error: 'No output from computation', encrypted: false };
      }
    } catch (err: any) {
      console.error(`[Result Worker] Failed to fetch encrypted result for job ${jobId}:`, err.message);
      result = { error: 'Failed to fetch result', details: err.message, encrypted: false };
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
  }, {
    connection,
    concurrency: 3, // Process up to 3 finalization jobs in parallel
    limiter: {
      max: 5, // Max 5 jobs
      duration: 1000 // Per second
    }
  });

  // Add error handler
  worker.on('failed', (job, err) => {
    console.error(`[Result Worker] Job ${job?.id} failed after all retries:`, err.message);
  });

  worker.on('error', (err) => {
    console.error('[Result Worker] Worker error:', err.message);
  });

  return worker;
}
