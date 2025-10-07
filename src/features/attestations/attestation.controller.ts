import { Request, Response } from 'express';

function get(_req: Request, res: Response) { res.json({ provider: 'arcium' }); }
function verify(_req: Request, res: Response) { res.json({ valid: true }); }

export const attestationController = { get, verify };

