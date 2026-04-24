'use client'
import { useState, useEffect } from 'react'
import { Heart, Check } from 'lucide-react'
import { DashboardNav } from '@/components/ui/Nav'
import { Button, Card } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import Image from 'next/image'
import type { Charity } from '@/types'

export default function CharityDashboardPage() {
  const [charities, setCharities] = useState<Charity[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [pct, setPct] = useState(10)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const [{ data: user }, { data: chars }] = await Promise.all([
        supabase.from('users').select('charity_id, charity_percentage').eq('id', session.user.id).single(),
        supabase.from('charities').select('*').eq('is_active', true).order('name'),
      ])

      setCharities(chars ?? [])
      setSelected(user?.charity_id ?? null)
      setPct(user?.charity_percentage ?? 10)
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave() {
    if (!selected) { toast.error('Please select a charity'); return }
    setSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('users')
        .update({ charity_id: selected, charity_percentage: pct })
        .eq('id', session.user.id)

      if (error) throw error
      toast.success('Charity preferences saved!')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const selectedCharity = charities.find(c => c.id === selected)
  const monthlyContribution = (9.99 * pct) / 100

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
        <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
          <div>
            <h1 className="font-display font-bold text-3xl text-brand-text mb-2">My Charity</h1>
            <p className="text-brand-subtext">Choose where your contribution goes each month</p>
          </div>

          {/* Contribution slider */}
          <Card>
            <h2 className="font-display font-semibold text-brand-text mb-2">Contribution Percentage</h2>
            <p className="text-brand-muted text-sm mb-6">What portion of your subscription goes to your charity (minimum 10%)</p>

            <div className="space-y-4">
              <div className="flex items-end justify-between">
                <span className="font-display text-5xl font-bold text-brand-accent">{pct}%</span>
                <div className="text-right">
                  <p className="text-brand-subtext text-sm">≈ <span className="text-brand-text font-semibold">€{monthlyContribution.toFixed(2)}</span>/month</p>
                  <p className="text-brand-muted text-xs">based on monthly plan</p>
                </div>
              </div>

              <input
                type="range"
                min={10}
                max={100}
                step={5}
                value={pct}
                onChange={e => setPct(Number(e.target.value))}
                className="w-full"
              />

              <div className="flex justify-between text-xs text-brand-muted">
                <span>10% minimum</span>
                <span>100% maximum</span>
              </div>
            </div>
          </Card>

          {/* Selected preview */}
          {selectedCharity && (
            <div className="bg-brand-accent/5 border border-brand-accent/20 rounded-2xl p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-brand-surface border border-brand-border flex-shrink-0 overflow-hidden relative">
                {selectedCharity.image_url ? (
                  <Image src={selectedCharity.image_url} alt={selectedCharity.name} fill className="object-cover" />
                ) : (
                  <Heart className="w-6 h-6 text-brand-accent absolute inset-0 m-auto" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-brand-text">{selectedCharity.name}</p>
                <p className="text-brand-muted text-sm line-clamp-1">{selectedCharity.description}</p>
              </div>
              <Check className="w-5 h-5 text-brand-accent shrink-0" />
            </div>
          )}

          {/* Charity list */}
          <div>
            <h2 className="font-display font-semibold text-brand-text mb-4">Choose a Charity</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {charities.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelected(c.id)}
                  className={`text-left p-4 rounded-2xl border transition-all group ${selected === c.id ? 'border-brand-accent bg-brand-accent/5' : 'border-brand-border bg-brand-card hover:border-brand-accent/40'}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-brand-surface border border-brand-border flex-shrink-0 overflow-hidden relative mt-0.5">
                      {c.image_url ? (
                        <Image src={c.image_url} alt={c.name} fill className="object-cover" />
                      ) : (
                        <Heart className="w-4 h-4 text-brand-muted absolute inset-0 m-auto" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-medium text-brand-text text-sm truncate group-hover:text-brand-accent transition-colors">{c.name}</p>
                        {selected === c.id && <Check className="w-4 h-4 text-brand-accent shrink-0" />}
                      </div>
                      <p className="text-brand-muted text-xs line-clamp-2">{c.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <Button size="lg" onClick={handleSave} loading={saving} disabled={!selected}>
            Save Preferences
          </Button>
        </div>
      </main>
    </>
  )
}
