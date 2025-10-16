import { Request, Response } from 'express';
import { jobService } from '@/features/jobs/job.service';

async function create(req: Request, res: Response) {
  const tenantId = (req as any).tenantId as string;
  const { dataset_id, operation, encrypted_inputs } = req.body;
  const callbackUrl = req.body?.callback_url as string | undefined;

  if (!encrypted_inputs) {
    res.status(400).json({ code: 'invalid_body', message: 'encrypted_inputs_required' });
    return;
  }

  const out = await jobService.createWithEncryptedInputs({
    tenantId,
    datasetId: dataset_id,
    operationId: operation,
    encryptedInputs: encrypted_inputs,
    callbackUrl
  });
  res.status(202).json(out);
}

async function list(req: Request, res: Response) {
  const tenantId = (req as any).tenantId as string;
  const limitRaw = (req.query.limit as string) || undefined;
  const cursor = (req.query.cursor as string) || undefined;
  const sinceRaw = (req.query.since as string) || undefined;

  let limit: number | undefined = undefined;
  if (limitRaw) {
    const n = parseInt(limitRaw, 10);
    if (!isNaN(n) && n > 0) {
      // cap limit to prevent abuse
      limit = Math.min(n, 200);
    }
  }

  let since: Date | undefined = undefined;
  if (sinceRaw) {
    const d = new Date(sinceRaw);
    if (!isNaN(d.getTime())) {
      since = d;
    }
  }

  const out = await jobService.list(tenantId, { limit, cursor, since });
  res.json(out);
}

async function get(req: Request, res: Response) {
  const tenantId = (req as any).tenantId as string;
  const { jobId } = req.params;
  const out = await jobService.get(tenantId, jobId);
  res.json(out);
}

async function cancel(req: Request, res: Response) {
  const tenantId = (req as any).tenantId as string;
  const { jobId } = req.params;
  await jobService.cancel(tenantId, jobId);
  res.status(202).json({ job_id: jobId, status: 'cancelled' });
}

export const jobController = { create, list, get, cancel };
