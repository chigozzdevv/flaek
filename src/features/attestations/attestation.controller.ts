import { Request, Response } from 'express';
import { JobModel } from '@/features/jobs/job.model';

async function get(req: Request, res: Response) {
  const { jobId } = req.params;
  const job = await JobModel.findById(jobId).exec();
  if (!job) return res.status(404).json({ code: 'not_found', message: 'job_not_found' });
  return res.json({ attestation: job.attestation || null });
}

async function verify(req: Request, res: Response) {
  const { jobId } = req.body || {};
  const job = jobId ? await JobModel.findById(jobId).exec() : null;
  if (!job) return res.status(404).json({ code: 'not_found', message: 'job_not_found' });
  const valid = !!(job.attestation && job.attestation.status === 'finalized');
  return res.json({ valid, attestation: job.attestation || null });
}

export const attestationController = { get, verify };
