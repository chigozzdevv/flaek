import { Request, Response, NextFunction } from 'express';
import { verifyJwt } from '@/utils/jwt';

export interface AuthClaims { sub: string; role: string }

export function jwtAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.header('authorization') || '';
  if (!auth.toLowerCase().startsWith('bearer ')) return res.status(401).json({ code: 'unauthorized', message: 'Missing JWT' });
  const token = auth.slice(7).trim();
  try {
    const claims = verifyJwt<AuthClaims>(token);
    (req as any).user = claims;
    return next();
  } catch {
    return res.status(401).json({ code: 'unauthorized', message: 'Invalid JWT' });
  }
}
