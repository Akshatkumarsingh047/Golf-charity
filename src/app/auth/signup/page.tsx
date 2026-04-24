'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Trophy, ArrowRight, ArrowLeft, Heart } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button, Input } from '@/components/ui'
import toast from 'react-hot-toast'

type Step = 'account' | 'charity'

interface Charity { id: string; name: string; description: string | null }

export default function SignupPage() {
  const [step, setStep] = useState<Step>('account')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [charities, setCharities] = useState<Charity[]>([])
  const [selectedCharity, setSelectedCharity] = useState<string | null>(null)
  const [charityPct, setCharityPct] = useState(10)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleAccountStep(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    setLoading(true)
    try {
      // Pre-load charities for step 2
      const { data } = await supabase.from('charities').select('id, name, description').eq('is_active', true).order('name')
      setCharities(data ?? [])
      setStep('charity')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSignup() {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${location.origin}/auth/callback`,
        },
      })
      if (error) throw error

      // Create user profile with charity selection
      if (data.user) {
        await supabase.from('users').upsert({
          id: data.user.id,
          email,
          full_name: fullName,
          charity_id: selectedCharity,
          charity_percentage: charityPct,
        })
      }

      toast.success('Account created! Please check your email to verify.')
      router.push('/auth/login')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-brand-accent rounded-xl flex items-center justify-center">
            <Trophy className="w-5 h-5 text-brand-bg" />
          </div>
          <span className="font-display font-bold text-2xl text-brand-text">GolfDraw</span>
        </Link>

        {/* Progress */}
        <div className="flex items-center gap-3 mb-8">
          {(['account', 'charity'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-3 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step === s || (i === 0 && step === 'charity') ? 'bg-brand-accent text-brand-bg' : 'bg-brand-card border border-brand-border text-brand-muted'}`}>
                {i + 1}
              </div>
              <span className="text-xs text-brand-subtext capitalize">{s}</span>
              {i < 1 && <div className="flex-1 h-px bg-brand-border" />}
            </div>
          ))}
        </div>

        <div className="bg-brand-card border border-brand-border rounded-2xl p-8">
          {step === 'account' ? (
            <>
              <h1 className="font-display font-bold text-2xl text-brand-text mb-2">Create account</h1>
              <p className="text-brand-subtext text-sm mb-8">Join thousands of golfers making a difference</p>

              <form onSubmit={handleAccountStep} className="space-y-5">
                <Input label="Full name" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your name" required />
                <Input label="Email address" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
                <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 8 characters" required hint="At least 8 characters" />
                <Button type="submit" loading={loading} size="lg" className="w-full">
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t border-brand-border text-center">
                <p className="text-brand-subtext text-sm">
                  Already have an account?{' '}
                  <Link href="/auth/login" className="text-brand-accent hover:underline font-medium">Sign in</Link>
                </p>
              </div>
            </>
          ) : (
            <>
              <h1 className="font-display font-bold text-2xl text-brand-text mb-2">Choose your cause</h1>
              <p className="text-brand-subtext text-sm mb-6">Select a charity to receive your contributions. You can change this later.</p>

              <div className="space-y-3 max-h-64 overflow-y-auto mb-6 pr-1">
                {charities.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCharity(c.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${selectedCharity === c.id ? 'border-brand-accent bg-brand-accent/5' : 'border-brand-border bg-brand-surface hover:border-brand-accent/40'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedCharity === c.id ? 'border-brand-accent' : 'border-brand-border'}`}>
                        {selectedCharity === c.id && <div className="w-2 h-2 rounded-full bg-brand-accent" />}
                      </div>
                      <div>
                        <p className="font-medium text-brand-text text-sm">{c.name}</p>
                        {c.description && <p className="text-brand-muted text-xs line-clamp-1">{c.description}</p>}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-brand-subtext mb-3">
                  Contribution percentage: <span className="text-brand-accent font-bold">{charityPct}%</span>
                </label>
                <input
                  type="range"
                  min={10}
                  max={100}
                  step={5}
                  value={charityPct}
                  onChange={e => setCharityPct(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-brand-muted mt-1">
                  <span>10% (min)</span>
                  <span>100%</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="secondary" size="lg" onClick={() => setStep('account')} className="flex-1">
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
                <Button size="lg" onClick={handleSignup} loading={loading} disabled={!selectedCharity} className="flex-1">
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>

              <p className="text-center text-brand-muted text-xs mt-4">
                You can skip charity selection for now and choose later in your dashboard.
              </p>
              <div className="text-center mt-2">
                <button type="button" onClick={handleSignup} className="text-brand-muted text-xs hover:text-brand-subtext underline">
                  Skip for now
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
