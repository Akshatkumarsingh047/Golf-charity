import { notFound } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { createServiceClient } from '@/lib/supabase/server'
import { Badge, Card, StatCard } from '@/components/ui'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface Props { params: { id: string } }

export default async function AdminUserDetailPage({ params }: Props) {
  const supabase = createServiceClient()

  const [
    { data: user },
    { data: scores },
    { data: entries },
    { data: contributions },
  ] = await Promise.all([
    supabase.from('users').select('*, charities(name)').eq('id', params.id).single(),
    supabase.from('scores').select('*').eq('user_id', params.id).order('score_date', { ascending: false }),
    supabase.from('draw_entries').select('*, draws(draw_month, winning_numbers, status)').eq('user_id', params.id).order('created_at', { ascending: false }),
    supabase.from('charity_contributions').select('amount, created_at, charities(name)').eq('user_id', params.id).order('created_at', { ascending: false }).limit(10),
  ])

  if (!user) notFound()

  const totalWon = (entries ?? []).filter(e => e.match_count && e.match_count >= 3).reduce((s, e) => s + Number(e.prize_amount ?? 0), 0)
  const totalContributed = (contributions ?? []).reduce((s, c) => s + Number(c.amount), 0)

  return (
    <div className="space-y-6 max-w-4xl">
      <Link href="/admin/users" className="inline-flex items-center gap-2 text-brand-subtext hover:text-brand-accent text-sm transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Users
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-bold text-brand-text mb-1">{user.full_name ?? 'Unnamed User'}</h1>
          <p className="text-brand-muted">{user.email}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge label={user.subscription_status} variant={user.subscription_status as any} />
          {user.subscription_plan && <Badge label={user.subscription_plan} variant="default" />}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Draws Entered" value={(entries ?? []).length} />
        <StatCard label="Total Won" value={`€${totalWon.toFixed(2)}`} accent />
        <StatCard label="Charity Donations" value={`€${totalContributed.toFixed(2)}`} />
        <StatCard label="Joined" value={format(parseISO(user.created_at), 'dd MMM yy')} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Profile info */}
        <Card>
          <h2 className="font-display font-semibold text-brand-text mb-4">Account Details</h2>
          <dl className="space-y-3 text-sm">
            {[
              { label: 'Email', value: user.email },
              { label: 'Stripe Customer', value: user.stripe_customer_id ?? '—' },
              { label: 'Subscription Plan', value: user.subscription_plan ?? '—' },
              { label: 'Subscription End', value: user.subscription_end ? format(parseISO(user.subscription_end), 'dd MMM yyyy') : '—' },
              { label: 'Charity', value: (user.charities as any)?.name ?? '—' },
              { label: 'Charity %', value: `${user.charity_percentage}%` },
              { label: 'Country', value: user.country ?? 'IE' },
              { label: 'Role', value: user.role ?? 'user' },
            ].map(row => (
              <div key={row.label} className="flex justify-between gap-2">
                <dt className="text-brand-muted">{row.label}</dt>
                <dd className="text-brand-text font-medium text-right truncate max-w-xs">{row.value}</dd>
              </div>
            ))}
          </dl>
        </Card>

        {/* Current scores */}
        <Card>
          <h2 className="font-display font-semibold text-brand-text mb-4">Current Scores</h2>
          {scores && scores.length > 0 ? (
            <div className="space-y-2">
              {scores.map(s => (
                <div key={s.id} className="flex items-center justify-between py-2 border-b border-brand-border last:border-0">
                  <span className="text-brand-subtext text-sm">{format(parseISO(s.score_date), 'EEE, d MMM yyyy')}</span>
                  <span className="font-display font-bold text-brand-text">{s.score_value}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-brand-muted text-sm text-center py-6">No scores yet</p>
          )}
        </Card>
      </div>

      {/* Draw history */}
      <Card>
        <h2 className="font-display font-semibold text-brand-text mb-4">Draw History</h2>
        {entries && entries.length > 0 ? (
          <div className="space-y-3">
            {entries.map(e => {
              const draw = e.draws as any
              return (
                <div key={e.id} className="flex items-center justify-between p-3 bg-brand-surface rounded-xl text-sm">
                  <div>
                    <p className="text-brand-text font-medium">
                      {draw?.draw_month ? format(parseISO(draw.draw_month), 'MMMM yyyy') : '—'}
                    </p>
                    <p className="text-brand-muted text-xs">Scores: {(e.user_scores ?? []).join(', ')}</p>
                  </div>
                  <div className="text-right">
                    {e.match_count && e.match_count >= 3 ? (
                      <>
                        <Badge label={`${e.match_count} match`} variant="active" />
                        <p className="text-brand-accent font-bold mt-1">€{Number(e.prize_amount ?? 0).toFixed(2)}</p>
                      </>
                    ) : (
                      <span className="text-brand-muted text-xs">No match</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-brand-muted text-sm text-center py-6">No draw entries yet</p>
        )}
      </Card>

      {/* Charity contributions */}
      {contributions && contributions.length > 0 && (
        <Card>
          <h2 className="font-display font-semibold text-brand-text mb-4">Recent Charity Contributions</h2>
          <div className="space-y-2">
            {contributions.map((c, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-brand-border last:border-0 text-sm">
                <div>
                  <p className="text-brand-subtext">{(c.charities as any)?.name ?? '—'}</p>
                  <p className="text-brand-muted text-xs">{format(parseISO(c.created_at), 'dd MMM yyyy')}</p>
                </div>
                <span className="text-brand-accent font-medium">€{Number(c.amount).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
