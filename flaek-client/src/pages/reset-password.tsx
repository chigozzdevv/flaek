import { useEffect, useState } from 'react'
import BrandLogo from '@/components/brand-logo'
import { ArrowLeft } from 'lucide-react'
import { navigate } from '@/lib/router'
import { apiConfirmPasswordReset } from '@/lib/api'

export default function ResetPasswordPage() {
  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setToken(params.get('token') || '')
  }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await apiConfirmPasswordReset({ token, password, confirmPassword: confirm })
      setDone(true)
      setTimeout(() => navigate('/signin'), 1000)
    } catch (err: any) {
      setError(err.message || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh text-text-primary bg-bg-base overflow-x-hidden flex items-center justify-center py-12">
      <div className="w-full max-w-md mx-auto px-6">
        <div className="mb-10 flex items-center">
          <button onClick={() => navigate('/signin')} className="text-white/80 hover:text-white transition-colors -mr-1" aria-label="Back">
            <ArrowLeft size={24} />
          </button>
          <BrandLogo className="h-8" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-balance">Set a new password</h1>
        {!token && <div className="mt-6 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">Missing token</div>}
        {done ? (
          <div className="mt-8 rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-3 text-sm text-green-400">Password updated</div>
        ) : (
          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2">New password</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-base outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 transition-all duration-200" placeholder="At least 8 characters" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Confirm new password</label>
              <input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} required className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-base outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 transition-all duration-200" placeholder="Repeat password" />
            </div>
            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">{error}</div>}
            <div className="pt-2">
              <button disabled={loading || !token} className="w-full inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-3 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-brand-600 hover:to-brand-700 transition-all duration-200 shadow-lg shadow-brand-500/20 hover:shadow-xl hover:shadow-brand-500/30">{loading?'Saving…':'Save password'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
