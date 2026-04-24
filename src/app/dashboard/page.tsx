'use client'
import { useState, useEffect, useRef } from 'react'
import { Upload, Trophy, ExternalLink } from 'lucide-react'
import { DashboardNav } from '@/components/ui/Nav'
import { Badge, Card, Button } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

interface WinEntry {
  id: string
  match_count: number
  prize_amount: number
  draws: { draw_month: string }
  winner_verifications: Array<{
    id: string
    status: string
    payout_status: string
    proof_url: string | null
    admin_notes: string | null
    paid_at: string | null
  }>
}

export default function WinningsPage() {
  const [wins, setWins] = useState<WinEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [pendingEntryId, setPendingEntryId] = useState<string | null>(null)
  const supabase = createClient()

  async function loadWins() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('draw_entries')
      .select(`
        id, match_count, prize_amount,
        draws(draw_month),
        winner_verifications(id, status, payout_status, proof_url, admin_notes, paid_at)
      `)
      .eq('user_id', user.id)
      .gte('match_count', 3)
      .order('created_at', { ascending: false })

    setWins((data as any) ?? [])
    setLoading(false)
  }

  useEffect(() => { loadWins() }, [])

  function triggerUpload(entryId: string) {
    setPendingEntryId(entryId)
    fileRef.current?.click()
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !pendingEntryId) return

    // Client-side validation before sending to server
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
      // Send to server-side API route — uses service role, bypasses RLS
      const fd = new FormData()
      fd.append('file', file)
      fd.append('drawEntryId', pendingEntryId)

      const res = await fetch('/api/user/upload-proof', {
        method: 'POST',
        body: fd,
      })

      let data: { success?: boolean; error?: string; proof_url?: string }
      try {
        data = await res.json()
      } catch {
        throw new Error('Server returned an unexpected response')
      }

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

  return (
    <>
      <DashboardNav />
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      <main className="pt-20 min-h-screen">
        <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
          <div>
            <h1 className="font-display font-bold text-3xl text-brand-text mb-2">My Winnings</h1>
            <p className="text-brand-subtext">Your prize history and payout status</p>
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
            <div className="text-center py-16 text-brand-muted">Loading...</div>
          ) : wins.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <Trophy className="w-12 h-12 text-brand-muted mx-auto mb-3" />
                <p className="text-brand-subtext font-medium">No wins yet</p>
                <p className="text-brand-muted text-sm mt-1">You need to match 3 or more numbers to win</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {wins.map(w => {
                const verif = w.winner_verifications?.[0]
                const drawMonth = (w.draws as any)?.draw_month
                  ? new Date((w.draws as any).draw_month).toLocaleDateString('en-IE', { month: 'long', year: 'numeric' })
                  : 'Unknown draw'

                return (
                  <Card key={w.id}>
                    <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
                      <div>
                        <h2 className="font-display font-semibold text-brand-text">{drawMonth}</h2>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge label={`${w.match_count} numbers matched`} variant="active" />
                          {verif && <Badge label={verif.status} variant={verif.status as any} />}
                          {verif && (
                            <Badge
                              label={verif.payout_status === 'paid' ? 'Paid ✓' : 'Payout pending'}
                              variant={verif.payout_status === 'paid' ? 'paid' : 'pending'}
                            />
                          )}
                        </div>
                      </div>
                      <p className="font-display font-bold text-2xl text-brand-accent">
                        €{Number(w.prize_amount).toFixed(2)}
                      </p>
                    </div>

                    {/* No verification yet — show upload button */}
                    {!verif && (
                      <div className="border-t border-brand-border pt-4">
                        <p className="text-brand-subtext text-sm mb-3">
                          🎉 You won! Upload a screenshot of your scores from your golf platform to claim your prize.
                        </p>
                        <Button
                          size="sm"
                          onClick={() => triggerUpload(w.id)}
                          loading={uploading === w.id}
                        >
                          <Upload className="w-4 h-4" />
                          Upload Proof
                        </Button>
                      </div>
                    )}

                    {/* Pending review */}
                    {verif?.status === 'pending' && (
                      <div className="border-t border-brand-border pt-4">
                        <div className="flex items-center justify-between gap-4">
                          <p className="text-blue-400 text-sm">⏳ Proof submitted — under review by our team</p>
                          {verif.proof_url && (
                            <a
                              href={verif.proof_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-brand-muted text-xs hover:text-brand-accent transition-colors"
                            >
                              View proof <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Rejected — allow re-upload */}
                    {verif?.status === 'rejected' && (
                      <div className="border-t border-brand-border pt-4 space-y-3">
                        <p className="text-red-400 text-sm">❌ Proof not accepted</p>
                        {verif.admin_notes && (
                          <p className="text-brand-muted text-xs bg-brand-surface rounded-lg px-3 py-2 italic">
                            &ldquo;{verif.admin_notes}&rdquo;
                          </p>
                        )}
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

                    {/* Approved, waiting payment */}
                    {verif?.status === 'approved' && verif.payout_status === 'pending' && (
                      <div className="border-t border-brand-border pt-4">
                        <p className="text-brand-accent text-sm">✅ Approved — payout is being processed</p>
                      </div>
                    )}

                    {/* Paid */}
                    {verif?.payout_status === 'paid' && (
                      <div className="border-t border-brand-border pt-4">
                        <p className="text-purple-400 text-sm">
                          💸 Paid on {verif.paid_at
                            ? new Date(verif.paid_at).toLocaleDateString('en-IE', { day: 'numeric', month: 'long', year: 'numeric' })
                            : '—'}
                        </p>
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </>
  )
}