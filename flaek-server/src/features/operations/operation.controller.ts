import { Request, Response } from 'express';
import { operationService } from '@/features/operations/operation.service';

async function create(req: Request, res: Response) {
  const tenantId = (req as any).tenantId as string;
  const out = await operationService.create(tenantId, req.body);
  res.status(201).json(out);
}
async function list(req: Request, res: Response) {
  const tenantId = (req as any).tenantId as string;
  const out = await operationService.list(tenantId);
  res.json(out);
}
async function get(req: Request, res: Response) {
  const tenantId = (req as any).tenantId as string;
  const { operationId } = req.params;
  const out = await operationService.get(tenantId, operationId);
  res.json(out);
}
async function update(req: Request, res: Response) {
  const tenantId = (req as any).tenantId as string;
  const { operationId } = req.params;
  const { name, version } = req.body;
  const out = await operationService.update(tenantId, operationId, { name, version });
  res.json(out);
}

async function deprecate(req: Request, res: Response) {
  const tenantId = (req as any).tenantId as string;
  const { operationId } = req.params;
  await operationService.deprecate(tenantId, operationId);
  res.status(204).end();
}

export const operationController = { create, list, get, update, deprecate };
