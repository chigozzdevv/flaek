import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Play, Key, Eye, EyeOff, Copy, Check } from 'lucide-react'
import { apiGetOperations, apiGetOperation, apiCreateJob, apiGetJob, apiGetMxePublicKey } from '@/lib/api'
import { x25519, RescueCipher, deserializeLE } from '@arcium-hq/client'

type OperationLite = { operation_id: string; name: string; version: string; status: 'active'|'deprecated' }

export default function PlaygroundPage() {
  const [ops, setOps] = useState<OperationLite[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string>('')
  const [op, setOp] = useState<any>(null)
  const [inputs, setInputs] = useState<Record<string, any>>({})
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string>('')
  const [jobId, setJobId] = useState<string>('')
  const [sentEncrypted, setSentEncrypted] = useState<any>(null)
  const [serverEncrypted, setServerEncrypted] = useState<any>(null)
  const [justGenerated, setJustGenerated] = useState<string>('')
  const [showPriv, setShowPriv] = useState(false)
  const [copiedKey, setCopiedKey] = useState(false)
  const [usedKeyHex, setUsedKeyHex] = useState<string>('')
  const [usedPubKey, setUsedPubKey] = useState<number[] | null>(null)
  const [hasKey, setHasKey] = useState<boolean>(!!localStorage.getItem('flaek_encryption_key'))

  useEffect(() => {
    loadOps()
  }, [])

  async function loadOps() {
    setLoading(true)
    try {
      const data = await apiGetOperations()
      const items = (data.items || []).filter((o: any) => o.status === 'active')
      setOps(items)
      const last = localStorage.getItem('flaek_last_op')
      if (last && items.find((o: any) => o.operation_id === last)) {
        setSelected(last)
      } else if (items.length > 0) {
        setSelected(items[0].operation_id)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!selected) return
    loadOp(selected)
  }, [selected])

  async function loadOp(id: string) {
    setResult(null)
    setError('')
    setJobId('')
    localStorage.setItem('flaek_last_op', id)
    try {
      const data = await apiGetOperation(id)
      setOp(data)
      const init: Record<string, any> = {}
      for (const k of data.inputs || []) init[k] = ''
      setInputs(init)
    } catch (e: any) {
      setError(e.message || 'Failed to load operation')
    }
  }

  function generateKey() {
    const rnd = crypto.getRandomValues(new Uint8Array(32))
    const hex = Array.from(rnd).map(b => b.toString(16).padStart(2, '0')).join('')
    localStorage.setItem('flaek_encryption_key', hex)
    setJustGenerated(hex)
    setHasKey(true)
  }

  async function run() {
    if (!op) return
    setError('')
    setResult(null)
    setRunning(true)
    try {
      // prepare key and MXE shared secret
      const keyHex = localStorage.getItem('flaek_encryption_key')
      if (!keyHex) throw new Error('Generate encryption key first')
      const hexToBytes = (hex: string) => new Uint8Array(hex.match(/.{1,2}/g)!.map(b => parseInt(b, 16)))
      const privKeyBytes = hexToBytes(keyHex)
      const publicKey = x25519.getPublicKey(privKeyBytes)
      setUsedKeyHex(keyHex)
      setUsedPubKey(Array.from(publicKey))

      const mxeResp = await apiGetMxePublicKey(op.mxe_program_id)
      const mxePublicKey = new Uint8Array(mxeResp.public_key)
      const sharedSecret = x25519.getSharedSecret(privKeyBytes, mxePublicKey)
      const cipher = new RescueCipher(sharedSecret)

      // validate inputs (basic numeric)
      const values: Record<string, number> = {}
      for (const name of op.inputs || []) {
        const raw = inputs[name]
        if (raw === '' || raw === undefined || raw === null) throw new Error(`${name} is required`)
        const num = Number(raw)
        if (!Number.isFinite(num) || num < 0) throw new Error(`${name} must be a non-negative number`)
        values[name] = num
      }

      const nonce = crypto.getRandomValues(new Uint8Array(16))
      const limbs = Object.values(values).map((val: any) => {
        const buf = new Uint8Array(32)
        const dv = new DataView(buf.buffer)
        dv.setBigUint64(0, BigInt(val), true)
        return deserializeLE(buf)
      })
      const [ct0, ct1] = cipher.encrypt(limbs, nonce)
      const encPayload = {
        ct0: Array.from(ct0),
        ct1: Array.from(ct1),
        client_public_key: Array.from(publicKey),
        nonce: Array.from(nonce),
      }
      setSentEncrypted(encPayload)
      const created = await apiCreateJob({
        dataset_id: op.dataset_id,
        operation: op.operation_id,
        encrypted_inputs: encPayload
      } as any)

      const id = (created as any).job_id
      setJobId(id)

      // poll result
      let tries = 0
      while (tries < 40) {
        const j = await apiGetJob(id)
        if (j.status === 'completed') {
          setServerEncrypted(j.result)
          const nonceArr = Array.isArray(j.result.nonce)
            ? new Uint8Array(j.result.nonce)
            : (typeof j.result.nonce === 'string' ? Uint8Array.from(atob(j.result.nonce), c => c.charCodeAt(0)) : new Uint8Array())
          const dec = (new (RescueCipher as any)(sharedSecret)).decrypt([
            new Uint8Array(j.result.ct0), new Uint8Array(j.result.ct1)
          ], nonceArr)
          setResult(dec)
          break
        }
        if (j.status === 'failed') {
          setError((j as any).error || 'Job failed')
          break
        }
        await new Promise(r => setTimeout(r, 1500))
        tries++
      }
      if (tries >= 40) setError('Timed out waiting for result')
    } catch (e: any) {
      setError(e.message || 'Failed to run')
    } finally {
      setRunning(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 animate-spin" /></div>
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-white/10">
        <h1 className="text-2xl font-bold">Playground</h1>
        <p className="text-sm text-white/60 mt-1">Try your published operations with client-side encryption</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {justGenerated && (
          <Card className="p-3 border border-green-500/20 bg-green-500/10">
            <div className="text-xs text-green-400">
              Encryption key generated and saved to localStorage as
              <span className="font-mono"> 'flaek_encryption_key'</span>.
              <button
                onClick={() => { navigator.clipboard.writeText(justGenerated); setCopiedKey(true); setTimeout(()=>setCopiedKey(false), 1000) }}
                className="ml-2 inline-flex items-center gap-1 text-green-300 hover:text-green-200"
              >
                {copiedKey ? <Check size={12} /> : <Copy size={12} />}
                {copiedKey ? 'Copied' : 'Copy key'}
              </button>
            </div>
            <div className="mt-1 text-[11px] text-white/60 break-all font-mono">
              {justGenerated}
            </div>
          </Card>
        )}
        <Card className="p-4 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-white/70 mb-2 block">1) Choose Operation</label>
              <select
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500/50"
              >
                {ops.map(o => (
                  <option key={o.operation_id} value={o.operation_id}>
                    {o.name} (v{o.version})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button variant="secondary" onClick={generateKey} className="text-xs ml-auto">
                <Key size={14} />
                {hasKey ? 'Regenerate Key' : 'Generate Key'}
              </Button>
            </div>
          </div>

          {op && (
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-white/50 mb-1">MXE Program</div>
                <div className="text-xs font-mono bg-white/5 border border-white/10 rounded px-2 py-1">{op.mxe_program_id}</div>
              </div>
              <div>
                <div className="text-xs text-white/50 mb-1">Dataset</div>
                <div className="text-sm font-medium">{op.dataset?.name || '—'}</div>
                <div className="text-[11px] text-white/40">ID: <span className="font-mono">{op.dataset_id}</span></div>
              </div>
              <div className="md:col-span-2">
                <div className="text-xs text-white/50 mb-1">Client Key</div>
                <div className="flex items-center gap-3">
                  <div className="text-[11px] font-mono bg-white/5 border border-white/10 rounded px-2 py-1 break-all flex-1">
                    {showPriv ? (usedKeyHex || localStorage.getItem('flaek_encryption_key') || '—') : '•••••••• (hidden)'}
                  </div>
                  <Button variant="ghost" onClick={() => setShowPriv(s=>!s)} className="text-xs">
                    {showPriv ? <EyeOff size={14}/> : <Eye size={14}/>} Show
                  </Button>
                </div>
                {usedPubKey && (
                  <div className="mt-2 text-[11px] text-white/60">Public key: <span className="font-mono">[{usedPubKey.join(', ')}]</span></div>
                )}
              </div>
            </div>
          )}
        </Card>

        {op && (
          <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Inputs</h2>
              <Badge>{op.inputs?.length || 0} fields</Badge>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {(op.inputs || []).map((k: string) => (
                <label key={k} className="text-xs">
                  <div className="mb-1 text-white/70">{k}</div>
                  <input
                    type="number"
                    value={inputs[k] ?? ''}
                    onChange={(e) => setInputs(s => ({ ...s, [k]: e.target.value }))}
                    placeholder={`Enter ${k}`}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm"
                  />
                </label>
              ))}
            </div>
            {error && <div className="text-xs text-red-400 whitespace-pre-wrap">{error}</div>}
            <div className="flex items-center gap-3">
              <Button onClick={run} disabled={running || !hasKey || !op.dataset_id || !selected}>
                {running ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                {running ? 'Running…' : 'Run'}
              </Button>
              {!hasKey && <div className="text-xs text-amber-400">Generate encryption key first</div>}
              {!op.dataset_id && <div className="text-xs text-amber-400">Operation must have a linked dataset</div>}
            </div>
            {jobId && (
              <div className="text-xs text-white/60">Job ID: {jobId}</div>
            )}
            {sentEncrypted && (
              <div>
                <div className="text-xs text-white/70 mb-1">Submitted Encrypted Inputs</div>
                <pre className="text-xs bg-white/5 border border-white/10 rounded p-2 overflow-x-auto">{JSON.stringify(sentEncrypted, null, 2)}</pre>
              </div>
            )}
            {serverEncrypted && (
              <div>
                <div className="text-xs text-white/70 mb-1">Encrypted Result</div>
                <pre className="text-xs bg-white/5 border border-white/10 rounded p-2 overflow-x-auto">{JSON.stringify(serverEncrypted, null, 2)}</pre>
              </div>
            )}
            {result && (
              <div>
                <div className="text-xs text-white/70 mb-1">Decrypted Output</div>
                <pre className="text-xs bg-white/5 border border-white/10 rounded p-2 overflow-x-auto">{JSON.stringify(result, null, 2)}</pre>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}
