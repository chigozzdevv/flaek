import { useEffect, useState, useRef } from 'react'
import { Loader2, Briefcase, Eye, Search, RefreshCw, CheckCircle, XCircle, Clock, AlertCircle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { apiGetJobs, apiGetJob, apiCancelJob, apiCreateJob } from '@/lib/api'
import { io, Socket } from 'socket.io-client'
import { x25519, RescueCipher, getMXEPublicKey } from '@arcium-hq/client'
import { Connection, PublicKey } from '@solana/web3.js'

type Job = {
  job_id: string
  dataset_id: string
  operation_id: string
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'
  created_at: string
  updated_at: string
  result?: any
  error?: string
}

const statusConfig = {
  queued: { icon: Clock, variant: 'info' as const, label: 'Queued' },
  running: { icon: RefreshCw, variant: 'warning' as const, label: 'Running' },
  completed: { icon: CheckCircle, variant: 'success' as const, label: 'Completed' },
  failed: { icon: XCircle, variant: 'danger' as const, label: 'Failed' },
  cancelled: { icon: AlertCircle, variant: 'default' as const, label: 'Cancelled' },
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedJob, setSelectedJob] = useState<any>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [socketConnected, setSocketConnected] = useState(false)
  const socketRef = useRef<Socket | null>(null)
  const [decryptedResult, setDecryptedResult] = useState<any>(null)
  const [decrypting, setDecrypting] = useState(false)

  useEffect(() => {
    loadJobs()
    setupSocket()
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, [statusFilter])

  function setupSocket() {
    const token = localStorage.getItem('flaek_jwt')
    if (!token) return

    const socket = io(import.meta.env.VITE_API_BASE || 'http://localhost:4000', {
      auth: {
        token
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    })

    socket.on('connect', () => {
      console.log('Socket.IO connected')
      setSocketConnected(true)
    })

    socket.on('job:update', (data: any) => {
      setJobs(prevJobs => 
        prevJobs.map(job => 
          job.job_id === data.job_id
            ? { ...job, status: data.status, updated_at: data.updated_at, ...data }
            : job
        )
      )
    })

    socket.on('disconnect', () => {
      console.log('Socket.IO disconnected')
      setSocketConnected(false)
    })

    socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error.message)
    })

    socketRef.current = socket
  }

  async function loadJobs(showLoader: boolean = true) {
    try {
      const params = statusFilter !== 'all' ? { status: statusFilter } : undefined
      const data = await apiGetJobs(params)
      setJobs(data.items)
    } catch (error) {
      console.error('Failed to load jobs:', error)
    } finally {
      if (showLoader !== false) setLoading(false)
    }
  }

  async function viewJob(id: string) {
    try {
      const data = await apiGetJob(id)
      setSelectedJob(data)
      setDecryptedResult(null)
      setShowDetails(true)
    } catch (error) {
      console.error('Failed to load job:', error)
      alert('Failed to load job details')
    }
  }

  async function decryptResult() {
    if (!selectedJob?.result?.encrypted) {
      alert('Result is not encrypted or already decrypted')
      return
    }

    const encryptionKey = localStorage.getItem('flaek_encryption_key')
    if (!encryptionKey) {
      alert('Encryption key not found. Please generate a key in Run Job modal first.')
      return
    }

    setDecrypting(true)
    try {
      const privKeyBytes = new Uint8Array(encryptionKey.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)))

      const connection = new Connection('https://api.devnet.solana.com')
      const mxeProgramId = new PublicKey(selectedJob.attestation?.mxe_program_id || 'GQdBArjknHVD3r4QesRZsmV1vwQfHyMW7Ue8Shtsaqf9')
      const mxePublicKey = await getMXEPublicKey({ connection } as any, mxeProgramId)
      
      if (!mxePublicKey) {
        alert('Failed to retrieve MXE public key')
        setDecrypting(false)
        return
      }
      
      const sharedSecret = x25519.getSharedSecret(privKeyBytes, mxePublicKey)
      const cipher = new RescueCipher(sharedSecret)

      const nonce = selectedJob.result.nonce
        ? new Uint8Array(
            atob(selectedJob.result.nonce)
              .split('')
              .map((c: string) => c.charCodeAt(0))
          )
        : new Uint8Array(16)

      const ct0 = Array.isArray(selectedJob.result.ct0)
        ? new Uint8Array(selectedJob.result.ct0)
        : new Uint8Array(Object.values(selectedJob.result.ct0))
      const ct1 = Array.isArray(selectedJob.result.ct1)
        ? new Uint8Array(selectedJob.result.ct1)
        : new Uint8Array(Object.values(selectedJob.result.ct1))

      const decrypted = cipher.decrypt([ct0 as any, ct1 as any], nonce)

      let resultValue: any
      if (typeof decrypted === 'bigint') {
        resultValue = Number(decrypted)
      } else if (Array.isArray(decrypted) && decrypted.length > 0 && typeof decrypted[0] === 'bigint') {
        resultValue = decrypted.map(v => Number(v))
      } else {
        resultValue = decrypted
      }

      setDecryptedResult(resultValue)
    } catch (error: any) {
      console.error('Decryption failed:', error)
      alert(`Failed to decrypt result: ${error.message}`)
    } finally {
      setDecrypting(false)
    }
  }

  async function rerunJob(job: Job) {
    if (!confirm('Re-run this job with the same configuration?')) return
    try {
      const result = await apiCreateJob({
        dataset_id: job.dataset_id,
        operation: job.operation_id,
        inputs: [], // TODO: Store original inputs
      })
      alert(`New job created: ${result.job_id}`)
      await loadJobs()
    } catch (error: any) {
      alert(`Failed to re-run: ${error.message}`)
    }
  }

  async function cancelJob(id: string) {
    if (!confirm('Cancel this job?')) return
    try {
      await apiCancelJob(id)
      await loadJobs()
      alert('Job cancelled successfully')
    } catch (error: any) {
      alert(`Failed to cancel: ${error.message}`)
    }
  }

  const filteredJobs = jobs.filter((job) =>
    job.job_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.dataset_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.operation_id.toLowerCase().includes(searchTerm.toLowerCase())
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold">Jobs</h1>
              {socketConnected && (
                <div className="flex items-center gap-2 text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-full border border-green-500/20">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  Live
                </div>
              )}
            </div>
            <p className="text-sm text-white/60">Monitor and manage your batch processing jobs</p>
          </div>
          <Button onClick={() => loadJobs()}>
            <RefreshCw size={16} />
            Refresh
          </Button>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Search jobs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-brand-500/50"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500/50"
          >
            <option value="all">All Status</option>
            <option value="queued">Queued</option>
            <option value="running">Running</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {filteredJobs.length === 0 ? (
          <Card className="p-12 text-center">
            <Briefcase className="w-12 h-12 mx-auto mb-4 text-white/20" />
            <h3 className="text-lg font-semibold mb-2">No Jobs Found</h3>
            <p className="text-sm text-white/60">
              {statusFilter !== 'all' 
                ? `No ${statusFilter} jobs found`
                : 'Run your first pipeline operation to create jobs'}
            </p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredJobs.map((job) => {
              const config = statusConfig[job.status]
              const StatusIcon = config.icon
              return (
                <Card key={job.job_id} className="p-4 hover:bg-white/[0.03] transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <StatusIcon 
                          size={18} 
                          className={`${
                            job.status === 'running' ? 'animate-spin' : ''
                          } text-${config.variant === 'info' ? 'blue' : config.variant === 'warning' ? 'amber' : config.variant === 'success' ? 'green' : config.variant === 'danger' ? 'red' : 'white'}-400`}
                        />
                        <h3 className="font-semibold font-mono text-sm">{job.job_id}</h3>
                        <Badge variant={config.variant}>{config.label}</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-white/50">Dataset:</span>
                          <span className="ml-2 font-mono text-xs" title={job.dataset_id}>{job.dataset_id?.slice(0, 12) || 'N/A'}...</span>
                        </div>
                        <div>
                          <span className="text-white/50">Operation:</span>
                          <span className="ml-2 font-mono text-xs" title={job.operation_id}>{job.operation_id?.slice(0, 12) || 'N/A'}...</span>
                        </div>
                        <div>
                          <span className="text-white/50">Created:</span>
                          <span className="ml-2">{new Date(job.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                      {job.error && (
                        <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-400">
                          {job.error}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => viewJob(job.job_id)}
                        className="text-xs"
                      >
                        <Eye size={14} />
                        View
                      </Button>
                      {job.status === 'completed' && (
                        <Button
                          variant="ghost"
                          onClick={() => rerunJob(job)}
                          className="text-xs text-brand-400 hover:text-brand-300"
                        >
                          <RotateCcw size={14} />
                        </Button>
                      )}
                      {(job.status === 'queued' || job.status === 'running') && (
                        <Button
                          variant="ghost"
                          onClick={() => cancelJob(job.job_id)}
                          className="text-xs text-red-400 hover:text-red-300"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {showDetails && selectedJob && (
        <Modal open={showDetails} onClose={() => setShowDetails(false)} title="Job Details">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-white/70 mb-1 block">Job ID</label>
              <div className="text-sm font-mono bg-white/5 p-2 rounded border border-white/10 break-all">
                {selectedJob.job_id}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-white/70 mb-1 block">Status</label>
              <Badge variant={statusConfig[selectedJob.status as keyof typeof statusConfig].variant}>
                {statusConfig[selectedJob.status as keyof typeof statusConfig].label}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-white/70 mb-1 block">Dataset ID</label>
                <div className="text-xs font-mono bg-white/5 p-2 rounded border border-white/10 break-all">
                  {selectedJob.dataset_id}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-white/70 mb-1 block">Operation ID</label>
                <div className="text-xs font-mono bg-white/5 p-2 rounded border border-white/10 break-all">
                  {selectedJob.operation_id}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-white/70 mb-1 block">Created</label>
                <div className="text-xs">{new Date(selectedJob.created_at).toLocaleString()}</div>
              </div>
              <div>
                <label className="text-xs font-semibold text-white/70 mb-1 block">Updated</label>
                <div className="text-xs">{new Date(selectedJob.updated_at).toLocaleString()}</div>
              </div>
            </div>
            {selectedJob.arcium_tx && (
              <div>
                <label className="text-xs font-semibold text-white/70 mb-1 block">Solana Transaction</label>
                <a
                  href={`https://explorer.solana.com/tx/${selectedJob.arcium_tx}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono bg-white/5 p-2 rounded border border-white/10 break-all hover:bg-white/10 transition flex items-center gap-2 text-brand-400 hover:text-brand-300"
                >
                  {selectedJob.arcium_tx}
                  <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            )}
            {selectedJob.result && (
              <div>
                <label className="text-xs font-semibold text-white/70 mb-1 block">Result</label>
                {selectedJob.result.encrypted ? (
                  <div>
                    <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg mb-2">
                      <p className="text-xs text-blue-400">
                        Result is encrypted. Decrypt with your key to view.
                      </p>
                    </div>
                    {decryptedResult ? (
                      <pre className="text-xs bg-green-500/5 p-3 rounded border border-green-500/20 overflow-x-auto max-h-48">
                        {JSON.stringify(decryptedResult, null, 2)}
                      </pre>
                    ) : (
                      <Button
                        onClick={decryptResult}
                        disabled={decrypting}
                        variant="secondary"
                        className="w-full"
                      >
                        {decrypting ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            Decrypting...
                          </>
                        ) : (
                          'Decrypt Result'
                        )}
                      </Button>
                    )}
                  </div>
                ) : (
                  <pre className="text-xs bg-white/5 p-3 rounded border border-white/10 overflow-x-auto max-h-48">
                    {JSON.stringify(selectedJob.result, null, 2)}
                  </pre>
                )}
              </div>
            )}
            {selectedJob.error && (
              <div>
                <label className="text-xs font-semibold text-white/70 mb-1 block">Error</label>
                <div className="bg-red-500/10 border border-red-500/20 p-3 rounded">
                  <div className="text-sm font-medium text-red-400 mb-2">
                    {parseErrorMessage(selectedJob.error).title}
                  </div>
                  <div className="text-xs text-red-300">
                    {parseErrorMessage(selectedJob.error).details}
                  </div>
                  {parseErrorMessage(selectedJob.error).suggestion && (
                    <div className="text-xs text-white/60 mt-2 pt-2 border-t border-red-500/20">
                      <strong>Suggestion:</strong> {parseErrorMessage(selectedJob.error).suggestion}
                    </div>
                  )}
                </div>
              </div>
            )}
            <Button variant="secondary" onClick={() => setShowDetails(false)} className="w-full">
              Close
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function parseErrorMessage(error: string): { title: string; details: string; suggestion?: string } {
  // Try to parse structured error messages
  try {
    const errorObj = JSON.parse(error)
    return {
      title: errorObj.title || 'Execution Failed',
      details: errorObj.details || error,
      suggestion: errorObj.suggestion,
    }
  } catch {
    // Handle common error patterns
    if (error.includes('Block') && error.includes('failed')) {
      const blockMatch = error.match(/Block '([^']+)' failed/)
      const blockName = blockMatch ? blockMatch[1] : 'Unknown block'
      return {
        title: `Block '${blockName}' failed`,
        details: error,
        suggestion: 'Check your input values and block configuration',
      }
    }
    
    if (error.includes('type') && error.includes('expected')) {
      return {
        title: 'Type Mismatch Error',
        details: error,
        suggestion: 'Ensure all inputs match the expected data types',
      }
    }
    
    return {
      title: 'Execution Failed',
      details: error,
    }
  }
}
