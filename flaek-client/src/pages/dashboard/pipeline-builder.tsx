import { useState, useCallback, useEffect } from 'react'
import ReactFlow, {
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  Panel,
  Handle,
  Position,
} from 'reactflow'
import type { Node, Connection, NodeTypes } from 'reactflow'
import 'reactflow/dist/style.css'

const customStyles = `
  .react-flow__node {
    background: transparent !important;
    border: none !important;
    padding: 0 !important;
    box-shadow: none !important;
  }
  .react-flow__node.selected {
    box-shadow: none !important;
  }
  .react-flow__attribution {
    display: none !important;
  }
`
import { Save, Trash2, Loader2, Zap, X, Menu, ArrowLeft, Play, Beaker, Code, Copy, Check, Plus } from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { navigate } from '@/lib/router'
import { apiGetBlocks, apiCreateOperation, apiGetPipelineDraft, apiSavePipelineDraft, apiDeletePipelineDraft, apiTestPipeline, apiGetDatasets, apiGetDataset } from '@/lib/api'

type BlockDef = {
  id: string
  name: string
  category: string
  description: string
  circuit: string
  inputs: Array<{ name: string; type: string; description: string; required: boolean }>
  outputs: Array<{ name: string; type: string; description: string }>
  icon?: string
  color?: string
}

function InputNode({ data, selected }: { data: any; selected?: boolean }) {
  return (
    <div className={`group relative px-4 py-3 rounded-lg border min-w-[140px] shadow-lg transition-all bg-[#0e1726] ${
      selected ? 'border-green-500/60 shadow-green-500/20' : 'border-green-500/30 hover:border-green-500/50'
    }`}>
      <button
        onPointerDownCapture={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation()
          data.onDelete?.()
        }}
        className="nodrag nopan absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg opacity-0 group-hover:opacity-100 z-[100] cursor-pointer"
        type="button"
      >
        <X size={12} className="text-white pointer-events-none" />
      </button>
      <div className="flex items-center gap-2 mb-1">
        <div className="text-xs font-semibold text-green-400">INPUT</div>
      </div>
      <div className="text-sm font-medium text-white/90">{data.fieldName || 'unnamed'}</div>
      <Handle type="source" position={Position.Right} className="w-2.5 h-2.5 bg-green-500 border border-green-400/50" />
    </div>
  )
}

function OutputNode({ data, selected }: { data: any; selected?: boolean }) {
  return (
    <div className={`group relative px-4 py-3 rounded-lg border min-w-[140px] shadow-lg transition-all bg-[#0e1726] ${
      selected ? 'border-blue-500/60 shadow-blue-500/20' : 'border-blue-500/30 hover:border-blue-500/50'
    }`}>
      <button
        onPointerDownCapture={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation()
          data.onDelete?.()
        }}
        className="nodrag nopan absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg opacity-0 group-hover:opacity-100 z-[100] cursor-pointer"
        type="button"
      >
        <X size={12} className="text-white pointer-events-none" />
      </button>
      <Handle type="target" position={Position.Left} className="w-2.5 h-2.5 bg-blue-500 border border-blue-400/50" />
      <div className="flex items-center gap-2 mb-1">
        <div className="text-xs font-semibold text-blue-400">OUTPUT</div>
      </div>
      <div className="text-sm font-medium text-white/90">{data.fieldName || 'unnamed'}</div>
    </div>
  )
}

function BlockNode({ data, selected }: { data: any; selected?: boolean }) {
  const blockColor = data.block?.color || '#6a4ff8'
  return (
    <div
      className={`group relative px-4 py-3 rounded-lg border min-w-[160px] shadow-lg transition-all bg-[#0e1726] ${
        selected ? 'shadow-xl' : 'hover:shadow-xl'
      }`}
      style={{
        borderColor: selected ? blockColor + '99' : blockColor + '55',
      }}
    >
      <button
        onPointerDownCapture={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation()
          data.onDelete?.()
        }}
        className="nodrag nopan absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg opacity-0 group-hover:opacity-100 z-[100] cursor-pointer"
        type="button"
      >
        <X size={12} className="text-white pointer-events-none" />
      </button>
      <Handle type="target" position={Position.Left} className="w-2.5 h-2.5 border" style={{ background: blockColor, borderColor: blockColor + '80' }} />
      <div className="flex items-center gap-2 mb-1.5">
        <div
          className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold text-white"
          style={{ background: blockColor }}
        >
          {data.label?.[0] || 'B'}
        </div>
        <div className="text-xs font-semibold" style={{ color: blockColor }}>{data.block?.category || 'Block'}</div>
      </div>
      <div className="text-sm font-medium text-white/90">{data.label}</div>
      <Handle type="source" position={Position.Right} className="w-2.5 h-2.5 border" style={{ background: blockColor, borderColor: blockColor + '80' }} />
    </div>
  )
}

const nodeTypes: NodeTypes = { input: InputNode, output: OutputNode, block: BlockNode }

