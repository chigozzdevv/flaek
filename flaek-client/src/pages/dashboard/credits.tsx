import { useEffect, useState } from 'react'
import { Loader2, DollarSign, TrendingUp, TrendingDown } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { apiGetCredits, apiGetCreditsLedger } from '@/lib/api'

type CreditHistory = {
  transaction_id: string
  amount: number
  type: 'purchase' | 'usage' | 'refund' | 'bonus'
  description: string
  balance_after: number
  created_at: string
}

export default function CreditsPage() {
  const [balance, setBalance] = useState(0)
  const [history, setHistory] = useState<CreditHistory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [creditsData, ledger] = await Promise.all([
        apiGetCredits(),
        apiGetCreditsLedger({ limit: 50 })
      ])
      setBalance(creditsData.balance)
      // Compute running balance for display from newest to oldest
      let running = creditsData.balance
      const items = ledger.items.map((i) => {
        const delta = (i.delta_cents || 0) / 100
        const reason = i.reason || ''
        const type: CreditHistory['type'] = delta >= 0
          ? (reason === 'topup' ? 'purchase' : 'bonus')
          : 'usage'
        const description = reason === 'topup'
          ? 'Top-up'
          : reason === 'job_execution'
            ? (i.job_id ? `Job execution (${i.job_id})` : 'Job execution')
            : reason || 'Adjustment'
        const tx: CreditHistory = {
          transaction_id: i.id,
          amount: delta,
          type,
          description,
          balance_after: running,
          created_at: i.created_at,
        }
        running -= delta
        return tx
      })
      setHistory(items)
    } catch (error) {
      console.error('Failed to load credits:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    )
  }

  const last30Days = history.filter(t => new Date(t.created_at) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
  const totalSpent = last30Days.filter(t => t.type === 'usage').reduce((sum, t) => sum + Math.abs(t.amount), 0)
  const totalPurchased = last30Days.filter(t => t.type === 'purchase').reduce((sum, t) => sum + t.amount, 0)

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-white/10">
        <h1 className="text-2xl font-bold">Credits</h1>
        <p className="text-sm text-white/60 mt-1">Manage your compute credits and usage</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid gap-6 md:grid-cols-3 mb-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-white/70">Current Balance</h3>
              <DollarSign className="w-5 h-5 text-brand-500" />
            </div>
            <div className="text-3xl font-bold">{balance.toLocaleString()} credits</div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-white/70">Last 30 Days Usage</h3>
              <TrendingDown className="w-5 h-5 text-red-400" />
            </div>
            <div className="text-3xl font-bold text-red-400">{totalSpent.toLocaleString()}</div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-white/70">Last 30 Days Purchased</h3>
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <div className="text-3xl font-bold text-green-400">{totalPurchased.toLocaleString()}</div>
          </Card>
        </div>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Transaction History</h2>
          {history.length === 0 ? (
            <p className="text-sm text-white/60 text-center py-8">No transactions yet</p>
          ) : (
            <div className="space-y-3">
              {history.map((tx) => (
                <div key={tx.transaction_id} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-lg border border-white/5">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={tx.type === 'purchase' || tx.type === 'bonus' ? 'success' : 'default'}>
                        {tx.type}
                      </Badge>
                      <span className="text-sm font-medium">{tx.description}</span>
                    </div>
                    <div className="text-xs text-white/50">
                      {new Date(tx.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}
                    </div>
                    <div className="text-xs text-white/50">
                      Balance: {tx.balance_after.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
