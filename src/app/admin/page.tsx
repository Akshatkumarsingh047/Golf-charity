import { createServiceClient } from '@/lib/supabase/server'
import { StatCard } from '@/components/ui'

export const metadata = { title: 'Admin — Overview' }

export default async function AdminPage() {
  const supabase = createServiceClient()

  const [
    { count: activeSubscribers },
    { count: totalUsers },
    { data: contributions },
    { data: draws },
    { data: pendingVerifications },
  ] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('subscription_status', 'active').neq('role', 'admin'),
    supabase.from('users').select('id', { count: 'exact', head: true }),
    supabase.from('charity_contributions').select('amount'),
    supabase.from('draws').select('jackpot_amount, jackpot_rolled, status, draw_month').eq('status', 'published').order('draw_month', { ascending: false }).limit(5),
    supabase.from('winner_verifications').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
  ])

  const totalContributions = contributions?.reduce((s, c) => s + Number(c.amount), 0) ?? 0
  const lastDraw = draws?.[0]
  const rolledJackpot = lastDraw?.jackpot_rolled ? (lastDraw.jackpot_amount ?? 0) : 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-brand-text mb-1">Admin Overview</h1>
        <p className="text-brand-subtext text-sm">Real-time platform metrics</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Subscribers" value={activeSubscribers ?? 0} accent />
        <StatCard label="Total Users" value={totalUsers ?? 0} />
        <StatCard label="Total Charity Contributions" value={`€${totalContributions.toFixed(2)}`} accent />
        <StatCard label="Pending Verifications" value={pendingVerifications?.length ?? 0} sub="Need review" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Rolled jackpot */}
        {rolledJackpot > 0 && (
          <div className="bg-brand-gold/10 border border-brand-gold/30 rounded-2xl p-6">
            <p className="text-brand-gold text-sm font-medium mb-1">🏆 Rolled Jackpot</p>
            <p className="font-display text-4xl font-bold text-brand-gold">€{rolledJackpot.toFixed(2)}</p>
            <p className="text-brand-muted text-xs mt-1">No 5-match winner last draw — jackpot carries forward</p>
          </div>
        )}

        {/* Recent draws */}
        <div className="bg-brand-card border border-brand-border rounded-2xl p-6">
          <h2 className="font-display font-bold text-brand-text mb-4">Recent Draws</h2>
          {draws && draws.length > 0 ? (
            <div className="space-y-3">
              {draws.map(d => (
                <div key={d.draw_month} className="flex items-center justify-between text-sm">
                  <span className="text-brand-subtext">{new Date(d.draw_month).toLocaleDateString('en-IE', { month: 'long', year: 'numeric' })}</span>
                  <span className="text-brand-text font-medium">€{Number(d.jackpot_amount).toFixed(2)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-brand-muted text-sm">No draws published yet</p>
          )}
        </div>
      </div>
    </div>
  )
}