export default function PipelineBuilderPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [blocks, setBlocks] = useState<BlockDef[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)

  // nodeTypes is a stable top-level constant (no re-creation per render)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [showPalette, setShowPalette] = useState(true)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [showTestPanel, setShowTestPanel] = useState(false)
  const [testInputs, setTestInputs] = useState<Record<string, any>>({})
  const [testResult, setTestResult] = useState<any>(null)
  const [testing, setTesting] = useState(false)
  const [testError, setTestError] = useState('')
  const [datasets, setDatasets] = useState<any[]>([])
  const [selectedDataset, setSelectedDataset] = useState<string>('')
  const [showCanvas, setShowCanvas] = useState(false)
  const [hasDraft, setHasDraft] = useState(false)
  const [draftInfo, setDraftInfo] = useState<any>(null)

  function handleNewPipeline() {
    setNodes([])
    setEdges([])
    setSelectedDataset('')
    setShowCanvas(true)
  }

  function handleContinueEditing() {
    setShowCanvas(true)
  }

  function getTimeAgo(date: string) {
    const now = new Date()
    const updated = new Date(date)
    const diffMs = now.getTime() - updated.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  }


  function PublishPipelineModal({ open, onClose, pipeline, selectedDataset }: { open: boolean; onClose: () => void; pipeline: any; selectedDataset: string }) {
  const [name, setName] = useState('')
  const [version, setVersion] = useState('1.0.0')
  const [mxeProgramId, setMxeProgramId] = useState('EdNxpkFCVuSzwP5FmPxbSm4k9kvdyQ7dgRN9u4m7mRYJ')
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState('')
  const [publishedOp, setPublishedOp] = useState<any>(null)
  const [showCodeSnippet, setShowCodeSnippet] = useState(false)
  const [jobRetentionDays, setJobRetentionDays] = useState(90)
  const [resultRetentionDays, setResultRetentionDays] = useState(365)
  const [autoDeleteAfter, setAutoDeleteAfter] = useState(true)

  // Extract inputs and outputs from pipeline
  const inputs = pipeline.nodes.filter((n: any) => n.type === 'input').map((n: any) => n.data.fieldName).filter(Boolean)
  const outputs = pipeline.nodes.filter((n: any) => n.type === 'output').map((n: any) => n.data.fieldName).filter(Boolean)

  async function handlePublish() {
    if (!name.trim()) {
      setError('Operation name is required')
      return
    }
    if (!version.trim()) {
      setError('Version is required')
      return
    }
    if (inputs.length === 0) {
      setError('Pipeline must have at least one input node')
      return
    }
    if (outputs.length === 0) {
      setError('Pipeline must have at least one output node')
      return
    }

    setPublishing(true)
    setError('')
    
    try {
      // Normalize nodes: ensure blockId is at top level for backend
      const normalizedNodes = pipeline.nodes.map((node: any) => ({
        id: node.id,
        type: node.type,
        blockId: node.data?.blockId || node.blockId,
        data: node.data,
        position: node.position,
      }))

      const result = await apiCreateOperation({
        name: name.trim(),
        version: version.trim(),
        pipeline: {
          nodes: normalizedNodes,
          edges: pipeline.edges,
        },
        mxeProgramId,
        datasetId: selectedDataset || undefined,
        retentionPolicy: {
          jobRetentionDays,
          resultRetentionDays,
          autoDeleteAfter
        }
      })

      setPublishedOp({ ...result, name: name.trim(), version: version.trim(), inputs, outputs, dataset_id: selectedDataset || undefined })
      setShowCodeSnippet(true)
    } catch (err: any) {
      setError(err.message || 'Failed to publish pipeline')
    } finally {
      setPublishing(false)
    }
  }

  if (showCodeSnippet && publishedOp) {
    return (
      <CodeSnippetModal
        open={open}
        onClose={() => {
          onClose()
          navigate('/dashboard/operations')
        }}
        operation={publishedOp}
      />
    )
  }

  return (
    <Modal open={open} onClose={onClose} title="Publish Pipeline">
      <div className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-white/70 mb-2 block">Operation Name *</label>
          <input
            type="text"
            placeholder="e.g., credit-score-calculator"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-brand-500/50"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-white/70 mb-2 block">Version *</label>
          <input
            type="text"
            placeholder="1.0.0"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-brand-500/50"
          />
        </div>

        {selectedDataset && (
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="text-sm font-medium text-green-400 mb-1">✓ Dataset Schema Linked</div>
            <div className="text-xs text-white/70">
              This operation will validate inputs against the selected dataset schema
            </div>
          </div>
        )}

        <details className="border border-white/10 rounded-lg">
          <summary className="px-3 py-2 cursor-pointer hover:bg-white/5 rounded-lg text-sm font-semibold">
            Data Retention Policy
          </summary>
          <div className="p-3 space-y-3 border-t border-white/10">
            <div>
              <label className="text-xs font-semibold text-white/70 mb-2 block">
                Job Input Retention (days)
              </label>
              <input
                type="number"
                value={jobRetentionDays}
                onChange={(e) => setJobRetentionDays(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500/50"
                min="0"
              />
              <p className="text-xs text-white/50 mt-1">
                How long to keep encrypted inputs (0 = indefinite)
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-white/70 mb-2 block">
                Result Retention (days)
              </label>
              <input
                type="number"
                value={resultRetentionDays}
                onChange={(e) => setResultRetentionDays(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500/50"
                min="0"
              />
              <p className="text-xs text-white/50 mt-1">
                How long to keep encrypted results (0 = indefinite)
              </p>
            </div>

            <label className="flex items-center gap-2 px-3 py-2 border border-white/10 rounded-lg bg-white/[0.03] cursor-pointer hover:bg-white/[0.06]">
              <input
                type="checkbox"
                checked={autoDeleteAfter}
                onChange={(e) => setAutoDeleteAfter(e.target.checked)}
                className="w-4 h-4"
              />
              <div>
                <div className="text-xs font-medium">Auto-delete after retention period</div>
                <div className="text-[10px] text-white/50">Automatically remove data when retention expires</div>
              </div>
            </label>
          </div>
        </details>

        <div>
          <label className="text-xs font-semibold text-white/70 mb-2 block">MXE Program ID</label>
          <input
            type="text"
            placeholder="MXE program address"
            value={mxeProgramId}
            onChange={(e) => setMxeProgramId(e.target.value)}
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-brand-500/50 font-mono"
            disabled
          />
          <p className="text-xs text-white/50 mt-1">Using deployed flaek_mxe program (devnet)</p>
        </div>

        <div className="grid grid-cols-2 gap-4 p-3 bg-white/[0.02] rounded-lg border border-white/5">
          <div>
            <div className="text-xs text-white/50 mb-1">Inputs</div>
            <div className="text-sm font-medium">{inputs.length} field{inputs.length !== 1 ? 's' : ''}</div>
            {inputs.length > 0 && (
              <div className="text-xs text-white/40 mt-1">{inputs.join(', ')}</div>
            )}
          </div>
          <div>
            <div className="text-xs text-white/50 mb-1">Outputs</div>
            <div className="text-sm font-medium">{outputs.length} field{outputs.length !== 1 ? 's' : ''}</div>
            {outputs.length > 0 && (
              <div className="text-xs text-white/40 mt-1">{outputs.join(', ')}</div>
            )}
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={publishing} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handlePublish} disabled={publishing} className="flex-1">
            {publishing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Save size={16} />
                Publish
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

  const TEMPLATES = [
  {
    id: 'credit_score',
    name: 'Credit Score Calculator',
    description: 'Calculate credit score from income, debt, and payment history',
    nodes: [
      { id: 'in1', type: 'input', position: { x: 50, y: 50 }, data: { fieldName: 'income' } },
      { id: 'in2', type: 'input', position: { x: 50, y: 150 }, data: { fieldName: 'debt' } },
      { id: 'in3', type: 'input', position: { x: 50, y: 250 }, data: { fieldName: 'missed_payments' } },
      { id: 'out1', type: 'output', position: { x: 650, y: 125 }, data: { fieldName: 'score' } },
    ],
    edges: [],
  },
  {
    id: 'simple_math',
    name: 'Simple Math',
    description: 'Add two numbers together',
    nodes: [
      { id: 'in1', type: 'input', position: { x: 50, y: 100 }, data: { fieldName: 'a' } },
      { id: 'in2', type: 'input', position: { x: 50, y: 200 }, data: { fieldName: 'b' } },
      { id: 'out1', type: 'output', position: { x: 500, y: 150 }, data: { fieldName: 'result' } },
    ],
    edges: [],
  },
]

  // Load pipeline draft from backend on mount
  useEffect(() => {
    async function init() {
      try {
        await loadBlocks()
        const loadedDatasets = await loadDatasets()
        await loadDraft(loadedDatasets)
      } catch (err) {
        console.error('Failed to initialize pipeline builder:', err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  async function loadDraft(datasetsToUse?: any[]) {
    try {
      const { draft } = await apiGetPipelineDraft()
      if (draft?.pipeline) {
        const { nodes: savedNodes, edges: savedEdges, datasetId } = draft.pipeline

        setHasDraft(savedNodes && savedNodes.length > 0)

        if (savedNodes && savedNodes.length > 0) {
          // Use passed datasets or fall back to state
          const datasetsList = datasetsToUse || datasets
          const dataset = datasetsList.find(d => d.dataset_id === datasetId)
          setDraftInfo({
            nodeCount: savedNodes.length,
            datasetName: dataset?.name || 'Unknown',
            datasetId,
            updatedAt: draft.updatedAt
          })
        }

        if (datasetId) {
          setSelectedDataset(datasetId)
        }

        if (savedNodes && savedNodes.length > 0) {
          const nodesWithDelete = savedNodes.map((node: any) => ({
            ...node,
            data: {
              ...node.data,
              onDelete: () => deleteNode(node.id)
            }
          }))
          setNodes(nodesWithDelete)
          setEdges(savedEdges || [])
          setLastSaved(new Date(draft.updatedAt))
        }
      }
    } catch (err) {
      console.error('Failed to load draft:', err)
    }
  }

  // Auto-save pipeline to backend whenever nodes, edges, or dataset change (debounced)
  useEffect(() => {
    if (nodes.length === 0 && edges.length === 0) return

    const timeoutId = setTimeout(async () => {
      try {
        const pipeline = { nodes, edges, datasetId: selectedDataset }
        await apiSavePipelineDraft(pipeline)
        setLastSaved(new Date())
      } catch (err) {
        console.error('Failed to save draft:', err)
      }
    }, 1000) // Debounce by 1 second

    return () => clearTimeout(timeoutId)
  }, [nodes, edges, selectedDataset])

  async function loadBlocks() {
    try {
      const data = await apiGetBlocks()
      setBlocks(data.blocks || [])
    } catch (error) {
      console.error('Failed to load blocks:', error)
      throw error
    }
  }

  async function loadDatasets() {
    try {
      const data = await apiGetDatasets()
      const activeDatasets = data.items.filter((d: any) => d.status === 'active')
      setDatasets(activeDatasets)
      return activeDatasets
    } catch (error) {
      console.error('Failed to load datasets:', error)
      throw error
    }
  }

  async function handleDatasetChange(datasetId: string) {
    setSelectedDataset(datasetId)
    
    if (!datasetId) return
    
    const dataset = datasets.find(d => d.dataset_id === datasetId)
    if (!dataset) return
    
    try {
      const fullDataset = await apiGetDataset(datasetId)
      const schema = fullDataset.schema
      
      if (schema?.properties) {
        // Remove existing input nodes and their connected edges in one go
        const existingInputIds = new Set(nodes.filter(n => n.type === 'input').map(n => n.id))
        if (existingInputIds.size > 0) {
          setNodes((nds) => nds.filter((node) => !existingInputIds.has(node.id)))
          setEdges((eds) => eds.filter((e) => !existingInputIds.has(e.source) && !existingInputIds.has(e.target)))
        }
        
        const fieldNames = Object.keys(schema.properties)
        const newInputNodes = fieldNames.map((fieldName, index) => {
          const id = `input-${fieldName}-${Date.now()}`
          return {
            id,
            type: 'input',
            position: { x: 50, y: 100 + (index * 100) },
            data: { 
              fieldName,
              onDelete: () => deleteNode(id)
            },
          } as Node
        })
        
        setNodes((nds) => [...nds, ...newInputNodes])
      }
    } catch (error) {
      console.error('Failed to load dataset schema:', error)
    }
  }

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  )

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedNode(node)
  }, [])

  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
  }, [])

  function addOutputNode() {
    const id = `output-${Date.now()}`
    const newNode: Node = {
      id,
      type: 'output',
      position: { x: 700, y: 100 + nodes.length * 80 },
      data: { 
        fieldName: '',
        onDelete: () => deleteNode(id)
      },
    }
    setNodes((nds) => [...nds, newNode])
  }

  function addBlockNode(block: BlockDef) {
    const id = `block-${Date.now()}`
    const newNode: Node = {
      id,
      type: 'block',
      position: { x: 400, y: 100 + nodes.length * 80 },
      data: {
        label: block.name,
        blockId: block.id,
        block,
        onDelete: () => deleteNode(id)
      },
    }
    setNodes((nds) => [...nds, newNode])
  }

  function deleteNode(nodeId: string) {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId))
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId))
    if (selectedNode?.id === nodeId) setSelectedNode(null)
  }

  // Also handle keyboard-delete/backspace removals by React Flow
  const onNodesDelete = useCallback((deleted: Node[]) => {
    const ids = new Set(deleted.map((n) => n.id))
    setEdges((eds) => eds.filter((e) => !ids.has(e.source) && !ids.has(e.target)))
    if (selectedNode && ids.has(selectedNode.id)) setSelectedNode(null)
  }, [setEdges, selectedNode])

  function loadTemplate(template: typeof TEMPLATES[0]) {
    // Add onDelete callback to each node
    const nodesWithDelete = template.nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        onDelete: () => deleteNode(node.id)
      }
    }))
    setNodes(nodesWithDelete)
    setEdges(template.edges)
    setShowTemplates(false)
    setLastSaved(new Date())
  }

  async function clearPipeline() {
    if (confirm('Clear the current pipeline? This will remove all nodes and edges.')) {
      setNodes([])
      setEdges([])
      setSelectedNode(null)
      try {
        await apiDeletePipelineDraft()
      } catch (err) {
        console.error('Failed to delete draft:', err)
      }
      setLastSaved(null)
    }
  }

  async function handleTestPipeline() {
    setTestError('')
    setTestResult(null)
    setTesting(true)

    try {
      // Normalize nodes: ensure blockId is at top level for backend
      const normalizedNodes = nodes.map((node: any) => ({
        id: node.id,
        type: node.type,
        blockId: node.data?.blockId || node.blockId,
        data: node.data,
        position: node.position,
      }))

      const result = await apiTestPipeline({
        pipeline: { nodes: normalizedNodes, edges },
        inputs: testInputs,
        mxeProgramId: '39n29DcQUxTGDHVw6DNnhSa1T85EXrW88pmbK1VrT8gp',
      })

      setTestResult(result)
    } catch (err: any) {
      setTestError(err.message || 'Test failed')
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    )
  }

  if (!showCanvas) {
    return (
      <div className="min-h-screen bg-bg-base p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2">Pipeline Builder</h1>
            <p className="text-text-secondary">Build confidential compute pipelines with visual flow</p>
          </div>

          {hasDraft && draftInfo ? (
            <Card className="p-6 hover:border-white/20 transition">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
                      <Zap size={20} className="text-brand-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Your Draft Pipeline</h3>
                      <p className="text-xs text-white/50">Continue where you left off</p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-white/50">Dataset:</span>
                      <span className="font-medium text-brand-400">{draftInfo.datasetName}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-white/70">
                      <span>{draftInfo.nodeCount} nodes</span>
                      <span>•</span>
                      <span>Last saved {getTimeAgo(draftInfo.updatedAt)}</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button onClick={handleContinueEditing}>
                      <Play size={16} />
                      Continue Editing
                    </Button>
                    <Button variant="secondary" onClick={handleNewPipeline}>
                      Start Fresh
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="py-16">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mb-4">
                  <Zap size={32} className="text-brand-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No Draft Pipeline</h3>
                <p className="text-text-secondary mb-6 max-w-md">
                  Start building a new confidential compute pipeline. Select a dataset, add blocks, and connect them visually.
                </p>
                <Button onClick={handleNewPipeline}>
                  <Plus size={18} />
                  Create Your First Pipeline
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-bg-base z-50">
      <style>{customStyles}</style>
      {/* Toolbar */}
      <div className="h-14 border-b border-white/10 flex items-center justify-between px-4 bg-bg-elev">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => setShowCanvas(false)} className="px-2">
            <ArrowLeft size={18} />
          </Button>
          <div className="h-6 w-px bg-white/10" />
          <h1 className="text-base font-semibold">Pipeline Builder</h1>
          <Badge variant="info" className="text-xs">{nodes.length} nodes</Badge>
          {lastSaved && (
            <span className="text-xs text-white/40">
              Auto-saved {new Date().getTime() - lastSaved.getTime() < 3000 ? 'just now' : 'recently'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setShowTemplates(true)} className="text-xs">
            <Zap size={16} />
            Templates
          </Button>
          {nodes.length > 0 && (
            <>
              <Button variant="secondary" onClick={() => setShowTestPanel(true)} className="text-xs">
                <Beaker size={16} />
                Test
              </Button>
              <Button variant="ghost" onClick={clearPipeline} className="text-xs text-red-400 hover:text-red-300">
                <Trash2 size={16} />
                Clear
              </Button>
            </>
          )}
          <Button onClick={() => setShowSaveModal(true)} className="text-xs" disabled={nodes.length === 0}>
            <Save size={16} />
            Publish
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar - Blocks Palette */}
        {showPalette && (
          <div className="absolute left-0 top-0 bottom-0 z-10 shadow-2xl w-64">
            <div className="h-full border-r border-white/10 bg-bg-elev flex flex-col">
              <div className="p-3 border-b border-white/10 flex items-center justify-between shrink-0">
                <h2 className="text-sm font-semibold">Blocks</h2>
                <button onClick={() => setShowPalette(false)} className="p-1 hover:bg-white/5 rounded">
                  <X size={16} />
                </button>
              </div>
              
              {/* Dataset Selector & Add Input/Output buttons */}
              <div className="p-3 border-b border-white/10">
                <p className="text-xs font-semibold text-white/50 mb-2">DATASET SCHEMA</p>
                <div className="flex gap-2 mb-3">
                  <select
                    value={selectedDataset}
                    onChange={(e) => handleDatasetChange(e.target.value)}
                    className="flex-1 px-3 py-2 bg-bg-surface border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-brand-500/50"
                  >
                    <option value="" className="bg-bg-surface">Select dataset...</option>
                    {datasets.map((ds) => (
                      <option key={ds.dataset_id} value={ds.dataset_id} className="bg-bg-surface">
                        {ds.name} ({ds.field_count} fields)
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => navigate('/dashboard/datasets')}
                    className="px-2 py-2 bg-brand-500/10 border border-brand-500/30 rounded-lg hover:bg-brand-500/20 transition"
                    title="Create new dataset"
                  >
                    <Plus size={14} className="text-brand-400" />
                  </button>
                </div>
                {!selectedDataset && (
                  <p className="text-[10px] text-yellow-400 mb-3">⚠️ Select dataset to auto-generate inputs</p>
                )}
                {selectedDataset && (
                  <p className="text-[10px] text-green-400 mb-3">✓ Input nodes generated from schema</p>
                )}
                <button
                  onClick={addOutputNode}
                  className="w-full p-2 rounded-lg bg-blue-500/5 border border-blue-500/20 hover:bg-blue-500/10 transition text-left"
                >
                  <div className="font-medium text-xs text-blue-400">+ Output</div>
                </button>
              </div>

              {/* Blocks Section - Scrollable */}
              <div className="flex-1 overflow-y-auto p-3">
                <p className="text-xs font-semibold text-white/50 mb-2">BLOCKS ({blocks.length})</p>
                <div className="space-y-1.5">
                  {blocks.map((block) => (
                    <button
                      key={block.id}
                      onClick={() => addBlockNode(block)}
                      className="w-full p-2.5 rounded-lg bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] hover:border-brand-500/50 transition text-left"
                    >
                      <div className="font-medium text-xs mb-0.5">{block.name}</div>
                      <div className="text-[10px] text-white/40 line-clamp-1">{block.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {!showPalette && (
          <button
            onClick={() => setShowPalette(true)}
            className="absolute left-4 top-4 z-10 p-3 rounded-lg bg-bg-elev border border-white/10 hover:bg-white/5 transition shadow-lg"
          >
            <Menu size={20} />
          </button>
        )}

        {/* Canvas */}
        <div className="flex-1 relative bg-[#0a0b0f]">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onNodesDelete={onNodesDelete}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background gap={20} size={2} color="#ffffff" style={{ opacity: 0.05 }} />
            <Controls position="bottom-right" />
            <Panel position="top-center">
              {nodes.length === 0 && (
                <Card className="p-4 shadow-2xl">
                  <p className="text-sm text-text-secondary">
                    Click <strong>blocks palette</strong> on the left or load a <strong>template</strong> to start
                  </p>
                </Card>
              )}
            </Panel>
          </ReactFlow>
        </div>

        {/* Right Sidebar - Inspector */}
        {selectedNode && (
          <div className="absolute right-0 top-0 bottom-0 z-10 shadow-2xl">
            <div className="w-80 h-full border-l border-white/10 bg-bg-elev flex flex-col">
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold">Node Inspector</h2>
                  <Badge className="mt-1">{selectedNode.type}</Badge>
                </div>
                <button onClick={() => setSelectedNode(null)} className="p-1 hover:bg-white/5 rounded">
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {selectedNode.type === 'input' && (
                  <div>
                    <label className="text-xs font-semibold text-white/70 mb-2 block">Field Name</label>
                    <input
                      type="text"
                      placeholder="e.g., age, income"
                      value={selectedNode.data.fieldName || ''}
                      onChange={(e) => {
                        setNodes((nds) =>
                          nds.map((n) => n.id === selectedNode.id ? { ...n, data: { ...n.data, fieldName: e.target.value } } : n)
                        )
                        setSelectedNode({ ...selectedNode, data: { ...selectedNode.data, fieldName: e.target.value } })
                      }}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-brand-500/50"
                    />
                    <p className="text-xs text-white/50 mt-2">Dataset field to use as input</p>
                  </div>
                )}

                {selectedNode.type === 'output' && (
                  <div>
                    <label className="text-xs font-semibold text-white/70 mb-2 block">Field Name</label>
                    <input
                      type="text"
                      placeholder="e.g., score, result"
                      value={selectedNode.data.fieldName || ''}
                      onChange={(e) => {
                        setNodes((nds) =>
                          nds.map((n) => n.id === selectedNode.id ? { ...n, data: { ...n.data, fieldName: e.target.value } } : n)
                        )
                        setSelectedNode({ ...selectedNode, data: { ...selectedNode.data, fieldName: e.target.value } })
                      }}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-brand-500/50"
                    />
                    <p className="text-xs text-white/50 mt-2">Name for this output field</p>
                  </div>
                )}

                {selectedNode.type === 'block' && selectedNode.data.block && (
                  <>
                    <div>
                      <h3 className="text-sm font-semibold mb-2">{selectedNode.data.block.name}</h3>
                      <p className="text-xs text-white/50">{selectedNode.data.block.description}</p>
                    </div>
                  </>
                )}

                <div className="pt-2 border-t border-white/10">
                  <Button
                    variant="danger"
                    onClick={() => {
                      deleteNode(selectedNode.id)
                      setSelectedNode(null)
                    }}
                    className="w-full"
                  >
                    <Trash2 size={16} />
                    Delete Node
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

{showSaveModal && (
        <PublishPipelineModal
          open={showSaveModal}
          onClose={() => setShowSaveModal(false)}
          pipeline={{ nodes, edges }}
          selectedDataset={selectedDataset}
        />
      )}

      {showTemplates && (
        <Modal open={showTemplates} onClose={() => setShowTemplates(false)} title="Pipeline Templates">
          <div className="space-y-3">
            {TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => loadTemplate(template)}
                className="w-full p-4 rounded-lg bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] hover:border-brand-500/50 transition text-left"
              >
                <div className="font-medium mb-1">{template.name}</div>
                <div className="text-xs text-white/50">{template.description}</div>
              </button>
            ))}
          </div>
        </Modal>
      )}

      {showTestPanel && (
        <TestPipelineModal
          open={showTestPanel}
          onClose={() => {
            setShowTestPanel(false)
            setTestResult(null)
            setTestError('')
          }}
          pipeline={{ nodes, edges }}
          testInputs={testInputs}
          setTestInputs={setTestInputs}
          onTest={handleTestPipeline}
          testing={testing}
          testResult={testResult}
          testError={testError}
        />
      )}
    </div>
  )
}

function CodeSnippetModal({ open, onClose, operation }: { open: boolean; onClose: () => void; operation: any }) {
  const [copied, setCopied] = useState<string | null>(null)
  const [needsSetup, setNeedsSetup] = useState(true)
  const [datasets, setDatasets] = useState<any[]>([])
  const [selectedDataset, setSelectedDataset] = useState<string>('')
  const [loadingDatasets, setLoadingDatasets] = useState(true)
  const [snippetMode, setSnippetMode] = useState<'node'|'browser'>('node')

  useEffect(() => {
    // If operation already has a linked dataset, use it and skip selection
    if (operation?.dataset_id) {
      setSelectedDataset(operation.dataset_id)
      setLoadingDatasets(false)
      setNeedsSetup(false)
      return
    }
    loadDatasets()
  }, [])

  async function loadDatasets() {
    try {
      const data = await apiGetDatasets()
      setDatasets(data.items || [])
      if (data.items && data.items.length > 0) {
        setSelectedDataset(data.items[0].dataset_id)
      }
    } catch (err) {
      console.error('Failed to load datasets:', err)
    } finally {
      setLoadingDatasets(false)
    }
  }

  const datasetId = selectedDataset || operation?.dataset_id || 'YOUR_DATASET_ID'

  const installSnippet = `npm install @arcium-hq/client @solana/web3.js axios`

  const keyGenSnippet = `node -e "const { x25519 } = require('@arcium-hq/client'); const key = Buffer.from(x25519.utils.randomSecretKey()).toString('hex'); console.log('Your Encryption Key (save securely):'); console.log(key);"`

  const nodeSnippet = `// Node.js example (set FLAEK_ENC_KEY in env)
const { x25519, RescueCipher, getMXEPublicKey, deserializeLE } = require('@arcium-hq/client');
const { Connection, PublicKey } = require('@solana/web3.js');
const axios = require('axios');
const crypto = require('crypto');

// Step 1: Load your encryption key from env
const privateKey = process.env.FLAEK_ENC_KEY;
if (!privateKey) throw new Error('Set FLAEK_ENC_KEY environment variable with your hex private key');

// Step 2: Perform key exchange with MXE
const privKeyBytes = Buffer.from(privateKey, 'hex');
const publicKey = x25519.getPublicKey(privKeyBytes);

const connection = new Connection('https://api.devnet.solana.com');
const mxeProgramId = new PublicKey('${operation.mxe_program_id || 'FonvaXZrDWaLnCEC8YVuKDCtNw76XctEdT4dkah5xydM'}');
const mxePublicKey = await getMXEPublicKey({ connection }, mxeProgramId);
const sharedSecret = x25519.getSharedSecret(privKeyBytes, mxePublicKey);
const cipher = new RescueCipher(sharedSecret);

// Step 3: Prepare and validate inputs
const inputs = {
  ${operation.inputs?.map((i: string) => `${i}: 100`).join(',\n  ') || 'value: 100'}
};

for (const [key, value] of Object.entries(inputs)) {
  if (value === undefined || value === null || value === '') throw new Error(\`\${key} is required\`);
  const num = Number(value);
  if (isNaN(num) || num < 0 || !Number.isInteger(num)) throw new Error(\`\${key} must be a positive integer\`);
}

// Step 4: Encrypt inputs
const nonce = crypto.randomBytes(16);
const limbs = Object.values(inputs).map(val => {
  const buf = Buffer.alloc(32);
  buf.writeBigUInt64LE(BigInt(val), 0);
  return deserializeLE(buf);
});

const [ct0, ct1] = cipher.encrypt(limbs, nonce);

// Step 5: Submit encrypted job to Flaek
const response = await axios.post('https://api.flaek.dev/v1/jobs', {
  dataset_id: '${datasetId}',
  operation: '${operation.operation_id}',
  encrypted_inputs: {
    ct0: Array.from(ct0),
    ct1: Array.from(ct1),
    client_public_key: Array.from(publicKey),
    nonce: Buffer.from(nonce).toString('base64')
  }
}, {
  headers: { 'Authorization': 'Bearer YOUR_API_KEY' }
});

console.log('Job submitted:', response.data.job_id);

// Step 6: Poll for result (encrypted on server) and decrypt client-side
const pollInterval = setInterval(async () => {
  const job = await axios.get(
    \`https://api.flaek.dev/v1/jobs/\${response.data.job_id}\`,
    { headers: { 'Authorization': 'Bearer YOUR_API_KEY' } }
  );

  if (job.data.status === 'completed') {
    clearInterval(pollInterval);
    const resultCipher = new RescueCipher(sharedSecret);
    const decrypted = resultCipher.decrypt(
      [new Uint8Array(job.data.result.ct0), new Uint8Array(job.data.result.ct1)],
      Buffer.from(job.data.result.nonce, 'base64')
    );
    console.log('✅ Decrypted Result:', decrypted);
  } else if (job.data.status === 'failed') {
    clearInterval(pollInterval);
    console.error('❌ Job failed:', job.data.error);
  }
}, 2000);`

  const browserSnippet = `// Browser example (saves key in localStorage)
import { x25519, RescueCipher, getMXEPublicKey, deserializeLE } from '@arcium-hq/client'
import { Connection, PublicKey } from '@solana/web3.js'

// Ensure encryption key in localStorage
let privateKey = localStorage.getItem('flaek_encryption_key')
if (!privateKey) {
  const rnd = x25519.utils.randomSecretKey()
  privateKey = Array.from(rnd).map(b => b.toString(16).padStart(2, '0')).join('')
  localStorage.setItem('flaek_encryption_key', privateKey)
}

const hexToBytes = (hex) => new Uint8Array(hex.match(/.{1,2}/g).map(b => parseInt(b, 16)))
const toBase64 = (bytes) => btoa(String.fromCharCode(...bytes))

const privKeyBytes = hexToBytes(privateKey)
const publicKey = x25519.getPublicKey(privKeyBytes)

const connection = new Connection('https://api.devnet.solana.com')
const mxeProgramId = new PublicKey('${operation.mxe_program_id || '39n29DcQUxTGDHVw6DNnhSa1T85EXrW88pmbK1VrT8gp'}')
const mxePublicKey = await getMXEPublicKey({ connection }, mxeProgramId)
const sharedSecret = x25519.getSharedSecret(privKeyBytes, mxePublicKey)
const cipher = new RescueCipher(sharedSecret)

const inputs = {
  ${operation.inputs?.map((i: string) => `${i}: 100`).join(',\n  ') || 'value: 100'}
}

const nonce = crypto.getRandomValues(new Uint8Array(16))
const limbs = Object.values(inputs).map(val => {
  const buf = new Uint8Array(32)
  const dv = new DataView(buf.buffer)
  dv.setBigUint64(0, BigInt(val), true)
  return deserializeLE(buf)
})
const [ct0, ct1] = cipher.encrypt(limbs, nonce)

const res = await fetch('https://api.flaek.dev/v1/jobs', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer YOUR_API_KEY' },
  body: JSON.stringify({
    dataset_id: '${datasetId}',
    operation: '${operation.operation_id}',
    encrypted_inputs: {
      ct0: Array.from(ct0), ct1: Array.from(ct1), client_public_key: Array.from(publicKey), nonce: toBase64(nonce)
    }
  })
})
const { job_id } = await res.json()
console.log('Job submitted:', job_id)`

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <Modal open={open} onClose={onClose} title="✓ Pipeline Published!">
      <div className="space-y-4">
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Check size={20} className="text-green-400" />
            <h3 className="font-semibold text-green-400">Successfully Published</h3>
          </div>
          <p className="text-sm text-white/70">
            {operation.name} v{operation.version}
          </p>
          <p className="text-xs text-white/50 mt-1 font-mono">
            ID: {operation.operation_id}
          </p>
        </div>

        <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
          <p className="text-xs text-blue-400 mb-2">
            <strong>🔐 Confidential Computing:</strong> Your data is encrypted locally before sending. The server never sees your plaintext data.
          </p>
        </div>

        {needsSetup && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <p className="text-xs text-amber-400 mb-2">
              <strong>⚠ Setup Required:</strong>
            </p>
            <ul className="text-xs text-white/70 space-y-1 ml-4 list-disc">
              <li>
                <button onClick={() => navigate('/dashboard/keys')} className="text-brand-400 hover:text-brand-300">
                  Create an API key
                </button> to authenticate requests
              </li>
              <li>
                <button onClick={() => navigate('/dashboard/datasets')} className="text-brand-400 hover:text-brand-300">
                  Create a dataset
                </button> to structure your inputs
              </li>
              <li>
                Optional: <button onClick={() => navigate('/dashboard/webhooks')} className="text-brand-400 hover:text-brand-300">
                  Configure webhooks
                </button> for job completion notifications
              </li>
            </ul>
            <button
              onClick={() => setNeedsSetup(false)}
              className="text-xs text-amber-400 hover:text-amber-300 mt-2"
            >
              I've set these up →
            </button>
          </div>
        )}

        {!operation?.dataset_id && (
        <div>
          <label className="text-xs font-semibold text-white/70 mb-2 block">Select Dataset</label>
          {loadingDatasets ? (
            <div className="flex items-center gap-2 text-xs text-white/50">
              <Loader2 size={14} className="animate-spin" />
              Loading datasets...
            </div>
          ) : datasets.length === 0 ? (
            <div className="p-3 bg-white/5 rounded-lg border border-white/10 text-xs text-white/50">
              No datasets found.{' '}
              <button onClick={() => navigate('/dashboard/datasets')} className="text-brand-400 hover:text-brand-300">
                Create one
              </button>
            </div>
          ) : (
            <select
              value={selectedDataset}
              onChange={(e) => setSelectedDataset(e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500/50"
            >
              {datasets.map((ds) => (
                <option key={ds.dataset_id} value={ds.dataset_id}>
                  {ds.name} ({ds.dataset_id.slice(0, 8)}...)
                </option>
              ))}
            </select>
          )}
        </div>
        )}
        {/* Dataset is already linked to the operation; no selector/banner needed here */}

        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Code size={16} />
            Integration Steps
          </h4>

          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-white/70">Step 1: Install Dependencies</span>
                <button
                  onClick={() => copyToClipboard(installSnippet, 'install')}
                  className="text-xs flex items-center gap-1 text-brand-400 hover:text-brand-300"
                >
                  {copied === 'install' ? <Check size={12} /> : <Copy size={12} />}
                  {copied === 'install' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <SyntaxHighlighter 
                language="bash"
                style={vscDarkPlus}
                customStyle={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                {installSnippet}
              </SyntaxHighlighter>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-white/70">Step 2: Generate Encryption Key</span>
                <button
                  onClick={() => copyToClipboard(keyGenSnippet, 'keygen')}
                  className="text-xs flex items-center gap-1 text-brand-400 hover:text-brand-300"
                >
                  {copied === 'keygen' ? <Check size={12} /> : <Copy size={12} />}
                  {copied === 'keygen' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <SyntaxHighlighter 
                language="bash"
                style={vscDarkPlus}
                customStyle={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                {keyGenSnippet}
              </SyntaxHighlighter>
              <p className="text-xs text-amber-400 mt-1">Save the key in localStorage as 'flaek_encryption_key'</p>
            </div>

            <div>
              <div className="mb-1">
                <span className="text-xs font-semibold text-white/70">Step 3: Setup API Key & Webhook</span>
              </div>
              <div className="text-xs text-white/60 space-y-1 pl-3">
                <div>→ <button onClick={() => navigate('/dashboard/keys')} className="text-brand-400 hover:text-brand-300">Create API key</button></div>
                <div>→ <button onClick={() => navigate('/dashboard/webhooks')} className="text-brand-400 hover:text-brand-300">Setup webhook</button> (optional)</div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-white/70">Step 4: Run Jobs</span>
                <div className="flex items-center gap-2">
                  <label className="text-[11px] text-white/60">Mode:</label>
                  <select value={snippetMode} onChange={(e)=> setSnippetMode(e.target.value as any)} className="bg-white/5 border border-white/10 text-xs rounded px-2 py-1">
                    <option value="node">Node.js</option>
                    <option value="browser">Browser</option>
                  </select>
                  <button
                    onClick={() => copyToClipboard(snippetMode==='node'? nodeSnippet : browserSnippet, snippetMode)}
                    className="text-xs flex items-center gap-1 text-brand-400 hover:text-brand-300"
                  >
                    {copied === snippetMode ? <Check size={12} /> : <Copy size={12} />}
                    {copied === snippetMode ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
              <SyntaxHighlighter 
                language="javascript"
                style={vscDarkPlus}
                customStyle={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  maxHeight: '320px',
                }}
              >
                {snippetMode === 'node' ? nodeSnippet : browserSnippet}
              </SyntaxHighlighter>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            onClick={() => {
              try { localStorage.setItem('flaek_last_op', operation.operation_id) } catch {}
              navigate('/dashboard/playground')
            }}
            className="flex-1"
          >
            Open Playground
          </Button>
          <Button onClick={() => navigate('/dashboard/operations')} variant="secondary" className="flex-1">
            View Operations
          </Button>
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function TestPipelineModal({ open, onClose, pipeline, testInputs, setTestInputs, onTest, testing, testResult, testError }: {
  open: boolean
  onClose: () => void
  pipeline: { nodes: any[]; edges: any[] }
  testInputs: Record<string, any>
  setTestInputs: (inputs: Record<string, any>) => void
  onTest: () => void
  testing: boolean
  testResult: any
  testError: string
}) {
  const inputNodes = pipeline.nodes.filter(n => n.type === 'input')
  const outputNodes = pipeline.nodes.filter((n: any) => n.type === 'output')
  const hasBlock = pipeline.nodes.some((n: any) => n.type === 'block')
  const isRunnable = inputNodes.length > 0 && outputNodes.length > 0 && hasBlock && pipeline.edges.length > 0

  return (
    <Modal open={open} onClose={onClose} title="Test Pipeline">
      <div className="space-y-4">
        <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
          <p className="text-xs text-blue-400">
            <strong>Tip:</strong> Test your pipeline with sample inputs before publishing.
          </p>
          <p className="text-[11px] text-white/60 mt-1">
            Validation-only dry run. No MXE confidential compute occurs here. Publish as an operation to run on Arcium MXE.
          </p>
        </div>

        <div>
          <label className="text-xs font-semibold text-white/70 mb-2 block">Test Inputs</label>
          {!isRunnable && (
            <div className="p-2 mb-2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
              Add at least one input, one block, connect edges, and one output.
            </div>
          )}
          <div className="space-y-2">
            {inputNodes.map((node) => {
              const fieldName = node.data?.fieldName || node.id
              return (
                <div key={node.id}>
                  <label className="text-xs text-white/60 mb-1 block">{fieldName}</label>
                  <input
                    type="text"
                    value={testInputs[fieldName] || ''}
                    onChange={(e) => setTestInputs({ ...testInputs, [fieldName]: e.target.value })}
                    placeholder={`Enter ${fieldName}`}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-brand-500/50"
                  />
                </div>
              )
            })}
          </div>
        </div>

        {testResult && (
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="text-xs font-semibold text-green-400 mb-2">✓ Test Successful</div>
            <div className="text-xs text-white/70 mb-1">Outputs:</div>
            <pre className="text-xs bg-white/5 p-2 rounded overflow-x-auto">
              {JSON.stringify(testResult.outputs, null, 2)}
            </pre>
            <div className="text-xs text-white/50 mt-2">
              Completed in {testResult.duration}ms with {testResult.steps?.length || 0} steps. (Dry run — simulated for validation only)
            </div>
          </div>
        )}

        {testError && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="text-xs font-semibold text-red-400 mb-1">✗ Test Failed</div>
            <p className="text-xs text-red-400">{testError}</p>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={testing} className="flex-1">
            Close
          </Button>
          <Button onClick={onTest} disabled={testing || !isRunnable} className="flex-1">
            {testing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Play size={16} />
                Run Test
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
