import { createClient } from '@/lib/supabase/server'
import { AdminSidebar } from './AdminSidebar'

const navItems = [
  { href: '/admin',           label: 'Overview',  icon: 'TrendingUp' },
  { href: '/admin/users',     label: 'Users',     icon: 'Users'      },
  { href: '/admin/draws',     label: 'Draws',     icon: 'Trophy'     },
  { href: '/admin/charities', label: 'Charities', icon: 'Heart'      },
  { href: '/admin/winners',   label: 'Winners',   icon: 'Award'      },
  { href: '/admin/reports',   label: 'Reports',   icon: 'BarChart2'  },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // If no user or not admin — render nothing (middleware already redirected)
  // DO NOT call redirect() here — it causes a loop with /admin-login
  if (!user) return null

  const { data: dbUser } = await supabase
    .from('users')
    .select('role, email, full_name')
    .eq('id', user.id)
    .single()

  if ((dbUser as any)?.role !== 'admin') return null

  return (
    <div className="min-h-screen bg-brand-bg flex">
      <AdminSidebar
        navItems={navItems}
        email={dbUser?.email ?? ''}
        fullName={(dbUser as any)?.full_name ?? null}
      />
      <main className="flex-1 overflow-auto lg:pt-0 pt-14">
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  )
}