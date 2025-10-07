import { JobModel } from '@/features/jobs/job.model';

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
    return JobModel.findByIdAndUpdate(jobId, { status, ...patch }, { new: true }).exec();
  },
};

