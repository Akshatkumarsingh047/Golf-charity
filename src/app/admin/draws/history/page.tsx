import { createServiceClient } from '@/lib/supabase/server'
import { format, parseISO } from 'date-fns'
import { Badge } from '@/components/ui'
import Link from 'next/link'

export const metadata = { title: 'Admin — Draw History' }

export default async function DrawHistoryPage() {
  const supabase = createServiceClient()

  const { data: draws } = await supabase
    .from('draws')
    .select(`
      id, draw_month, draw_type, status, winning_numbers,
      jackpot_amount, pool_4match, pool_3match, jackpot_rolled, published_at,
      draw_entries(match_count)
    `)
    .eq('status', 'published')
    .order('draw_month', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display font-semibold text-xl text-brand-text mb-1">Published Draw History</h2>
        <p className="text-brand-muted text-sm">{draws?.length ?? 0} draws published</p>
      </div>

      {(!draws || draws.length === 0) ? (
        <div className="text-center py-16 bg-brand-card border border-brand-border rounded-2xl">
          <p className="text-brand-muted">No draws published yet</p>
        </div>
      ) : (
        <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border">
                {['Month', 'Type', 'Winning Numbers', 'Jackpot', '5✓', '4✓', '3✓', 'Rolled', 'Published'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-brand-muted font-medium text-xs uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {draws.map(d => {
                const entries = (d.draw_entries ?? []) as any[]
                const five = entries.filter(e => e.match_count === 5).length
                const four = entries.filter(e => e.match_count === 4).length
                const three = entries.filter(e => e.match_count === 3).length

                return (
                  <tr key={d.id} className="hover:bg-brand-surface/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-brand-text">
                      {format(parseISO(d.draw_month), 'MMMM yyyy')}
                    </td>
                    <td className="px-4 py-3 capitalize text-brand-subtext">{d.draw_type}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5 flex-wrap">
                        {(d.winning_numbers ?? []).map((n: number, i: number) => (
                          <span key={i} className="w-7 h-7 rounded-full bg-brand-accent/20 text-brand-accent flex items-center justify-center text-xs font-bold">
                            {n}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-bold text-brand-gold">€{Number(d.jackpot_amount).toFixed(0)}</td>
                    <td className="px-4 py-3 text-brand-accent font-bold">{five || '—'}</td>
                    <td className="px-4 py-3 text-brand-accent2">{four || '—'}</td>
                    <td className="px-4 py-3 text-brand-subtext">{three || '—'}</td>
                    <td className="px-4 py-3">
                      {d.jackpot_rolled
                        ? <span className="text-yellow-400 text-xs font-medium">↻ Yes</span>
                        : <span className="text-brand-muted text-xs">—</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-brand-muted text-xs">
                      {d.published_at ? format(parseISO(d.published_at), 'dd MMM HH:mm') : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
