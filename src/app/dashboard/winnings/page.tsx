'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Upload, Trophy, ExternalLink, RefreshCw } from 'lucide-react'
import { DashboardNav } from '@/components/ui/Nav'
import { Badge, Card, Button } from '@/components/ui'
import toast from 'react-hot-toast'

interface Verification {
  id: string
  status: string
  payout_status: string
  proof_url: string | null
  admin_notes: string | null
  paid_at: string | null
  reviewed_at: string | null
}

interface WinEntry {
  id: string
  match_count: number
  prize_amount: number
  draws: { draw_month: string; winning_numbers: number[] }
  winner_verifications: Verification[]
}

export default function WinningsPage() {
  const [wins, setWins] = useState<WinEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [pendingEntryId, setPendingEntryId] = useState<string | null>(null)

  // Fetch wins from server-side API (uses service role — always fresh data)
  const loadWins = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true)
    try {
      const res = await fetch('/api/user/winnings', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setWins(data.wins ?? [])
    } catch (err: any) {
      toast.error('Failed to load winnings: ' + err.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadWins()
    // Auto-refresh every 15 seconds so user sees status updates without manual refresh
    const interval = setInterval(() => loadWins(), 15000)
    return () => clearInterval(interval)
  }, [loadWins])

  function triggerUpload(entryId: string) {
    setPendingEntryId(entryId)
    fileRef.current?.click()
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !pendingEntryId) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File must be under 5MB')
      e.target.value = ''
      return
    }
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      toast.error('Only image files are accepted (JPG, PNG, WEBP, GIF)')
      e.target.value = ''
      return
    }

    setUploading(pendingEntryId)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('drawEntryId', pendingEntryId)

      const res = await fetch('/api/user/upload-proof', { method: 'POST', body: fd })

      let data: { success?: boolean; error?: string }
      try { data = await res.json() }
      catch { throw new Error('Server returned an unexpected response') }

      if (!res.ok) throw new Error(data.error ?? `Upload failed (${res.status})`)

      toast.success('Proof uploaded! Our team will review it shortly.')
      await loadWins()
    } catch (err: any) {
      toast.error(err.message ?? 'Upload failed')
    } finally {
      setUploading(null)
      setPendingEntryId(null)
      e.target.value = ''
    }
  }

  const totalWon = wins.reduce((s, w) => s + Number(w.prize_amount ?? 0), 0)
  const totalPaid = wins
    .filter(w => w.winner_verifications?.[0]?.payout_status === 'paid')
    .reduce((s, w) => s + Number(w.prize_amount ?? 0), 0)

  function statusLabel(verif: Verification | undefined) {
    if (!verif) return null
    if (verif.payout_status === 'paid') return '💸 Paid'
    if (verif.status === 'approved') return '✅ Approved — payout processing'
    if (verif.status === 'rejected') return '❌ Proof rejected'
    if (verif.status === 'pending') return '⏳ Proof under review'
    return null
  }

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
              className="flex items-center gap-2 px-3 py-2 text-brand-subtext hover:text-brand-accent border border-brand-border hover:border-brand-accent/40 rounded-xl transition-all text-sm"
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
            </div>
            <div className="bg-brand-card border border-brand-border rounded-2xl p-5">
              <p className="text-brand-muted text-sm mb-1">Total Paid Out</p>
              <p className="font-display font-bold text-3xl text-brand-text">€{totalPaid.toFixed(2)}</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 gap-3 text-brand-muted">
              <RefreshCw className="w-5 h-5 animate-spin" />
              Loading your winnings...
            </div>
          ) : wins.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <Trophy className="w-12 h-12 text-brand-muted mx-auto mb-3" />
                <p className="text-brand-subtext font-medium">No wins yet</p>
                <p className="text-brand-muted text-sm mt-1">
                  You need to match 3 or more numbers in a draw to win
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {wins.map(w => {
                const verif = w.winner_verifications?.[0]
                const draw = w.draws as any
                const drawMonth = draw?.draw_month
                  ? new Date(draw.draw_month).toLocaleDateString('en-IE', { month: 'long', year: 'numeric' })
                  : 'Unknown draw'
                const isPaid = verif?.payout_status === 'paid'
                const isApproved = verif?.status === 'approved'
                const isPending = verif?.status === 'pending'
                const isRejected = verif?.status === 'rejected'
                const noProof = !verif

                return (
                  <Card key={w.id} className={isPaid ? 'border-purple-500/30' : isApproved ? 'border-brand-accent/30' : ''}>

                    {/* Header row */}
                    <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
                      <div>
                        <h2 className="font-display font-semibold text-brand-text text-lg">{drawMonth}</h2>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <Badge label={`${w.match_count} numbers matched`} variant="active" />
                          {isPaid && <Badge label="Paid ✓" variant="paid" />}
                          {isApproved && !isPaid && <Badge label="Approved" variant="approved" />}
                          {isPending && <Badge label="Proof Under Review" variant="pending" />}
                          {isRejected && <Badge label="Proof Rejected" variant="rejected" />}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-display font-bold text-2xl text-brand-accent">
                          €{Number(w.prize_amount).toFixed(2)}
                        </p>
                        <p className="text-brand-muted text-xs mt-0.5">
                          {w.match_count === 5 ? 'Jackpot' : w.match_count === 4 ? '4-Match Prize' : '3-Match Prize'}
                        </p>
                      </div>
                    </div>

                    {/* Winning numbers vs your scores */}
                    {draw?.winning_numbers && (
                      <div className="bg-brand-surface rounded-xl p-4 mb-4">
                        <p className="text-brand-muted text-xs mb-2">Winning numbers</p>
                        <div className="flex gap-2 flex-wrap">
                          {draw.winning_numbers.map((n: number, i: number) => (
                            <span
                              key={i}
                              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold bg-brand-accent text-brand-bg"
                            >
                              {n}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ── Status-specific sections ── */}

                    {/* PAID — full success state */}
                    {isPaid && (
                      <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
                        <p className="text-purple-300 font-semibold text-sm mb-0.5">
                          💸 Prize paid!
                        </p>
                        <p className="text-purple-400 text-xs">
                          Paid on {verif.paid_at
                            ? new Date(verif.paid_at).toLocaleDateString('en-IE', { day: 'numeric', month: 'long', year: 'numeric' })
                            : '—'}
                        </p>
                      </div>
                    )}

                    {/* APPROVED — waiting for payment */}
                    {isApproved && !isPaid && (
                      <div className="bg-brand-accent/10 border border-brand-accent/20 rounded-xl p-4">
                        <p className="text-brand-accent font-semibold text-sm mb-0.5">✅ Proof approved!</p>
                        <p className="text-brand-accent/70 text-xs">Your payout is being processed — you'll receive a confirmation email when it's sent.</p>
                      </div>
                    )}

                    {/* PENDING — proof under review */}
                    {isPending && (
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-blue-300 font-semibold text-sm mb-0.5">⏳ Proof submitted</p>
                            <p className="text-blue-400/70 text-xs">Our team is reviewing your submission — usually within 24 hours.</p>
                          </div>
                          {verif.proof_url && (
                            <a
                              href={verif.proof_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-blue-400 text-xs hover:text-blue-300 transition-colors shrink-0"
                            >
                              View <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {/* REJECTED — allow re-upload */}
                    {isRejected && (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 space-y-3">
                        <div>
                          <p className="text-red-400 font-semibold text-sm mb-0.5">❌ Proof not accepted</p>
                          {verif.admin_notes && (
                            <p className="text-red-400/70 text-xs mt-1 italic">
                              &ldquo;{verif.admin_notes}&rdquo;
                            </p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => triggerUpload(w.id)}
                          loading={uploading === w.id}
                        >
                          <Upload className="w-4 h-4" />
                          Re-upload Proof
                        </Button>
                      </div>
                    )}

                    {/* NO PROOF YET — first-time upload */}
                    {noProof && (
                      <div className="bg-brand-surface border border-brand-border rounded-xl p-4">
                        <p className="text-brand-subtext text-sm mb-3">
                          🎉 Congratulations! Upload a screenshot of your scores from your golf platform to claim your prize.
                        </p>
                        <Button
                          size="sm"
                          onClick={() => triggerUpload(w.id)}
                          loading={uploading === w.id}
                        >
                          <Upload className="w-4 h-4" />
                          Upload Proof
                        </Button>
                        <p className="text-brand-muted text-xs mt-2">
                          Accepted formats: JPG, PNG, WEBP, GIF · Max 5MB
                        </p>
                      </div>
                    )}

                  </Card>
                )
              })}
            </div>
          )}

          {/* Auto-refresh notice */}
          {!loading && wins.length > 0 && (
            <p className="text-center text-brand-muted text-xs">
              Status updates automatically every 15 seconds · Last refreshed: {new Date().toLocaleTimeString('en-IE')}
            </p>
          )}

        </div>
      </main>
    </>
  )
}