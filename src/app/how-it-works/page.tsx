import { createClient } from '@/lib/supabase/server'
import { PublicNav } from '@/components/ui/Nav'
import { SectionHeading, Card } from '@/components/ui'
import Link from 'next/link'
import { Button } from '@/components/ui'
import { Hash, Trophy, Heart, Zap, CheckCircle, ArrowRight } from 'lucide-react'

export const metadata = { title: 'How It Works' }

export default async function HowItWorksPage() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  return (
    <>
      <PublicNav user={session?.user ?? null} />
      <main className="pt-20 min-h-screen">
        {/* Hero */}
        <section className="py-20 px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="font-display text-5xl md:text-7xl font-bold text-brand-text mb-4">
              How GolfDraw Works
            </h1>
            <p className="text-brand-subtext text-xl leading-relaxed">
              A monthly prize draw powered by your Stableford scores.
              No lottery tickets. No luck. Just your game.
            </p>
          </div>
        </section>

        {/* Steps */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto space-y-6">
            {[
              {
                n: '01', icon: <Hash className="w-6 h-6" />, color: 'brand-accent',
                title: 'Subscribe & Choose Your Charity',
                body: 'Pick a monthly or yearly plan. Select from our curated list of charities. Set your contribution percentage — minimum 10%, up to 100%. You can change both at any time.',
              },
              {
                n: '02', icon: <Trophy className="w-6 h-6" />, color: 'brand-accent2',
                title: 'Log Your Stableford Scores',
                body: 'Add up to 5 Stableford scores (1–45) at any time during the month. Each score must have a unique date. These scores become your personal draw numbers. Adding a 6th score automatically removes your oldest one.',
              },
              {
                n: '03', icon: <Zap className="w-6 h-6" />, color: 'brand-gold',
                title: 'Monthly Draw',
                body: 'At the end of each month, our engine draws 5 winning numbers. We offer two draw types: fully random, or algorithmically weighted by the most popular scores entered that month.',
              },
              {
                n: '04', icon: <CheckCircle className="w-6 h-6" />, color: 'brand-accent',
                title: 'Match Numbers to Win',
                body: 'We count how many of your 5 scores match the 5 winning numbers. Match 3 to win a share of the 3-match prize pool. Match 4 for a bigger share. Match all 5 to win (or share) the jackpot!',
              },
              {
                n: '05', icon: <Heart className="w-6 h-6" />, color: 'brand-accent',
                title: 'Your Charity Gets Paid',
                body: 'Every month, a percentage of every subscriber\'s payment goes directly to their chosen charity. No manual action required — it\'s automatic with every billing cycle.',
              },
            ].map((step, i) => (
              <div key={step.n} className="flex gap-6 items-start">
                <div className={`w-14 h-14 rounded-2xl bg-${step.color}/10 flex items-center justify-center text-${step.color} shrink-0`}>
                  {step.icon}
                </div>
                <div className="flex-1 pb-6 border-b border-brand-border last:border-0">
                  <div className="flex items-baseline gap-3 mb-2">
                    <span className="text-brand-border font-display text-lg font-bold">{step.n}</span>
                    <h2 className="font-display font-bold text-xl text-brand-text">{step.title}</h2>
                  </div>
                  <p className="text-brand-subtext leading-relaxed">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Prize structure */}
        <section className="py-16 px-4 bg-brand-surface">
          <div className="max-w-3xl mx-auto">
            <SectionHeading title="Prize Pool Breakdown" subtitle="70% of all subscription revenue goes directly to prizes." />
            <div className="space-y-3">
              {[
                { match: '5 numbers', label: 'Jackpot', pct: '40%', note: 'Rolls over if no winner', color: 'brand-gold' },
                { match: '4 numbers', label: '4-Match Pool', pct: '35%', note: 'Split among all 4-match winners', color: 'brand-accent2' },
                { match: '3 numbers', label: '3-Match Pool', pct: '25%', note: 'Split among all 3-match winners', color: 'brand-accent' },
              ].map(row => (
                <div key={row.match} className="flex items-center gap-4 bg-brand-card border border-brand-border rounded-2xl p-5">
                  <div className={`text-2xl font-display font-bold text-${row.color} w-14 text-right shrink-0`}>{row.pct}</div>
                  <div className="flex-1">
                    <p className="font-medium text-brand-text">{row.match} matched → <span className={`text-${row.color}`}>{row.label}</span></p>
                    <p className="text-brand-muted text-sm">{row.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Winner verification */}
        <section className="py-16 px-4">
          <div className="max-w-3xl mx-auto">
            <SectionHeading title="Claiming Your Prize" subtitle="A simple verification step to keep everything fair." />
            <div className="bg-brand-card border border-brand-border rounded-2xl p-8 space-y-4">
              {[
                'You\'re notified by email if you matched 3 or more numbers',
                'Log in to your dashboard and upload a screenshot of your scores from your golf app or platform',
                'Our team reviews your proof (usually within 24 hours)',
                'Once approved, your prize is paid out and you receive confirmation',
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-brand-accent flex items-center justify-center text-brand-bg text-xs font-bold shrink-0 mt-0.5">{i + 1}</div>
                  <p className="text-brand-subtext">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-4 text-center">
          <div className="max-w-xl mx-auto space-y-6">
            <h2 className="font-display text-4xl font-bold text-brand-text">Ready to play?</h2>
            <p className="text-brand-subtext">From €9.99/month. Your scores. Your draw. Your cause.</p>
            <Link href="/pricing">
              <Button size="xl">
                See Pricing
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </section>
      </main>
    </>
  )
}
