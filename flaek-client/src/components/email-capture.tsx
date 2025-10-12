import { useState } from 'react'
import { z } from 'zod'

const schema = z.object({ email: z.string().email() })

export default function EmailCapture() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setOk(false)
    const parsed = schema.safeParse({ email })
    if (!parsed.success) {
      setError('Enter a valid email')
      return
    }
    setOk(true)
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 flex flex-col sm:flex-row items-stretch gap-3 max-w-xl mx-auto">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        className="flex-1 rounded-full bg-bg-elev/60 border border-[var(--color-border)] px-5 py-3 outline-none focus:border-brand-500/70"
      />
      <button type="submit" className="rounded-full px-6 py-3 bg-gradient-to-r from-brand-500 to-brand-600 font-medium">Notify me</button>
      {error && <div className="w-full text-left text-sm text-red-400 sm:ml-4">{error}</div>}
      {ok && <div className="w-full text-left text-sm text-accent-500 sm:ml-4">Thanks! We’ll be in touch.</div>}
    </form>
  )
}
