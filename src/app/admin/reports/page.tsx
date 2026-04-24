import { createServiceClient } from '@/lib/supabase/server'
import { StatCard } from '@/components/ui'
import { format, parseISO } from 'date-fns'

export const metadata = { title: 'Admin — Reports' }

export default async function AdminReportsPage() {
  const supabase = createServiceClient()

  const [
    { count: activeSubscribers },
    { count: monthlyCount },
    { count: yearlyCount },
    { data: charityContributions },
    { data: draws },
    { data: config },
  ] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('subscription_status', 'active'),
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('subscription_plan', 'monthly').eq('subscription_status', 'active'),
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('subscription_plan', 'yearly').eq('subscription_status', 'active'),
    supabase.from('charity_contributions').select('amount, charity_id, charities(name)').order('created_at', { ascending: false }),
    supabase.from('draws').select(`
      id, draw_month, jackpot_amount, pool_4match, pool_3match, jackpot_rolled,
      draw_entries(match_count)
    `).eq('status', 'published').order('draw_month', { ascending: false }),
    supabase.from('prize_pool_config').select('*').eq('id', 1).single(),
  ])

  const totalContributions = charityContributions?.reduce((s, c) => s + Number(c.amount), 0) ?? 0

  // Per-charity totals
  const charityTotals: Record<string, { name: string; total: number }> = {}
  for (const c of charityContributions ?? []) {
    const name = (c.charities as any)?.name ?? 'Unknown'
    if (!charityTotals[c.charity_id]) charityTotals[c.charity_id] = { name, total: 0 }
    charityTotals[c.charity_id].total += Number(c.amount)
  }

  // Current month prize pool estimate
  const poolPct = config?.pool_percentage ?? 70
  const monthlyPriceCents = config?.monthly_price_cents ?? 999
  const yearlyPriceCents = config?.yearly_price_cents ?? 9999
  const estimatedPool = (
    (monthlyCount ?? 0) * monthlyPriceCents +
    (yearlyCount ?? 0) * Math.round(yearlyPriceCents / 12)
  ) * poolPct / 100 / 100

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="font-display text-3xl font-bold text-brand-text mb-1">Reports & Analytics</h1>
        <p className="text-brand-subtext text-sm">Platform performance overview</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Subscribers" value={activeSubscribers ?? 0} accent />
        <StatCard label="Monthly Plans" value={monthlyCount ?? 0} sub={`${Math.round(((monthlyCount ?? 0) / (activeSubscribers || 1)) * 100)}% of active`} />
        <StatCard label="Yearly Plans" value={yearlyCount ?? 0} sub={`${Math.round(((yearlyCount ?? 0) / (activeSubscribers || 1)) * 100)}% of active`} />
        <StatCard label="Est. Prize Pool (Month)" value={`€${estimatedPool.toFixed(2)}`} accent />
      </div>

      {/* Charity contributions */}
      <div className="bg-brand-card border border-brand-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-semibold text-brand-text">Charity Contributions</h2>
          <span className="text-brand-accent font-bold">€{totalContributions.toFixed(2)} total</span>
        </div>
        <div className="space-y-3">
          {Object.values(charityTotals).sort((a, b) => b.total - a.total).map(c => {
            const pct = totalContributions > 0 ? (c.total / totalContributions) * 100 : 0
            return (
              <div key={c.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-brand-subtext">{c.name}</span>
                  <span className="text-brand-text font-medium">€{c.total.toFixed(2)}</span>
                </div>
                <div className="h-2 bg-brand-surface rounded-full overflow-hidden">
                  <div className="h-full bg-brand-accent rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
          {Object.keys(charityTotals).length === 0 && (
            <p className="text-brand-muted text-sm">No contributions yet</p>
          )}
        </div>
      </div>

      {/* Plan split visual */}
      <div className="bg-brand-card border border-brand-border rounded-2xl p-6">
        <h2 className="font-display font-semibold text-brand-text mb-5">Subscription Plan Split</h2>
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 h-4 bg-brand-surface rounded-full overflow-hidden flex">
            <div
              className="h-full bg-brand-accent transition-all"
              style={{ width: `${Math.round(((monthlyCount ?? 0) / (activeSubscribers || 1)) * 100)}%` }}
            />
            <div
              className="h-full bg-brand-accent2 transition-all"
              style={{ width: `${Math.round(((yearlyCount ?? 0) / (activeSubscribers || 1)) * 100)}%` }}
            />
          </div>
        </div>
        <div className="flex gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-brand-accent" />
            <span className="text-brand-subtext">Monthly ({monthlyCount ?? 0})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-brand-accent2" />
            <span className="text-brand-subtext">Yearly ({yearlyCount ?? 0})</span>
          </div>
        </div>
      </div>

      {/* Draw history table */}
      <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-brand-border">
          <h2 className="font-display font-semibold text-brand-text">Draw Statistics</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-border">
              {['Month', 'Jackpot', '4-Match Pool', '3-Match Pool', '5✓', '4✓', '3✓', 'Rolled'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-brand-muted font-medium text-xs uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {(draws ?? []).map(d => {
              const entries = (d.draw_entries ?? []) as any[]
              const five = entries.filter(e => e.match_count === 5).length
              const four = entries.filter(e => e.match_count === 4).length
              const three = entries.filter(e => e.match_count === 3).length
              return (
                <tr key={d.id} className="hover:bg-brand-surface/50 transition-colors">
                  <td className="px-4 py-3 text-brand-text">{format(parseISO(d.draw_month), 'MMM yyyy')}</td>
                  <td className="px-4 py-3 text-brand-gold font-medium">€{Number(d.jackpot_amount).toFixed(0)}</td>
                  <td className="px-4 py-3 text-brand-subtext">€{Number(d.pool_4match).toFixed(0)}</td>
                  <td className="px-4 py-3 text-brand-subtext">€{Number(d.pool_3match).toFixed(0)}</td>
                  <td className="px-4 py-3 text-brand-accent font-bold">{five}</td>
                  <td className="px-4 py-3 text-brand-accent2">{four}</td>
                  <td className="px-4 py-3 text-brand-subtext">{three}</td>
                  <td className="px-4 py-3">
                    {d.jackpot_rolled ? (
                      <span className="text-yellow-400 text-xs">↻ Yes</span>
                    ) : (
                      <span className="text-brand-muted text-xs">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
            {(!draws || draws.length === 0) && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-brand-muted">No draws yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
