import { Request, Response } from 'express';
import { datasetService } from '@/features/datasets/dataset.service';

async function create(req: Request, res: Response) {
  const tenantId = (req as any).tenantId as string;
  const { name, schema, retention_days } = req.body;
  const ds = await datasetService.create(tenantId, name, schema, retention_days);
  res.status(201).json({ dataset_id: ds.id });
}

async function list(req: Request, res: Response) {
  const tenantId = (req as any).tenantId as string;
  const out = await datasetService.list(tenantId);
  res.json(out);
}

async function get(req: Request, res: Response) {
  const tenantId = (req as any).tenantId as string;
  const { datasetId } = req.params;
  const out = await datasetService.get(tenantId, datasetId);
  res.json(out);
}

async function ingest(req: Request, res: Response) {
  const tenantId = (req as any).tenantId as string;
  const { datasetId } = req.params;
  const body = req.body as string;
  const run = typeof req.query.run === 'string' ? req.query.run : undefined;
  const contentType = req.header('content-type') || '';
  const out = await datasetService.ingest(tenantId, datasetId, body, contentType, run);
  res.status(202).json(out);
}

export const datasetController = { create, list, get, ingest };
