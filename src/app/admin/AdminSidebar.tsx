'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Trophy, Users, BarChart2, Heart, Award, TrendingUp,
  LogOut, Shield, ChevronRight, Menu, X
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import toast from 'react-hot-toast'

const ICONS: Record<string, React.ElementType> = {
  TrendingUp, Users, Trophy, Heart, Award, BarChart2,
}

interface NavItem { href: string; label: string; icon: string }

interface Props {
  navItems: NavItem[]
  email: string
  fullName: string | null
}

export function AdminSidebar({ navItems, email, fullName }: Props) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()
  const [signingOut, setSigningOut] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)

  async function handleSignOut() {
    setSigningOut(true)
    try {
      await supabase.auth.signOut()
      toast.success('Signed out')
      router.push('/admin-login')
      router.refresh()
    } catch {
      toast.error('Sign out failed')
      setSigningOut(false)
    }
  }

  const initials = fullName
    ? fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : email[0]?.toUpperCase() ?? 'A'

  const SidebarContent = () => (
    <div className="flex flex-col h-full">

      {/* Logo */}
      <div className="p-5 border-b border-brand-border">
        <Link href="/admin" className="flex items-center gap-2.5">
          <div className="relative w-9 h-9">
            <div className="absolute inset-0 bg-brand-accent/20 rounded-xl blur-sm" />
            <div className="relative w-9 h-9 bg-brand-accent rounded-xl flex items-center justify-center shadow-accent">
              <Trophy className="w-4.5 h-4.5 text-brand-bg" strokeWidth={2.5} />
            </div>
          </div>
          <div>
            <p className="font-display font-bold text-brand-text text-sm tracking-tight">GolfDraw</p>
            <div className="flex items-center gap-1">
              <Shield className="w-2.5 h-2.5 text-brand-accent" />
              <p className="text-brand-accent text-xs font-semibold">Admin Panel</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Nav links */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(item => {
          const Icon = ICONS[item.icon]
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative ${
                active
                  ? 'bg-brand-accent/10 text-brand-accent border border-brand-accent/20'
                  : 'text-brand-subtext hover:text-brand-text hover:bg-brand-card'
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-brand-accent rounded-full" />
              )}
              <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-brand-accent' : 'text-brand-muted group-hover:text-brand-accent'} transition-colors`} />
              {item.label}
              {active && <ChevronRight className="w-3 h-3 ml-auto text-brand-accent/60" />}
            </Link>
          )
        })}
      </nav>

      {/* Bottom section — user info + logout */}
      <div className="p-3 border-t border-brand-border space-y-2">

        {/* User info */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-brand-card border border-brand-border">
          <div className="w-8 h-8 rounded-full bg-brand-accent/20 border border-brand-accent/30 flex items-center justify-center shrink-0">
            <span className="text-brand-accent text-xs font-bold">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            {fullName && <p className="text-brand-text text-xs font-semibold truncate">{fullName}</p>}
            <p className="text-brand-muted text-xs truncate">{email}</p>
          </div>
        </div>

        {/* Sign out button */}
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-brand-subtext hover:text-brand-danger hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-150 group disabled:opacity-50"
        >
          {signingOut ? (
            <svg className="animate-spin h-4 w-4 text-brand-muted shrink-0" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          ) : (
            <LogOut className="w-4 h-4 shrink-0 group-hover:text-brand-danger transition-colors" />
          )}
          {signingOut ? 'Signing out...' : 'Sign Out'}
        </button>

      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 bg-brand-surface border-r border-brand-border flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-brand-surface/95 backdrop-blur-xl border-b border-brand-border px-4 h-14 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-brand-accent rounded-lg flex items-center justify-center">
            <Trophy className="w-3.5 h-3.5 text-brand-bg" strokeWidth={2.5} />
          </div>
          <span className="font-display font-bold text-brand-text text-sm tracking-tight">GolfDraw Admin</span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-brand-subtext hover:text-brand-text rounded-lg hover:bg-brand-card transition-all"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-brand-surface border-r border-brand-border flex flex-col animate-fade-in pt-14">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Mobile top padding spacer */}
      <div className="lg:hidden h-14 shrink-0" />
    </>
  )
}