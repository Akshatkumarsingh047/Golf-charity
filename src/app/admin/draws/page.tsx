'use client'
import { useState } from 'react'
import { format, parseISO, startOfMonth, addMonths } from 'date-fns'
import { Play, Send, Trophy, RefreshCw } from 'lucide-react'
import { Button, Badge, Card, StatCard } from '@/components/ui'
import toast from 'react-hot-toast'
import type { SimulationResult, DrawType } from '@/types'

export default function AdminDrawsPage() {
  const [drawType, setDrawType] = useState<DrawType>('random')
  const [simulation, setSimulation] = useState<SimulationResult | null>(null)
  const [loading, setLoading] = useState<'simulate' | 'publish' | null>(null)

  // Default to current month
  const thisMonth = format(startOfMonth(new Date()), 'yyyy-MM-dd')

  async function handleSimulate() {
    setLoading('simulate')
    setSimulation(null)
    try {
      const res = await fetch('/api/admin/draws', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'simulate', drawType }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSimulation(data.simulation)
      toast.success('Simulation complete — review results before publishing')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(null)
    }
  }

  async function handlePublish() {
    if (!confirm(`Publish the ${format(parseISO(thisMonth), 'MMMM yyyy')} draw? This cannot be undone.`)) return
    setLoading('publish')
    try {
      const res = await fetch('/api/admin/draws', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'publish', drawType, drawMonth: thisMonth }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`Draw published! ID: ${data.drawId}`)
      setSimulation(null)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="font-display text-3xl font-bold text-brand-text mb-1">Draw Management</h1>
        <p className="text-brand-subtext text-sm">Configure and run monthly prize draws</p>
      </div>

      {/* Configure */}
      <Card>
        <h2 className="font-display font-semibold text-brand-text mb-4">Configure Draw — {format(parseISO(thisMonth), 'MMMM yyyy')}</h2>

        <div className="mb-6">
          <p className="text-sm text-brand-subtext mb-3">Draw type</p>
          <div className="flex gap-3">
            {(['random', 'algorithmic'] as DrawType[]).map(t => (
              <button
                key={t}
                onClick={() => setDrawType(t)}
                className={`px-5 py-2.5 rounded-xl border text-sm font-medium capitalize transition-all ${drawType === t ? 'border-brand-accent bg-brand-accent/10 text-brand-accent' : 'border-brand-border text-brand-subtext hover:border-brand-accent/40'}`}
              >
                {t}
                {t === 'algorithmic' && <span className="text-xs ml-1 opacity-70">(frequency-weighted)</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={handleSimulate} loading={loading === 'simulate'} variant="secondary">
            <Play className="w-4 h-4" />
            Simulate Draw
          </Button>
          {simulation && (
            <Button onClick={handlePublish} loading={loading === 'publish'}>
              <Send className="w-4 h-4" />
              Publish Draw
            </Button>
          )}
        </div>
      </Card>

      {/* Simulation results */}
      {simulation && (
        <div className="space-y-6">
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4">
            <p className="text-yellow-400 text-sm font-medium">⚠️ Simulation Preview — not yet published</p>
          </div>

          {/* Winning numbers */}
          <Card>
            <h3 className="font-display font-semibold text-brand-text mb-4">Winning Numbers</h3>
            <div className="flex gap-3 flex-wrap">
              {simulation.winning_numbers.map((n, i) => (
                <div key={i} className="w-14 h-14 rounded-full bg-brand-accent flex items-center justify-center font-display font-bold text-2xl text-brand-bg">
                  {n}
                </div>
              ))}
            </div>
          </Card>

          {/* Prize breakdown */}
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Jackpot (5 match)" value={`€${simulation.jackpot_amount.toFixed(2)}`} sub={`${simulation.five_match_count} winner(s)`} accent />
            <StatCard label="4-Match Pool" value={`€${simulation.pool_4match.toFixed(2)}`} sub={`${simulation.four_match_count} winner(s)`} />
            <StatCard label="3-Match Pool" value={`€${simulation.pool_3match.toFixed(2)}`} sub={`${simulation.three_match_count} winner(s)`} />
          </div>

          {simulation.jackpot_rolled && (
            <div className="bg-brand-accent2/10 border border-brand-accent2/30 rounded-2xl p-4">
              <p className="text-brand-accent2 text-sm font-medium">🔄 Jackpot will roll over — no 5-match winners this draw</p>
            </div>
          )}

          {/* Winner list */}
          {simulation.entries.filter(e => e.match_count >= 3).length > 0 && (
            <Card>
              <h3 className="font-display font-semibold text-brand-text mb-4">Winners Preview</h3>
              <div className="space-y-3">
                {simulation.entries
                  .filter(e => e.match_count >= 3)
                  .sort((a, b) => b.match_count - a.match_count)
                  .map(e => (
                    <div key={e.user_id} className="flex items-center justify-between p-3 bg-brand-surface rounded-xl">
                      <div>
                        <p className="text-brand-text text-sm font-medium">{e.full_name ?? e.email}</p>
                        <p className="text-brand-muted text-xs">Scores: {e.user_scores.join(', ')} • {e.match_count} match</p>
                      </div>
                      <div className="text-right">
                        <p className="text-brand-accent font-bold">€{e.prize_amount.toFixed(2)}</p>
                        <Badge label={`${e.match_count} match`} variant={e.match_count === 5 ? 'active' : 'pending'} />
                      </div>
                    </div>
                  ))}
              </div>
            </Card>
          )}

          {simulation.entries.filter(e => e.match_count >= 3).length === 0 && (
            <div className="text-center py-8 bg-brand-card border border-brand-border rounded-2xl">
              <Trophy className="w-10 h-10 text-brand-muted mx-auto mb-2" />
              <p className="text-brand-subtext">No winners this draw (3+ matches required)</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
