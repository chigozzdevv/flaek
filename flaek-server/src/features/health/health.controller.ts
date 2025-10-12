import { Request, Response } from 'express';

function index(_req: Request, res: Response) {
  res.json({ status: 'ok', time: new Date().toISOString() });
}

export const healthController = { index };

