import { useState, useEffect } from 'react'
import { Plus, Search, Database as DatabaseIcon, Loader2, Trash2, Edit } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Select } from '@/components/ui/select'
import { apiGetDatasets, apiCreateDataset, apiDeprecateDataset, apiUpdateDataset } from '@/lib/api'

type FieldType = 'u8' | 'u16' | 'u32' | 'u64' | 'bool' | 'string' | 'number'

type Field = {
  id: string
  name: string
  type: FieldType
  required: boolean
  min?: number
  max?: number
}

export default function DatasetsPage() {
  const [loading, setLoading] = useState(true)
  const [datasets, setDatasets] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    loadDatasets()
  }, [])

  async function loadDatasets() {
    try {
      const data = await apiGetDatasets()
      setDatasets(data.items)
    } catch (error) {
      console.error('Failed to load datasets:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredDatasets = datasets.filter((ds) =>
    ds.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Datasets</h1>
          <p className="text-text-secondary">Define schemas for your encrypted compute jobs</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus size={18} />
          Create Dataset
        </Button>
      </div>

      <Card className="mb-6">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
          <input
            type="text"
            placeholder="Search datasets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-transparent border-none outline-none text-sm"
          />
        </div>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        </div>
      ) : filteredDatasets.length === 0 ? (
        <Card className="py-12">
          <div className="flex flex-col items-center text-center">
            <DatabaseIcon size={48} className="text-white/20 mb-4" />
            <p className="text-text-secondary mb-1">
              {searchQuery ? 'No datasets found' : 'No datasets yet'}
            </p>
            <p className="text-sm text-white/50 mb-6">
              {searchQuery ? 'Try a different search term' : 'Create your first dataset to get started'}
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus size={18} />
                Create Dataset
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredDatasets.map((dataset) => (
            <DatasetCard key={dataset.dataset_id} dataset={dataset} onUpdate={loadDatasets} />
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateDatasetModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            loadDatasets()
          }}
        />
      )}
    </div>
  )
}

