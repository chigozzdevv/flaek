import { useEffect, useState } from 'react'
import { Loader2, Box, Trash2, Eye, Plus, Search, Play, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { navigate } from '@/lib/router'
import { apiGetOperations, apiGetOperation, apiDeprecateOperation, apiUpdateOperation } from '@/lib/api'

type Operation = {
  operation_id: string
  name: string
  version: string
  pipeline_hash: string
  created_at: string
  status: 'active' | 'deprecated'
}

export default function OperationsPage() {
  const [operations, setOperations] = useState<Operation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedOp, setSelectedOp] = useState<any>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [editingOp, setEditingOp] = useState<any>(null)
  

  useEffect(() => {
    loadOperations()
  }, [])

  async function loadOperations() {
    try {
      const data = await apiGetOperations()
      setOperations(data.items)
    } catch (error) {
      console.error('Failed to load operations:', error)
    } finally {
      setLoading(false)
    }
  }

  async function viewOperation(id: string) {
    try {
      const data = await apiGetOperation(id)
      setSelectedOp(data)
      setShowDetails(true)
    } catch (error) {
      console.error('Failed to load operation:', error)
      alert('Failed to load operation details')
    }
  }

  function openPlayground(id: string) {
    try {
      localStorage.setItem('flaek_last_op', id)
      navigate('/dashboard/playground')
    } catch {}
  }

  async function deprecateOperation(id: string, name: string) {
    if (!confirm(`Deprecate operation "${name}"? This will prevent new jobs from using it.`)) {
      return
    }
    try {
      await apiDeprecateOperation(id)
      await loadOperations()
      alert('Operation deprecated successfully')
    } catch (error: any) {
      alert(`Failed to deprecate: ${error.message}`)
    }
  }

  const filteredOps = operations.filter((op) =>
    op.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    op.version.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Operations</h1>
            <p className="text-sm text-white/60 mt-1">Published pipeline operations</p>
          </div>
          <Button onClick={() => navigate('/dashboard/pipelines')}>
            <Plus size={16} />
            Create Operation
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search operations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-brand-500/50"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {filteredOps.length === 0 ? (
          <Card className="p-12 text-center">
            <Box className="w-12 h-12 mx-auto mb-4 text-white/20" />
            <h3 className="text-lg font-semibold mb-2">No Operations Yet</h3>
            <p className="text-sm text-white/60 mb-6">
              Create your first operation by building a pipeline
            </p>
            <Button onClick={() => navigate('/dashboard/pipelines')}>
              <Plus size={16} />
              Create Operation
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredOps.map((op) => (
              <Card key={op.operation_id} className="p-4 hover:bg-white/[0.03] transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{op.name}</h3>
                      <Badge variant={op.status === 'active' ? 'success' : 'default'}>
                        {op.status}
                      </Badge>
                      <Badge variant="info">{op.version}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-white/50">Pipeline Hash:</span>
                        <span className="ml-2 font-mono text-xs">{op.pipeline_hash.slice(0, 16)}...</span>
                      </div>
                      <div>
                        <span className="text-white/50">Created:</span>
                        <span className="ml-2">{new Date(op.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {op.status === 'active' && (
                      <Button onClick={() => openPlayground(op.operation_id)} className="text-xs">
                        <Play size={14} />
                        Playground
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      onClick={() => viewOperation(op.operation_id)}
                      className="text-xs"
                    >
                      <Eye size={14} />
                      View
                    </Button>
                    {op.status === 'active' && (
                      <>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setEditingOp(op)
                            setShowEdit(true)
                          }}
                          className="text-xs"
                        >
                          <Edit size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => deprecateOperation(op.operation_id, op.name)}
                          className="text-xs text-red-400 hover:text-red-300"
                        >
                          <Trash2 size={14} />
                          Deprecate
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {showEdit && editingOp && (
        <EditOperationModal
          operation={editingOp}
          open={showEdit}
          onClose={() => {
            setShowEdit(false)
            setEditingOp(null)
          }}
          onUpdate={loadOperations}
        />
      )}

      {/* Run modal removed; use Playground instead */}

      {showDetails && selectedOp && (
        <Modal open={showDetails} onClose={() => setShowDetails(false)} title="Operation Details">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-white/70 mb-1 block">Name</label>
              <div className="text-sm">{selectedOp.name}</div>
            </div>
            <div>
              <label className="text-xs font-semibold text-white/70 mb-1 block">Version</label>
              <div className="text-sm">{selectedOp.version}</div>
            </div>
            <div>
              <label className="text-xs font-semibold text-white/70 mb-1 block">Status</label>
              <Badge variant={selectedOp.status === 'active' ? 'success' : 'default'}>
                {selectedOp.status}
              </Badge>
            </div>
            <div>
              <label className="text-xs font-semibold text-white/70 mb-1 block">Runtime</label>
              <div className="text-sm">{selectedOp.runtime}</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-white/70 mb-1 block">Inputs</label>
                <div className="text-xs text-white/60">
                  {selectedOp.inputs?.join(', ') || 'None'}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-white/70 mb-1 block">Outputs</label>
                <div className="text-xs text-white/60">
                  {selectedOp.outputs?.join(', ') || 'None'}
                </div>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-white/70 mb-1 block">Pipeline Hash</label>
              <div className="text-xs font-mono bg-white/5 p-2 rounded border border-white/10 break-all">
                {selectedOp.pipeline_hash}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-white/70 mb-1 block">Artifact URI</label>
              <div className="text-xs font-mono bg-white/5 p-2 rounded border border-white/10 break-all">
                {selectedOp.artifact_uri}
              </div>
            </div>
            <Button variant="secondary" onClick={() => setShowDetails(false)} className="w-full">
              Close
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// RunJobModal removed in favor of the Playground

function EditOperationModal({ operation, open, onClose, onUpdate }: { operation: any; open: boolean; onClose: () => void; onUpdate: () => void }) {
  const [name, setName] = useState(operation.name)
  const [version, setVersion] = useState(operation.version)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Operation name is required')
      return
    }

    setLoading(true)
    setError('')

    try {
      await apiUpdateOperation(operation.operation_id, { 
        name: name.trim(), 
        version: version.trim() 
      })
      onUpdate()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to update operation')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit Operation">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-white/70 mb-2 block">Operation Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., credit-score-calculator"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-brand-500/50"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-white/70 mb-2 block">Version</label>
          <input
            type="text"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            placeholder="e.g., 1.0.0"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-brand-500/50"
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3">
          <Button type="submit" loading={loading} className="flex-1">
            Update Operation
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  )
}
