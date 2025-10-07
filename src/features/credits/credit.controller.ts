import { Request, Response } from 'express';

function getBalance(_req: Request, res: Response) { res.json({ balance_cents: 0, plan: 'free' }); }
function topup(_req: Request, res: Response) { res.status(201).json({ balance_cents: 0 }); }
function ledger(_req: Request, res: Response) { res.json({ items: [], next_cursor: null }); }

export const creditController = { getBalance, topup, ledger };

