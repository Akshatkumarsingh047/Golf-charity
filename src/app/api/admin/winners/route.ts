import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendEmail, emailTemplates } from '@/lib/email'

async function verifyAdmin() {
  const supabase = createClient()
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
  if (authError || !authUser) return null
  const { data: dbUser } = await supabase.from('users').select('role').eq('id', authUser.id).single()
  if ((dbUser as any)?.role !== 'admin') return null
  return authUser
}

export async function GET(req: NextRequest) {
  const admin = await verifyAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const supabase = createServiceClient()
  let query = supabase.from('winner_verifications').select('id, status, payout_status, proof_url, admin_notes, reviewed_at, paid_at, created_at, users!inner(email, full_name), draw_entries!inner(match_count, prize_amount, user_scores, draws!inner(draw_month, winning_numbers))').order('created_at', { ascending: false })
  if (status) query = query.eq('status', status)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ winners: data })
}

export async function PATCH(req: NextRequest) {
  const admin = await verifyAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id, action, notes } = await req.json()
  if (!id || !action) return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  const supabase = createServiceClient()
  const { data: verif } = await supabase.from('winner_verifications').select('id, user_id, status, draw_entries(prize_amount), users(email, full_name)').eq('id', id).single()
  if (!verif) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const user = verif.users as any
  const prizeAmount = (verif.draw_entries as any)?.prize_amount ?? 0
  if (action === 'approve') {
    await supabase.from('winner_verifications').update({ status: 'approved', admin_notes: notes ?? null, reviewed_at: new Date().toISOString() }).eq('id', id)
    await sendEmail({ to: user.email, subject: 'Your GolfDraw prize has been approved!', html: emailTemplates.winnerApproved(user.full_name ?? user.email, prizeAmount) })
    return NextResponse.json({ success: true })
  }
  if (action === 'reject') {
    await supabase.from('winner_verifications').update({ status: 'rejected', admin_notes: notes ?? null, reviewed_at: new Date().toISOString() }).eq('id', id)
    await sendEmail({ to: user.email, subject: 'GolfDraw — Proof not accepted', html: emailTemplates.winnerRejected(user.full_name ?? user.email, notes ?? null) })
    return NextResponse.json({ success: true })
  }
  if (action === 'mark_paid') {
    await supabase.from('winner_verifications').update({ payout_status: 'paid', paid_at: new Date().toISOString() }).eq('id', id)
    await sendEmail({ to: user.email, subject: 'Your GolfDraw prize has been paid!', html: emailTemplates.payoutPaid(user.full_name ?? user.email, prizeAmount) })
    return NextResponse.json({ success: true })
  }
  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
