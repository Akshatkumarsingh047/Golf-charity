import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Trophy, Heart, Zap, ChevronRight, Star, Users, DollarSign } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PublicNav } from '@/components/ui/Nav'
import { Button, Card, SectionHeading } from '@/components/ui'

export const metadata: Metadata = {
  title: 'GolfDraw — Play Golf, Win Prizes, Fund Charity',
}

async function getFeaturedCharities() {
  const supabase = createClient()
  const { data } = await supabase
    .from('charities')
    .select('id, name, description, image_url')
    .eq('is_featured', true)
    .eq('is_active', true)
    .limit(3)
  return data ?? []
}

async function getStats() {
  const supabase = createClient()
  const [{ count: subscribers }, { data: contributions }] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('subscription_status', 'active'),
    supabase.from('charity_contributions').select('amount'),
  ])
  const totalContributed = contributions?.reduce((sum, c) => sum + Number(c.amount), 0) ?? 0
  return { subscribers: subscribers ?? 0, totalContributed }
}

export default async function HomePage() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const [charities, stats] = await Promise.all([getFeaturedCharities(), getStats()])

  return (
    <>
      <PublicNav user={session?.user ?? null} />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-20 overflow-hidden">
        {/* Ambient background blobs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand-accent/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-brand-accent2/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 bg-brand-accent/10 border border-brand-accent/20 rounded-full px-4 py-2 text-brand-accent text-sm font-medium">
            <Zap className="w-3.5 h-3.5" />
            Monthly draw now open
          </div>

          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold leading-tight text-brand-text">
            Play Golf.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent to-brand-accent2">
              Win Big.
            </span>
            {' '}Fund Good.
          </h1>

          <p className="text-brand-subtext text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Enter your Stableford scores each month to join our prize draw.
            Match 3, 4, or 5 winning numbers to win. Every subscription funds
            the charity you choose — guaranteed.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/pricing">
              <Button size="xl" className="w-full sm:w-auto text-xl font-bold px-12 py-5">
                Start Playing
                <ChevronRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="/how-it-works">
              <Button variant="secondary" size="xl" className="w-full sm:w-auto">
                How It Works
              </Button>
            </Link>
          </div>

          {/* Trust stats */}
          <div className="flex flex-wrap items-center justify-center gap-8 pt-4">
            <div className="flex items-center gap-2 text-brand-subtext text-sm">
              <Users className="w-4 h-4 text-brand-accent" />
              <span><strong className="text-brand-text">{stats.subscribers.toLocaleString()}</strong> active players</span>
            </div>
            <div className="flex items-center gap-2 text-brand-subtext text-sm">
              <Heart className="w-4 h-4 text-brand-accent" />
              <span><strong className="text-brand-text">€{stats.totalContributed.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</strong> donated to charities</span>
            </div>
            <div className="flex items-center gap-2 text-brand-subtext text-sm">
              <Trophy className="w-4 h-4 text-brand-accent" />
              <span>Monthly draws</span>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-brand-border flex items-start justify-center p-1">
            <div className="w-1 h-2.5 bg-brand-accent rounded-full" />
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <SectionHeading title="Three simple steps" subtitle="Enter your scores, enter the draw, change a life." />

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                number: '01',
                icon: <Trophy className="w-6 h-6" />,
                title: 'Log your scores',
                desc: 'Enter up to 5 Stableford scores (1–45) any time before month end. Your scores are your draw numbers.',
              },
              {
                number: '02',
                icon: <Zap className="w-6 h-6" />,
                title: 'Monthly draw',
                desc: 'Each month we draw 5 winning numbers. Match 3 to win a share of the prize pool. Match 5 and you take the jackpot.',
              },
              {
                number: '03',
                icon: <Heart className="w-6 h-6" />,
                title: 'Fund your charity',
                desc: 'At least 10% of your subscription goes directly to the charity you choose. Pick from our curated list of causes.',
              },
            ].map(step => (
              <Card key={step.number} gradient className="relative">
                <span className="absolute -top-3 -right-3 font-display text-5xl font-bold text-brand-border/60">{step.number}</span>
                <div className="w-12 h-12 rounded-xl bg-brand-accent/10 flex items-center justify-center text-brand-accent mb-4">
                  {step.icon}
                </div>
                <h3 className="font-display font-bold text-xl text-brand-text mb-2">{step.title}</h3>
                <p className="text-brand-subtext text-sm leading-relaxed">{step.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRIZE STRUCTURE ──────────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-brand-surface">
        <div className="max-w-4xl mx-auto">
          <SectionHeading title="Win on every level" subtitle="Three tiers of prizes drawn every month." />

          <div className="space-y-4">
            {[
              { match: '5 numbers', tier: 'Jackpot', pct: '40%', color: 'brand-gold', desc: 'Split equally if multiple winners. Rolls over if no winner.' },
              { match: '4 numbers', tier: 'Prize Pool', pct: '35%', color: 'brand-accent2', desc: 'Split equally among all 4-match winners.' },
              { match: '3 numbers', tier: 'Prize Pool', pct: '25%', color: 'brand-accent', desc: 'Split equally among all 3-match winners.' },
            ].map(row => (
              <div key={row.match} className="bg-brand-card border border-brand-border rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <Star className={`w-4 h-4 text-${row.color}`} />
                    <span className="font-display font-bold text-brand-text">{row.match}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full bg-${row.color}/10 text-${row.color} font-medium`}>{row.tier}</span>
                  </div>
                  <p className="text-brand-subtext text-sm">{row.desc}</p>
                </div>
                <div className={`text-3xl font-display font-bold text-${row.color}`}>{row.pct}</div>
              </div>
            ))}
          </div>

          <p className="text-center text-brand-muted text-sm mt-6">
            70% of subscription revenue goes to the prize pool. The remainder funds platform operations and charity contributions.
          </p>
        </div>
      </section>

      {/* ── FEATURED CHARITIES ───────────────────────────────────────────── */}
      {charities.length > 0 && (
        <section className="py-24 px-4">
          <div className="max-w-6xl mx-auto">
            <SectionHeading title="Causes that matter" subtitle="Choose your cause. A portion of every subscription goes directly to them." />

            <div className="grid md:grid-cols-3 gap-6 mb-10">
              {charities.map(c => (
                <Link key={c.id} href={`/charities/${c.id}`}>
                  <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden hover:border-brand-accent/40 transition-all group">
                    <div className="relative h-40 bg-brand-surface">
                      {c.image_url ? (
                        <Image src={c.image_url} alt={c.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Heart className="w-12 h-12 text-brand-border" />
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="font-display font-bold text-brand-text mb-1 group-hover:text-brand-accent transition-colors">{c.name}</h3>
                      <p className="text-brand-subtext text-sm line-clamp-2">{c.description}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="text-center">
              <Link href="/charities">
                <Button variant="outline">View All Charities</Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-accent/5 to-brand-accent2/5" />
        <div className="relative max-w-2xl mx-auto text-center space-y-6">
          <h2 className="font-display text-4xl md:text-6xl font-bold text-brand-text">
            Ready to play?
          </h2>
          <p className="text-brand-subtext text-lg">
            From €9.99/month. Cancel anytime. Every euro makes a difference.
          </p>
          <Link href="/pricing">
            <Button size="xl" className="text-xl font-bold px-12">
              Start Playing Today
              <ChevronRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-brand-border py-12 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-brand-accent rounded-lg flex items-center justify-center">
              <Trophy className="w-3.5 h-3.5 text-brand-bg" />
            </div>
            <span className="font-display font-bold text-brand-text">GolfDraw</span>
          </div>
          <div className="flex gap-6 text-brand-subtext text-sm">
            <Link href="/how-it-works" className="hover:text-brand-text">How It Works</Link>
            <Link href="/charities" className="hover:text-brand-text">Charities</Link>
            <Link href="/pricing" className="hover:text-brand-text">Pricing</Link>
            <Link href="/auth/login" className="hover:text-brand-text">Sign In</Link>
          </div>
          <p className="text-brand-muted text-xs">© {new Date().getFullYear()} GolfDraw. All rights reserved.</p>
        </div>
      </footer>
    </>
  )
}
