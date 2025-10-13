import crypto from 'crypto'
import { env } from '@/config/env'

function getKey(): Buffer {
  // Derive a 32-byte key from the configured secret
  const raw = Buffer.from(env.JOB_ENC_KEY, 'utf8')
  return crypto.createHash('sha256').update(raw).digest()
}

export function wrapSecret(plain: Uint8Array): { ivB64: string; cipherB64: string } {
  const key = getKey()
  const iv = crypto.randomBytes(12) // GCM 96-bit IV
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const ct = Buffer.concat([cipher.update(Buffer.from(plain)), cipher.final()])
  const tag = cipher.getAuthTag()
  const out = Buffer.concat([ct, tag])
  return { ivB64: iv.toString('base64'), cipherB64: out.toString('base64') }
}

export function unwrapSecret(ivB64: string, cipherB64: string): Uint8Array {
  const key = getKey()
  const iv = Buffer.from(ivB64, 'base64')
  const data = Buffer.from(cipherB64, 'base64')
  const ct = data.slice(0, Math.max(0, data.length - 16))
  const tag = data.slice(-16)
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  const pt = Buffer.concat([decipher.update(ct), decipher.final()])
  return new Uint8Array(pt)
}

