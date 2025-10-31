import { useState, useEffect } from 'react'
import { DollarSign, User, Pencil } from 'lucide-react'
import { navigate } from '@/lib/router'
import { apiGetCredits, apiGetTenant, apiUpdateTenantName, apiMe } from '@/lib/api'
import { Modal } from '@/components/ui/modal'
import { clearToken } from '@/lib/auth'

export function Topbar() {
  const [credits, setCredits] = useState(0)
  const [org, setOrg] = useState<string>('')
  const [open, setOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    loadCredits()
    loadTenant()
    loadUser()
  }, [])

  async function loadCredits() {
    try {
      const { balance } = await apiGetCredits()
      setCredits(balance)
    } catch {
      setCredits(0)
    }
  }

  async function loadTenant() {
    try {
      const t = await apiGetTenant()
      setOrg(t.org_name)
    } catch {}
  }

  async function saveName(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const out = await apiUpdateTenantName(newName.trim())
      setOrg(out.org_name)
      setOpen(false)
      setNewName('')
    } finally {
      setSaving(false)
    }
  }

  async function loadUser() {
    try {
      const me = await apiMe()
      setUserName(me.user.name)
    } catch {}
  }

  return (
    <div className="fixed top-0 left-64 right-0 z-30 h-16 border-b border-white/10 bg-bg-base flex items-center justify-between px-6">
      <div className="flex items-center gap-3" />
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/dashboard/credits')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] hover:border-white/20 transition"
        >
          <DollarSign size={16} className="text-green-400" />
          <span className="text-sm font-medium">{credits.toFixed(2)}</span>
          <span className="text-xs text-white/50">credits</span>
        </button>
        <div className="relative">
          <button onClick={()=>setMenuOpen(s=>!s)} className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-500 hover:bg-brand-500/30 transition">
            <User size={16} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl border border-white/10 bg-bg-elev shadow-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-white/10">
                <div className="text-xs text-white/50">Account</div>
                <div className="text-sm font-medium truncate" title={userName || '—'}>{userName || '—'}</div>
              </div>
              <div className="px-4 py-3 border-b border-white/10">
                <div className="text-xs text-white/50">Organization</div>
                <div className="flex items-center justify-between mt-1">
                  <div className="text-sm font-medium truncate max-w-[180px]" title={org}>{org || '—'}</div>
                  <button onClick={()=>{ setNewName(org); setOpen(true); setMenuOpen(false) }} className="w-6 h-6 rounded bg-white/[0.06] border border-white/10 flex items-center justify-center hover:bg-white/[0.1]" title="Rename">
                    <Pencil size={14} />
                  </button>
                </div>
              </div>
              <button onClick={()=>{ setMenuOpen(false); navigate('/dashboard/settings') }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/[0.06]">Settings</button>
              <button onClick={()=>{ setMenuOpen(false); clearToken(); window.location.href = '/signin' }} className="w-full text-left px-4 py-2.5 text-sm text-red-300 hover:bg-red-500/10">Logout</button>
            </div>
          )}
        </div>
        
      </div>
      <Modal open={open} onClose={()=>setOpen(false)} title="Change organization name">
        <form onSubmit={saveName} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Organization name</label>
            <input value={newName} onChange={e=>setNewName(e.target.value)} required minLength={2} className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-base outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 transition-all duration-200" placeholder="Your organization" />
          </div>
          <div className="flex items-center gap-3">
            <button disabled={saving || newName.trim().length<2} className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-2.5 text-sm font-semibold disabled:opacity-50">
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button type="button" onClick={()=>setOpen(false)} className="px-4 py-2 text-sm text-white/70 hover:text-white">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
