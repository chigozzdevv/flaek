import { jobRepository } from '@/features/jobs/job.repository';
import { Queue, QueueEvents, JobsOptions } from 'bullmq';
import { getRedis } from '@/db/redis';
import { JOB_QUEUE, SUBMIT_JOB_NAME } from '@/features/jobs/queue/job.queue';
import { httpError } from '@/shared/errors';
import { creditService } from '@/features/credits/credit.service';

type IngestSource =
  | { type: 'ephemeral'; ref: string }
  | { type: 'retained'; url: string };

type CreateFromIngestInput = {
  tenantId: string;
  datasetId: string;
  operationId: string;
  source: IngestSource;
  rows: any[];
};

const connection = getRedis();
const submitQueue = new Queue(JOB_QUEUE, { connection });
const queueEvents = new QueueEvents(JOB_QUEUE, { connection });

async function enqueueSubmission(jobId: string) {
  const opts: JobsOptions = {
    removeOnComplete: 100,
    removeOnFail: 100,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000 
    }
  };
  console.log(`[Job Service] Enqueuing job: ${jobId}`);
  const bullJob = await submitQueue.add(SUBMIT_JOB_NAME, { jobId }, opts);
  console.log(`[Job Service] Job enqueued in submit queue with BullMQ ID: ${bullJob.id}`);
}

async function createFromIngest(input: CreateFromIngestInput) {
  await creditService.deduct(input.tenantId, 100, 'job_execution');
  const job = await jobRepository.create({
    tenantId: input.tenantId,
    datasetId: input.datasetId,
    operationId: input.operationId,
    source: input.source,
    status: 'queued',
  });
  await enqueueSubmission(job.id);
  return { job_id: job.id, status: job.status };
}

async function createInline(input: { tenantId: string; datasetId: string; operationId: string; rows: any[]; callbackUrl?: string }) {
  await creditService.deduct(input.tenantId, 100, 'job_execution');
  const job = await jobRepository.create({
    tenantId: input.tenantId,
    datasetId: input.datasetId,
    operationId: input.operationId,
    source: { type: 'inline', rows: input.rows },
    callbackUrl: input.callbackUrl,
    status: 'queued',
  });
  await enqueueSubmission(job.id);
  return { job_id: job.id, status: job.status };
}

async function get(tenantId: string, jobId: string) {
  const job = await jobRepository.get(tenantId, jobId);
  if (!job) throw httpError(404, 'not_found', 'job_not_found');
  return {
    job_id: job.id,
    dataset_id: job.datasetId,
    operation_id: job.operationId,
    status: job.status,
    result: job.result,
    attestation: job.attestation,
    arcium_tx: job.arciumRef,
    cost: job.cost,
    created_at: job.createdAt,
    updated_at: job.updatedAt,
  };
}

async function list(tenantId: string) {
  const items = await jobRepository.list(tenantId);
  return { 
    items: items.map(j => ({ 
      job_id: j.id, 
      dataset_id: j.datasetId,
      operation_id: j.operationId,
      status: j.status, 
      created_at: j.createdAt,
      updated_at: j.updatedAt,
      error: j.error,
    })) 
  };
}

async function cancel(tenantId: string, jobId: string) {
  const job = await jobRepository.get(tenantId, jobId);
  if (!job) throw httpError(404, 'not_found', 'job_not_found');
  
  if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
    throw httpError(400, 'invalid_state', 'Job already finished');
  }
  
  await jobRepository.setStatus(jobId, 'cancelled', { 
    error: 'Job cancelled by user' 
  });
  
  // Try to remove from queue if it's still queued
  try {
    const jobs = await submitQueue.getJobs(['waiting', 'active', 'delayed']);
    for (const bullJob of jobs) {
      if (bullJob.data.jobId === jobId) {
        await bullJob.remove();
      }
    }
  } catch (err) {
    console.error('Failed to remove job from submit queue:', err);
  }
  
  return { job_id: jobId, status: 'cancelled' };
}

export const jobService = { createFromIngest, createInline, get, list, cancel };
