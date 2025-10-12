import { Worker } from 'bullmq';
import { getRedis } from '@/db/redis';
import { JOB_QUEUE } from '@/features/jobs/queue/job.queue';
import { JobModel } from '@/features/jobs/job.model';
import { jobRepository } from '@/features/jobs/job.repository';
import * as anchor from '@coral-xyz/anchor';
import { Connection, Keypair } from '@solana/web3.js';
import { awaitComputationFinalization, RescueCipher, x25519 } from '@arcium-hq/client';
import axios from 'axios';
import { signHmac } from '@/utils/hmac';
import { env } from '@/config/env';
import { creditService } from '@/features/credits/credit.service';

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
    await jobRepository.setStatus(jobId, 'completed', { attestation, cost });

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
