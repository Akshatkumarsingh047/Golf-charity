'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Trophy, Mail, Lock, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button, Input } from '@/components/ui'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
    <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-brand-accent rounded-xl flex items-center justify-center">
            <Trophy className="w-5 h-5 text-brand-bg" />
          </div>
          <span className="font-display font-bold text-2xl text-brand-text">GolfDraw</span>
        </Link>

        <div className="bg-brand-card border border-brand-border rounded-2xl p-8">
          <h1 className="font-display font-bold text-2xl text-brand-text mb-2">Welcome back</h1>
          <p className="text-brand-subtext text-sm mb-8">Sign in to your account</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />

            {!magicLink && (
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            )}

            <Button type="submit" loading={loading} size="lg" className="w-full">
              {magicLink ? 'Send Magic Link' : 'Sign In'}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setMagicLink(!magicLink)}
              className="text-brand-subtext text-sm hover:text-brand-accent transition-colors"
            >
              {magicLink ? 'Sign in with password instead' : 'Sign in with magic link'}
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-brand-border text-center">
            <p className="text-brand-subtext text-sm">
              Don&apos;t have an account?{' '}
              <Link href="/auth/signup" className="text-brand-accent hover:underline font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
