import crypto from 'crypto';

export function randomBytes(len = 32) {
  return crypto.randomBytes(len);
}

