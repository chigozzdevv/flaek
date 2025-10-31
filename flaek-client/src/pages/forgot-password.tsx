import { useState } from 'react'
import BrandLogo from '@/components/brand-logo'
import { ArrowLeft } from 'lucide-react'
import { navigate } from '@/lib/router'
import { apiRequestPasswordReset } from '@/lib/api'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await apiRequestPasswordReset({ email })
      setSent(true)
    } catch (err: any) {
      setError(err.message || 'Failed to request reset')
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
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-balance">Reset your password</h1>
        <p className="mt-4 text-base text-white/70 leading-relaxed">Enter your email to get a reset link.</p>
        {sent ? (
          <div className="mt-8 rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-3 text-sm text-green-400">If the email exists, a reset link was sent.</div>
        ) : (
          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-base outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 transition-all duration-200" placeholder="you@company.com" />
            </div>
            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">{error}</div>}
            <div className="pt-2">
              <button disabled={loading} className="w-full inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-3 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-brand-600 hover:to-brand-700 transition-all duration-200 shadow-lg shadow-brand-500/20 hover:shadow-xl hover:shadow-brand-500/30">{loading?'Sending…':'Send reset link'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
