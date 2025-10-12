import { Request, Response, NextFunction } from 'express';
import { tenantRepository } from '@/features/tenants/tenant.repository';

export async function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.header('authorization') || '';
  if (!auth.toLowerCase().startsWith('bearer ')) {
    return res.status(401).json({ code: 'unauthorized', message: 'Missing API key' });
  }
  const token = auth.slice(7).trim();
  if (!token) return res.status(401).json({ code: 'unauthorized', message: 'Invalid API key' });

  const tenant = await tenantRepository.findByApiKey(token);
  if (!tenant) return res.status(401).json({ code: 'unauthorized', message: 'Invalid API key' });

  (req as any).tenantId = tenant.id;
  (req as any).tenant = tenant;
  return next();
}
