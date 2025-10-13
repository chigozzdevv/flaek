import { JobModel } from '@/features/jobs/job.model';
import { broadcastJobUpdate } from '@/features/jobs/job.sse';

export const jobRepository = {
  async create(data: any) {
    const job = new JobModel(data);
    return job.save();
  },
  async get(tenantId: string, jobId: string) {
    return JobModel.findOne({ _id: jobId, tenantId }).exec();
  },
  async list(tenantId: string, limit = 20) {
    return JobModel.find({ tenantId }).sort({ createdAt: -1 }).limit(limit).exec();
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
