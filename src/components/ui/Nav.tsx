'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Menu, X, Trophy, User, LogOut, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui'

interface NavProps {
  user?: { email: string; full_name?: string | null } | null
}

export function PublicNav({ user }: NavProps) {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const links = [
    { href: '/how-it-works', label: 'How It Works' },
    { href: '/charities', label: 'Charities' },
    { href: '/pricing', label: 'Pricing' },
  ]

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-brand-bg/90 backdrop-blur-2xl border-b border-brand-border shadow-[0_1px_0_rgba(168,255,62,0.05)]' : 'bg-transparent'}`}>
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 bg-brand-accent rounded-lg opacity-20 group-hover:opacity-40 blur-sm transition-opacity" />
            <div className="relative w-8 h-8 bg-brand-accent rounded-lg flex items-center justify-center">
              <Trophy className="w-4 h-4 text-brand-bg" strokeWidth={2.5} />
            </div>
          </div>
          <span className="font-display font-bold text-xl text-brand-text tracking-tight">GolfDraw</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {links.map(l => (
            <Link key={l.href} href={l.href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 underline-anim ${pathname === l.href ? 'text-brand-text bg-brand-card' : 'text-brand-subtext hover:text-brand-text hover:bg-brand-card/60'}`}>
              {l.label}
            </Link>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <Link href="/dashboard">
                <Button variant="secondary" size="sm" className="gap-1.5">
                  Dashboard <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
              <button onClick={signOut} className="p-2 text-brand-muted hover:text-brand-danger rounded-lg hover:bg-red-500/10 transition-all" title="Sign out">
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link href="/pricing">
                <Button size="sm" className="glow-accent">Start Playing</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden p-2 text-brand-subtext hover:text-brand-text rounded-lg hover:bg-brand-card transition-all" onClick={() => setOpen(!open)}>
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-brand-surface/95 backdrop-blur-2xl border-t border-brand-border px-4 py-4 space-y-1 animate-fade-in">
          {links.map(l => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
              className="flex items-center justify-between px-4 py-3 rounded-xl text-brand-subtext hover:text-brand-text hover:bg-brand-card transition-all text-sm font-medium">
              {l.label}
              <ChevronRight className="w-4 h-4 opacity-40" />
            </Link>
          ))}
          <div className="pt-3 border-t border-brand-border space-y-2">
            {user ? (
              <>
                <Link href="/dashboard" onClick={() => setOpen(false)}>
                  <Button variant="secondary" size="md" className="w-full">Dashboard</Button>
                </Link>
                <button onClick={signOut} className="w-full text-brand-danger text-sm py-2 hover:bg-red-500/10 rounded-xl transition-all">Sign Out</button>
              </>
            ) : (
              <>
                <Link href="/auth/login" onClick={() => setOpen(false)}>
                  <Button variant="secondary" size="md" className="w-full">Sign In</Button>
                </Link>
                <Link href="/pricing" onClick={() => setOpen(false)}>
                  <Button size="md" className="w-full">Start Playing</Button>
                </Link>
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
  const pathname = usePathname()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const links = [
    { href: '/dashboard', label: 'Overview', exact: true },
    { href: '/dashboard/scores', label: 'Scores' },
    { href: '/dashboard/draws', label: 'Draws' },
    { href: '/dashboard/winnings', label: 'Winnings' },
    { href: '/dashboard/charity', label: 'Charity' },
    { href: '/dashboard/billing', label: 'Billing' },
  ]

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-brand-bg/90 backdrop-blur-2xl border-b border-brand-border shadow-[0_1px_0_rgba(255,255,255,0.02)]">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="relative w-7 h-7">
            <div className="w-7 h-7 bg-brand-accent rounded-lg flex items-center justify-center">
              <Trophy className="w-3.5 h-3.5 text-brand-bg" strokeWidth={2.5} />
            </div>
          </div>
          <span className="font-display font-bold text-lg text-brand-text tracking-tight">GolfDraw</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-0.5">
          {links.map(l => (
            <Link key={l.href} href={l.href}
              className={`relative px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive(l.href, l.exact) ? 'text-brand-text bg-brand-card' : 'text-brand-subtext hover:text-brand-text hover:bg-brand-card/60'}`}>
              {l.label}
              {isActive(l.href, l.exact) && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-brand-accent rounded-full" />
              )}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="hidden md:flex items-center gap-2">
          <Link href="/dashboard/profile">
            <button className="w-8 h-8 rounded-full bg-brand-accent/15 border border-brand-accent/20 flex items-center justify-center text-brand-accent hover:bg-brand-accent/25 transition-all hover:scale-105">
              <User className="w-3.5 h-3.5" />
            </button>
          </Link>
          <button onClick={signOut} className="p-2 text-brand-muted hover:text-brand-danger rounded-lg hover:bg-red-500/10 transition-all" title="Sign out">
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        <button className="md:hidden p-2 text-brand-subtext rounded-lg hover:bg-brand-card transition-all" onClick={() => setOpen(!open)}>
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-brand-surface/95 backdrop-blur-2xl border-t border-brand-border px-4 py-3 space-y-1 animate-fade-in">
          {links.map(l => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
              className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive(l.href, l.exact) ? 'bg-brand-card text-brand-text' : 'text-brand-subtext hover:bg-brand-card hover:text-brand-text'}`}>
              {l.label}
              {isActive(l.href, l.exact) && <span className="w-1.5 h-1.5 rounded-full bg-brand-accent" />}
            </Link>
          ))}
          <div className="pt-2 border-t border-brand-border">
            <button onClick={signOut} className="w-full text-brand-danger text-sm py-2.5 hover:bg-red-500/10 rounded-xl transition-all">Sign Out</button>
          </div>
        </div>
      )}
    </header>
  )
}