import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { PublicNav } from '@/components/ui/Nav'
import { SectionHeading } from '@/components/ui'
import Link from 'next/link'
import Image from 'next/image'
import { Heart, Search, ExternalLink, Calendar } from 'lucide-react'
import type { Charity } from '@/types'

export const revalidate = 3600 // ISR: 1 hour

export const metadata = { title: 'Charity Directory' }

async function getCharities() {
  const supabase = createClient()
  const { data } = await supabase
    .from('charities')
    .select('id, name, description, image_url, website_url, is_featured, upcoming_events')
    .eq('is_active', true)
    .order('is_featured', { ascending: false })
    .order('name')
  return data ?? []
}

export default async function CharitiesPage({
  searchParams,
}: {
  searchParams: { q?: string }
}) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const allCharities = await getCharities()
  const q = searchParams.q?.toLowerCase() ?? ''

  const charities = q
    ? allCharities.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q)
      )
    : allCharities

  const featured = charities.filter(c => c.is_featured)
  const rest = charities.filter(c => !c.is_featured)

  return (
    <>
      <PublicNav user={session?.user ?? null} />
      <main className="pt-20 min-h-screen">
        {/* Header */}
        <section className="py-16 px-4 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-brand-accent/5 to-transparent pointer-events-none" />
          <div className="relative max-w-2xl mx-auto">
            <h1 className="font-display text-5xl font-bold text-brand-text mb-4">Charity Directory</h1>
            <p className="text-brand-subtext text-lg mb-8">Every subscription supports a cause you believe in. Choose yours.</p>

            {/* Search */}
            <form method="get" className="relative max-w-md mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
              <input
                type="text"
                name="q"
                defaultValue={searchParams.q}
                placeholder="Search charities..."
                className="w-full bg-brand-card border border-brand-border rounded-full pl-11 pr-4 py-3 text-brand-text placeholder:text-brand-muted focus:outline-none focus:border-brand-accent text-sm"
              />
            </form>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-4 pb-20 space-y-12">
          {/* Featured */}
          {featured.length > 0 && !q && (
            <div>
              <h2 className="font-display font-bold text-2xl text-brand-text mb-6">
                ⭐ Featured Charities
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                {featured.map(c => <CharityCard key={c.id} charity={c} />)}
              </div>
            </div>
          )}

          {/* All */}
          <div>
            {!q && <h2 className="font-display font-bold text-2xl text-brand-text mb-6">All Charities ({rest.length})</h2>}
            {q && <p className="text-brand-subtext mb-6">{charities.length} result{charities.length !== 1 ? 's' : ''} for "{searchParams.q}"</p>}

            {charities.length === 0 ? (
              <div className="text-center py-16">
                <Heart className="w-12 h-12 text-brand-muted mx-auto mb-3" />
                <p className="text-brand-subtext">No charities found matching your search</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {(q ? charities : rest).map(c => <CharityCard key={c.id} charity={c} />)}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  )
}

function CharityCard({ charity: c }: { charity: Charity }) {
  return (
    <Link href={`/charities/${c.id}`} className="group block bg-brand-card border border-brand-border rounded-2xl overflow-hidden hover:border-brand-accent/40 transition-all">
      <div className="relative h-40 bg-brand-surface">
        {c.image_url ? (
          <Image src={c.image_url} alt={c.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand-accent/10 to-brand-accent2/10">
            <Heart className="w-12 h-12 text-brand-border" />
          </div>
        )}
        {c.is_featured && (
          <span className="absolute top-3 left-3 bg-brand-gold text-brand-bg text-xs font-bold px-2.5 py-1 rounded-full">Featured</span>
        )}
      </div>
      <div className="p-5">
        <h3 className="font-display font-bold text-brand-text mb-1 group-hover:text-brand-accent transition-colors">{c.name}</h3>
        <p className="text-brand-subtext text-sm line-clamp-2 mb-3">{c.description}</p>
        {c.upcoming_events && c.upcoming_events.length > 0 && (
          <div className="flex items-center gap-1.5 text-brand-muted text-xs">
            <Calendar className="w-3 h-3" />
            {c.upcoming_events.length} upcoming event{c.upcoming_events.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </Link>
  )
}
