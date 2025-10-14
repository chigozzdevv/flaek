import { Worker, Queue, JobsOptions } from 'bullmq';
import { getRedis } from '@/db/redis';
import { JOB_QUEUE } from '@/features/jobs/queue/job.queue';
import { JobModel } from '@/features/jobs/job.model';
import { jobRepository } from '@/features/jobs/job.repository';
import { operationRepository } from '@/features/operations/operation.repository';
import { DatasetModel } from '@/features/datasets/dataset.model';
import { getEphemeral, delEphemeral } from '@/features/ingest/ephemeral.store';
import axios from 'axios';
import { ArciumClient } from '@/clients/arcium-client';
import { sha256Hex } from '@/utils/hash';
import { executePipeline } from './pipeline.executor';

export function startSubmitWorker() {
  const connection = getRedis();
  const queue = new Queue(JOB_QUEUE, { connection });
  const worker = new Worker(JOB_QUEUE, async (bullJob) => {
    if (bullJob.name !== 'submit') {
      console.log(`[Submit Worker] Wrong job type: ${bullJob.name} (ID: ${bullJob.id}) - requeueing`);
      await bullJob.moveToDelayed(Date.now() + 100, bullJob.token!);
      return;
    }

    const { jobId } = bullJob.data as { jobId: string };
    console.log(`[Submit Worker] Processing job: ${jobId} (BullMQ ID: ${bullJob.id})`);
    const job = await JobModel.findById(jobId).exec();
    if (!job) {
      console.error(`[Submit Worker] Job not found in DB: ${jobId}`);
      return;
    }

    // Check if job was cancelled before we started processing
    if (job.status === 'cancelled') {
      console.log(`[Submit Worker] Job ${jobId} was cancelled, skipping execution`);
      return;
    }

    console.log(`[Submit Worker] Setting job ${jobId} to running`);
    await jobRepository.setStatus(jobId, 'running');

    const op = await operationRepository.get(job.tenantId, job.operationId);
    const ds = await DatasetModel.findById(job.datasetId).exec();
    if (!op || !ds) {
      console.error(`[Submit Worker] Missing refs for job ${jobId}: op=${!!op}, ds=${!!ds}`);
      await jobRepository.setStatus(jobId, 'failed', { error: 'missing_refs' });
      return;
    }

    let buffer: Buffer | null = null;
    let clientEncryptedData: any = null;

    if (job.source.type === 'encrypted') {
      clientEncryptedData = job.source.data;
      console.log(`[Submit Worker] Using client-encrypted data for job ${jobId}`);
    } else if (job.source.type === 'ephemeral') {
      buffer = await getEphemeral(job.source.ref);
      await delEphemeral(job.source.ref).catch(() => {});
    } else if (job.source.type === 'retained') {
      const res = await axios.get(job.source.url, { responseType: 'arraybuffer' });
      buffer = Buffer.from(res.data);
      try {
        if (ds && Array.isArray(ds.batches)) {
          const batch = ds.batches.find((b: any) => b.url === job.source.url);
          if (batch) {
            const calc = sha256Hex(buffer);
            if (batch.sha256 !== calc) {
              await jobRepository.setStatus(jobId, 'failed', { error: 'sha256_mismatch' });
              return;
            }
          }
        }
      } catch {}
    } else if (job.source.type === 'inline') {
      buffer = Buffer.from(job.source.rows.map((r: any) => JSON.stringify(r)).join('\n'), 'utf8');
    }

    if (!buffer && !clientEncryptedData) {
      console.error(`[Submit Worker] No buffer or encrypted data for job ${jobId}, source type: ${job.source.type}`);
      await jobRepository.setStatus(jobId, 'failed', { error: 'missing_payload' });
      return;
    }

    if (op.pipelineSpec?.type === 'visual_pipeline') {
      console.log(`[Submit Worker] Job ${jobId} is a visual pipeline, executing...`);
      const inputData = clientEncryptedData || (buffer ? JSON.parse(buffer.toString()) : {});
      await executePipeline(job, op, inputData, clientEncryptedData ? 'encrypted' : 'plaintext');
      console.log(`[Submit Worker] Visual pipeline execution completed for job ${jobId}`);
      return;
    }

    const circuitName = (op as any).pipelineSpec?.circuit_name || (op as any).pipelineSpec?.circuitName;
    if (!op.mxeProgramId || typeof (op as any).compDefOffset !== 'number' || !circuitName) {
      console.error(`[Submit Worker] Missing Arcium config for job ${jobId}:`, {
        mxeProgramId: !!op.mxeProgramId,
        compDefOffset: (op as any).compDefOffset,
        circuitName,
        pipelineSpec: op.pipelineSpec
      });
      await jobRepository.setStatus(jobId, 'failed', { error: 'arcium_configuration_missing', details: { mxeProgramId: !!op.mxeProgramId, compDefOffset: (op as any).compDefOffset, circuitName } });
      return;
    }

    console.log(`[Submit Worker] Submitting to Arcium for job ${jobId}...`);

    try {
      const sdk = new ArciumClient();
      const { tx, computationOffset, nonceB64, clientPubKeyB64, clientPrivB64 } = await sdk.submitQueue({
        mxeProgramId: op.mxeProgramId,
        compDefOffset: (op as any).compDefOffset as number,
        circuit: circuitName,
        accounts: op.accounts || {},
        payload: buffer,
      });

      console.log(`[Submit Worker] Arcium submission successful for job ${jobId}, tx: ${tx}`);

      const { wrapSecret } = await import('@/utils/secret-wrap')
      const wrapped = wrapSecret(Buffer.from(clientPrivB64, 'base64'))
      await jobRepository.setStatus(jobId, 'running', {
        arciumRef: tx,
        mxeProgramId: op.mxeProgramId,
        computationOffset,
        enc: { nonceB64, clientPubKeyB64, privIvB64: wrapped.ivB64, wrappedPrivB64: wrapped.cipherB64, algo: 'rescue' },
      });

      const opts: JobsOptions = {
        removeOnComplete: 100,
        removeOnFail: 100,
        delay: 5000, // Wait 5 seconds before starting finalization
        attempts: 5, // Retry up to 5 times for finalization
        backoff: {
          type: 'exponential',
          delay: 3000 // Start with 3 seconds
        }
      };
      console.log(`[Submit Worker] Queueing finalize job for ${jobId} with 5s delay`);
      await queue.add('finalize', { jobId }, opts);
    } catch (error: any) {
      console.error(`[Submit Worker] Arcium submission failed for job ${jobId}:`, error.message);
      await jobRepository.setStatus(jobId, 'failed', {
        error: 'arcium_submission_failed',
        details: error.message,
        stack: error.stack?.split('\n').slice(0, 3).join('\n')
      });
      throw error; // Re-throw to let BullMQ handle retries
    }
  }, {
    connection,
    concurrency: 5, // Process up to 5 jobs in parallel
    limiter: {
      max: 10, // Max 10 jobs
      duration: 1000 // Per second
    }
  });

  // Add error handler
  worker.on('failed', (job, err) => {
    console.error(`[Submit Worker] Job ${job?.id} failed after all retries:`, err.message);
  });

  worker.on('error', (err) => {
    console.error('[Submit Worker] Worker error:', err.message);
  });

  return worker;
}
