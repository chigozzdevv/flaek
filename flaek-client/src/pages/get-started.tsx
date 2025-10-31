import { useState, useEffect } from 'react'
import { apiSignup, apiVerifyTotp, apiLogin } from '@/lib/api'
import BrandLogo from '@/components/brand-logo'
import { ArrowLeft } from 'lucide-react'
import { navigate } from '@/lib/router'
import { isAuthenticated } from '@/lib/auth'

type Mode = 'signup' | 'signin'

export default function GetStartedPage({ mode: initialMode = 'signup' as Mode }) {
  const mode: Mode = initialMode
  
  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/dashboard')
    }
  }, [])

  if (isAuthenticated()) {
    return null
  }
  
  return (
    <div className="min-h-dvh text-text-primary bg-bg-base overflow-x-hidden flex items-center justify-center py-12">
      <div className="w-full max-w-md mx-auto px-6">
        <div className="mb-10 flex items-center">
          <button
            onClick={() => navigate('/')}
            className="text-white/80 hover:text-white transition-colors -mr-1"
            aria-label="Back to home"
          >
            <ArrowLeft size={24} />
          </button>
          <BrandLogo className="h-8" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-balance">{mode === 'signup' ? 'Create your account' : 'Welcome back'}</h1>
        <p className="mt-4 text-base text-white/70 leading-relaxed">Private compute with public proof. {mode==='signup' ? 'Start for free.' : 'Sign in to continue.'}</p>

        <div className="mt-8">
          {mode === 'signup' ? <SignupForm /> : <SigninForm />}
        </div>
      </div>
    </div>
  )
}

function SignupForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [org, setOrg] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'form' | 'totp'>('form')
  const [totp, setTotp] = useState<{ secret: string; url: string } | null>(null)
  const [code, setCode] = useState('')
  const [qr, setQr] = useState<string>('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const out = await apiSignup({ name, email, password, confirmPassword: confirm, orgName: org })
      setTotp({ secret: out.totp.secret_base32, url: out.totp.otpauth_url })
      setStep('totp')
    } catch (err: any) {
      setError(err.message || 'Failed to sign up')
    } finally {
      setLoading(false)
    }
  }

  async function onVerify(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const out = await apiVerifyTotp({ email, code })
      localStorage.setItem('flaek_jwt', out.jwt)
      window.location.href = '/dashboard'
    } catch (err: any) {
      setError(err.message || 'Invalid code')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true
    async function gen() {
      if (totp?.url) {
        try {
          const { toDataURL } = await import('qrcode')
          const dataUrl = await toDataURL(totp.url)
          if (mounted) setQr(dataUrl)
        } catch {}
      } else {
        setQr('')
      }
    }
    gen()
    return () => { mounted = false }
  }, [totp?.url])

  if (step === 'totp') {
    return (
      <form onSubmit={onVerify} className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold">Secure your account</h2>
          <p className="mt-2 text-sm text-white/70 leading-relaxed">Set up 2FA in your authenticator app, then enter the 6‑digit code.</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
          {qr ? (
            <div className="flex flex-col items-center">
              <img src={qr} alt="Scan QR" className="w-48 h-48" />
              <a className="mt-3 inline-block text-sm text-brand-500 hover:text-brand-400 font-medium transition-colors" href={totp?.url || '#'}>Open in authenticator →</a>
            </div>
          ) : (
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-white/60 mb-2">Secret Key</div>
              <div className="mt-1 font-mono text-sm break-all text-white/90 leading-relaxed">{totp?.secret}</div>
              {totp?.url && (
                <a className="mt-3 inline-block text-sm text-brand-500 hover:text-brand-400 font-medium transition-colors" href={totp.url}>Open in authenticator →</a>
              )}
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Authentication code</label>
          <input value={code} onChange={e=>setCode(e.target.value)} inputMode="numeric" pattern="[0-9]*" maxLength={6}
            className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-base outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 transition-all duration-200" placeholder="123456" />
        </div>
        {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">{error}</div>}
        <div className="flex items-center gap-3 pt-2">
          <button disabled={loading || code.length!==6} className="flex-1 inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-3 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-brand-600 hover:to-brand-700 transition-all duration-200 shadow-lg shadow-brand-500/20 hover:shadow-xl hover:shadow-brand-500/30">{loading?'Verifying…':'Verify & continue'}</button>
          <button type="button" onClick={()=>setStep('form')} className="px-4 py-3 text-sm text-white/70 hover:text-white transition-colors">Back</button>
        </div>
        <div className="text-center text-sm text-white/70">Don’t want to set up 2FA now? <a href="/signin" onClick={(e)=>{ e.preventDefault(); navigate('/signin') }} className="text-brand-500 hover:text-brand-400 font-medium transition-colors">Skip for now</a></div>
      </form>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium mb-2">Full name</label>
          <input value={name} onChange={e=>setName(e.target.value)} required className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-base outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 transition-all duration-200" placeholder="Ada Lovelace" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Organization</label>
          <input value={org} onChange={e=>setOrg(e.target.value)} required className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-base outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 transition-all duration-200" placeholder="My company" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Email</label>
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-base outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 transition-all duration-200" placeholder="you@company.com" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium mb-2">Password</label>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-base outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 transition-all duration-200" placeholder="At least 8 characters" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Confirm password</label>
          <input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} required className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-base outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 transition-all duration-200" placeholder="Repeat password" />
        </div>
      </div>
      {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">{error}</div>}
      <div className="pt-2">
        <button disabled={loading} className="w-full inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-3 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-brand-600 hover:to-brand-700 transition-all duration-200 shadow-lg shadow-brand-500/20 hover:shadow-xl hover:shadow-brand-500/30">{loading?'Creating…':'Create account'}</button>
      </div>
      <div className="text-center text-sm text-white/70">Already have an account? <a href="/signin" onClick={(e)=>{ e.preventDefault(); navigate('/signin') }} className="text-brand-500 hover:text-brand-400 font-medium transition-colors">Sign in</a></div>
    </form>
  )
}

function SigninForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const out = await apiLogin({ email, password, code: code || undefined })
      localStorage.setItem('flaek_jwt', out.jwt)
      window.location.href = '/dashboard'
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium mb-2">Email</label>
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-base outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 transition-all duration-200" placeholder="you@company.com" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Password</label>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-base outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 transition-all duration-200" placeholder="Your password" />
        <div className="mt-2 text-sm"><a href="/forgot-password" onClick={(e)=>{ e.preventDefault(); navigate('/forgot-password') }} className="text-white/70 hover:text-white transition-colors">Forgot password?</a></div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium">2FA code</label>
          <span className="text-xs text-white/50">Optional</span>
        </div>
        <input inputMode="numeric" pattern="[0-9]*" maxLength={6} value={code} onChange={e=>setCode(e.target.value)} className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-base outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 transition-all duration-200" placeholder="123456" />
      </div>
      {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">{error}</div>}
      <div className="pt-2">
        <button disabled={loading} className="w-full inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-3 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-brand-600 hover:to-brand-700 transition-all duration-200 shadow-lg shadow-brand-500/20 hover:shadow-xl hover:shadow-brand-500/30">{loading?'Signing in…':'Sign in'}</button>
      </div>
      <div className="text-center text-sm text-white/70">New to Flaek? <a href="/get-started" onClick={(e)=>{ e.preventDefault(); navigate('/get-started') }} className="text-brand-500 hover:text-brand-400 font-medium transition-colors">Create an account</a></div>
    </form>
  )
}
