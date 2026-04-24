'use client'
import { useState, useEffect } from 'react'
import { DashboardNav } from '@/components/ui/Nav'
import { Input, Button, Card } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { User } from 'lucide-react'

export default function ProfilePage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      setEmail(session.user.email ?? '')
      const { data } = await supabase.from('users').select('full_name').eq('id', session.user.id).single()
      setFullName(data?.full_name ?? '')
    }
    load()
  }, [])

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('users')
        .update({ full_name: fullName, updated_at: new Date().toISOString() })
        .eq('id', session.user.id)

      if (error) throw error
      toast.success('Profile updated')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return }
    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      toast.success('Password updated')
      setNewPassword('')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <DashboardNav />
      <main className="pt-20 min-h-screen">
        <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
          <div>
            <h1 className="font-display font-bold text-3xl text-brand-text mb-2">Profile & Settings</h1>
            <p className="text-brand-subtext">Manage your account details</p>
          </div>

          {/* Avatar placeholder */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-brand-accent/20 flex items-center justify-center">
              <User className="w-8 h-8 text-brand-accent" />
            </div>
            <div>
              <p className="font-medium text-brand-text">{fullName || email}</p>
              <p className="text-brand-muted text-sm">{email}</p>
            </div>
          </div>

          {/* Profile form */}
          <Card>
            <h2 className="font-display font-semibold text-brand-text mb-5">Personal Information</h2>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <Input
                label="Full Name"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Your full name"
              />
              <Input
                label="Email Address"
                type="email"
                value={email}
                disabled
                hint="Email cannot be changed. Contact support if needed."
              />
              <Button type="submit" loading={saving}>Save Profile</Button>
            </form>
          </Card>

          {/* Password form */}
          <Card>
            <h2 className="font-display font-semibold text-brand-text mb-5">Change Password</h2>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <Input
                label="New Password"
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Min 8 characters"
                hint="Choose a strong password"
              />
              <Button type="submit" loading={saving} variant="secondary">Update Password</Button>
            </form>
          </Card>
        </div>
      </main>
    </>
  )
}
