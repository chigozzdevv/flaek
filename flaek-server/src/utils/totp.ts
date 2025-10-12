import { authenticator } from 'otplib';

export function generateTotpSecret() {
  return authenticator.generateSecret();
}

export function buildOtpAuthUrl(email: string, secret: string, issuer = 'Flaek') {
  return authenticator.keyuri(email, issuer, secret);
}

export function verifyTotpToken(secret: string, token: string) {
  return authenticator.verify({ token, secret });
}

