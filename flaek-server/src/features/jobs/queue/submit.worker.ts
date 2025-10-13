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
    // Only process submit jobs
    if (bullJob.name !== 'submit') return;
    
    const { jobId } = bullJob.data as { jobId: string };
    console.log(`[Submit Worker] Processing job: ${jobId}`);
    const job = await JobModel.findById(jobId).exec();
    if (!job) {
      console.error(`[Submit Worker] Job not found: ${jobId}`);
      return;
    }
    
    // Check if job was cancelled before we started processing
    if (job.status === 'cancelled') {
      console.log(`Job ${jobId} was cancelled, skipping execution`);
      return;
    }
    
    console.log(`[Submit Worker] Setting job ${jobId} to running`);
    await jobRepository.setStatus(jobId, 'running');

    const op = await operationRepository.get(job.tenantId, job.operationId);
    const ds = await DatasetModel.findById(job.datasetId).exec();
    if (!op || !ds) {
      await jobRepository.setStatus(jobId, 'failed', { error: 'missing_refs' });
      return;
    }

    let buffer: Buffer | null = null;
    if (job.source.type === 'ephemeral') {
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
    if (!buffer) {
      await jobRepository.setStatus(jobId, 'failed', { error: 'missing_payload' });
      return;
    }

    if (op.pipelineSpec?.type === 'visual_pipeline') {
      console.log(`[Submit Worker] Job ${jobId} is a visual pipeline, executing...`);
      const inputData = buffer ? JSON.parse(buffer.toString()) : {};
      await executePipeline(job, op, inputData);
      console.log(`[Submit Worker] Visual pipeline execution completed for job ${jobId}`);
      return;
    }

    const circuitName = (op as any).pipelineSpec?.circuit_name || (op as any).pipelineSpec?.circuitName;
    if (!op.mxeProgramId || typeof (op as any).compDefOffset !== 'number' || !circuitName) {
      await jobRepository.setStatus(jobId, 'failed', { error: 'arcium_configuration_missing', details: { mxeProgramId: !!op.mxeProgramId, compDefOffset: (op as any).compDefOffset, circuitName } });
      return;
    }
    const sdk = new ArciumClient();
    const { tx, computationOffset, nonceB64, clientPubKeyB64, clientPrivB64 } = await sdk.submitQueue({
      mxeProgramId: op.mxeProgramId,
      compDefOffset: (op as any).compDefOffset as number,
      circuit: circuitName,
      accounts: op.accounts || {},
      payload: buffer,
    });
  
    const { wrapSecret } = await import('@/utils/secret-wrap')
    const wrapped = wrapSecret(Buffer.from(clientPrivB64, 'base64'))
    await jobRepository.setStatus(jobId, 'running', {
      arciumRef: tx,
      mxeProgramId: op.mxeProgramId,
      computationOffset,
      enc: { nonceB64, clientPubKeyB64, privIvB64: wrapped.ivB64, wrappedPrivB64: wrapped.cipherB64, algo: 'rescue' },
    });

    const opts: JobsOptions = { removeOnComplete: 100, removeOnFail: 100, delay: 1000 };
    await queue.add('finalize', { jobId }, opts);
  }, { connection });

  return worker;
}
