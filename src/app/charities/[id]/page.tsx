import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { PublicNav } from '@/components/ui/Nav'
import { Button } from '@/components/ui'
import { ExternalLink, Calendar, Heart, ArrowLeft } from 'lucide-react'
import { format, parseISO } from 'date-fns'

export const revalidate = 3600

interface Props { params: { id: string } }

export async function generateMetadata({ params }: Props) {
  const supabase = createClient()
  const { data } = await supabase.from('charities').select('name').eq('id', params.id).single()
  return { title: data?.name ?? 'Charity' }
}

export default async function CharityPage({ params }: Props) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const { data: charity } = await supabase
    .from('charities')
    .select('*')
    .eq('id', params.id)
    .eq('is_active', true)
    .single()

  if (!charity) notFound()

  // Total contributions to this charity
  const { data: contribs } = await supabase
    .from('charity_contributions')
    .select('amount')
    .eq('charity_id', params.id)

  const totalContributions = contribs?.reduce((s, c) => s + Number(c.amount), 0) ?? 0

  return (
    <>
      <PublicNav user={session?.user ?? null} />
      <main className="pt-20 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <Link href="/charities" className="inline-flex items-center gap-2 text-brand-subtext hover:text-brand-accent transition-colors text-sm mb-8">
            <ArrowLeft className="w-4 h-4" />
            Back to charities
          </Link>

          {/* Hero */}
          <div className="bg-brand-card border border-brand-border rounded-3xl overflow-hidden mb-8">
            {charity.image_url && (
              <div className="relative h-64">
                <Image src={charity.image_url} alt={charity.name} fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-card to-transparent" />
              </div>
            )}
            <div className="p-8">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h1 className="font-display text-4xl font-bold text-brand-text mb-2">{charity.name}</h1>
                  <p className="text-brand-subtext leading-relaxed max-w-2xl">{charity.description}</p>
                </div>
                <div className="flex flex-col gap-3">
                  {charity.website_url && (
                    <a href={charity.website_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="secondary" size="sm">
                        <ExternalLink className="w-4 h-4" />
                        Website
                      </Button>
                    </a>
                  )}
                  <Link href={session ? '/dashboard/charity' : '/auth/signup'}>
                    <Button size="sm">
                      <Heart className="w-4 h-4" />
                      Support This Cause
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Stats */}
              <div className="mt-8 pt-6 border-t border-brand-border">
                <div className="flex items-center gap-2 text-brand-subtext text-sm">
                  <Heart className="w-4 h-4 text-brand-accent" />
                  <span>GolfDraw members have contributed <strong className="text-brand-accent">€{totalContributions.toFixed(2)}</strong> to {charity.name}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming Events */}
          {charity.upcoming_events && charity.upcoming_events.length > 0 && (
            <div className="bg-brand-card border border-brand-border rounded-2xl p-6">
              <h2 className="font-display font-bold text-xl text-brand-text mb-5 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-accent" />
                Upcoming Events
              </h2>
              <div className="space-y-4">
                {charity.upcoming_events.map((ev, i) => (
                  <div key={i} className="flex gap-4 pb-4 border-b border-brand-border last:border-0 last:pb-0">
                    <div className="bg-brand-accent/10 text-brand-accent text-center rounded-xl p-3 shrink-0 w-16">
                      <p className="text-lg font-bold leading-none">{new Date(ev.date).getDate()}</p>
                      <p className="text-xs">{new Date(ev.date).toLocaleDateString('en-IE', { month: 'short' })}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-brand-text mb-0.5">{ev.title}</h3>
                      {ev.description && <p className="text-brand-muted text-sm">{ev.description}</p>}
                    </div>
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
