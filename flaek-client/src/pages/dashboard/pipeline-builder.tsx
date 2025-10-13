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
import { Save, Trash2, Loader2, Zap, X, Menu, ArrowLeft, Play, Beaker, Code, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { navigate } from '@/lib/router'
import { apiGetBlocks, apiCreateOperation, apiGetPipelineDraft, apiSavePipelineDraft, apiDeletePipelineDraft, apiTestPipeline } from '@/lib/api'

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
      <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button
          onClick={(e) => {
            e.stopPropagation()
            data.onDelete?.()
          }}
          className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition shadow-lg"
        >
          <X size={12} className="text-white" />
        </button>
      </div>
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
      <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button
          onClick={(e) => {
            e.stopPropagation()
            data.onDelete?.()
          }}
          className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition shadow-lg"
        >
          <X size={12} className="text-white" />
        </button>
      </div>
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
      <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button
          onClick={(e) => {
            e.stopPropagation()
            data.onDelete?.()
          }}
          className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition shadow-lg"
        >
          <X size={12} className="text-white" />
        </button>
      </div>
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

const nodeTypes: NodeTypes = {
  input: InputNode,
  output: OutputNode,
  block: BlockNode,
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

function PublishPipelineModal({ open, onClose, pipeline }: { open: boolean; onClose: () => void; pipeline: any }) {
  const [name, setName] = useState('')
  const [version, setVersion] = useState('1.0.0')
  const [mxeProgramId, setMxeProgramId] = useState('F1aQdsqtKM61djxRgUwKy4SS5BTKVDtgoK5vYkvL62B6')
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState('')
  const [publishedOp, setPublishedOp] = useState<any>(null)
  const [showCodeSnippet, setShowCodeSnippet] = useState(false)

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
      })

      setPublishedOp({ ...result, name: name.trim(), version: version.trim(), inputs, outputs })
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

export default function PipelineBuilderPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [blocks, setBlocks] = useState<BlockDef[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [showPalette, setShowPalette] = useState(true)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [showTestPanel, setShowTestPanel] = useState(false)
  const [testInputs, setTestInputs] = useState<Record<string, any>>({})
  const [testResult, setTestResult] = useState<any>(null)
  const [testing, setTesting] = useState(false)
  const [testError, setTestError] = useState('')

  // Load pipeline draft from backend on mount
  useEffect(() => {
    loadBlocks()
    loadDraft()
  }, [])

  async function loadDraft() {
    try {
      const { draft } = await apiGetPipelineDraft()
      if (draft?.pipeline) {
        const { nodes: savedNodes, edges: savedEdges } = draft.pipeline
        if (savedNodes && savedNodes.length > 0) {
          // Re-attach onDelete callbacks when loading from draft
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

  // Auto-save pipeline to backend whenever nodes or edges change (debounced)
  useEffect(() => {
    if (nodes.length === 0 && edges.length === 0) return

    const timeoutId = setTimeout(async () => {
      try {
        const pipeline = { nodes, edges }
        await apiSavePipelineDraft(pipeline)
        setLastSaved(new Date())
      } catch (err) {
        console.error('Failed to save draft:', err)
      }
    }, 1000) // Debounce by 1 second

    return () => clearTimeout(timeoutId)
  }, [nodes, edges])

  async function loadBlocks() {
    try {
      const data = await apiGetBlocks()
      console.log('Loaded blocks:', data)
      setBlocks(data.blocks || [])
    } catch (error) {
      console.error('Failed to load blocks:', error)
      alert('Failed to load blocks. Check console for details.')
    } finally {
      setLoading(false)
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

  function addInputNode() {
    const id = `input-${Date.now()}`
    const newNode: Node = {
      id,
      type: 'input',
      position: { x: 100, y: 100 + nodes.length * 80 },
      data: { 
        fieldName: '',
        onDelete: () => deleteNode(id)
      },
    }
    setNodes((nds) => [...nds, newNode])
  }

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
      <div className="fixed inset-0 flex items-center justify-center bg-bg-base">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    )
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-bg-base z-50">
      <style>{customStyles}</style>
      {/* Toolbar */}
      <div className="h-14 border-b border-white/10 flex items-center justify-between px-4 bg-bg-elev">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="px-2">
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
              
              {/* Nodes Section */}
              <div className="shrink-0 p-3 border-b border-white/10">
                <p className="text-xs font-semibold text-white/50 mb-2">NODES</p>
                <button
                  onClick={addInputNode}
                  className="w-full p-2 rounded-lg bg-green-500/5 border border-green-500/20 hover:bg-green-500/10 transition text-left"
                >
                  <div className="font-medium text-xs text-green-400">+ Input</div>
                </button>
                <button
                  onClick={addOutputNode}
                  className="w-full p-2 rounded-lg bg-blue-500/5 border border-blue-500/20 hover:bg-blue-500/10 transition text-left mt-1.5"
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

  const curlSnippet = `curl -X POST https://api.flaek.dev/v1/jobs \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "dataset_id": "YOUR_DATASET_ID",
    "operation": "${operation.operation_id}",
    "inputs": [{
      ${operation.inputs?.map((i: string) => `"${i}": "value"`).join(',\n      ') || ''}
    }]
  }'`

  const nodeSnippet = `const axios = require('axios');

const response = await axios.post('https://api.flaek.dev/v1/jobs', {
  dataset_id: 'YOUR_DATASET_ID',
  operation: '${operation.operation_id}',
  inputs: [{
    ${operation.inputs?.map((i: string) => `${i}: 'value'`).join(',\n    ') || ''}
  }]
}, {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});

console.log('Job ID:', response.data.job_id);`

  const pythonSnippet = `import requests

response = requests.post(
    'https://api.flaek.dev/v1/jobs',
    headers={
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json'
    },
    json={
        'dataset_id': 'YOUR_DATASET_ID',
        'operation': '${operation.operation_id}',
        'inputs': [{
            ${operation.inputs?.map((i: string) => `'${i}': 'value'`).join(',\n            ') || ''}
        }]
    }
)

print('Job ID:', response.json()['job_id'])`

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

        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Code size={16} />
            Usage Examples
          </h4>

          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-white/70">cURL</span>
                <button
                  onClick={() => copyToClipboard(curlSnippet, 'curl')}
                  className="text-xs flex items-center gap-1 text-brand-400 hover:text-brand-300"
                >
                  {copied === 'curl' ? <Check size={12} /> : <Copy size={12} />}
                  {copied === 'curl' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <pre className="text-xs bg-white/5 p-3 rounded border border-white/10 overflow-x-auto">
                <code>{curlSnippet}</code>
              </pre>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-white/70">Node.js</span>
                <button
                  onClick={() => copyToClipboard(nodeSnippet, 'node')}
                  className="text-xs flex items-center gap-1 text-brand-400 hover:text-brand-300"
                >
                  {copied === 'node' ? <Check size={12} /> : <Copy size={12} />}
                  {copied === 'node' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <pre className="text-xs bg-white/5 p-3 rounded border border-white/10 overflow-x-auto">
                <code>{nodeSnippet}</code>
              </pre>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-white/70">Python</span>
                <button
                  onClick={() => copyToClipboard(pythonSnippet, 'python')}
                  className="text-xs flex items-center gap-1 text-brand-400 hover:text-brand-300"
                >
                  {copied === 'python' ? <Check size={12} /> : <Copy size={12} />}
                  {copied === 'python' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <pre className="text-xs bg-white/5 p-3 rounded border border-white/10 overflow-x-auto">
                <code>{pythonSnippet}</code>
              </pre>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Close
          </Button>
          <Button onClick={() => navigate('/dashboard/operations')} className="flex-1">
            View Operations
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

  return (
    <Modal open={open} onClose={onClose} title="Test Pipeline">
      <div className="space-y-4">
        <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
          <p className="text-xs text-blue-400">
            <strong>Tip:</strong> Test your pipeline with sample inputs before publishing.
          </p>
        </div>

        <div>
          <label className="text-xs font-semibold text-white/70 mb-2 block">Test Inputs</label>
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
              Completed in {testResult.duration}ms with {testResult.steps?.length || 0} steps
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
          <Button onClick={onTest} disabled={testing || inputNodes.length === 0} className="flex-1">
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
