import { Request, Response } from 'express';
import { datasetService } from '@/features/datasets/dataset.service';

async function create(req: Request, res: Response) {
  const tenantId = (req as any).tenantId as string;
  const { name, schema } = req.body;
  const ds = await datasetService.create(tenantId, name, schema);
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

async function update(req: Request, res: Response) {
  const tenantId = (req as any).tenantId as string;
  const { datasetId } = req.params;
  const { name, schema } = req.body;
  const out = await datasetService.update(tenantId, datasetId, { name, schema });
  res.json(out);
}

async function deprecate(req: Request, res: Response) {
  const tenantId = (req as any).tenantId as string;
  const { datasetId } = req.params;
  const out = await datasetService.deprecate(tenantId, datasetId);
  res.json(out);
}

export const datasetController = { create, list, get, update, deprecate };
