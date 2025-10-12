import { Request, Response } from 'express';

function test(_req: Request, res: Response) { res.json({ delivered: true }); }

export const webhookController = { test };

