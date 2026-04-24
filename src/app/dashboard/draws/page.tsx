import { redirect } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { DashboardNav } from '@/components/ui/Nav'
import { Badge, Card } from '@/components/ui'
import { Trophy } from 'lucide-react'

export const metadata = { title: 'My Draws' }

export default async function DrawsPage() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const { data: entries } = await supabase
    .from('draw_entries')
    .select(`
      id, user_scores, match_count, prize_amount,
      draws(id, draw_month, winning_numbers, status, jackpot_amount, pool_4match, pool_3match)
    `)
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })

  return (
    <>
      <DashboardNav user={session.user} />
      <main className="pt-20 min-h-screen">
        <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
          <div>
            <h1 className="font-display font-bold text-3xl text-brand-text mb-2">Draw History</h1>
            <p className="text-brand-subtext">Your participation in monthly draws</p>
          </div>

          {(!entries || entries.length === 0) ? (
            <Card>
              <div className="text-center py-12">
                <Trophy className="w-10 h-10 text-brand-muted mx-auto mb-3" />
                <p className="text-brand-subtext font-medium">No draws yet</p>
                <p className="text-brand-muted text-sm mt-1">You'll appear here once the first draw is published</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {entries.map(e => {
                const draw = e.draws as any
                const winningNumbers: number[] = draw?.winning_numbers ?? []
                const userScores: number[] = e.user_scores ?? []
                const matchCount = e.match_count

                return (
                  <Card key={e.id}>
                    <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
                      <div>
                        <h2 className="font-display font-semibold text-brand-text">
                          {draw?.draw_month ? format(parseISO(draw.draw_month), 'MMMM yyyy') : 'Draw'}
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge label={draw?.status ?? 'unknown'} variant={draw?.status === 'published' ? 'approved' : 'pending'} />
                          {matchCount && matchCount >= 3 && (
                            <Badge label={`${matchCount} match — Winner!`} variant="active" />
                          )}
                        </div>
                      </div>
                      {e.prize_amount && Number(e.prize_amount) > 0 && (
                        <div className="text-right">
                          <p className="text-brand-muted text-xs">Prize Won</p>
                          <p className="font-display font-bold text-2xl text-brand-accent">€{Number(e.prize_amount).toFixed(2)}</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      {/* Winning numbers */}
                      {draw?.status === 'published' && winningNumbers.length > 0 && (
                        <div>
                          <p className="text-brand-muted text-xs mb-2">Winning Numbers</p>
                          <div className="flex flex-wrap gap-2">
                            {winningNumbers.map((n, i) => (
                              <div
                                key={i}
                                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 ${userScores.includes(n) ? 'bg-brand-accent text-brand-bg border-brand-accent' : 'bg-brand-surface text-brand-subtext border-brand-border'}`}
                              >
                                {n}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Your scores */}
                      <div>
                        <p className="text-brand-muted text-xs mb-2">Your Scores (draw entry)</p>
                        <div className="flex flex-wrap gap-2">
                          {userScores.map((s, i) => (
                            <div
                              key={i}
                              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 ${winningNumbers.includes(s) && draw?.status === 'published' ? 'border-brand-accent text-brand-accent bg-brand-accent/10' : 'border-brand-border text-brand-subtext bg-brand-surface'}`}
                            >
                              {s}
                            </div>
                          ))}
                          {userScores.length === 0 && (
                            <p className="text-brand-muted text-xs italic">No scores recorded</p>
                          )}
                        </div>
                      </div>

                      {/* Prize pool breakdown */}
                      {draw?.status === 'published' && (
                        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-brand-border">
                          <div className="text-center">
                            <p className="text-brand-gold font-bold text-sm">€{Number(draw.jackpot_amount ?? 0).toFixed(0)}</p>
                            <p className="text-brand-muted text-xs">Jackpot</p>
                          </div>
                          <div className="text-center">
                            <p className="text-brand-accent2 font-bold text-sm">€{Number(draw.pool_4match ?? 0).toFixed(0)}</p>
                            <p className="text-brand-muted text-xs">4-Match</p>
                          </div>
                          <div className="text-center">
                            <p className="text-brand-accent font-bold text-sm">€{Number(draw.pool_3match ?? 0).toFixed(0)}</p>
                            <p className="text-brand-muted text-xs">3-Match</p>
                          </div>
                        </div>
                      )}
                    </div>
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
