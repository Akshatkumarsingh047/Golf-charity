import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  // Step 1 — log every env var related to Stripe so we can see what's missing
  const envCheck = {
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? '✓ set (' + process.env.STRIPE_SECRET_KEY.slice(0, 7) + '...)' : '✗ MISSING',
    STRIPE_MONTHLY_PRICE_ID: process.env.STRIPE_MONTHLY_PRICE_ID ?? '✗ MISSING',
    STRIPE_YEARLY_PRICE_ID: process.env.STRIPE_YEARLY_PRICE_ID ?? '✗ MISSING',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? '✗ MISSING',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ set' : '✗ MISSING',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓ set' : '✗ MISSING',
  }
  console.log('[checkout] env check:', envCheck)

  try {
    // Step 2 — parse body
    let body: { priceId?: string } = {}
    try { body = await req.json() } catch (e) {
      return NextResponse.json({ error: 'Could not parse request body', detail: String(e) }, { status: 400 })
    }
    const { priceId } = body
    console.log('[checkout] received priceId:', priceId)

    // Step 3 — check priceId
    if (!priceId || priceId === 'undefined') {
      return NextResponse.json({ error: 'priceId is missing. Make sure NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID is in .env.local and you restarted the server.', envCheck }, { status: 400 })
    }

    // Step 4 — check Stripe env vars
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'STRIPE_SECRET_KEY is not set in .env.local', envCheck }, { status: 500 })
    }
    if (!process.env.STRIPE_MONTHLY_PRICE_ID || !process.env.STRIPE_YEARLY_PRICE_ID) {
      return NextResponse.json({ error: 'STRIPE_MONTHLY_PRICE_ID or STRIPE_YEARLY_PRICE_ID is not set in .env.local', envCheck }, { status: 500 })
    }

    // Step 5 — validate price ID matches
    const monthlyId = process.env.STRIPE_MONTHLY_PRICE_ID
    const yearlyId = process.env.STRIPE_YEARLY_PRICE_ID
    if (![monthlyId, yearlyId].includes(priceId)) {
      return NextResponse.json({ error: 'priceId "' + priceId + '" does not match either price ID on the server. Check that NEXT_PUBLIC_ values match the server values in .env.local.', envCheck }, { status: 400 })
    }

    // Step 6 — import Stripe lazily to catch module load errors
    let stripe: any
    try {
      const stripeModule = await import('stripe')
      const Stripe = stripeModule.default
      stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' as any })
    } catch (e: any) {
      return NextResponse.json({ error: 'Failed to load Stripe: ' + e.message, envCheck }, { status: 500 })
    }

    // Step 7 — check auth
    let authUser: any = null
    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = createClient()
      const { data, error } = await supabase.auth.getUser()
      if (error || !data.user) {
        return NextResponse.json({ error: 'Not logged in. Please sign in first.', detail: error?.message }, { status: 401 })
      }
      authUser = data.user
    } catch (e: any) {
      return NextResponse.json({ error: 'Supabase auth error: ' + e.message, envCheck }, { status: 500 })
    }

    // Step 8 — get stripe customer ID from DB
    let customerId: string | undefined
    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = createClient()
      // Block admin accounts from subscribing — they are operators, not players
    const { data: dbUser } = await supabase
      .from('users')
      .select('stripe_customer_id, role')
      .eq('id', authUser.id)
      .single()

    if ((dbUser as any)?.role === 'admin') {
      return NextResponse.json(
        { error: 'Admin accounts cannot subscribe. Admins are platform operators, not players.' },
        { status: 403 }
      )
    }
      customerId = dbUser?.stripe_customer_id ?? undefined
    } catch (e) { /* non-fatal */ }

    // Step 9 — create Stripe checkout session
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const sessionParams: any = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: appUrl + '/dashboard/billing?success=1',
      cancel_url: appUrl + '/pricing?cancelled=1',
      metadata: { userId: authUser.id },
      subscription_data: { metadata: { userId: authUser.id } },
    }
    if (customerId) { sessionParams.customer = customerId }
    else { sessionParams.customer_email = authUser.email }

    let checkoutSession: any
    try {
      checkoutSession = await stripe.checkout.sessions.create(sessionParams)
    } catch (e: any) {
      console.error('[checkout] Stripe API error:', e)
      return NextResponse.json({ error: 'Stripe API error: ' + e.message, type: e.type, code: e.code }, { status: 500 })
    }

    if (!checkoutSession.url) {
      return NextResponse.json({ error: 'Stripe returned no URL', session: checkoutSession }, { status: 500 })
    }

    return NextResponse.json({ url: checkoutSession.url })

  } catch (err: any) {
    console.error('[checkout] unhandled error:', err)
    return NextResponse.json({ error: 'Unhandled error: ' + (err?.message ?? String(err)), stack: err?.stack?.split('\n').slice(0, 5) }, { status: 500 })
  }
}