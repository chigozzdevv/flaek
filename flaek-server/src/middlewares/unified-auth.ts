import { Request, Response, NextFunction } from 'express';
import { tenantRepository } from '@/features/tenants/tenant.repository';
import { verifyJwt } from '@/utils/jwt';
import { userRepository } from '@/features/auth/user.repository';

export async function unifiedAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.header('authorization') || '';
  if (!auth.toLowerCase().startsWith('bearer ')) {
    return res.status(401).json({ code: 'unauthorized', message: 'Missing authorization token' });
  }
  
  const token = auth.slice(7).trim();
  if (!token) {
    return res.status(401).json({ code: 'unauthorized', message: 'Invalid authorization token' });
  }

  // Try API key first
  const tenantByApiKey = await tenantRepository.findByApiKey(token);
  if (tenantByApiKey) {
    (req as any).tenantId = tenantByApiKey.id;
    (req as any).tenant = tenantByApiKey;
    return next();
  }

  // Try JWT
  try {
    const claims = verifyJwt<{ sub: string; role: string }>(token);
    const user = await userRepository.findById(claims.sub);
    if (!user) {
      return res.status(401).json({ code: 'unauthorized', message: 'User not found' });
    }
    
    const tenant = await tenantRepository.findByOwnerUserId(user.id);
    if (!tenant) {
      return res.status(401).json({ code: 'unauthorized', message: 'Tenant not found' });
    }

    (req as any).user = claims;
    (req as any).tenantId = tenant.id;
    (req as any).tenant = tenant;
    return next();
  } catch {
    return res.status(401).json({ code: 'unauthorized', message: 'Invalid authorization token' });
  }
}
