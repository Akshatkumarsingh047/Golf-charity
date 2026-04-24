import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { simulateDraw, publishDraw } from '@/features/draws/engine'
import type { DrawType } from '@/types'

async function verifyAdmin() {
  const supabase = createClient()
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
  if (authError || !authUser) return null
  const { data: dbUser } = await supabase.from('users').select('role').eq('id', authUser.id).single()
  if ((dbUser as any)?.role !== 'admin') return null
  return authUser
}

export async function POST(req: NextRequest) {
  const admin = await verifyAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { action, drawType, drawMonth } = await req.json()
  if (!['random', 'algorithmic'].includes(drawType)) return NextResponse.json({ error: 'Invalid draw type' }, { status: 400 })
  try {
    if (action === 'simulate') {
      const result = await simulateDraw(drawType as DrawType)
      return NextResponse.json({ simulation: result })
    }
    if (action === 'publish') {
      if (!drawMonth) return NextResponse.json({ error: 'drawMonth required' }, { status: 400 })
      const result = await publishDraw(drawType as DrawType, drawMonth)
      return NextResponse.json({ drawId: result.drawId, success: true })
    }
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET() {
  const admin = await verifyAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const supabase = createServiceClient()
  const { data, error } = await supabase.from('draws').select('id, draw_month, draw_type, status, winning_numbers, jackpot_amount, pool_4match, pool_3match, jackpot_rolled, published_at, draw_entries(count)').order('draw_month', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ draws: data })
}
