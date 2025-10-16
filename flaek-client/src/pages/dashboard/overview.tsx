import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Database, Package, Briefcase, TrendingUp, Plus, Zap, Workflow, Loader2 } from 'lucide-react'
import { navigate } from '@/lib/router'
import { apiGetDatasets, apiGetOperations, apiGetJobs } from '@/lib/api'

export default function OverviewPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    jobsCount: 0,
    operationsCount: 0,
    datasetsCount: 0,
    successRate: 0,
  })
  const [recentJobs, setRecentJobs] = useState<any[]>([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  async function loadDashboardData() {
    try {
      // Compute last 30 days window on client and pass 'since' to backend
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      const [datasets, operations, firstPage] = await Promise.all([
        apiGetDatasets(),
        apiGetOperations(),
        apiGetJobs({ limit: 100, since }),
      ])
      // If there are more than 100 jobs in 30 days, paginate until we fetch them or hit a safe cap
      let allJobs = [...firstPage.items]
      let cursor = firstPage.next_cursor
      let safety = 0
      while (cursor && safety < 5) { // cap at 5 extra pages (max ~600 jobs)
        const page = await apiGetJobs({ limit: 100, cursor, since })
        allJobs = allJobs.concat(page.items)
        cursor = page.next_cursor
        safety += 1
      }

      const completedJobs = allJobs.filter((j: any) => j.status === 'completed').length
      const successRate = allJobs.length > 0 
        ? Math.round((completedJobs / allJobs.length) * 100) 
        : 0

      setStats({
        jobsCount: allJobs.length,
        operationsCount: operations.items.length,
        datasetsCount: datasets.items.length,
        successRate,
      })
      setRecentJobs(firstPage.items.slice(0, 5))
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome back</h1>
        <p className="text-text-secondary">Run AI/analytics on encrypted inputs with verifiable attestations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          icon={Briefcase}
          label="Jobs"
          value={stats.jobsCount.toString()}
          subtitle="Last 30 days"
          color="text-blue-400"
        />
        <StatsCard
          icon={Package}
          label="Operations"
          value={stats.operationsCount.toString()}
          subtitle="Active pipelines"
          color="text-purple-400"
        />
        <StatsCard
          icon={Database}
          label="Datasets"
          value={stats.datasetsCount.toString()}
          subtitle="Schema contracts"
          color="text-green-400"
        />
        <StatsCard
          icon={TrendingUp}
          label="Success Rate"
          value={stats.jobsCount > 0 ? `${stats.successRate}%` : '—'}
          subtitle="Job completion"
          color="text-amber-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          {recentJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Zap size={48} className="text-white/20 mb-4" />
              <p className="text-text-secondary mb-1">No jobs yet</p>
              <p className="text-sm text-white/50">Create a dataset and pipeline to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentJobs.map((job) => (
                <JobRow key={job.job_id} job={job} />
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <ActionButton
              icon={Database}
              label="Create Dataset"
              onClick={() => navigate('/dashboard/datasets')}
            />
            <ActionButton
              icon={Workflow}
              label="Build Pipeline"
              onClick={() => navigate('/dashboard/pipelines')}
            />
            <ActionButton
              icon={Briefcase}
              label="Run Job"
              onClick={() => navigate('/dashboard/jobs')}
            />
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="text-lg font-semibold mb-4">Getting Started</h2>
        <div className="space-y-3">
          <ChecklistItem completed={stats.datasetsCount > 0} text="Create your first dataset" />
          <ChecklistItem completed={stats.operationsCount > 0} text="Build a pipeline with blocks" />
          <ChecklistItem completed={stats.operationsCount > 0} text="Publish as an operation" />
          <ChecklistItem completed={stats.jobsCount > 0} text="Run your first encrypted job" />
        </div>
      </Card>
    </div>
  )
}

function JobRow({ job }: { job: any }) {
  const statusMap: Record<string, 'success' | 'danger' | 'info' | 'warning' | 'default'> = {
    completed: 'success',
    failed: 'danger',
    running: 'info',
    queued: 'warning',
    cancelled: 'default',
  }
  const statusVariant = statusMap[job.status] || 'default'

  return (
    <button
      onClick={() => navigate(`/dashboard/jobs/${job.job_id}`)}
      className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/10 hover:bg-white/[0.04] hover:border-white/20 transition text-left"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium truncate">{job.job_id}</span>
          <Badge variant={statusVariant}>{job.status}</Badge>
        </div>
        <div className="text-xs text-white/50">
          {new Date(job.created_at).toLocaleString()}
        </div>
      </div>
    </button>
  )
}

type StatsCardProps = {
  icon: any
  label: string
  value: string
  subtitle: string
  color: string
}

function StatsCard({ icon: Icon, label, value, subtitle, color }: StatsCardProps) {
  return (
    <Card className="hover:border-white/20 transition">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center ${color}`}>
          <Icon size={20} />
        </div>
      </div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="text-sm text-text-secondary">{label}</div>
      <div className="text-xs text-white/50 mt-1">{subtitle}</div>
    </Card>
  )
}

type ActionButtonProps = {
  icon: any
  label: string
  onClick: () => void
}

function ActionButton({ icon: Icon, label, onClick }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] hover:border-white/20 transition text-left"
    >
      <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-500">
        <Icon size={16} />
      </div>
      <span className="text-sm font-medium">{label}</span>
      <Plus size={16} className="ml-auto text-white/40" />
    </button>
  )
}

type ChecklistItemProps = {
  completed: boolean
  text: string
}

function ChecklistItem({ completed, text }: ChecklistItemProps) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-5 h-5 rounded border flex items-center justify-center ${
        completed ? 'bg-brand-500 border-brand-500' : 'border-white/20'
      }`}>
        {completed && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <span className={completed ? 'text-white/50 line-through' : 'text-text-secondary'}>{text}</span>
    </div>
  )
}
