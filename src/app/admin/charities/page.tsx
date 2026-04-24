'use client'
import { useState, useEffect, useRef } from 'react'
import { Plus, Edit2, Trash2, Star, Upload, X, Check, Globe } from 'lucide-react'
import { Button, Input, Badge } from '@/components/ui'
import toast from 'react-hot-toast'
import Image from 'next/image'
import type { Charity, CharityEvent } from '@/types'

const EMPTY_CHARITY = {
  name: '', description: '', image_url: '', website_url: '',
  is_featured: false, is_active: true, upcoming_events: [] as CharityEvent[],
}

export default function AdminCharitiesPage() {
  const [charities, setCharities] = useState<Charity[]>([])
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_CHARITY })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [newEvent, setNewEvent] = useState<CharityEvent>({ title: '', date: '', description: '' })
  const fileRef = useRef<HTMLInputElement>(null)

  async function fetchCharities() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/charities')
      const data = await res.json()
      setCharities(data.charities ?? [])
    } catch { toast.error('Failed to load charities') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchCharities() }, [])

  function startCreate() {
    setEditing(null)
    setForm({ ...EMPTY_CHARITY })
    setShowForm(true)
  }

  function startEdit(c: Charity) {
    setEditing(c.id)
    setForm({
      name: c.name, description: c.description ?? '',
      image_url: c.image_url ?? '', website_url: c.website_url ?? '',
      is_featured: c.is_featured, is_active: c.is_active,
      upcoming_events: c.upcoming_events ?? [],
    })
    setShowForm(true)
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { toast.error('Only JPG, PNG, WEBP allowed'); return }

    setUploading(true)
    try {
      // Upload to Supabase Storage via dedicated endpoint
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/admin/upload-image', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setForm(f => ({ ...f, image_url: data.url }))
      toast.success('Image uploaded')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setUploading(false)
    }
  }

  async function handleSave() {
    if (!form.name.trim()) { toast.error('Name is required'); return }
    setSaving(true)
    try {
      const method = editing ? 'PATCH' : 'POST'
      const body = editing ? { id: editing, ...form } : form
      const res = await fetch('/api/admin/charities', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success(editing ? 'Charity updated' : 'Charity created')
      setShowForm(false)
      setEditing(null)
      fetchCharities()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    try {
      const res = await fetch(`/api/admin/charities?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Charity deleted')
      fetchCharities()
    } catch { toast.error('Failed to delete charity') }
  }

  async function toggleFeatured(id: string, current: boolean) {
    try {
      await fetch('/api/admin/charities', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_featured: !current }),
      })
      fetchCharities()
    } catch { toast.error('Failed to update') }
  }

  function addEvent() {
    if (!newEvent.title || !newEvent.date) { toast.error('Title and date required'); return }
    setForm(f => ({ ...f, upcoming_events: [...(f.upcoming_events || []), { ...newEvent }] }))
    setNewEvent({ title: '', date: '', description: '' })
  }

  function removeEvent(idx: number) {
    setForm(f => ({ ...f, upcoming_events: (f.upcoming_events || []).filter((_, i) => i !== idx) }))
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-brand-text mb-1">Charities</h1>
          <p className="text-brand-subtext text-sm">Manage the charity directory</p>
        </div>
        <Button onClick={startCreate}>
          <Plus className="w-4 h-4" />
          Add Charity
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-brand-card border border-brand-accent/30 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-brand-text">{editing ? 'Edit Charity' : 'New Charity'}</h2>
            <button onClick={() => setShowForm(false)} className="text-brand-muted hover:text-brand-text">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Charity name" />
            <Input label="Website URL" value={form.website_url} onChange={e => setForm(f => ({ ...f, website_url: e.target.value }))} placeholder="https://" />
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-subtext mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
              className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-3 text-brand-text placeholder:text-brand-muted focus:outline-none focus:border-brand-accent resize-none text-sm"
              placeholder="Describe this charity's mission..."
            />
          </div>

          {/* Image upload */}
          <div>
            <label className="block text-sm font-medium text-brand-subtext mb-2">Charity Image</label>
            <div className="flex items-center gap-4">
              {form.image_url && (
                <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-brand-border">
                  <Image src={form.image_url} alt="Preview" fill className="object-cover" />
                </div>
              )}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-4 py-2.5 bg-brand-surface border border-brand-border rounded-xl text-brand-subtext hover:border-brand-accent/40 transition-all text-sm"
              >
                <Upload className="w-4 h-4" />
                {uploading ? 'Uploading...' : 'Upload Image'}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              <p className="text-brand-muted text-xs">Max 5MB · JPG, PNG, WEBP</p>
            </div>
          </div>

          {/* Toggles */}
          <div className="flex gap-6">
            {[
              { key: 'is_featured', label: 'Featured on homepage' },
              { key: 'is_active', label: 'Active (visible to users)' },
            ].map(t => (
              <label key={t.key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(form as any)[t.key]}
                  onChange={e => setForm(f => ({ ...f, [t.key]: e.target.checked }))}
                  className="w-4 h-4 accent-brand-accent"
                />
                <span className="text-brand-subtext text-sm">{t.label}</span>
              </label>
            ))}
          </div>

          {/* Events */}
          <div>
            <p className="text-sm font-medium text-brand-subtext mb-3">Upcoming Events</p>
            {(form.upcoming_events || []).map((ev, idx) => (
              <div key={idx} className="flex items-center justify-between bg-brand-surface rounded-xl px-4 py-2.5 mb-2 text-sm">
                <div>
                  <span className="text-brand-text font-medium">{ev.title}</span>
                  <span className="text-brand-muted ml-2">{ev.date}</span>
                  {ev.description && <p className="text-brand-muted text-xs mt-0.5">{ev.description}</p>}
                </div>
                <button onClick={() => removeEvent(idx)} className="text-brand-muted hover:text-red-400">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <div className="grid grid-cols-3 gap-2 mt-2">
              <Input placeholder="Event title" value={newEvent.title} onChange={e => setNewEvent(n => ({ ...n, title: e.target.value }))} />
              <Input type="date" value={newEvent.date} onChange={e => setNewEvent(n => ({ ...n, date: e.target.value }))} />
              <Button variant="secondary" size="sm" onClick={addEvent} className="self-end">
                <Plus className="w-4 h-4" /> Add
              </Button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={handleSave} loading={saving}>
              <Check className="w-4 h-4" />
              {editing ? 'Save Changes' : 'Create Charity'}
            </Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="text-center py-12 text-brand-muted">Loading...</div>
      ) : (
        <div className="space-y-3">
          {charities.map(c => (
            <div key={c.id} className="bg-brand-card border border-brand-border rounded-2xl p-5 flex items-center gap-5">
              <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-brand-border bg-brand-surface shrink-0">
                {c.image_url ? (
                  <Image src={c.image_url} alt={c.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-brand-muted text-xl font-bold">
                    {c.name[0]}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-medium text-brand-text">{c.name}</h3>
                  {c.is_featured && <Badge label="Featured" variant="active" />}
                  {!c.is_active && <Badge label="Inactive" variant="inactive" />}
                </div>
                <p className="text-brand-muted text-sm line-clamp-1">{c.description}</p>
                {c.website_url && (
                  <a href={c.website_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-brand-accent text-xs hover:underline mt-0.5">
                    <Globe className="w-3 h-3" />{c.website_url}
                  </a>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => toggleFeatured(c.id, c.is_featured)}
                  className={`p-2 rounded-lg transition-all ${c.is_featured ? 'text-brand-gold bg-brand-gold/10' : 'text-brand-muted hover:text-brand-gold hover:bg-brand-gold/10'}`}
                  title={c.is_featured ? 'Remove from featured' : 'Mark as featured'}
                >
                  <Star className="w-4 h-4" />
                </button>
                <button onClick={() => startEdit(c)} className="p-2 rounded-lg text-brand-muted hover:text-brand-accent hover:bg-brand-accent/10 transition-all">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(c.id, c.name)} className="p-2 rounded-lg text-brand-muted hover:text-red-400 hover:bg-red-500/10 transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
