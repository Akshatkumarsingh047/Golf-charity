import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

async function verifyAdmin() {
  const supabase = createClient()
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
  if (authError || !authUser) return null
  const { data: dbUser } = await supabase.from('users').select('role').eq('id', authUser.id).single()
  if ((dbUser as any)?.role !== 'admin') return null
  return authUser
}

export async function GET() {
  const admin = await verifyAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = createServiceClient()
  const [
    { count: activeSubscribers }, { count: totalUsers },
    { data: contributions }, { data: config }, { data: draws },
    { count: monthlyCount }, { count: yearlyCount }, { count: pendingWinners },
  ] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('subscription_status', 'active').neq('role', 'admin'),
    supabase.from('users').select('id', { count: 'exact', head: true }),
    supabase.from('charity_contributions').select('amount, charity_id, charities(name)'),
    supabase.from('prize_pool_config').select('*').eq('id', 1).single(),
    supabase.from('draws').select('id, draw_month, jackpot_amount, jackpot_rolled, draw_entries(match_count)').eq('status', 'published').order('draw_month', { ascending: false }),
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('subscription_plan', 'monthly').eq('subscription_status', 'active'),
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('subscription_plan', 'yearly').eq('subscription_status', 'active'),
    supabase.from('winner_verifications').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
  ])

  const totalContributions = contributions?.reduce((s: number, c: any) => s + Number(c.amount), 0) ?? 0
  const poolPct = (config as any)?.pool_percentage ?? 70
  const estimatedPool = ((monthlyCount ?? 0) * ((config as any)?.monthly_price_cents ?? 999) + (yearlyCount ?? 0) * Math.round(((config as any)?.yearly_price_cents ?? 9999) / 12)) * poolPct / 100 / 100

  const charityTotals: Record<string, { name: string; total: number }> = {}
  for (const c of contributions ?? []) {
    const name = (c as any).charities?.name ?? 'Unknown'
    if (!charityTotals[(c as any).charity_id]) charityTotals[(c as any).charity_id] = { name, total: 0 }
    charityTotals[(c as any).charity_id].total += Number((c as any).amount)
  }

  const drawStats = (draws ?? []).map((d: any) => {
    const entries = d.draw_entries ?? []
    return { draw_month: d.draw_month, jackpot_amount: d.jackpot_amount, jackpot_rolled: d.jackpot_rolled, five_match: entries.filter((e: any) => e.match_count === 5).length, four_match: entries.filter((e: any) => e.match_count === 4).length, three_match: entries.filter((e: any) => e.match_count === 3).length }
  })

  return NextResponse.json({ activeSubscribers, totalUsers, totalContributions, estimatedPool, monthlyCount, yearlyCount, pendingWinners, charityTotals: Object.values(charityTotals).sort((a: any, b: any) => b.total - a.total), drawStats })
}