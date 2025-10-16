import { useEffect, useState } from 'react'
import { Loader2, Key, Plus, Copy, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { apiGetApiKeys, apiCreateApiKey, apiRevokeApiKey } from '@/lib/api'

type ApiKey = {
  key_id: string
  name: string
  prefix: string
  created_at: string
  last_used?: string
  status: 'active' | 'revoked'
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [creating, setCreating] = useState(false)
  const [newKeyValue, setNewKeyValue] = useState('')

  useEffect(() => {
    loadKeys()
  }, [])

  async function loadKeys() {
    try {
      const data = await apiGetApiKeys()
      setKeys(data.items)
    } catch (error) {
      console.error('Failed to load API keys:', error)
    } finally {
      setLoading(false)
    }
  }

  async function createKey() {
    if (!newKeyName.trim()) {
      alert('Please enter a key name')
      return
    }
    setCreating(true)
    try {
      const data = await apiCreateApiKey({ name: newKeyName.trim() })
      setNewKeyValue(data.api_key)
      await loadKeys()
      setNewKeyName('')
    } catch (error: any) {
      alert(`Failed to create key: ${error.message}`)
    } finally {
      setCreating(false)
    }
  }

  async function revokeKey(id: string, name: string) {
    if (!confirm(`Revoke API key "${name}"? This cannot be undone.`)) return
    try {
      await apiRevokeApiKey(id)
      await loadKeys()
      alert('API key revoked successfully')
    } catch (error: any) {
      alert(`Failed to revoke: ${error.message}`)
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">API Keys</h1>
            <p className="text-sm text-white/60 mt-1">Manage your API authentication keys</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus size={16} />
            Create API Key
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {keys.length === 0 ? (
          <Card className="p-12 text-center">
            <Key className="w-12 h-12 mx-auto mb-4 text-white/20" />
            <h3 className="text-lg font-semibold mb-2">No API Keys</h3>
            <p className="text-sm text-white/60 mb-6">
              Create your first API key to start using the API
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus size={16} />
              Create API Key
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4">
            {keys.map((key) => (
              <Card key={key.key_id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Key size={18} className="text-brand-500" />
                      <h3 className="font-semibold">{key.name}</h3>
                      <Badge variant={key.status === 'active' ? 'success' : 'danger'}>
                        {key.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <code className="text-sm font-mono bg-white/5 px-3 py-1 rounded border border-white/10">
                        {key.prefix}_••••••••••••••••••••
                      </code>
                      <button
                        onClick={() => copyToClipboard(key.key_id)}
                        className="p-1.5 hover:bg-white/5 rounded transition group"
                        title="Copy Key ID"
                      >
                        <Copy size={14} className="text-white/50 group-hover:text-brand-400" />
                      </button>
                    </div>
                    <p className="text-xs text-white/40 italic mb-2">
                      Full key only shown once at creation
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-white/50">Created:</span>
                        <span className="ml-2">{new Date(key.created_at).toLocaleDateString()}</span>
                      </div>
                      {key.last_used && (
                        <div>
                          <span className="text-white/50">Last Used:</span>
                          <span className="ml-2">{new Date(key.last_used).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {key.status === 'active' && (
                    <Button
                      variant="ghost"
                      onClick={() => revokeKey(key.key_id, key.name)}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      <Trash2 size={14} />
                      Revoke
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <Modal
          open={showCreateModal}
          onClose={() => {
            setShowCreateModal(false)
            setNewKeyValue('')
            setNewKeyName('')
          }}
          title="Create API Key"
        >
          <div className="space-y-4">
            {!newKeyValue ? (
              <>
                <div>
                  <label className="text-xs font-semibold text-white/70 mb-2 block">Key Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Production API"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-brand-500/50"
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setShowCreateModal(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={createKey} disabled={creating} className="flex-1">
                    {creating ? <Loader2 size={16} className="animate-spin" /> : 'Create'}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <p className="text-sm text-amber-400 mb-2">⚠️ Save this key now!</p>
                  <p className="text-xs text-white/60">This is the only time you'll see the full key. Store it securely.</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-white/70 mb-2 block">Your API Key</label>
                  <div className="flex gap-2">
                    <code className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-mono break-all">
                      {newKeyValue}
                    </code>
                    <Button variant="secondary" onClick={() => copyToClipboard(newKeyValue)}>
                      <Copy size={16} />
                    </Button>
                  </div>
                </div>
                <Button onClick={() => { setShowCreateModal(false); setNewKeyValue('') }} className="w-full">
                  Done
                </Button>
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}
