'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { CreditCard, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react'
import { DashboardNav } from '@/components/ui/Nav'
import { Badge, Card, Button } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

interface UserData {
  subscription_status: string
  subscription_plan: string | null
  subscription_end: string | null
  stripe_customer_id: string | null
}

export default function BillingPage() {
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [portalLoading, setPortalLoading] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const supabase = createClient()
  const params = useSearchParams()
  const showSuccess = params.get('success') === '1'
  const showReactivate = params.get('reactivate') === '1'

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const { data } = await supabase
        .from('users')
        .select('subscription_status, subscription_plan, subscription_end, stripe_customer_id')
        .eq('id', session.user.id)
        .single()
      setUser(data)
      setLoading(false)
    }
    load()
  }, [])

  async function handlePortal() {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      window.location.href = data.url
    } catch (err: any) {
      toast.error(err.message ?? 'Could not open billing portal')
    } finally {
      setPortalLoading(false)
    }
  }

  async function handleSubscribe(plan: 'monthly' | 'yearly') {
    setCheckoutLoading(plan)
    try {
      const priceId = plan === 'monthly'
        ? process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID
        : process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID

      if (!priceId) {
        toast.error(
          `Stripe price ID not found. Make sure NEXT_PUBLIC_STRIPE_${plan.toUpperCase()}_PRICE_ID is in your .env.local and you restarted the dev server.`
        )
        return
      }

      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      })

      let data: { url?: string; error?: string }
      try {
        data = await res.json()
        
      } catch {
        throw new Error('Server returned an unexpected response. Check your browser console and server logs.')
      }

      if (!res.ok) throw new Error(data.error ?? `Request failed with status ${res.status}`)
      if (!data.url) throw new Error('No checkout URL returned')
      window.location.href = data.url
    } catch (err: any) {
      toast.error(err.message ?? 'Could not start checkout')
    } finally {
      setCheckoutLoading(null)
    }
  }

  const isActive = user?.subscription_status === 'active'

  if (loading) return (
    <>
      <DashboardNav />
      <main className="pt-20 min-h-screen flex items-center justify-center">
        <div className="text-brand-muted">Loading...</div>
      </main>
    </>
  )

  return (
    <>
      <DashboardNav />
      <main className="pt-20 min-h-screen">
        <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
          <div>
            <h1 className="font-display font-bold text-3xl text-brand-text mb-2">Billing</h1>
            <p className="text-brand-subtext">Manage your subscription and payment details</p>
          </div>

          {showSuccess && (
            <div className="flex items-center gap-3 bg-brand-accent/10 border border-brand-accent/30 rounded-2xl p-4">
              <CheckCircle className="w-5 h-5 text-brand-accent shrink-0" />
              <p className="text-brand-accent font-medium">Subscription activated! You're all set to play.</p>
            </div>
          )}

          {showReactivate && !isActive && (
            <div className="flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4">
              <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0" />
              <p className="text-yellow-300">Your subscription has lapsed. Choose a plan below to reactivate.</p>
            </div>
          )}

          {/* Current status */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-brand-text">Subscription Status</h2>
              <Badge label={user?.subscription_status ?? 'unknown'} variant={user?.subscription_status as any} />
            </div>

            {isActive && user?.subscription_plan && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-brand-muted">Plan</span>
                  <span className="text-brand-text capitalize font-medium">{user.subscription_plan}</span>
                </div>
                {user.subscription_end && (
                  <div className="flex justify-between">
                    <span className="text-brand-muted">Next renewal</span>
                    <span className="text-brand-text">{new Date(user.subscription_end).toLocaleDateString('en-IE', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                )}
              </div>
            )}

            {isActive && user?.stripe_customer_id && (
              <div className="mt-5 pt-5 border-t border-brand-border">
                <Button variant="secondary" size="md" onClick={handlePortal} loading={portalLoading}>
                  <CreditCard className="w-4 h-4" />
                  Manage Subscription
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>
                <p className="text-brand-muted text-xs mt-2">Change plan, update payment method, or cancel — via Stripe's secure portal</p>
              </div>
            )}
          </Card>

          {/* Plans (shown when not active) */}
          {!isActive && (
            <div className="space-y-4">
              <h2 className="font-display font-semibold text-brand-text">Choose a Plan</h2>

              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { plan: 'monthly' as const, price: '€9.99', period: '/month', tag: null },
                  { plan: 'yearly' as const, price: '€99.99', period: '/year', tag: 'Save 17%' },
                ].map(opt => (
                  <div key={opt.plan} className="bg-brand-card border border-brand-border rounded-2xl p-6 relative">
                    {opt.tag && (
                      <span className="absolute -top-3 right-4 bg-brand-accent text-brand-bg text-xs font-bold px-3 py-1 rounded-full">{opt.tag}</span>
                    )}
                    <h3 className="font-display font-semibold text-brand-text capitalize mb-1">{opt.plan}</h3>
                    <p className="font-display text-3xl font-bold text-brand-text mb-1">{opt.price}<span className="text-brand-muted text-base font-normal">{opt.period}</span></p>
                    <p className="text-brand-muted text-xs mb-5">70% to prize pool · 10%+ to charity · Cancel anytime</p>
                    <Button
                      size="md"
                      className="w-full"
                      onClick={() => handleSubscribe(opt.plan)}
                      loading={checkoutLoading === opt.plan}
                    >
                      Subscribe {opt.plan}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  )
}