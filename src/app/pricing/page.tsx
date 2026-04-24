'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PublicNav } from '@/components/ui/Nav'
import { Button, SectionHeading } from '@/components/ui'
import { Check, Trophy, Heart, Zap } from 'lucide-react'
import toast from 'react-hot-toast'

const FEATURES = [
  'Enter the monthly prize draw',
  'Up to 5 scores stored as draw numbers',
  'Choose a charity to support',
  'Set your charity contribution % (min 10%)',
  'Winner notifications by email',
  'Prize claim dashboard',
  'Cancel anytime',
]

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubscribe(plan: 'monthly' | 'yearly') {

    
    setLoading(plan)
    try {
      const priceId = plan === 'monthly'
        ? process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID
        : process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID

      // Guard: env var not set or dev server not restarted after adding to .env.local
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

      if (res.status === 401) {
        // Not logged in — redirect to signup
        router.push(`/auth/signup?plan=${plan}`)
        return
      }

      // Always parse as JSON — our API route now guarantees JSON responses
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
      setLoading(null)
    }
  }

  return (
    <>
      <PublicNav />
      <main className="pt-20 min-h-screen">
        {/* Hero */}
        <section className="py-20 px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h1 className="font-display text-5xl md:text-7xl font-bold text-brand-text mb-4">
              Simple Pricing
            </h1>
            <p className="text-brand-subtext text-xl">
              One subscription. Monthly draws. Charity impact. No hidden fees.
            </p>
          </div>
        </section>

        {/* Plans */}
        <section className="pb-20 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Monthly */}
              <div className="bg-brand-card border border-brand-border rounded-3xl p-8">
                <h2 className="font-display font-bold text-2xl text-brand-text mb-1">Monthly</h2>
                <p className="text-brand-muted text-sm mb-6">Pay month to month, cancel anytime</p>
                <div className="mb-8">
                  <span className="font-display text-5xl font-bold text-brand-text">€9.99</span>
                  <span className="text-brand-muted">/month</span>
                </div>
                <Button size="lg" className="w-full mb-6" onClick={() => handleSubscribe('monthly')} loading={loading === 'monthly'}>
                  Start Monthly
                </Button>
                <ul className="space-y-3">
                  {FEATURES.map(f => (
                    <li key={f} className="flex items-start gap-3 text-sm text-brand-subtext">
                      <Check className="w-4 h-4 text-brand-accent shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Yearly */}
              <div className="bg-brand-card border-2 border-brand-accent rounded-3xl p-8 relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand-accent text-brand-bg text-sm font-bold px-4 py-1.5 rounded-full whitespace-nowrap">
                  🏆 Best Value — Save 17%
                </div>
                <h2 className="font-display font-bold text-2xl text-brand-text mb-1">Yearly</h2>
                <p className="text-brand-muted text-sm mb-6">12 months, one payment</p>
                <div className="mb-2">
                  <span className="font-display text-5xl font-bold text-brand-text">€99.99</span>
                  <span className="text-brand-muted">/year</span>
                </div>
                <p className="text-brand-accent text-sm mb-8">≈ €8.33/month · 2 months free</p>
                <Button size="lg" className="w-full mb-6" onClick={() => handleSubscribe('yearly')} loading={loading === 'yearly'}>
                  Start Yearly
                </Button>
                <ul className="space-y-3">
                  {FEATURES.map(f => (
                    <li key={f} className="flex items-start gap-3 text-sm text-brand-subtext">
                      <Check className="w-4 h-4 text-brand-accent shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                  <li className="flex items-start gap-3 text-sm text-brand-accent font-medium">
                    <Check className="w-4 h-4 shrink-0 mt-0.5" />
                    Priority support
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* How the money splits */}
        <section className="py-16 px-4 bg-brand-surface">
          <div className="max-w-3xl mx-auto">
            <SectionHeading title="Where your money goes" />
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: <Trophy className="w-6 h-6" />, pct: '70%', label: 'Prize Pool', desc: 'Funded monthly draws — jackpot + prize tiers' },
                { icon: <Heart className="w-6 h-6" />, pct: '10–100%', label: 'Your Charity', desc: 'You decide what percentage goes to your cause' },
                { icon: <Zap className="w-6 h-6" />, pct: 'Rest', label: 'Platform', desc: 'Keeping GolfDraw running and improving' },
              ].map(item => (
                <div key={item.label} className="bg-brand-card border border-brand-border rounded-2xl p-5 text-center">
                  <div className="w-12 h-12 rounded-xl bg-brand-accent/10 flex items-center justify-center text-brand-accent mx-auto mb-3">
                    {item.icon}
                  </div>
                  <p className="font-display font-bold text-2xl text-brand-accent mb-1">{item.pct}</p>
                  <p className="font-medium text-brand-text text-sm mb-1">{item.label}</p>
                  <p className="text-brand-muted text-xs">{item.desc}</p>
                </div>
              ))}
            </div>
            <p className="text-center text-brand-muted text-xs mt-6">
              * Charity contribution percentage is set by you (10–100%). The prize pool is fixed at 70% of subscription revenue. These percentages overlap — your charity contribution is taken from your subscription total, not in addition to the prize pool.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 px-4">
          <div className="max-w-2xl mx-auto">
            <SectionHeading title="FAQ" />
            <div className="space-y-4">
              {[
                { q: 'Can I change my plan later?', a: 'Yes. Use the Stripe Customer Portal from your billing page to switch between monthly and yearly at any time.' },
                { q: 'What if no one matches 5 numbers?', a: 'The jackpot rolls over to the following month\'s draw, growing until someone wins it.' },
                { q: 'How do I claim a prize?', a: 'You\'ll receive an email. Log in to your dashboard, upload a screenshot of your scores from your golf platform, and we\'ll verify and pay you.' },
                { q: 'Which golf score format is used?', a: 'Stableford scoring, values between 1 and 45. This is the most widely used format in recreational golf.' },
                { q: 'Can I choose any charity?', a: 'You can choose from our curated and verified charity directory. New charities are added regularly.' },
              ].map(item => (
                <div key={item.q} className="bg-brand-card border border-brand-border rounded-2xl p-5">
                  <h3 className="font-medium text-brand-text mb-2">{item.q}</h3>
                  <p className="text-brand-subtext text-sm">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  )
}