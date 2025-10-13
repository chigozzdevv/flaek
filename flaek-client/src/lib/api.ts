const API_BASE = import.meta.env.VITE_API_BASE || ''

type Json = Record<string, any>

async function request(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    credentials: 'include',
    ...opts,
  })
  const ct = res.headers.get('content-type') || ''
  const body = ct.includes('application/json') ? await res.json() : await res.text()
  if (!res.ok) {
    const message = (body && (body.message || body.error || body.code)) || res.statusText
    throw new Error(typeof message === 'string' ? message : 'Request failed')
  }
  return body
}

export async function apiSignup(input: { name: string; email: string; password: string; confirmPassword: string; orgName?: string }) {
  return request('/auth/signup', { method: 'POST', body: JSON.stringify(input) }) as Promise<{
    user_id: string; tenant_id?: string; totp: { secret_base32: string; otpauth_url: string }
  }>
}

export async function apiVerifyTotp(input: { email: string; code: string }) {
  return request('/auth/verify-totp', { method: 'POST', body: JSON.stringify(input) }) as Promise<{ jwt: string }>
}

export async function apiLogin(input: { email: string; password: string; code?: string }) {
  return request('/auth/login', { method: 'POST', body: JSON.stringify(input) }) as Promise<{ jwt: string }>
}

