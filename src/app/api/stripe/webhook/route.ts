import { NextRequest, NextResponse } from 'next/server'
import { constructWebhookEvent, stripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import { sendEmail, emailTemplates } from '@/lib/email'
import type Stripe from 'stripe'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = constructWebhookEvent(body, sig)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createServiceClient()

  try {
    switch (event.type) {
      // ── Subscription activated ───────────────────────────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== 'subscription') break

        const userId = session.metadata?.userId
        if (!userId) break

        const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
        const plan = subscription.items.data[0].plan.interval === 'year' ? 'yearly' : 'monthly'
        const endDate = new Date(subscription.current_period_end * 1000).toISOString()

        await supabase.from('users').update({
          stripe_customer_id: session.customer as string,
          subscription_status: 'active',
          subscription_plan: plan,
          subscription_end: endDate,
          updated_at: new Date().toISOString(),
        }).eq('id', userId)

        // Send activation email
        const { data: user } = await supabase.from('users').select('email, full_name').eq('id', userId).single()
        if (user) {
          await sendEmail({
            to: user.email,
            subject: 'Welcome to GolfDraw — Your subscription is active!',
            html: emailTemplates.subscriptionActivated(user.full_name ?? user.email),
          })
        }
        break
      }

      // ── Invoice paid (renewal) ───────────────────────────────────────────────
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        if (invoice.billing_reason === 'subscription_create') break // handled above

        const customerId = invoice.customer as string
        const { data: user } = await supabase
          .from('users')
          .select('id, email, full_name, charity_id, charity_percentage')
          .eq('stripe_customer_id', customerId)
          .single()

        if (!user) break

        const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
        const endDate = new Date(subscription.current_period_end * 1000).toISOString()
        const plan = subscription.items.data[0].plan.interval === 'year' ? 'yearly' : 'monthly'

        await supabase.from('users').update({
          subscription_status: 'active',
          subscription_plan: plan,
          subscription_end: endDate,
          updated_at: new Date().toISOString(),
        }).eq('id', user.id)

        // Record charity contribution
        if (user.charity_id) {
          const amountPaid = invoice.amount_paid // in cents
          const charityAmount = (amountPaid * user.charity_percentage) / 100 / 100 // convert to euros

          await supabase.from('charity_contributions').insert({
            user_id: user.id,
            charity_id: user.charity_id,
            amount: charityAmount,
            contribution_type: 'subscription',
            stripe_payment_id: invoice.payment_intent as string,
          })
        }
        break
      }

      // ── Payment failed ───────────────────────────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        const { data: user } = await supabase
          .from('users')
          .select('id, email, full_name')
          .eq('stripe_customer_id', customerId)
          .single()

        if (!user) break

        await supabase.from('users').update({
          subscription_status: 'lapsed',
          updated_at: new Date().toISOString(),
        }).eq('id', user.id)

        await sendEmail({
          to: user.email,
          subject: 'GolfDraw — Payment failed',
          html: emailTemplates.paymentFailed(user.full_name ?? user.email),
        })
        break
      }

      // ── Subscription cancelled ───────────────────────────────────────────────
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        await supabase.from('users').update({
          subscription_status: 'cancelled',
          updated_at: new Date().toISOString(),
        }).eq('stripe_customer_id', customerId)
        break
      }

      default:
        break
    }
  } catch (err) {
    console.error('Webhook handler error:', err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
