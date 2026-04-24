import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Trophy, Heart, Zap, ChevronRight, Users, ArrowUpRight, Target, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PublicNav } from '@/components/ui/Nav'
import { Button, SectionHeading } from '@/components/ui'

export const metadata: Metadata = {
  title: 'GolfDraw — Play Golf, Win Prizes, Fund Charity',
}

async function getFeaturedCharities() {
  const supabase = createClient()
  const { data } = await supabase.from('charities').select('id, name, description, image_url').eq('is_featured', true).eq('is_active', true).limit(3)
  return data ?? []
}

async function getStats() {
  const supabase = createClient()
  const [{ count: subscribers }, { data: contributions }] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('subscription_status', 'active').neq('role', 'admin'),
    supabase.from('charity_contributions').select('amount'),
  ])
  const totalContributed = contributions?.reduce((s, c) => s + Number(c.amount), 0) ?? 0
  return { subscribers: subscribers ?? 0, totalContributed }
}

export default async function HomePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const [charities, stats] = await Promise.all([getFeaturedCharities(), getStats()])

  return (
    <>
      <PublicNav user={user ?? null} />

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-16 overflow-hidden bg-gradient-mesh">

        {/* Animated glow orbs */}
        <div className="orb w-[700px] h-[700px] bg-brand-accent/8 top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/4" style={{ animationDuration: '10s' }} />
        <div className="orb w-[400px] h-[400px] bg-brand-accent2/10 bottom-0 left-0" style={{ animationDuration: '7s', animationDelay: '-3s' }} />
        <div className="orb w-[300px] h-[300px] bg-brand-gold/6 top-1/3 right-0" style={{ animationDuration: '9s', animationDelay: '-5s' }} />

        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(30,30,48,0.4)_1px,transparent_1px),linear-gradient(90deg,rgba(30,30,48,0.4)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black,transparent)] pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto text-center">

          {/* Pill badge */}
          <div className="anim-item inline-flex items-center gap-2 bg-brand-accent/10 border border-brand-accent/20 rounded-full px-4 py-2 text-brand-accent text-sm font-semibold mb-8 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-accent opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-accent" />
            </span>
            Monthly draw now open
          </div>

          {/* Headline */}
          <h1 className="anim-item font-display font-bold leading-[1.05] tracking-tight text-brand-text mb-6">
            <span className="block text-[clamp(3rem,10vw,7rem)]">Play Golf.</span>
            <span className="block text-[clamp(3rem,10vw,7rem)] text-transparent bg-clip-text bg-gradient-to-r from-brand-accent via-[#c8ff7a] to-brand-accent2">
              Win Big.
            </span>
            <span className="block text-[clamp(3rem,10vw,7rem)]">Fund Good.</span>
          </h1>

          {/* Subtext */}
          <p className="anim-item text-brand-subtext text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10">
            Enter your Stableford scores every month. Match 3, 4, or 5 draw numbers to win.
            <span className="text-brand-text font-medium"> Every subscription funds your chosen charity — guaranteed.</span>
          </p>

          {/* CTAs */}
          <div className="anim-item flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/pricing">
              <Button size="xl" className="w-full sm:w-auto font-bold glow-accent text-lg tracking-tight">
                Start Playing
                <ChevronRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="/how-it-works">
              <Button variant="secondary" size="xl" className="w-full sm:w-auto">
                See How It Works
              </Button>
            </Link>
          </div>

          {/* Trust bar */}
          <div className="anim-item flex flex-wrap items-center justify-center gap-8">
            <div className="flex items-center gap-2.5 text-brand-subtext text-sm">
              <div className="w-7 h-7 rounded-lg bg-brand-accent/15 flex items-center justify-center">
                <Users className="w-3.5 h-3.5 text-brand-accent" />
              </div>
              <span><strong className="text-brand-text font-semibold">{stats.subscribers.toLocaleString()}</strong> active players</span>
            </div>
            <div className="w-px h-5 bg-brand-border hidden sm:block" />
            <div className="flex items-center gap-2.5 text-brand-subtext text-sm">
              <div className="w-7 h-7 rounded-lg bg-brand-accent/15 flex items-center justify-center">
                <Heart className="w-3.5 h-3.5 text-brand-accent" />
              </div>
              <span><strong className="text-brand-text font-semibold">€{stats.totalContributed.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong> donated</span>
            </div>
            <div className="w-px h-5 bg-brand-border hidden sm:block" />
            <div className="flex items-center gap-2.5 text-brand-subtext text-sm">
              <div className="w-7 h-7 rounded-lg bg-brand-accent/15 flex items-center justify-center">
                <Trophy className="w-3.5 h-3.5 text-brand-accent" />
              </div>
              <span>Monthly draws</span>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40 animate-bounce">
          <div className="w-5 h-8 rounded-full border border-brand-border flex items-start justify-center p-1">
            <div className="w-1 h-2 bg-brand-subtext rounded-full" />
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <section className="py-28 px-4 relative">
        <div className="max-w-6xl mx-auto">
          <SectionHeading title="Three simple steps" subtitle="Enter your scores. Enter the draw. Change a life." />

          <div className="grid md:grid-cols-3 gap-5">
            {[
              { n:'01', icon:<Target className="w-5 h-5"/>, title:'Log your scores', desc:'Enter up to 5 Stableford scores (1–45) at any time during the month. Your scores become your draw numbers.', color:'brand-accent' },
              { n:'02', icon:<Zap className="w-5 h-5"/>,    title:'Monthly draw',  desc:'Each month we draw 5 winning numbers. Match 3 to win a prize. Match all 5 and you take the jackpot.',           color:'brand-accent2' },
              { n:'03', icon:<Heart className="w-5 h-5"/>,  title:'Fund charity',  desc:'At least 10% of your subscription goes directly to your chosen charity every single billing cycle.',             color:'brand-gold' },
            ].map((s, i) => (
              <div key={s.n} className="anim-item group  relative bg-brand-card border border-brand-border rounded-2xl p-7 hover:border-brand-border-hi transition-all duration-300 hover:-translate-y-1 hover:shadow-card-lg overflow-hidden">
                {/* Background number watermark */}
                <span className={`absolute top-2 right-4 font-display text-6xl  font-bold text-${s.color}/5 select-none pointer-events-none`}>{s.n}</span>
                <div className={`w-11 h-11 rounded-xl bg-${s.color}/10 flex items-center justify-center text-${s.color} mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  {s.icon}
                </div>
                <h3 className="font-display font-bold text-xl text-brand-text mb-2 tracking-tight">{s.title}</h3>
                <p className="text-brand-subtext text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRIZE TIERS ───────────────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-brand-surface relative overflow-hidden">
        <div className="orb w-[500px] h-[500px] bg-brand-gold/5 top-0 right-0 pointer-events-none" />
        <div className="max-w-4xl mx-auto relative z-10">
          <SectionHeading title="Win on every level" subtitle="Three prize tiers drawn every single month." />
          <div className="space-y-4">
            {[
              { match:'5 numbers', tier:'Jackpot',    pct:'40%', note:'Rolls over monthly until won', col:'from-brand-gold/20 to-brand-gold/5', text:'text-brand-gold',   border:'border-brand-gold/20' },
              { match:'4 numbers', tier:'4-Match Pool', pct:'35%', note:'Split among all 4-match winners', col:'from-brand-accent2/20 to-brand-accent2/5', text:'text-brand-accent2', border:'border-brand-accent2/20' },
              { match:'3 numbers', tier:'3-Match Pool', pct:'25%', note:'Split among all 3-match winners', col:'from-brand-accent/20 to-brand-accent/5', text:'text-brand-accent', border:'border-brand-accent/20' },
            ].map((row, i) => (
              <div key={row.match} className={`anim-item flex items-center gap-6 bg-gradient-to-r ${row.col} border ${row.border} rounded-2xl px-7 py-5 group hover:scale-[1.01] transition-transform duration-200`}>
                <div className={`text-4xl font-display font-bold ${row.text} w-16 shrink-0`}>{row.pct}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-display font-bold text-brand-text">{row.match}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full bg-black/20 ${row.text} font-semibold`}>{row.tier}</span>
                  </div>
                  <p className="text-brand-subtext text-sm">{row.note}</p>
                </div>
                <ArrowUpRight className={`w-4 h-4 ${row.text} opacity-0 group-hover:opacity-100 transition-opacity`} />
              </div>
            ))}
          </div>
          <p className="text-center text-brand-muted text-sm mt-7">70% of all subscription revenue goes directly into the prize pool.</p>
        </div>
      </section>

      {/* ── CHARITIES ─────────────────────────────────────────────────────── */}
      {charities.length > 0 && (
        <section className="py-28 px-4">
          <div className="max-w-6xl mx-auto">
            <SectionHeading title="Causes that matter" subtitle="Choose your cause. A share of every subscription goes directly to them every month." />
            <div className="grid md:grid-cols-3 gap-6 mb-10">
              {charities.map(c => (
                <Link key={c.id} href={`/charities/${c.id}`} className="charity-card group block bg-brand-card border border-brand-border rounded-2xl overflow-hidden">
                  <div className="relative h-44 bg-brand-surface">
                    {c.image_url ? (
                      <Image src={c.image_url} alt={c.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-brand-accent/10 to-brand-accent2/10 flex items-center justify-center">
                        <Heart className="w-14 h-14 text-brand-border" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-card/80 to-transparent" />
                  </div>
                  <div className="p-5">
                    <h3 className="font-display font-bold text-brand-text mb-1.5 group-hover:text-brand-accent transition-colors tracking-tight">{c.name}</h3>
                    <p className="text-brand-subtext text-sm line-clamp-2 leading-relaxed">{c.description}</p>
                    <div className="flex items-center gap-1 mt-3 text-brand-accent text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                      Learn more <ArrowUpRight className="w-3 h-3" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="text-center">
              <Link href="/charities">
                <Button variant="outline" size="md">View All Charities</Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── FINAL CTA ─────────────────────────────────────────────────────── */}
      <section className="py-28 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-accent/5 via-transparent to-brand-accent2/5" />
        <div className="orb w-[600px] h-[600px] bg-brand-accent/6 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        <div className="relative max-w-2xl mx-auto text-center space-y-7">
          <div className="inline-flex items-center gap-2 text-brand-gold text-sm font-semibold bg-brand-gold/10 border border-brand-gold/20 rounded-full px-4 py-2">
            <Sparkles className="w-4 h-4" />
            From €9.99/month
          </div>
          <h2 className="font-display text-5xl md:text-6xl font-bold text-brand-text tracking-tight leading-tight">
            Ready to play?
          </h2>
          <p className="text-brand-subtext text-lg leading-relaxed">
            Join golfers who play, win, and give back every single month.
          </p>
          <Link href="/pricing">
            <Button size="xl" className="font-bold glow-accent text-lg">
              Start Playing Today
              <ChevronRight className="w-5 h-5" />
            </Button>
          </Link>
          <p className="text-brand-muted text-sm">Cancel anytime · No lock-in · Instant access</p>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-brand-border py-10 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-brand-accent rounded-lg flex items-center justify-center">
              <Trophy className="w-3.5 h-3.5 text-brand-bg" strokeWidth={2.5} />
            </div>
            <span className="font-display font-bold text-brand-text tracking-tight">GolfDraw</span>
          </div>
          <div className="flex gap-6 text-brand-subtext text-sm">
            {[['How It Works','/how-it-works'],['Charities','/charities'],['Pricing','/pricing'],['Sign In','/auth/login']].map(([l,h]) => (
              <Link key={h} href={h} className="underline-anim hover:text-brand-text transition-colors">{l}</Link>
            ))}
          </div>
          <p className="text-brand-muted text-xs">© {new Date().getFullYear()} GolfDraw. All rights reserved.</p>
        </div>
      </footer>
    </>
  )
}