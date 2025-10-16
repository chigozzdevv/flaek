import { JobModel } from '@/features/jobs/job.model';
import { broadcastJobUpdate } from '@/features/jobs/job.socket';

export const jobRepository = {
  async create(data: any) {
    const job = new JobModel(data);
    return job.save();
  },
  async get(tenantId: string, jobId: string) {
    return JobModel.findOne({ _id: jobId, tenantId }).exec();
  },
  async list(tenantId: string, limit: number = 20, cursor?: string, since?: Date) {
    const query: any = { tenantId };
    if (since) {
      query.createdAt = { $gte: since };
    }
    if (cursor) {
      query._id = { $lt: cursor };
    }
    const items = await JobModel.find(query).sort({ _id: -1 }).limit(limit).exec();
    const nextCursor = items.length === limit ? items[items.length - 1].id : null;
    return { items, nextCursor } as const;
  },
  async setStatus(jobId: string, status: string, patch: any = {}) {
    const job = await JobModel.findByIdAndUpdate(jobId, { status, ...patch }, { new: true }).exec();
    
    // Broadcast update via SSE
    if (job) {
      broadcastJobUpdate(job.tenantId, {
        type: 'job.update',
        job_id: job.id,
        status: job.status,
        updated_at: job.updatedAt,
        ...patch,
      });
    }
    
    return job;
  },
  async setResult(jobId: string, result: any) {
    return JobModel.findByIdAndUpdate(jobId, { result }, { new: true }).exec();
  },
};
