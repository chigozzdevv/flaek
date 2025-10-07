import { Worker } from 'bullmq';
import { getRedis } from '@/db/redis';
import { JOB_QUEUE } from '@/features/jobs/queue/job.queue';
import { JobModel } from '@/features/jobs/job.model';
import { jobRepository } from '@/features/jobs/job.repository';
import { operationRepository } from '@/features/operations/operation.repository';
import { DatasetModel } from '@/features/datasets/dataset.model';
import { getEphemeral, delEphemeral } from '@/features/ingest/ephemeral.store';
import axios from 'axios';
import { ArciumClient } from '@/clients/arcium-client';

export function startSubmitWorker() {
  const connection = getRedis();
  const worker = new Worker(JOB_QUEUE, async (bullJob) => {
    const { jobId } = bullJob.data as { jobId: string };
    const job = await JobModel.findById(jobId).exec();
    if (!job) return;
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
    } else if (job.source.type === 'inline') {
      buffer = Buffer.from(job.source.rows.map((r: any) => JSON.stringify(r)).join('\n'), 'utf8');
    }
    if (!buffer) {
      await jobRepository.setStatus(jobId, 'failed', { error: 'missing_payload' });
      return;
    }

    // SDK integration
    const idl = (op.pipelineSpec && (op.pipelineSpec as any).idl) || undefined;
    if (!op.programId || !op.method || !idl || !process.env.ARCIUM_MXE_PUBLIC_KEY) {
      await jobRepository.setStatus(jobId, 'failed', { error: 'arcium_sdk_configuration_missing', details: { programId: !!op.programId, method: !!op.method, idl: !!idl, mxe: !!process.env.ARCIUM_MXE_PUBLIC_KEY } });
      return;
    }
    const sdk = new ArciumClient();
    const { tx } = await sdk.submit({
      programId: op.programId,
      idl,
      method: op.method,
      accounts: op.accounts || {},
      payload: buffer,
      mxePublicKeyB64: process.env.ARCIUM_MXE_PUBLIC_KEY as string,
    });
    await jobRepository.setStatus(jobId, 'running', { arciumRef: tx });
  }, { connection });

  return worker;
}
