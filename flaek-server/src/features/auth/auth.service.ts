import { userRepository } from '@/features/auth/user.repository';
import { tenantRepository } from '@/features/tenants/tenant.repository';
import { hashPassword, verifyPassword } from '@/utils/password';
import { httpError } from '@/shared/errors';
import { signJwt } from '@/utils/jwt';
import { generateTotpSecret, buildOtpAuthUrl, verifyTotpToken } from '@/utils/totp';
import { Roles } from '@/shared/roles';
import crypto from 'crypto';

type SignupInput = { name: string; email: string; password: string; orgName: string };
type VerifyTotpInput = { email: string; code: string };
type LoginInput = { email: string; password: string; code?: string };
type MeInput = { userId: string };
type ChangePasswordInput = { userId: string; oldPassword: string; newPassword: string };
type TotpSetupInput = { userId: string };
type TotpVerifyJwtInput = { userId: string; code: string };
type TotpDisableInput = { userId: string; code: string };
type ResetPasswordRequestInput = { email: string };
type ResetPasswordConfirmInput = { token: string; password: string };

async function signup(input: SignupInput) {
  const existing = await userRepository.findByEmail(input.email);
  if (existing) throw httpError(409, 'conflict', 'email_already_exists');
  const passwordHash = await hashPassword(input.password);
  const secret = generateTotpSecret();
  const user = await userRepository.create({
    name: input.name,
    email: input.email.toLowerCase(),
    passwordHash,
    role: Roles.USER,
    totpEnabled: false,
    totpSecret: secret,
  } as any);
  const otpauth_url = buildOtpAuthUrl(user.email, secret);
  const tenant = await tenantRepository.ensureForOwner(user.id, input.orgName.trim());
  return { user_id: user.id, tenant_id: tenant.id, totp: { secret_base32: secret, otpauth_url } };
}

async function verifyTotp(input: VerifyTotpInput) {
  const user = await userRepository.findByEmail(input.email.toLowerCase());
  if (!user) throw httpError(404, 'not_found', 'user_not_found');
  if (!user.totpSecret) throw httpError(400, 'invalid_state', 'totp_not_initialized');
  const ok = verifyTotpToken(user.totpSecret, input.code);
  if (!ok) throw httpError(400, 'invalid_totp', 'invalid_totp_code');
  await userRepository.setTotp(user.id, true, user.totpSecret);
  const jwt = signJwt({ sub: user.id, role: user.role });
  return { jwt };
}

async function login(input: LoginInput) {
  const user = await userRepository.findByEmail(input.email.toLowerCase());
  if (!user) throw httpError(401, 'unauthorized', 'invalid_credentials');
  const ok = await verifyPassword(input.password, user.passwordHash);
  if (!ok) throw httpError(401, 'unauthorized', 'invalid_credentials');
  if (user.totpEnabled) {
    if (!input.code) throw httpError(400, 'invalid_body', 'totp_code_required');
    const v = verifyTotpToken(user.totpSecret || '', input.code);
    if (!v) throw httpError(400, 'invalid_totp', 'invalid_totp_code');
  }
  const jwt = signJwt({ sub: user.id, role: user.role });
  return { jwt };
}

async function me(input: MeInput) {
  const user = await userRepository.findById(input.userId);
  if (!user) throw httpError(404, 'not_found', 'user_not_found');
  return { user: { id: user.id, name: user.name, email: user.email, role: user.role, totpEnabled: user.totpEnabled, createdAt: user.createdAt } };
}

async function changePassword(input: ChangePasswordInput) {
  const user = await userRepository.findById(input.userId);
  if (!user) throw httpError(404, 'not_found', 'user_not_found');
  const ok = await verifyPassword(input.oldPassword, user.passwordHash);
  if (!ok) throw httpError(400, 'invalid_body', 'old_password_incorrect');
  const hash = await hashPassword(input.newPassword);
  await userRepository.updatePassword(user.id, hash);
}

async function totpSetup(input: TotpSetupInput) {
  const user = await userRepository.findById(input.userId);
  if (!user) throw httpError(404, 'not_found', 'user_not_found');
  const secret = generateTotpSecret();
  await userRepository.resetTotpSecret(user.id, secret);
  const otpauth_url = buildOtpAuthUrl(user.email, secret);
  return { totp: { secret_base32: secret, otpauth_url } };
}

async function totpVerifyJwt(input: TotpVerifyJwtInput) {
  const user = await userRepository.findById(input.userId);
  if (!user || !user.totpSecret) throw httpError(400, 'invalid_state', 'totp_not_initialized');
  const ok = verifyTotpToken(user.totpSecret, input.code);
  if (!ok) throw httpError(400, 'invalid_totp', 'invalid_totp_code');
  await userRepository.setTotp(user.id, true, user.totpSecret);
  return { enabled: true };
}

async function totpDisable(input: TotpDisableInput) {
  const user = await userRepository.findById(input.userId);
  if (!user || !user.totpSecret) throw httpError(400, 'invalid_state', 'totp_not_initialized');
  const ok = verifyTotpToken(user.totpSecret, input.code);
  if (!ok) throw httpError(400, 'invalid_totp', 'invalid_totp_code');
  await userRepository.disableTotp(user.id);
}

 
async function resetPasswordRequest(input: ResetPasswordRequestInput) {
  const user = await userRepository.findByEmail(input.email.toLowerCase());
  if (!user) return;
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60);
  await userRepository.setResetPassword(user.id, token, expiresAt);
}

async function resetPasswordConfirm(input: ResetPasswordConfirmInput) {
  const user = await userRepository.findByValidResetToken(input.token);
  if (!user) throw httpError(400, 'invalid_token', 'invalid_or_expired_token');
  const hash = await hashPassword(input.password);
  await userRepository.updatePassword(user.id, hash);
  await userRepository.clearResetPassword(user.id);
}

export const authService = { signup, verifyTotp, login, me, changePassword, totpSetup, totpVerifyJwt, totpDisable, resetPasswordRequest, resetPasswordConfirm };
