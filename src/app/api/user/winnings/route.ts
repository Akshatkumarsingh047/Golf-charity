import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const service = createServiceClient()

    // Fetch draw entries with match
    const { data: entries, error: entriesError } = await service
      .from('draw_entries')
      .select(`
        id,
        match_count,
        prize_amount,
        draws ( draw_month, winning_numbers )
      `)
      .eq('user_id', user.id)
      .gte('match_count', 3)
      .order('created_at', { ascending: false })

    if (entriesError) {
      return NextResponse.json({ error: entriesError.message }, { status: 500 })
    }

    if (!entries || entries.length === 0) {
      return NextResponse.json({ wins: [] })
    }

    // Fetch winner_verifications SEPARATELY to avoid the object vs array ambiguity
    // (Supabase returns one-to-one relations as objects, not arrays)
    const entryIds = entries.map(e => e.id)
    const { data: verifications } = await service
      .from('winner_verifications')
      .select('id, draw_entry_id, status, payout_status, proof_url, admin_notes, paid_at, reviewed_at')
      .in('draw_entry_id', entryIds)

    // Map verifications by draw_entry_id for O(1) lookup
    const verifMap: Record<string, any> = {}
    for (const v of verifications ?? []) {
      verifMap[v.draw_entry_id] = v
    }

    // Merge into wins array — verification is always either an object or null (never array)
    const wins = entries.map(entry => ({
      ...entry,
      verification: verifMap[entry.id] ?? null,  // single object or null
    }))

    return NextResponse.json({ wins })
  } catch (err: any) {
    console.error('Winnings API error:', err)
    return NextResponse.json({ error: err?.message ?? 'Internal server error' }, { status: 500 })
  }
}