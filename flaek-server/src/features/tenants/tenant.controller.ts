import { Request, Response } from 'express';
import { tenantService } from '@/features/tenants/tenant.service';

async function me(req: Request, res: Response) {
  const user = (req as any).user as { sub: string };
  const out = await tenantService.me(user.sub);
  res.json(out);
}

async function createKey(req: Request, res: Response) {
  const user = (req as any).user as { sub: string };
  const { name } = req.body || {};
  const out = await tenantService.createKey(user.sub, name);
  res.status(201).json(out);
}

async function createPublishableKey(req: Request, res: Response) {
  const user = (req as any).user as { sub: string };
  const out = await tenantService.createPublishable(user.sub);
  res.status(201).json(out);
}

async function revokeKey(req: Request, res: Response) {
  const user = (req as any).user as { sub: string };
  const { keyId } = req.params;
  await tenantService.revokeKey(user.sub, keyId);
  res.status(204).end();
}

async function listKeys(req: Request, res: Response) {
  const user = (req as any).user as { sub: string };
  const out = await tenantService.listKeys(user.sub);
  res.json(out);
}

async function updateName(req: Request, res: Response) {
  const user = (req as any).user as { sub: string };
  const { name } = req.body || {};
  const out = await tenantService.updateName(user.sub, name);
  res.json(out);
}

export const tenantController = { me, createKey, createPublishableKey, revokeKey, listKeys, updateName };
