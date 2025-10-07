import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { env } from '@/config/env';

export type Claims = { sub: string; role: string } & Record<string, any>;

export function signJwt(payload: Claims): string {
  return jwt.sign(payload as object, env.JWT_SECRET as Secret, { expiresIn: env.JWT_EXPIRES_IN } as SignOptions);
}

export function verifyJwt<T = any>(token: string): T {
  return jwt.verify(token, env.JWT_SECRET as Secret) as T;
}
