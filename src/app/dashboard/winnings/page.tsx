'use client'
import { useState, useEffect, useRef } from 'react'
import { Upload, Trophy, ExternalLink, RefreshCw, CheckCircle } from 'lucide-react'
import { DashboardNav } from '@/components/ui/Nav'
import { Badge, Button } from '@/components/ui'
import toast from 'react-hot-toast'

interface Verification {
  id: string
  draw_entry_id: string
  status: 'pending' | 'approved' | 'rejected'
  payout_status: 'pending' | 'paid'
  proof_url: string | null
  admin_notes: string | null
  paid_at: string | null
  reviewed_at: string | null
}

interface WinEntry {
  id: string
  match_count: number
  prize_amount: number
  draws: { draw_month: string; winning_numbers: number[] } | null
  verification: Verification | null  // single object, not array
}

// Single source of truth for state — payout_status=paid wins over everything
function getWinState(v: Verification | null | undefined): 'PAID' | 'APPROVED' | 'PENDING' | 'REJECTED' | 'NO_PROOF' {
  if (!v)                          return 'NO_PROOF'
  if (v.payout_status === 'paid')  return 'PAID'
  if (v.status === 'approved')     return 'APPROVED'
  if (v.status === 'rejected')     return 'REJECTED'
  if (v.status === 'pending')      return 'PENDING'
  return 'NO_PROOF'
}

