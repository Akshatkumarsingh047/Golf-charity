'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Trophy, Mail, ArrowRight, Eye, EyeOff, Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button, Input } from '@/components/ui'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [magicLink, setMagicLink] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get('next') ?? '/dashboard'
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      if (magicLink) {
        const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${location.origin}/auth/callback?next=${next}` } })
        if (error) throw error
        toast.success('Magic link sent! Check your email.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push(next)
        router.refresh()
      }
    } catch (err: any) {
      toast.error(err.message ?? 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-brand-bg flex overflow-hidden">
      {/* Left decorative panel */}
      <div className="hidden lg:flex w-1/2 relative bg-gradient-to-br from-brand-surface to-brand-bg items-center justify-center overflow-hidden">
        <div className="orb w-[500px] h-[500px] bg-brand-accent/10" style={{ top:'20%', left:'10%' }} />
        <div className="orb w-[300px] h-[300px] bg-brand-accent2/8" style={{ bottom:'10%', right:'5%', animationDelay:'-4s' }} />
        <div className="relative z-10 text-center px-12">
          <div className="w-16 h-16 bg-brand-accent rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-accent">
            <Trophy className="w-8 h-8 text-brand-bg" strokeWidth={2} />
          </div>
          <h2 className="font-display font-bold text-4xl text-brand-text mb-4 tracking-tight">GolfDraw</h2>
          <p className="text-brand-subtext text-lg leading-relaxed max-w-sm">Play golf. Win prizes. Support the causes that matter to you.</p>
          <div className="mt-10 space-y-3">
            {['Enter your Stableford scores', 'Match numbers to win prizes', 'Support your chosen charity'].map((t, i) => (
              <div key={i} className="flex items-center gap-3 text-brand-subtext text-sm bg-brand-card/50 border border-brand-border rounded-xl px-4 py-3">
                <div className="w-5 h-5 rounded-full bg-brand-accent/20 flex items-center justify-center shrink-0">
                  <div className="w-2 h-2 rounded-full bg-brand-accent" />
                </div>
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link href="/" className="flex items-center justify-center gap-2.5 mb-10 lg:hidden">
            <div className="w-9 h-9 bg-brand-accent rounded-xl flex items-center justify-center">
              <Trophy className="w-5 h-5 text-brand-bg" strokeWidth={2.5} />
            </div>
            <span className="font-display font-bold text-2xl text-brand-text tracking-tight">GolfDraw</span>
          </Link>

          <div className="mb-8">
            <h1 className="font-display font-bold text-3xl text-brand-text tracking-tight mb-2">Welcome back</h1>
            <p className="text-brand-subtext">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input label="Email address" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />

            {!magicLink && (
              <div className="relative">
                <Input label="Password" type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-8 text-brand-muted hover:text-brand-subtext transition-colors">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            )}

            {magicLink && (
              <div className="bg-brand-accent/5 border border-brand-accent/20 rounded-xl p-4 flex items-start gap-3">
                <Zap className="w-4 h-4 text-brand-accent shrink-0 mt-0.5" />
                <p className="text-brand-subtext text-sm">We'll send a magic link to your email — no password needed.</p>
              </div>
            )}

            <Button type="submit" loading={loading} size="lg" className="w-full glow-accent">
              {magicLink ? 'Send Magic Link' : 'Sign In'}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          <div className="mt-5 text-center">
            <button type="button" onClick={() => setMagicLink(!magicLink)}
              className="text-brand-subtext text-sm hover:text-brand-accent transition-colors underline-anim">
              {magicLink ? 'Sign in with password instead' : 'Sign in with magic link'}
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-brand-border text-center">
            <p className="text-brand-subtext text-sm">
              Don&apos;t have an account?{' '}
              <Link href="/auth/signup" className="text-brand-accent hover:text-brand-accent-dim font-semibold transition-colors">
                Sign up free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}