'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { createCheckoutSession, createPortalSession } from '@/lib/stripe'

async function getPlayerUser() {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/auth/login')

  const { data: dbUser } = await supabase
    .from('users')
    .select('role, stripe_customer_id')
    .eq('id', user!.id)
    .single()

  if ((dbUser as any)?.role === 'admin') {
    throw new Error('Admin accounts cannot subscribe. Admins are not players.')
  }

  return { user: user!, dbUser }
}

export async function startCheckout(priceId: string) {
  const { user, dbUser } = await getPlayerUser()

  const validPriceIds = [
    process.env.STRIPE_MONTHLY_PRICE_ID,
    process.env.STRIPE_YEARLY_PRICE_ID,
  ]
  if (!validPriceIds.includes(priceId)) throw new Error('Invalid price ID')

  const session = await createCheckoutSession({
    userId: user.id,
    userEmail: user.email!,
    priceId,
    customerId: (dbUser as any)?.stripe_customer_id,
  })
  if (session.url) redirect(session.url)
}

export async function openPortal() {
  const { dbUser } = await getPlayerUser()

  if (!(dbUser as any)?.stripe_customer_id) {
    throw new Error('No billing account found')
  }

  const portalSession = await createPortalSession((dbUser as any).stripe_customer_id)
  if (portalSession.url) redirect(portalSession.url)
}