import { Request, Response } from 'express';
import { jobService } from '@/features/jobs/job.service';
import { addSSEClient } from '@/features/jobs/job.sse';

async function events(req: Request, res: Response) {
  const tenantId = (req as any).tenantId as string;
  addSSEClient(tenantId, res);
}

async function create(req: Request, res: Response) {
  const tenantId = (req as any).tenantId as string;
  const { dataset_id, operation, inputs } = req.body;
  const callbackUrl = req.body?.callback_url as string | undefined;
  if (inputs && Array.isArray(inputs)) {
    const out = await jobService.createInline({ tenantId, datasetId: dataset_id, operationId: operation, rows: inputs, callbackUrl });
    res.status(202).json(out);
  } else {
    res.status(400).json({ code: 'invalid_body', message: 'inputs_required_for_inline_job_or_use_ingest_run' });
  }
}

async function list(req: Request, res: Response) {
  const tenantId = (req as any).tenantId as string;
  const out = await jobService.list(tenantId);
  res.json(out);
}

async function get(req: Request, res: Response) {
  const tenantId = (req as any).tenantId as string;
  const { jobId } = req.params;
  const out = await jobService.get(tenantId, jobId);
  res.json(out);
}

function cancel(_req: Request, res: Response) { res.status(202).json({ job_id: 'job_x', status: 'cancelling' }); }

export const jobController = { events, create, list, get, cancel };
