'use client'
import Link from 'next/link'
import { useState } from 'react'
import { Menu, X, Trophy, User, LogOut, Settings } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui'

interface NavProps {
  user?: { email: string; full_name?: string | null } | null
}

export function PublicNav({ user }: NavProps) {
  const [open, setOpen] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-brand-bg/80 backdrop-blur-xl border-b border-brand-border">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-accent rounded-lg flex items-center justify-center">
            <Trophy className="w-4 h-4 text-brand-bg" />
          </div>
          <span className="font-display font-bold text-xl text-brand-text">GolfDraw</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link href="/how-it-works" className="text-brand-subtext hover:text-brand-text transition-colors text-sm">How It Works</Link>
          <Link href="/charities" className="text-brand-subtext hover:text-brand-text transition-colors text-sm">Charities</Link>
          <Link href="/pricing" className="text-brand-subtext hover:text-brand-text transition-colors text-sm">Pricing</Link>
        </div>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <Link href="/dashboard">
                <Button variant="secondary" size="sm">Dashboard</Button>
              </Link>
              <button onClick={signOut} className="text-brand-subtext hover:text-red-400 transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link href="/pricing">
                <Button size="sm">Start Playing</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile */}
        <button className="md:hidden text-brand-subtext" onClick={() => setOpen(!open)}>
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {open && (
        <div className="md:hidden bg-brand-surface border-t border-brand-border px-4 py-4 space-y-3">
          <Link href="/how-it-works" className="block text-brand-subtext py-2" onClick={() => setOpen(false)}>How It Works</Link>
          <Link href="/charities" className="block text-brand-subtext py-2" onClick={() => setOpen(false)}>Charities</Link>
          <Link href="/pricing" className="block text-brand-subtext py-2" onClick={() => setOpen(false)}>Pricing</Link>
          <div className="pt-2 border-t border-brand-border flex flex-col gap-2">
            {user ? (
              <>
                <Link href="/dashboard" onClick={() => setOpen(false)}><Button variant="secondary" size="md" className="w-full">Dashboard</Button></Link>
                <button onClick={signOut} className="text-red-400 text-sm py-2">Sign Out</button>
              </>
            ) : (
              <>
                <Link href="/auth/login" onClick={() => setOpen(false)}><Button variant="secondary" size="md" className="w-full">Sign In</Button></Link>
                <Link href="/pricing" onClick={() => setOpen(false)}><Button size="md" className="w-full">Start Playing</Button></Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

export function DashboardNav({ user }: NavProps) {
  const [open, setOpen] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const links = [
    { href: '/dashboard', label: 'Overview' },
    { href: '/dashboard/scores', label: 'Scores' },
    { href: '/dashboard/draws', label: 'Draws' },
    { href: '/dashboard/winnings', label: 'Winnings' },
    { href: '/dashboard/charity', label: 'Charity' },
    { href: '/dashboard/billing', label: 'Billing' },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-brand-bg/80 backdrop-blur-xl border-b border-brand-border">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-accent rounded-lg flex items-center justify-center">
            <Trophy className="w-4 h-4 text-brand-bg" />
          </div>
          <span className="font-display font-bold text-xl text-brand-text">GolfDraw</span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {links.map(l => (
            <Link key={l.href} href={l.href} className="text-brand-subtext hover:text-brand-text transition-colors text-sm font-medium">{l.label}</Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/dashboard/profile">
            <button className="w-8 h-8 rounded-full bg-brand-accent/20 flex items-center justify-center text-brand-accent hover:bg-brand-accent/30 transition-colors">
              <User className="w-4 h-4" />
            </button>
          </Link>
          <button onClick={signOut} className="text-brand-subtext hover:text-red-400 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        <button className="md:hidden text-brand-subtext" onClick={() => setOpen(!open)}>
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {open && (
        <div className="md:hidden bg-brand-surface border-t border-brand-border px-4 py-4 space-y-2">
          {links.map(l => (
            <Link key={l.href} href={l.href} className="block text-brand-subtext py-2 text-sm" onClick={() => setOpen(false)}>{l.label}</Link>
          ))}
          <div className="pt-2 border-t border-brand-border">
            <button onClick={signOut} className="text-red-400 text-sm py-2">Sign Out</button>
          </div>
        </div>
      )}
    </header>
  )
}
