import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { DashboardNav } from '@/components/ui/Nav'
import { Badge, StatCard, Card, Button } from '@/components/ui'
import { Trophy, Target, Heart, ChevronRight, AlertCircle } from 'lucide-react'

export const metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const [
    { data: user },
    { data: scores },
    { data: draws },
    { data: winnings },
    { data: nextDraw },
  ] = await Promise.all([
    supabase.from('users').select('*, charities(name, image_url)').eq('id', session.user.id).single(),
    supabase.from('scores').select('id, score_value, score_date').eq('user_id', session.user.id).order('score_date', { ascending: false }).limit(5),
    supabase.from('draw_entries').select('id, match_count, prize_amount, draws(draw_month, status)').eq('user_id', session.user.id).order('created_at', { ascending: false }),
    supabase.from('winner_verifications').select('id, status, payout_status, draw_entries(prize_amount)').eq('user_id', session.user.id).order('created_at', { ascending: false }).limit(5),
    supabase.from('draws').select('draw_month').eq('status', 'pending').order('draw_month', { ascending: true }).limit(1).single(),
  ])

  const totalWon = (draws ?? []).reduce((s, d) => s + (d.match_count && d.match_count >= 3 ? Number(d.prize_amount ?? 0) : 0), 0)
  const drawsEntered = (draws ?? []).length
  const isActive = user?.subscription_status === 'active'

  return (
    <>
      <DashboardNav user={session.user} />
      <main className="pt-20 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">

          {/* Reactivate banner */}
          {!isActive && (
            <div className="flex items-start gap-3 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-5">
              <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-yellow-300 font-semibold">Your subscription is {user?.subscription_status}</p>
                <p className="text-yellow-400/80 text-sm">Reactivate to enter draws and support your charity.</p>
              </div>
              <Link href="/dashboard/billing"><Button size="sm">Reactivate</Button></Link>
            </div>
          )}

          {/* Greeting + status */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-display font-bold text-3xl text-brand-text mb-1">
                Welcome back{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}! 👋
              </h1>
              <p className="text-brand-subtext">Here's your GolfDraw overview</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge label={user?.subscription_status ?? 'unknown'} variant={user?.subscription_status as any} />
              {user?.subscription_end && isActive && (
                <span className="text-brand-muted text-xs">Renews {format(parseISO(user.subscription_end), 'dd MMM yyyy')}</span>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Scores Stored" value={`${scores?.length ?? 0}/5`} sub="Draws use your scores" accent />
            <StatCard label="Draws Entered" value={drawsEntered} />
            <StatCard label="Total Won" value={`€${totalWon.toFixed(2)}`} accent />
            <StatCard label="Next Draw" value={nextDraw?.draw_month ? format(parseISO(nextDraw.draw_month), 'MMM yyyy') : 'TBC'} sub="Monthly draw" />
          </div>

          {/* My Scores */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display font-semibold text-brand-text flex items-center gap-2">
                  <Target className="w-5 h-5 text-brand-accent" /> My Scores
                </h2>
                <Link href="/dashboard/scores">
                  <Button variant="ghost" size="sm">
                    Manage <ChevronRight className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
              {scores && scores.length > 0 ? (
                <div className="space-y-2">
                  {scores.map((s, i) => (
                    <div key={s.id} className="flex items-center justify-between py-2.5 border-b border-brand-border last:border-0">
                      <span className="text-brand-subtext text-sm">{format(parseISO(s.score_date), 'EEE, d MMM yyyy')}</span>
                      <span className={`font-display font-bold text-lg ${i === 0 ? 'text-brand-accent' : 'text-brand-text'}`}>{s.score_value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-brand-muted text-sm mb-4">No scores yet. Add your first score to enter draws!</p>
                  <Link href="/dashboard/scores"><Button size="sm">Add Score</Button></Link>
                </div>
              )}
            </Card>

            {/* Charity */}
            <Card>
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display font-semibold text-brand-text flex items-center gap-2">
                  <Heart className="w-5 h-5 text-brand-accent" /> My Charity
                </h2>
                <Link href="/dashboard/charity">
                  <Button variant="ghost" size="sm">
                    Change <ChevronRight className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
              {(user as any)?.charities ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-brand-surface border border-brand-border flex items-center justify-center overflow-hidden">
                      {(user as any).charities.image_url ? (
                        <img src={(user as any).charities.image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Heart className="w-5 h-5 text-brand-muted" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-brand-text">{(user as any).charities.name}</p>
                      <p className="text-brand-muted text-xs">Your chosen cause</p>
                    </div>
                  </div>
                  <div className="bg-brand-surface rounded-xl p-4">
                    <p className="text-brand-subtext text-sm mb-1">Your contribution</p>
                    <p className="font-display font-bold text-2xl text-brand-accent">{user?.charity_percentage ?? 10}%</p>
                    <p className="text-brand-muted text-xs mt-0.5">of your subscription goes to this charity</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-brand-muted text-sm mb-4">No charity selected yet.</p>
                  <Link href="/dashboard/charity"><Button size="sm">Choose Charity</Button></Link>
                </div>
              )}
            </Card>
          </div>

          {/* Recent winnings */}
          <Card>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-semibold text-brand-text flex items-center gap-2">
                <Trophy className="w-5 h-5 text-brand-accent" /> Recent Winnings
              </h2>
              <Link href="/dashboard/winnings">
                <Button variant="ghost" size="sm">
                  View All <ChevronRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
            {winnings && winnings.length > 0 ? (
              <div className="space-y-3">
                {winnings.map(w => (
                  <div key={w.id} className="flex items-center justify-between p-3 bg-brand-surface rounded-xl">
                    <div className="flex items-center gap-3">
                      <Badge label={w.status} variant={w.status as any} />
                      <Badge label={w.payout_status} variant={w.payout_status === 'paid' ? 'paid' : 'pending'} />
                    </div>
                    <span className="text-brand-accent font-bold">€{Number((w.draw_entries as any)?.prize_amount ?? 0).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-brand-muted text-sm text-center py-8">No winnings yet — keep playing!</p>
            )}
          </Card>

        </div>
      </main>
    </>
  )
}
