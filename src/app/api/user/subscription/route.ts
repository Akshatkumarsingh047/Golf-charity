import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
  if (authError || !authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: dbUser } = await supabase
    .from('users')
    .select('subscription_status, subscription_end, subscription_plan, stripe_customer_id')
    .eq('id', authUser.id)
    .single()

  if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const now = new Date()
  if (dbUser.subscription_status === 'active' && dbUser.subscription_end && new Date(dbUser.subscription_end) < now && dbUser.stripe_customer_id) {
    try {
      const subs = await stripe.subscriptions.list({ customer: dbUser.stripe_customer_id, status: 'active', limit: 1 })
      const service = createServiceClient()
      if (subs.data.length > 0) {
        const sub = subs.data[0]
        const newEnd = new Date(sub.current_period_end * 1000).toISOString()
        await service.from('users').update({ subscription_end: newEnd, updated_at: new Date().toISOString() }).eq('id', authUser.id)
        return NextResponse.json({ ...dbUser, subscription_end: newEnd, synced: true })
      } else {
        await service.from('users').update({ subscription_status: 'lapsed', updated_at: new Date().toISOString() }).eq('id', authUser.id)
        return NextResponse.json({ ...dbUser, subscription_status: 'lapsed', synced: true })
      }
    } catch (err) { console.error('Stripe sync error:', err) }
  }

  return NextResponse.json(dbUser)
}
