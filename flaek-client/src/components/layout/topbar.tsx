<<<<<<< ours
import { useState, useEffect, useRef } from 'react'
import { DollarSign, User, LogOut, Settings } from 'lucide-react'
import { apiGetCredits, apiGetTenant } from '@/lib/api'
=======
import { useState, useEffect } from 'react'
import { DollarSign, User } from 'lucide-react'
import { apiGetCredits } from '@/lib/api'
>>>>>>> theirs
import { navigate } from '@/lib/router'

export function Topbar() {
  const [credits, setCredits] = useState(0)
<<<<<<< ours
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const btnRef = useRef<HTMLButtonElement | null>(null)
  const [orgName, setOrgName] = useState('')
  const [plan, setPlan] = useState('')
=======
>>>>>>> theirs

  useEffect(() => {
    loadCredits()
    loadTenant()
  }, [])

  async function loadCredits() {
    try {
      const { balance } = await apiGetCredits()
      setCredits(balance)
    } catch (error) {
      console.error('Failed to load credits:', error)
      setCredits(0)
    }
  }

<<<<<<< ours
  async function loadTenant() {
    try {
      const t = await apiGetTenant()
      setOrgName(t.org_name || '')
      setPlan(t.plan || '')
    } catch {}
  }

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const target = e.target as Node
      if (menuOpen) {
        if (menuRef.current && !menuRef.current.contains(target) && btnRef.current && !btnRef.current.contains(target)) {
          setMenuOpen(false)
        }
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [menuOpen])

  return (
    <div className="fixed top-0 left-64 right-0 z-30 h-16 border-b border-white/10 bg-bg-base flex items-center justify-between px-6 relative">
      <div className="flex items-center gap-4" />
=======
  return (
    <div className="fixed top-0 left-64 right-0 z-30 h-16 border-b border-white/10 bg-bg-base flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-text-primary">Dashboard</h1>
      </div>
>>>>>>> theirs

      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/dashboard/credits')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] hover:border-white/20 transition"
        >
          <DollarSign size={16} className="text-green-400" />
          <span className="text-sm font-medium">{credits.toFixed(2)}</span>
          <span className="text-xs text-white/50">credits</span>
        </button>

<<<<<<< ours
        <button
          ref={btnRef}
          onClick={() => setMenuOpen(o => !o)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-500 hover:bg-brand-500/30 transition"
        >
          <User size={16} />
        </button>
      </div>
      {menuOpen && (
        <div
          ref={menuRef}
          role="menu"
          className="absolute right-6 top-full mt-2 w-56 bg-bg-elev border border-white/10 rounded-lg shadow-xl overflow-hidden"
        >
          <div className="px-3 py-2">
            <div className="text-sm font-medium truncate">{orgName || 'Account'}</div>
            {plan && <div className="text-[11px] text-white/50">Plan: {plan}</div>}
          </div>
          <div className="h-px bg-white/10" />
          <div className="p-2">
            <button
              onClick={() => { navigate('/dashboard/keys'); setMenuOpen(false) }}
              className="w-full flex items-center gap-2 px-2 py-2 rounded text-sm hover:bg-white/5"
              role="menuitem"
            >
              <Settings size={16} className="text-white/70" />
              Account
            </button>
            <button
              onClick={() => { clearToken(); setMenuOpen(false); navigate('/') }}
              className="w-full flex items-center gap-2 px-2 py-2 rounded text-sm hover:bg-red-500/10 text-white/80"
              role="menuitem"
            >
              <LogOut size={16} className="text-red-400" />
              Sign out
            </button>
          </div>
        </div>
      )}
=======
        <button className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-500 hover:bg-brand-500/30 transition">
          <User size={16} />
        </button>
      </div>
>>>>>>> theirs
    </div>
  )
}
