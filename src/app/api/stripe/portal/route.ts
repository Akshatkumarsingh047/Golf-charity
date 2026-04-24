import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createPortalSession } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    if (authError || !authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: dbUser } = await supabase.from('users').select('stripe_customer_id').eq('id', authUser.id).single()
    if (!dbUser?.stripe_customer_id) return NextResponse.json({ error: 'No billing account found' }, { status: 404 })

    const portalSession = await createPortalSession(dbUser.stripe_customer_id)
    return NextResponse.json({ url: portalSession.url })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
