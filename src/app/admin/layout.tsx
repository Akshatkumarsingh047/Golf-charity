import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Trophy, Users, BarChart2, Heart, Award, TrendingUp } from 'lucide-react'

const navItems = [
  { href: '/admin', label: 'Overview', icon: TrendingUp },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/draws', label: 'Draws', icon: Trophy },
  { href: '/admin/charities', label: 'Charities', icon: Heart },
  { href: '/admin/winners', label: 'Winners', icon: Award },
  { href: '/admin/reports', label: 'Reports', icon: BarChart2 },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/auth/login?next=/admin')

  const { data: dbUser } = await supabase.from('users').select('role, email').eq('id', user.id).single()

  if ((dbUser as any)?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold text-red-400 mb-2">Access Denied</h1>
          <p className="text-brand-subtext mb-4">You do not have admin privileges.</p>
          <Link href="/dashboard" className="text-brand-accent hover:underline">Back to Dashboard</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-bg flex">
      <aside className="w-60 shrink-0 bg-brand-surface border-r border-brand-border flex flex-col">
        <div className="p-5 border-b border-brand-border">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-accent rounded-lg flex items-center justify-center">
              <Trophy className="w-4 h-4 text-brand-bg" />
            </div>
            <div>
              <p className="font-display font-bold text-brand-text text-sm">GolfDraw</p>
              <p className="text-brand-muted text-xs">Admin Panel</p>
            </div>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => (
            <Link key={item.href} href={item.href} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-brand-subtext hover:text-brand-text hover:bg-brand-card transition-all text-sm font-medium group">
              <item.icon className="w-4 h-4 group-hover:text-brand-accent transition-colors" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-brand-border">
          <div className="px-3 py-2">
            <p className="text-brand-muted text-xs">Signed in as</p>
            <p className="text-brand-text text-sm font-medium truncate">{dbUser?.email}</p>
          </div>
          <Link href="/dashboard" className="flex items-center gap-2 px-3 py-2 text-brand-muted hover:text-brand-text text-xs transition-colors">← Back to Dashboard</Link>
        </div>
      </aside>
      <main className="flex-1 overflow-auto"><div className="p-8">{children}</div></main>
    </div>
  )
}
