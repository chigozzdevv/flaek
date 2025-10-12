import { Request, Response, NextFunction } from 'express';
import { tenantRepository } from '@/features/tenants/tenant.repository';

export async function publishableKeyAuth(req: Request, res: Response, next: NextFunction) {
  const pk = req.header('x-publishable-key');
  if (!pk) return res.status(401).json({ code: 'unauthorized', message: 'Missing publishable key' });
  const tenant = await tenantRepository.findByPublishableKey(pk);
  if (!tenant) return res.status(401).json({ code: 'unauthorized', message: 'Invalid publishable key' });
  (req as any).tenantId = tenant.id;
  (req as any).tenant = tenant;
  next();
}
