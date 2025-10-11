import { Request, Response } from 'express';
import { creditService } from '@/features/credits/credit.service';

async function getBalance(req: Request, res: Response) {
  const tenantId = (req as any).tenantId as string;
  const out = await creditService.getBalance(tenantId);
  res.json(out);
}

async function topup(req: Request, res: Response) {
  const tenantId = (req as any).tenantId as string;
  const { amount_cents } = req.body;
  const out = await creditService.topup(tenantId, amount_cents || 10000);
  res.status(201).json(out);
}

async function ledger(req: Request, res: Response) {
  const tenantId = (req as any).tenantId as string;
  const limit = parseInt(req.query.limit as string) || 50;
  const cursor = req.query.cursor as string;
  const out = await creditService.ledger(tenantId, limit, cursor);
  res.json(out);
}

export const creditController = { getBalance, topup, ledger };

