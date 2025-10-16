import { useState, useEffect } from 'react'
import { DollarSign, User } from 'lucide-react'
import { navigate } from '@/lib/router'
import { apiGetCredits } from '@/lib/api'

export function Topbar() {
  const [credits, setCredits] = useState(0)

  useEffect(() => {
    loadCredits()
  }, [])

  async function loadCredits() {
    try {
      const { balance } = await apiGetCredits()
      setCredits(balance)
    } catch {
      setCredits(0)
    }
  }

  return (
    <div className="fixed top-0 left-64 right-0 z-30 h-16 border-b border-white/10 bg-bg-base flex items-center justify-between px-6">
      <div className="flex items-center gap-4" />
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/dashboard/credits')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] hover:border-white/20 transition"
        >
          <DollarSign size={16} className="text-green-400" />
          <span className="text-sm font-medium">{credits.toFixed(2)}</span>
          <span className="text-xs text-white/50">credits</span>
        </button>
        <button className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-500 hover:bg-brand-500/30 transition">
          <User size={16} />
        </button>
      </div>
    </div>
  )
}