function DatasetCard({ dataset, onUpdate }: { dataset: any; onUpdate: () => void }) {
  const [deprecating, setDeprecating] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [showEdit, setShowEdit] = useState(false)

  async function handleDeprecate() {
    if (!confirm('Are you sure you want to deprecate this dataset?')) return
    setDeprecating(true)
    try {
      await apiDeprecateDataset(dataset.dataset_id)
      onUpdate()
    } catch (error) {
      console.error('Failed to deprecate dataset:', error)
      alert('Failed to deprecate dataset')
    } finally {
      setDeprecating(false)
    }
  }

  const fieldCount = dataset.field_count || (dataset.schema?.properties ? Object.keys(dataset.schema.properties).length : 0)

  return (
    <>
      <Card className="hover:border-white/20 transition">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold">{dataset.name}</h3>
              <Badge variant={dataset.status === 'active' ? 'success' : 'default'}>
                {dataset.status}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-text-secondary">
              <span>{fieldCount} fields</span>
              <span>•</span>
              <span>Created {new Date(dataset.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" className="text-xs px-3 py-1.5" onClick={() => setShowDetails(true)}>
              View
            </Button>
            {dataset.status === 'active' && (
              <>
                <Button variant="ghost" className="text-xs px-2 py-1.5" onClick={() => setShowEdit(true)}>
                  <Edit size={14} />
                </Button>
                <Button
                  variant="ghost"
                  className="text-xs px-2 py-1.5 text-red-400 hover:bg-red-500/10"
                  onClick={handleDeprecate}
                  loading={deprecating}
                >
                  <Trash2 size={14} />
                </Button>
              </>
            )}
        </div>
      </div>
    </Card>

    {showDetails && (
      <DatasetDetailsModal
        dataset={dataset}
        open={showDetails}
        onClose={() => setShowDetails(false)}
      />
    )}
    {showEdit && (
      <EditDatasetModal
        dataset={dataset}
        open={showEdit}
        onClose={() => setShowEdit(false)}
        onUpdate={onUpdate}
      />
    )}
    </>
  )
}

function DatasetDetailsModal({ dataset, open, onClose }: { dataset: any; open: boolean; onClose: () => void }) {
  const schema = dataset.schema
  const properties = schema?.properties || {}
  const required = schema?.required || []

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={dataset.name}
      description={`Dataset ID: ${dataset.dataset_id}`}
    >
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold mb-3">Schema Fields</h3>
          <div className="space-y-2">
            {Object.entries(properties).map(([fieldName, fieldSchema]: [string, any]) => (
              <div key={fieldName} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/10">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-medium">{fieldName}</span>
                  {required.includes(fieldName) && (
                    <Badge variant="warning">Required</Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <code className="text-brand-500">{fieldSchema.type}</code>
                  {fieldSchema.minimum !== undefined && (
                    <span className="text-white/50">min: {fieldSchema.minimum}</span>
                  )}
                  {fieldSchema.maximum !== undefined && (
                    <span className="text-white/50">max: {fieldSchema.maximum}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-white/50">Status:</span>
            <span className="ml-2 font-medium">{dataset.status}</span>
          </div>
          <div>
            <span className="text-white/50">Created:</span>
            <span className="ml-2 font-medium">
              {new Date(dataset.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="bg-white/[0.02] border border-white/10 rounded-lg p-4">
          <h4 className="text-xs font-semibold mb-2 text-white/70">SAMPLE CURL</h4>
          <pre className="text-xs font-mono text-white/80 overflow-x-auto">
{`curl -X POST https://api.flaek.dev/v1/jobs \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "dataset_id": "${dataset.dataset_id}",
    "operation": "YOUR_OPERATION_ID",
    "inputs": [${Object.keys(properties).length > 0 ? `
      {
        ${Object.keys(properties).slice(0, 2).map(k => `"${k}": ...`).join(',\n        ')}
      }` : ''}
    ]
  }'`}
          </pre>
        </div>

        <div className="pt-4">
          <Button variant="secondary" onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function CreateDatasetModal({ open, onClose, onSuccess }: {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const [name, setName] = useState('')
  const [fields, setFields] = useState<Field[]>([
    { id: '1', name: '', type: 'u64', required: true }
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function addField() {
    setFields([...fields, {
      id: Date.now().toString(),
      name: '',
      type: 'u64',
      required: false
    }])
  }

  function removeField(id: string) {
    setFields(fields.filter((f) => f.id !== id))
  }

  function updateField(id: string, updates: Partial<Field>) {
    setFields(fields.map((f) => f.id === id ? { ...f, ...updates } : f))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Dataset name is required')
      return
    }

    const validFields = fields.filter((f) => f.name.trim())
    if (validFields.length === 0) {
      setError('At least one field is required')
      return
    }

    const schema = {
      type: 'object',
      required: validFields.filter((f) => f.required).map((f) => f.name),
      properties: validFields.reduce((acc, field) => {
        const prop: any = { type: field.type }
        if (field.min !== undefined) prop.minimum = field.min
        if (field.max !== undefined) prop.maximum = field.max
        acc[field.name] = prop
        return acc
      }, {} as Record<string, any>)
    }

    setLoading(true)
    try {
      await apiCreateDataset({
        name: name.trim(),
        schema
      })
      onSuccess()
    } catch (err: any) {
      setError(err.message || 'Failed to create dataset')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create Dataset"
      description="Define a schema for your encrypted data"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Dataset Name"
          placeholder="e.g., loan_applications"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium">Schema Fields</label>
            <Button type="button" variant="ghost" onClick={addField} className="text-xs">
              <Plus size={14} />
              Add Field
            </Button>
          </div>

          <div className="mb-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
            <p className="text-xs text-blue-400 leading-relaxed">
              <strong>Tip:</strong> Use u8 for small numbers (age, count), u16-u32 for amounts, u64 for large values, bool for yes/no flags.
            </p>
          </div>

          <div className="space-y-3">
            {fields.map((field) => (
              <div key={field.id} className="flex gap-2">
                <Input
                  placeholder="Field name"
                  value={field.name}
                  onChange={(e) => updateField(field.id, { name: e.target.value })}
                  className="flex-1"
                />
                <Select
                  options={[
                    { value: 'u8', label: 'u8 (0-255)' },
                    { value: 'u16', label: 'u16 (0-65K)' },
                    { value: 'u32', label: 'u32 (0-4B)' },
                    { value: 'u64', label: 'u64 (Large)' },
                    { value: 'bool', label: 'bool (Yes/No)' },
                    { value: 'string', label: 'string (Text)' },
                    { value: 'number', label: 'number (Decimal)' },
                  ]}
                  value={field.type}
                  onChange={(e) => updateField(field.id, { type: e.target.value as FieldType })}
                  className="w-44"
                />
                <label className="flex items-center gap-2 px-3 py-2 border border-white/10 rounded-lg bg-white/[0.03] cursor-pointer hover:bg-white/[0.06] transition">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) => updateField(field.id, { required: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-xs text-white/70">Required</span>
                </label>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => removeField(field.id)}
                    className="px-2"
                  >
                    <Trash2 size={14} className="text-red-400" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3 pt-4">
          <Button type="submit" loading={loading} className="flex-1">
            Create Dataset
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function EditDatasetModal({ dataset, open, onClose, onUpdate }: { dataset: any; open: boolean; onClose: () => void; onUpdate: () => void }) {
  const [name, setName] = useState(dataset.name)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Dataset name is required')
      return
    }

    setLoading(true)
    setError('')

    try {
      await apiUpdateDataset(dataset.dataset_id, { name: name.trim() })
      onUpdate()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to update dataset')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit Dataset">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-white/70 mb-2 block">Dataset Name</label>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Customer Data"
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3">
          <Button type="submit" loading={loading} className="flex-1">
            Update Dataset
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  )
}
