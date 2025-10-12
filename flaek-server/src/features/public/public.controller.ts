import { Request, Response } from 'express';
import { TenantModel } from '@/features/tenants/tenant.model';

async function getTenantPublic(req: Request, res: Response) {
  const { tenantId } = req.params;
  const tenant = await TenantModel.findById(tenantId).exec();
  if (!tenant) return res.status(404).json({ code: 'not_found', message: 'tenant_not_found' });
  res.json({ publishable_key: tenant.publishableKey, tenant_public_key: tenant.tenantPublicKey, embed_js: 'https://cdn.flaek.dev/embed.min.js' });
}

export const publicController = { getTenantPublic };
