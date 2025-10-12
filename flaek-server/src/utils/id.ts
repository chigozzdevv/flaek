import crypto from 'crypto';

export function newId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}
