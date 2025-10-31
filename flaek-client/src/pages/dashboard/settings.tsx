import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { apiMe, apiGetTenant, apiUpdateTenantName, apiChangePassword, apiTotpSetup, apiTotpVerifyJwt, apiTotpDisable } from '@/lib/api'

export default function SettingsPage() {
  const [user, setUser] = useState<{ name: string; email: string; totpEnabled: boolean } | null>(null)
  const [org, setOrg] = useState('')
  const [savingOrg, setSavingOrg] = useState(false)
  const [pw, setPw] = useState({ old: '', n1: '', n2: '' })
  const [pwMsg, setPwMsg] = useState('')
  const [pwLoading, setPwLoading] = useState(false)
  const [totp, setTotp] = useState<{ secret: string; url: string } | null>(null)
  const [qr, setQr] = useState('')
  const [code, setCode] = useState('')
  const [disableCode, setDisableCode] = useState('')
  const [tmsg, setTmsg] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const [{ user }, t] = await Promise.all([apiMe(), apiGetTenant()])
      setUser({ name: user.name, email: user.email, totpEnabled: user.totpEnabled })
      setOrg(t.org_name)
    } catch {}
  }

  async function saveOrg(e: React.FormEvent) {
    e.preventDefault()
    setSavingOrg(true)
    try {
      const out = await apiUpdateTenantName(org.trim())
      setOrg(out.org_name)
    } finally {
      setSavingOrg(false)
    }
  }

  async function changePw(e: React.FormEvent) {
    e.preventDefault()
    setPwLoading(true)
    setPwMsg('')
    try {
      await apiChangePassword({ oldPassword: pw.old, newPassword: pw.n1, confirmNewPassword: pw.n2 })
      setPw({ old: '', n1: '', n2: '' })
      setPwMsg('Password updated')
    } catch (e: any) {
      setPwMsg(e.message || 'Failed')
    } finally {
      setPwLoading(false)
    }
  }

  async function startTotp() {
    setTmsg('')
    setCode('')
    const out = await apiTotpSetup()
    setTotp({ secret: out.totp.secret_base32, url: out.totp.otpauth_url })
    try {
      const { toDataURL } = await import('qrcode')
      setQr(await toDataURL(out.totp.otpauth_url))
    } catch { setQr('') }
  }

  async function verifyTotp(e: React.FormEvent) {
    e.preventDefault()
    setTmsg('')
    try {
      await apiTotpVerifyJwt(code)
      setUser(u => u ? { ...u, totpEnabled: true } : u)
      setTotp(null); setQr(''); setCode('')
      setTmsg('Two‑factor enabled')
    } catch (e: any) {
      setTmsg(e.message || 'Invalid code')
    }
  }

  async function disableTotp(e: React.FormEvent) {
    e.preventDefault()
    setTmsg('')
    try {
      await apiTotpDisable(disableCode)
      setUser(u => u ? { ...u, totpEnabled: false } : u)
      setDisableCode('')
      setTmsg('Two‑factor disabled')
    } catch (e: any) {
      setTmsg(e.message || 'Failed')
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-semibold">Account</h2>
          <div className="mt-4 grid gap-3">
            <label className="text-sm">Name</label>
            <input value={user?.name || ''} readOnly className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm" />
            <label className="text-sm">Email</label>
            <input value={user?.email || ''} readOnly className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm" />
          </div>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">Organization</h2>
          <form onSubmit={saveOrg} className="mt-4 space-y-3">
            <label className="text-sm block">Name</label>
            <input value={org} onChange={e=>setOrg(e.target.value)} required minLength={2} className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm" />
            <Button loading={savingOrg}>Save</Button>
          </form>
        </Card>
        <Card className="lg:col-span-2">
          <h2 className="text-lg font-semibold">Security</h2>
          <div className="mt-4 grid md:grid-cols-2 gap-6">
            <form onSubmit={changePw} className="grid gap-3">
              <label className="text-sm">Current password</label>
              <input type="password" value={pw.old} onChange={e=>setPw(s=>({ ...s, old: e.target.value }))} className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm" required />
              <label className="text-sm">New password</label>
              <input type="password" value={pw.n1} onChange={e=>setPw(s=>({ ...s, n1: e.target.value }))} className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm" required />
              <label className="text-sm">Confirm new password</label>
              <input type="password" value={pw.n2} onChange={e=>setPw(s=>({ ...s, n2: e.target.value }))} className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm" required />
              {pwMsg && <div className={`text-sm ${pwMsg.includes('updated') ? 'text-green-400' : 'text-red-400'}`}>{pwMsg}</div>}
              <Button loading={pwLoading}>Update password</Button>
            </form>

            <div>
              {!user?.totpEnabled && !totp && (
                <div className="space-y-3">
                  <div className="text-sm text-white/70">Two‑factor authentication</div>
                  <Button onClick={startTotp}>Enable 2FA</Button>
                </div>
              )}
              {!user?.totpEnabled && totp && (
                <form onSubmit={verifyTotp} className="grid gap-4">
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 flex items-center justify-center">
                    {qr ? <img src={qr} alt="Scan QR" className="w-40 h-40" /> : <div className="text-sm">{totp.secret}</div>}
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm block">Authentication code</label>
                    <input value={code} onChange={e=>setCode(e.target.value)} inputMode="numeric" pattern="[0-9]*" maxLength={6} className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm" placeholder="123456" />
                    <Button disabled={code.length!==6}>Verify & enable</Button>
                    {tmsg && <div className={`text-sm ${tmsg.includes('enabled') ? 'text-green-400' : 'text-red-400'}`}>{tmsg}</div>}
                  </div>
                </form>
              )}
              {user?.totpEnabled && (
                <form onSubmit={disableTotp} className="grid gap-3">
                  <div className="text-sm text-white/70">Two‑factor authentication is enabled for {user.email}</div>
                  <label className="text-sm block">Enter a current code to disable</label>
                  <input value={disableCode} onChange={e=>setDisableCode(e.target.value)} inputMode="numeric" pattern="[0-9]*" maxLength={6} className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm" placeholder="123456" />
                  <Button variant="danger" disabled={disableCode.length!==6}>Disable 2FA</Button>
                  {tmsg && <div className={`text-sm ${tmsg.includes('disabled') ? 'text-green-400' : 'text-red-400'}`}>{tmsg}</div>}
                </form>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
