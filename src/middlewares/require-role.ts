import { Request, Response, NextFunction } from 'express';

export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || user.role !== role) return res.status(403).json({ code: 'forbidden', message: 'insufficient_role' });
    next();
  };
}

