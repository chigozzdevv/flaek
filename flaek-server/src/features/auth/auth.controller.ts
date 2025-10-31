import { Request, Response } from 'express';
import { authService } from '@/features/auth/auth.service';

async function signup(req: Request, res: Response) {
  const { name, email, password, orgName } = req.body;
  const out = await authService.signup({ name, email, password, orgName });
  res.status(201).json(out);
}

async function verifyTotp(req: Request, res: Response) {
  const { email, code } = req.body;
  const out = await authService.verifyTotp({ email, code });
  res.status(200).json(out);
}

async function login(req: Request, res: Response) {
  const { email, password, code } = req.body;
  const out = await authService.login({ email, password, code });
  res.json(out);
}

function logout(_req: Request, res: Response) { res.status(204).end(); }

async function me(req: Request, res: Response) {
  const claims = (req as any).user as { sub: string };
  const out = await authService.me({ userId: claims.sub });
  res.json(out);
}

async function changePassword(req: Request, res: Response) {
  const claims = (req as any).user as { sub: string };
  const { oldPassword, newPassword } = req.body;
  await authService.changePassword({ userId: claims.sub, oldPassword, newPassword });
  res.status(204).end();
}

async function totpSetup(req: Request, res: Response) {
  const claims = (req as any).user as { sub: string };
  const out = await authService.totpSetup({ userId: claims.sub });
  res.status(200).json(out);
}

async function totpVerifyJwt(req: Request, res: Response) {
  const claims = (req as any).user as { sub: string };
  const { code } = req.body;
  const out = await authService.totpVerifyJwt({ userId: claims.sub, code });
  res.status(200).json(out);
}

async function totpDisable(req: Request, res: Response) {
  const claims = (req as any).user as { sub: string };
  const { code } = req.body;
  await authService.totpDisable({ userId: claims.sub, code });
  res.status(204).end();
}

async function resetPasswordRequest(req: Request, res: Response) {
  const { email } = req.body;
  await authService.resetPasswordRequest({ email });
  res.status(204).end();
}

async function resetPasswordConfirm(req: Request, res: Response) {
  const { token, password } = req.body;
  await authService.resetPasswordConfirm({ token, password });
  res.status(204).end();
}

export const authController = { signup, verifyTotp, login, logout, me, changePassword, totpSetup, totpVerifyJwt, totpDisable, resetPasswordRequest, resetPasswordConfirm };
