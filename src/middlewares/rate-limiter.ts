import { Request, Response, NextFunction } from 'express';
import { getRedis } from '@/db/redis';

export function rateLimiter(limit: number, windowSeconds: number) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const tenantId = (req as any).tenantId || req.ip;
    const redis = getRedis();
    const key = `ratelimit:${tenantId}:${req.path}`;
    const current = await redis.incr(key);
    if (current === 1) await redis.expire(key, windowSeconds);
    if (current > limit) return res.status(429).json({ code: 'rate_limited', message: 'Too many requests' });
    next();
  };
}

