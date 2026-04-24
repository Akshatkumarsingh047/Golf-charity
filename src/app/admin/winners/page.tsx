'use client'
import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { Eye, Check, X, DollarSign, ExternalLink } from 'lucide-react'
import { Button, Badge } from '@/components/ui'
import toast from 'react-hot-toast'

interface Winner {
  id: string
  status: string
  payout_status: string
  proof_url: string
  admin_notes: string | null
  reviewed_at: string | null
  paid_at: string | null
  created_at: string
  users: { email: string; full_name: string | null }
  draw_entries: {
    match_count: number
    prize_amount: number
    user_scores: number[]
    draws: { draw_month: string; winning_numbers: number[] }
  }
}

export default function AdminWinnersPage() {
  const [winners, setWinners] = useState<Winner[]>([])
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  async function fetchWinners() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      const res = await fetch(`/api/admin/winners?${params}`)
      const data = await res.json()
      setWinners(data.winners ?? [])
    } catch {
      toast.error('Failed to load winners')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchWinners() }, [statusFilter])

  async function handleAction(id: string, action: string) {
    setActionLoading(`${id}-${action}`)
    try {
      const res = await fetch('/api/admin/winners', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action, notes: notes[id] ?? null }),
      })
      if (!res.ok) throw new Error()
      toast.success(`${action} successful`)
      fetchWinners()
    } catch {
      toast.error('Action failed')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-brand-text mb-1">Winners Management</h1>
        <p className="text-brand-subtext text-sm">Review proof submissions and manage payouts</p>
      </div>

      <div className="flex gap-3">
        {['', 'pending', 'approved', 'rejected'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all capitalize ${statusFilter === s ? 'border-brand-accent bg-brand-accent/10 text-brand-accent' : 'border-brand-border text-brand-subtext hover:border-brand-accent/40'}`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-brand-muted">Loading...</div>
        ) : winners.length === 0 ? (
          <div className="text-center py-12 text-brand-muted bg-brand-card border border-brand-border rounded-2xl">No winners found</div>
        ) : winners.map(w => (
          <div key={w.id} className="bg-brand-card border border-brand-border rounded-2xl p-6 space-y-4">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <p className="font-medium text-brand-text">{w.users?.full_name ?? w.users?.email}</p>
                  <Badge label={w.status} variant={w.status as any} />
                  <Badge label={w.payout_status} variant={w.payout_status === 'paid' ? 'paid' : 'pending'} />
                </div>
                <p className="text-brand-muted text-xs">{w.users?.email}</p>
              </div>
              <div className="text-right">
                <p className="text-brand-accent font-bold text-xl">€{Number(w.draw_entries?.prize_amount ?? 0).toFixed(2)}</p>
                <p className="text-brand-muted text-xs">{w.draw_entries?.match_count} match</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-brand-muted text-xs mb-1">Draw Month</p>
                <p className="text-brand-subtext">{w.draw_entries?.draws?.draw_month ? format(parseISO(w.draw_entries.draws.draw_month), 'MMMM yyyy') : '—'}</p>
              </div>
              <div>
                <p className="text-brand-muted text-xs mb-1">Winning Numbers</p>
                <p className="text-brand-subtext">{w.draw_entries?.draws?.winning_numbers?.join(', ')}</p>
              </div>
              <div>
                <p className="text-brand-muted text-xs mb-1">User Scores</p>
                <p className="text-brand-subtext">{w.draw_entries?.user_scores?.join(', ')}</p>
              </div>
              <div>
                <p className="text-brand-muted text-xs mb-1">Submitted</p>
                <p className="text-brand-subtext">{format(parseISO(w.created_at), 'dd MMM yyyy HH:mm')}</p>
              </div>
            </div>

            {/* Proof link */}
            <div>
              <p className="text-brand-muted text-xs mb-2">Proof Screenshot</p>
              <a
                href={w.proof_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-surface border border-brand-border rounded-xl text-brand-subtext hover:text-brand-accent hover:border-brand-accent/40 transition-all text-sm"
              >
                <Eye className="w-4 h-4" />
                View Proof
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {w.admin_notes && (
              <div className="bg-brand-surface rounded-xl p-3">
                <p className="text-brand-muted text-xs mb-1">Admin Notes</p>
                <p className="text-brand-subtext text-sm italic">"{w.admin_notes}"</p>
              </div>
            )}

            {/* Actions */}
            {w.status === 'pending' && (
              <div className="space-y-3 pt-2 border-t border-brand-border">
                <textarea
                  value={notes[w.id] ?? ''}
                  onChange={e => setNotes(prev => ({ ...prev, [w.id]: e.target.value }))}
                  placeholder="Optional admin notes..."
                  rows={2}
                  className="w-full bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-brand-text placeholder:text-brand-muted text-sm focus:outline-none focus:border-brand-accent resize-none"
                />
                <div className="flex gap-3">
                  <Button
                    size="sm"
                    onClick={() => handleAction(w.id, 'approve')}
                    loading={actionLoading === `${w.id}-approve`}
                  >
                    <Check className="w-4 h-4" />
                    Approve
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleAction(w.id, 'reject')}
                    loading={actionLoading === `${w.id}-reject`}
                  >
                    <X className="w-4 h-4" />
                    Reject
                  </Button>
                </div>
              </div>
            )}

            {w.status === 'approved' && w.payout_status === 'pending' && (
              <div className="pt-2 border-t border-brand-border">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAction(w.id, 'mark_paid')}
                  loading={actionLoading === `${w.id}-mark_paid`}
                >
                  <DollarSign className="w-4 h-4" />
                  Mark as Paid
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
