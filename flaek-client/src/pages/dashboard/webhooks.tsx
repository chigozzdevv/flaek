import { useEffect, useState } from 'react'
import { Loader2, Webhook, Plus, Trash2, TestTube, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { apiGetWebhooks, apiCreateWebhook, apiDeleteWebhook, apiTestWebhook } from '@/lib/api'

type WebhookType = {
  webhook_id: string
  url: string
  events: string[]
  status: 'active' | 'disabled'
  created_at: string
  last_triggered?: string
}

const availableEvents = [
  'job.queued',
  'job.running',
  'job.completed',
  'job.failed',
  'dataset.created',
  'dataset.updated',
  'operation.created',
  'operation.deprecated',
]

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<WebhookType[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null)
  const [newUrl, setNewUrl] = useState('')
  const [selectedEvents, setSelectedEvents] = useState<string[]>(['job.completed'])
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    loadWebhooks()
  }, [])

  async function loadWebhooks() {
    try {
      const data = await apiGetWebhooks()
      setWebhooks(data.items)
    } catch (error) {
      console.error('Failed to load webhooks:', error)
    } finally {
      setLoading(false)
    }
  }

  async function createWebhook() {
    if (!newUrl.trim() || selectedEvents.length === 0) {
      alert('Please enter URL and select at least one event')
      return
    }
    setCreating(true)
    try {
      await apiCreateWebhook({ url: newUrl.trim(), events: selectedEvents })
      await loadWebhooks()
      setShowCreateModal(false)
      setNewUrl('')
      setSelectedEvents(['job.completed'])
    } catch (error: any) {
      alert(`Failed to create webhook: ${error.message}`)
    } finally {
      setCreating(false)
    }
  }

  async function handleTest(webhookId: string, url: string) {
    setTestingWebhook(webhookId)
    try {
      const result = await apiTestWebhook(url)
      alert(result.delivered ? '✓ Webhook test successful! Check your endpoint logs.' : '✗ Webhook test failed')
    } catch (error: any) {
      alert(`Test failed: ${error.message}`)
    } finally {
      setTestingWebhook(null)
    }
  }

  async function handleDelete(webhookId: string) {
    if (!confirm(`Delete webhook for ${webhookId}?`)) return
    try {
      await apiDeleteWebhook(webhookId)
      await loadWebhooks()
      alert('Webhook deleted successfully')
    } catch (error: any) {
      alert(`Failed to delete: ${error.message}`)
    }
  }

  function toggleEvent(event: string) {
    setSelectedEvents(prev =>
      prev.includes(event) ? prev.filter(e => e !== event) : [...prev, event]
    )
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
            <h1 className="text-2xl font-bold">Webhooks</h1>
            <p className="text-sm text-white/60 mt-1">Receive real-time notifications for events</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus size={16} />
            Create Webhook
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {webhooks.length === 0 ? (
          <Card className="p-12 text-center">
            <Webhook className="w-12 h-12 mx-auto mb-4 text-white/20" />
            <h3 className="text-lg font-semibold mb-2">No Webhooks</h3>
            <p className="text-sm text-white/60 mb-6">
              Create a webhook to receive event notifications
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus size={16} />
              Create Webhook
            </Button>
          </Card>
        ) : (
          <div>
            <div className="mb-6 p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg">
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Webhook size={16} className="text-blue-400" />
                About Webhooks
              </h3>
              <p className="text-xs text-white/70 mb-3">
                Webhooks allow you to receive real-time notifications when jobs complete. We'll send a POST request to your URL with job details.
              </p>
              <div className="space-y-2 text-xs">
                <div>
                  <strong className="text-white/80">Payload example:</strong>
                  <pre className="mt-1 p-2 bg-white/5 rounded border border-white/10 overflow-x-auto">
{`{
  "event": "job.completed",
  "job_id": "job_...",
  "status": "completed",
  "result": { ... },
  "timestamp": "2025-01-01T00:00:00Z"
}`}
                  </pre>
                </div>
                <div className="flex items-start gap-2 text-white/60">
                  <Check size={14} className="text-green-400 mt-0.5 shrink-0" />
                  <span>Events: job.completed, job.failed</span>
                </div>
                <div className="flex items-start gap-2 text-white/60">
                  <Check size={14} className="text-green-400 mt-0.5 shrink-0" />
                  <span>Retries: 3 attempts with exponential backoff</span>
                </div>
              </div>
            </div>
            <div className="grid gap-4">
              {webhooks.map((webhook) => (
                <Card key={webhook.webhook_id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Webhook size={18} className="text-brand-500" />
                        <code className="text-sm font-mono">{webhook.url}</code>
                        <Badge variant={webhook.status === 'active' ? 'success' : 'default'}>
                          {webhook.status}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {webhook.events.map((event) => (
                          <Badge key={event} variant="info" className="text-xs">
                            {event}
                          </Badge>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-white/50">Created:</span>
                          <span className="ml-2">{new Date(webhook.created_at).toLocaleDateString()}</span>
                        </div>
                        {webhook.last_triggered && (
                          <div>
                            <span className="text-white/50">Last Triggered:</span>
                            <span className="ml-2">{new Date(webhook.last_triggered).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        onClick={() => handleTest(webhook.webhook_id, webhook.url)}
                        className="text-xs"
                        disabled={testingWebhook === webhook.webhook_id}
                      >
                        {testingWebhook === webhook.webhook_id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <TestTube size={14} />
                        )}
                        Test
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => handleDelete(webhook.webhook_id)}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        <Trash2 size={14} />
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {showCreateModal && (
        <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Webhook">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-white/70 mb-2 block">Webhook URL</label>
              <input
                type="url"
                placeholder="https://your-app.com/webhook"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-brand-500/50"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-white/70 mb-2 block">Events</label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {availableEvents.map((event) => (
                  <label key={event} className="flex items-center gap-2 p-2 hover:bg-white/5 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedEvents.includes(event)}
                      onChange={() => toggleEvent(event)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">{event}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setShowCreateModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={createWebhook} disabled={creating} className="flex-1">
                {creating ? <Loader2 size={16} className="animate-spin" /> : 'Create'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
