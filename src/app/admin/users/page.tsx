'use client'
import { useState, useEffect } from 'react'
import { Search, Download, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button, Badge, Input } from '@/components/ui'
import { format, parseISO } from 'date-fns'
import toast from 'react-hot-toast'

interface User {
  id: string
  email: string
  full_name: string | null
  subscription_status: string
  subscription_plan: string | null
  subscription_end: string | null
  created_at: string
  charities: { name: string } | null
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)

  async function fetchUsers() {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page) })
      if (search) params.append('search', search)
      const res = await fetch(`/api/admin/users?${params}`)
      const data = await res.json()
     
      setUsers(data.users ?? [])
      setTotalPages(data.totalPages ?? 1)
    } catch {
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [page, search])

  async function handleStatusChange(userId: string, status: string) {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, subscription_status: status }),
      })
      if (!res.ok) throw new Error()
      toast.success('Status updated')
      fetchUsers()
    } catch {
      toast.error('Failed to update status')
    }
  }

  async function handleExport() {
    const params = new URLSearchParams({ export: 'csv' })
    if (search) params.append('search', search)
    window.location.href = `/api/admin/users?${params}`
  }

  const statusBadge = (s: string) => <Badge label={s} variant={s as any} />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-brand-text mb-1">User Management</h1>
          <p className="text-brand-subtext text-sm">Search, view and manage all subscribers</p>
        </div>
        <Button variant="secondary" size="sm" onClick={handleExport}>
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
        <input
          type="text"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          placeholder="Search by email or name..."
          className="w-full bg-brand-surface border border-brand-border rounded-xl pl-9 pr-4 py-2.5 text-brand-text placeholder:text-brand-muted focus:outline-none focus:border-brand-accent text-sm"
        />
      </div>

      <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-border">
              {['User', 'Status', 'Plan', 'Charity', 'Joined', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-brand-muted font-medium text-xs uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-12 text-brand-muted">Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-brand-muted">No users found</td></tr>
            ) : users.map(u => (
              <tr key={u.id} className="hover:bg-brand-surface/50 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-brand-text">{u.full_name ?? '—'}</p>
                  <p className="text-brand-muted text-xs">{u.email}</p>
                </td>
                <td className="px-4 py-3">{statusBadge(u.subscription_status)}</td>
                <td className="px-4 py-3">
                  <span className="text-brand-subtext capitalize">{u.subscription_plan ?? '—'}</span>
                  {u.subscription_end && (
                    <p className="text-brand-muted text-xs">{format(parseISO(u.subscription_end), 'dd MMM yyyy')}</p>
                  )}
                </td>
                <td className="px-4 py-3 text-brand-subtext">{u.charities?.name ?? '—'}</td>
                <td className="px-4 py-3 text-brand-muted">{format(parseISO(u.created_at), 'dd MMM yyyy')}</td>
                <td className="px-4 py-3">
                  <select
                    value={u.subscription_status}
                    onChange={e => handleStatusChange(u.id, e.target.value)}
                    className="bg-brand-surface border border-brand-border rounded-lg px-2 py-1 text-brand-text text-xs focus:outline-none focus:border-brand-accent"
                  >
                    {['active', 'inactive', 'lapsed', 'cancelled'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-brand-border">
            <p className="text-brand-muted text-xs">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
