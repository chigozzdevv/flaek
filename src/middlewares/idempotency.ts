import { Request, Response, NextFunction } from 'express';
import { getRedis } from '../db/redis';

export function idempotency(windowSeconds = 3600) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = req.header('idempotency-key');
    if (!key) return next();
    const redis = getRedis();
    const cacheKey = `idem:${key}`;
    const exists = await redis.get(cacheKey);
    if (exists) return res.status(409).json({ code: 'idempotency_conflict', message: 'Idempotency key already used' });
    await redis.set(cacheKey, '1', 'EX', windowSeconds);
    next();
  };
}

