'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Shield, Eye, EyeOff, ArrowRight, AlertTriangle, Trophy, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export default function AdminLoginPage() {
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [showPass, setShowPass]   = useState(false)
  const [loading, setLoading]     = useState(false)
  const [rateLimited, setRateLimited] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const router   = useRouter()
  const params   = useSearchParams()
  const forbidden = params.get('error') === 'forbidden'
  const supabase = createClient()

  // Countdown timer when rate limited
  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  useEffect(() => {
    if (countdown === 0 && rateLimited) {
      setRateLimited(false)
    }
  }, [countdown, rateLimited])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rateLimited) return

    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) {
        // Handle rate limit specifically
        if (
          error.message.toLowerCase().includes('rate limit') ||
          error.message.toLowerCase().includes('over_request') ||
          (error as any).code === 'over_request_rate_limit'
        ) {
          setRateLimited(true)
          setCountdown(60) // wait 60 seconds
          return
        }
        throw error
      }

      // Verify admin role
      const { data: userData, error: roleError } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (roleError || !userData || userData.role !== 'admin') {
        await supabase.auth.signOut()
        throw new Error('This account does not have admin access.')
      }

      toast.success('Welcome back!')
      router.push('/admin')
      router.refresh()

    } catch (err: any) {
      toast.error(err.message ?? 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#080810] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#a8ff3e]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#4f8fff]/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(30,30,48,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(30,30,48,0.3)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black,transparent)] pointer-events-none" />

      <div className="relative w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 bg-[#a8ff3e] rounded-xl flex items-center justify-center">
              <Trophy className="w-5 h-5 text-[#080810]" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-2xl text-white tracking-tight">GolfDraw</span>
          </Link>
          <div className="inline-flex items-center gap-2 bg-[#13131f] border border-[#1e1e30] rounded-full px-4 py-2">
            <Shield className="w-4 h-4 text-[#a8ff3e]" />
            <span className="text-[#8888aa] text-sm font-medium">Admin Portal</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-[#13131f] border border-[#1e1e30] rounded-3xl p-8">

          {/* Forbidden banner */}
          {forbidden && (
            <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-6">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-red-400 font-semibold text-sm">Access Denied</p>
                <p className="text-red-400/70 text-xs mt-0.5">
                  This account does not have admin privileges.
                </p>
              </div>
            </div>
          )}

          {/* Rate limit banner */}
          {rateLimited && (
            <div className="flex items-start gap-3 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 mb-6">
              <Clock className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-yellow-400 font-semibold text-sm">Too many attempts</p>
                <p className="text-yellow-400/70 text-xs mt-0.5">
                  Supabase rate limit reached. Please wait{' '}
                  <span className="font-bold text-yellow-300">{countdown}s</span> before trying again.
                </p>
              </div>
            </div>
          )}

          <h1 className="font-bold text-2xl text-white tracking-tight mb-1">
            Admin Sign In
          </h1>
          <p className="text-[#8888aa] text-sm mb-7">
            Restricted access — authorised personnel only
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-[#8888aa] mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                autoComplete="email"
                disabled={rateLimited || loading}
                className="w-full bg-[#0f0f1a] border border-[#1e1e30] rounded-xl px-4 py-3 text-white placeholder:text-[#44445a] focus:outline-none focus:border-[#a8ff3e] focus:ring-1 focus:ring-[#a8ff3e]/30 transition-all text-sm disabled:opacity-50"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-[#8888aa] mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  disabled={rateLimited || loading}
                  className="w-full bg-[#0f0f1a] border border-[#1e1e30] rounded-xl px-4 py-3 pr-11 text-white placeholder:text-[#44445a] focus:outline-none focus:border-[#a8ff3e] focus:ring-1 focus:ring-[#a8ff3e]/30 transition-all text-sm disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#44445a] hover:text-[#8888aa] transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || rateLimited}
              className="w-full flex items-center justify-center gap-2 bg-[#a8ff3e] text-[#080810] font-bold py-3.5 rounded-xl hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Verifying...
                </>
              ) : rateLimited ? (
                <>
                  <Clock className="w-4 h-4" />
                  Wait {countdown}s
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Sign In to Admin
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#1e1e30]">
            <p className="text-[#44445a] text-xs text-center leading-relaxed">
              Restricted to authorised administrators only.<br />
              All activity is logged and monitored.
            </p>
          </div>
        </div>

        <p className="text-center mt-6">
          <Link href="/" className="text-[#44445a] text-sm hover:text-[#8888aa] transition-colors">
            ← Back to GolfDraw
          </Link>
        </p>
      </div>
    </div>
  )
}