export default function WinningsPage() {
  const [wins, setWins] = useState<WinEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)
  const [lastRefreshed, setLastRefreshed] = useState(new Date())
  const fileRef = useRef<HTMLInputElement>(null)
  const pendingEntryId = useRef<string | null>(null)

  async function loadWins(showRefreshing = false) {
    if (showRefreshing) setRefreshing(true)
    try {
      const res = await fetch('/api/user/winnings', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setWins(data.wins ?? [])
      setLastRefreshed(new Date())
    } catch (err: any) {
      toast.error('Failed to load: ' + (err.message ?? 'Unknown error'))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadWins()
    const interval = setInterval(loadWins, 10000)
    return () => clearInterval(interval)
  }, []) // empty deps — no infinite loop

  function triggerUpload(entryId: string) {
    pendingEntryId.current = entryId
    fileRef.current?.click()
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    const entryId = pendingEntryId.current
    if (!file || !entryId) return

    if (file.size > 5 * 1024 * 1024) { toast.error('File must be under 5MB'); e.target.value = ''; return }
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      toast.error('Only JPG, PNG, WEBP or GIF accepted'); e.target.value = ''; return
    }

    setUploading(entryId)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('drawEntryId', entryId)
      const res = await fetch('/api/user/upload-proof', { method: 'POST', body: fd })
      const data = await res.json().catch(() => ({ error: 'Unexpected response' }))
      if (!res.ok) throw new Error(data.error ?? `Upload failed (${res.status})`)
      toast.success('Proof uploaded! Our team will review it shortly.')
      await loadWins()
    } catch (err: any) {
      toast.error(err.message ?? 'Upload failed')
    } finally {
      setUploading(null)
      pendingEntryId.current = null
      e.target.value = ''
    }
  }

  const totalWon  = wins.reduce((s, w) => s + Number(w.prize_amount ?? 0), 0)
  const totalPaid = wins.filter(w => w.verification?.payout_status === 'paid').reduce((s, w) => s + Number(w.prize_amount ?? 0), 0)
  const paidCount = wins.filter(w => w.verification?.payout_status === 'paid').length

  return (
    <>
      <DashboardNav />
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      <main className="pt-20 min-h-screen">
        <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">

          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-display font-bold text-3xl text-brand-text mb-2">My Winnings</h1>
              <p className="text-brand-subtext">Your prize history and payout status</p>
            </div>
            <button
              onClick={() => loadWins(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-3 py-2 text-brand-subtext hover:text-brand-accent border border-brand-border hover:border-brand-accent/40 rounded-xl transition-all text-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-brand-card border border-brand-border rounded-2xl p-5">
              <p className="text-brand-muted text-sm mb-1">Total Won</p>
              <p className="font-display font-bold text-3xl text-brand-accent">€{totalWon.toFixed(2)}</p>
              <p className="text-brand-muted text-xs mt-1">{wins.length} winning draw{wins.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="bg-brand-card border border-brand-border rounded-2xl p-5">
              <p className="text-brand-muted text-sm mb-1">Total Paid Out</p>
              <p className="font-display font-bold text-3xl text-brand-text">€{totalPaid.toFixed(2)}</p>
              <p className="text-brand-muted text-xs mt-1">{paidCount} prize{paidCount !== 1 ? 's' : ''} paid</p>
            </div>
          </div>

          {/* List */}
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-3 text-brand-muted">
              <RefreshCw className="w-5 h-5 animate-spin" />
              Loading your winnings...
            </div>
          ) : wins.length === 0 ? (
            <div className="bg-brand-card border border-brand-border rounded-2xl p-12 text-center">
              <Trophy className="w-12 h-12 text-brand-muted mx-auto mb-3" />
              <p className="text-brand-subtext font-medium">No wins yet</p>
              <p className="text-brand-muted text-sm mt-1">Match 3 or more draw numbers to win a prize</p>
            </div>
          ) : (
            <div className="space-y-4">
              {wins.map(w => {
                const v     = w.verification   // single object or null
                const state = getWinState(v)
                const draw  = w.draws
                const drawMonth = draw?.draw_month
                  ? new Date(draw.draw_month).toLocaleDateString('en-IE', { month: 'long', year: 'numeric' })
                  : 'Unknown draw'

                const tierLabel =
                  w.match_count === 5 ? 'Jackpot' :
                  w.match_count === 4 ? '4-Match Prize' : '3-Match Prize'

                const borderClass =
                  state === 'PAID'     ? 'border-purple-500/40' :
                  state === 'APPROVED' ? 'border-brand-accent/40' :
                  state === 'REJECTED' ? 'border-red-500/30' : 'border-brand-border'

                return (
                  <div key={w.id} className={`bg-brand-card border ${borderClass} rounded-2xl p-6 space-y-4 transition-all`}>

                    {/* Title row */}
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <h2 className="font-display font-semibold text-xl text-brand-text">{drawMonth}</h2>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Badge label={`${w.match_count} matched`} variant="active" />
                          {state === 'PAID'     && <Badge label="Paid ✓"              variant="paid"     />}
                          {state === 'APPROVED' && <Badge label="Approved"            variant="approved" />}
                          {state === 'PENDING'  && <Badge label="Under Review"        variant="pending"  />}
                          {state === 'REJECTED' && <Badge label="Proof Rejected"      variant="rejected" />}
                          {state === 'NO_PROOF' && <Badge label="Upload Required"     variant="inactive" />}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-display font-bold text-3xl text-brand-accent">
                          €{Number(w.prize_amount).toFixed(2)}
                        </p>
                        <p className="text-brand-muted text-xs mt-0.5">{tierLabel}</p>
                      </div>
                    </div>

                    {/* Winning numbers */}
                    {draw?.winning_numbers && draw.winning_numbers.length > 0 && (
                      <div className="bg-brand-surface rounded-xl p-4">
                        <p className="text-brand-muted text-xs mb-2">Draw winning numbers</p>
                        <div className="flex gap-2 flex-wrap">
                          {draw.winning_numbers.map((n: number, i: number) => (
                            <span key={i} className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold bg-brand-accent text-brand-bg">
                              {n}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ── One block per state — mutually exclusive ── */}

                    {state === 'PAID' && (
                      <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-purple-400 shrink-0" />
                        <div>
                          <p className="text-purple-300 font-semibold text-sm">Prize paid — congratulations!</p>
                          <p className="text-purple-400/70 text-xs mt-0.5">
                            Paid on {v?.paid_at
                              ? new Date(v.paid_at).toLocaleDateString('en-IE', { day: 'numeric', month: 'long', year: 'numeric' })
                              : '—'}
                          </p>
                        </div>
                      </div>
                    )}

                    {state === 'APPROVED' && (
                      <div className="bg-brand-accent/10 border border-brand-accent/20 rounded-xl p-4">
                        <p className="text-brand-accent font-semibold text-sm">✅ Proof approved!</p>
                        <p className="text-brand-accent/70 text-xs mt-1">Your payout is being processed. A confirmation email will be sent when it is complete.</p>
                      </div>
                    )}

                    {state === 'PENDING' && (
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start justify-between gap-4">
                        <div>
                          <p className="text-blue-300 font-semibold text-sm">⏳ Proof under review</p>
                          <p className="text-blue-400/70 text-xs mt-1">Our team will verify your submission — usually within 24 hours.</p>
                        </div>
                        {v?.proof_url && (
                          <a href={v.proof_url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-400 text-xs hover:text-blue-300 shrink-0">
                            View <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    )}

                    {state === 'REJECTED' && (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 space-y-3">
                        <div>
                          <p className="text-red-400 font-semibold text-sm">❌ Proof not accepted</p>
                          {v?.admin_notes && (
                            <p className="text-red-400/70 text-xs mt-1 italic bg-red-500/10 rounded-lg px-3 py-2">
                              &ldquo;{v.admin_notes}&rdquo;
                            </p>
                          )}
                        </div>
                        <Button size="sm" variant="danger" onClick={() => triggerUpload(w.id)} loading={uploading === w.id}>
                          <Upload className="w-4 h-4" /> Re-upload Proof
                        </Button>
                      </div>
                    )}

                    {state === 'NO_PROOF' && (
                      <div className="bg-brand-surface border border-brand-border rounded-xl p-4">
                        <p className="text-brand-subtext text-sm mb-3">
                          🎉 You won! Upload a screenshot of your scores from your golf platform to claim your prize.
                        </p>
                        <Button size="sm" onClick={() => triggerUpload(w.id)} loading={uploading === w.id}>
                          <Upload className="w-4 h-4" /> Upload Proof
                        </Button>
                        <p className="text-brand-muted text-xs mt-2">JPG, PNG, WEBP or GIF · Max 5MB</p>
                      </div>
                    )}

                  </div>
                )
              })}
            </div>
          )}

          <p className="text-center text-brand-muted text-xs">
            Auto-refreshes every 10 seconds · Last updated: {lastRefreshed.toLocaleTimeString('en-IE')}
          </p>

        </div>
      </main>
    </>
  )
}