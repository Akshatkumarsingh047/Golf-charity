import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { DashboardNav } from '@/components/ui/Nav'
import { Badge, StatCard, Card, Button } from '@/components/ui'
import { Trophy, Target, Heart, ChevronRight, AlertCircle, TrendingUp, Calendar, Zap } from 'lucide-react'

export const metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [
    { data: dbUser },
    { data: scores },
    { data: draws },
    { data: winnings },
  ] = await Promise.all([
    supabase.from('users').select('*, charities(name, image_url)').eq('id', user.id).single(),
    supabase.from('scores').select('id, score_value, score_date').eq('user_id', user.id).order('score_date', { ascending: false }).limit(5),
    supabase.from('draw_entries').select('id, match_count, prize_amount, draws(draw_month, status)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
    supabase.from('draw_entries').select('id, prize_amount, draws(draw_month)').eq('user_id', user.id).gte('match_count', 3),
  ])

  const totalWon = (winnings ?? []).reduce((s, d) => s + Number(d.prize_amount ?? 0), 0)
  const drawsEntered = (draws ?? []).length
  const isActive = dbUser?.subscription_status === 'active'
  const firstName = dbUser?.full_name?.split(' ')[0] ?? null

  return (
    <>
      <DashboardNav user={user} />
      <main className="pt-20 min-h-screen bg-gradient-mesh">
        <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">

          {/* Reactivate banner */}
          {!isActive && (
            <div className="anim-item flex items-start gap-4 bg-yellow-500/8 border border-yellow-500/20 rounded-2xl p-5">
              <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-yellow-300 font-semibold">Subscription {dbUser?.subscription_status}</p>
                <p className="text-yellow-400/70 text-sm mt-0.5">Reactivate to enter draws and support your charity.</p>
              </div>
              <Link href="/dashboard/billing">
                <Button size="sm">Reactivate</Button>
              </Link>
            </div>
          )}

          {/* Greeting */}
          <div className="anim-item flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-display font-bold text-3xl md:text-4xl text-brand-text tracking-tight mb-1">
                {firstName ? `Welcome back, ${firstName} 👋` : 'Your Dashboard 👋'}
              </h1>
              <p className="text-brand-subtext">Here's everything at a glance</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                label={dbUser?.subscription_status === 'active' ? '● Active' : dbUser?.subscription_status ?? 'Unknown'}
                variant={dbUser?.subscription_status as any}
              />
              {dbUser?.subscription_end && isActive && (
                <span className="text-brand-muted text-xs">Renews {format(parseISO(dbUser.subscription_end), 'dd MMM yyyy')}</span>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label:'Scores Stored',  value:`${scores?.length ?? 0}/5`,    sub:'Draw entry numbers',  accent:true },
              { label:'Draws Entered',  value:drawsEntered,                   sub:'Total participation' },
              { label:'Total Won',      value:`€${totalWon.toFixed(2)}`,      sub:'All-time winnings',  accent:true },
              { label:'Charity %',      value:`${dbUser?.charity_percentage ?? 10}%`, sub:'Of subscription donated' },
            ].map((s, i) => (
              <div key={s.label} className="anim-item">
                <StatCard {...s} />
              </div>
            ))}
          </div>

          {/* Main grid */}
          <div className="grid lg:grid-cols-2 gap-6">

            {/* Scores card */}
            <div className="anim-item bg-brand-card border border-brand-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-brand-accent/10 flex items-center justify-center">
                    <Target className="w-4.5 h-4.5 text-brand-accent" />
                  </div>
                  <h2 className="font-display font-semibold text-brand-text">My Scores</h2>
                </div>
                <Link href="/dashboard/scores">
                  <button className="flex items-center gap-1 text-brand-subtext hover:text-brand-accent text-xs font-medium transition-colors">
                    Manage <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </Link>
              </div>

              {scores && scores.length > 0 ? (
                <div className="space-y-2">
                  {scores.map((s, i) => (
                    <div key={s.id} className={`anim-item flex items-center justify-between py-3 px-4 rounded-xl transition-colors hover:bg-brand-surface ${i === 0 ? 'bg-brand-accent/5 border border-brand-accent/15' : 'bg-brand-surface/50'}`}>
                      <div className="flex items-center gap-3">
                        <Calendar className="w-3.5 h-3.5 text-brand-muted" />
                        <span className="text-brand-subtext text-sm">{format(parseISO(s.score_date), 'EEE, d MMM yyyy')}</span>
                      </div>
                      <span className={`font-display font-bold text-xl ${i === 0 ? 'text-brand-accent' : 'text-brand-text'}`}>{s.score_value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 border border-dashed border-brand-border rounded-xl">
                  <Target className="w-8 h-8 text-brand-muted mx-auto mb-3" />
                  <p className="text-brand-subtext text-sm mb-4">No scores yet. Add your first to enter draws!</p>
                  <Link href="/dashboard/scores"><Button size="sm">Add Score</Button></Link>
                </div>
              )}
            </div>

            {/* Right column */}
            <div className="space-y-4">

              {/* Charity card */}
              <div className="anim-item bg-brand-card border border-brand-border rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center">
                      <Heart className="w-4.5 h-4.5 text-red-400" />
                    </div>
                    <h2 className="font-display font-semibold text-brand-text">My Charity</h2>
                  </div>
                  <Link href="/dashboard/charity">
                    <button className="flex items-center gap-1 text-brand-subtext hover:text-brand-accent text-xs font-medium transition-colors">
                      Change <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </Link>
                </div>
                {(dbUser as any)?.charities ? (
                  <div className="flex items-center gap-4 p-4 bg-brand-surface rounded-xl border border-brand-border">
                    <div className="w-12 h-12 rounded-xl bg-brand-card border border-brand-border flex items-center justify-center overflow-hidden shrink-0">
                      {(dbUser as any).charities.image_url
                        ? <img src={(dbUser as any).charities.image_url} alt="" className="w-full h-full object-cover" />
                        : <Heart className="w-5 h-5 text-brand-muted" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-brand-text truncate">{(dbUser as any).charities.name}</p>
                      <p className="text-brand-muted text-xs mt-0.5">
                        <span className="text-brand-accent font-semibold">{dbUser?.charity_percentage ?? 10}%</span> of your subscription
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 border border-dashed border-brand-border rounded-xl">
                    <p className="text-brand-muted text-sm mb-3">No charity selected</p>
                    <Link href="/dashboard/charity"><Button size="sm">Choose Charity</Button></Link>
                  </div>
                )}
              </div>

              {/* Recent draws */}
              <div className="anim-item bg-brand-card border border-brand-border rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-brand-gold/10 flex items-center justify-center">
                      <Trophy className="w-4.5 h-4.5 text-brand-gold" />
                    </div>
                    <h2 className="font-display font-semibold text-brand-text">Recent Draws</h2>
                  </div>
                  <Link href="/dashboard/draws">
                    <button className="flex items-center gap-1 text-brand-subtext hover:text-brand-accent text-xs font-medium transition-colors">
                      View All <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </Link>
                </div>
                {draws && draws.length > 0 ? (
                  <div className="space-y-2">
                    {draws.slice(0, 3).map(d => {
                      const draw = d.draws as any
                      const hasWin = d.match_count && d.match_count >= 3
                      return (
                        <div key={d.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-brand-surface/60 transition-colors">
                          <span className="text-brand-subtext text-sm">
                            {draw?.draw_month ? format(parseISO(draw.draw_month), 'MMM yyyy') : '—'}
                          </span>
                          <div className="flex items-center gap-2">
                            {hasWin ? (
                              <span className="text-brand-accent text-xs font-semibold bg-brand-accent/10 px-2.5 py-0.5 rounded-full">
                                {d.match_count} match · €{Number(d.prize_amount ?? 0).toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-brand-muted text-xs">No match</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-brand-muted text-sm text-center py-6">No draws yet</p>
                )}
              </div>
            </div>
          </div>

        </div>
      </main>
    </>
  )
}