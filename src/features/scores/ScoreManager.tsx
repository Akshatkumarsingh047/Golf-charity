'use client'
import { useState, useOptimistic, useTransition } from 'react'
import { format, parseISO } from 'date-fns'
import { Plus, Edit2, Trash2, Check, X, AlertTriangle, Calendar, Hash } from 'lucide-react'
import { addScore, updateScore, deleteScore } from '@/features/scores/actions'
import { Button, Input } from '@/components/ui'
import toast from 'react-hot-toast'
import type { Score } from '@/types'

interface Props {
  initialScores: Score[]
  userId: string
}

export function ScoreManager({ initialScores, userId }: Props) {
  const [scores, setScores] = useState<Score[]>(initialScores)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [editDate, setEditDate] = useState('')
  const [adding, setAdding] = useState(false)
  const [newValue, setNewValue] = useState('')
  const [newDate, setNewDate] = useState('')
  const [isPending, startTransition] = useTransition()
  const [flippedId, setFlippedId] = useState<string | null>(null)

  const today = new Date().toISOString().split('T')[0]

  // Warning: adding 6th score will replace oldest
  const willReplaceOldest = scores.length >= 5

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newValue || !newDate) return

    const fd = new FormData()
    fd.append('score_value', newValue)
    fd.append('score_date', newDate)

    startTransition(async () => {
      const res = await addScore(fd)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success('Score added!')
        setAdding(false)
        setNewValue('')
        setNewDate('')
        // Optimistic refresh: fetch latest - in real app router refreshes via revalidatePath
        window.location.reload()
      }
    })
  }

  function startEdit(score: Score) {
    setEditingId(score.id)
    setEditValue(String(score.score_value))
    setEditDate(score.score_date)
    setFlippedId(score.id)
  }

  function cancelEdit() {
    setEditingId(null)
    setFlippedId(null)
  }

  async function handleUpdate(scoreId: string) {
    const fd = new FormData()
    fd.append('score_value', editValue)
    fd.append('score_date', editDate)

    startTransition(async () => {
      const res = await updateScore(scoreId, fd)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success('Score updated!')
        setEditingId(null)
        setFlippedId(null)
        window.location.reload()
      }
    })
  }

  async function handleDelete(scoreId: string) {
    if (!confirm('Delete this score?')) return
    startTransition(async () => {
      const res = await deleteScore(scoreId)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success('Score deleted')
        setScores(prev => prev.filter(s => s.id !== scoreId))
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-brand-subtext text-sm">{scores.length}/5 scores stored</p>
        </div>
        {!adding && (
          <Button size="sm" onClick={() => setAdding(true)}>
            <Plus className="w-4 h-4" />
            Add Score
          </Button>
        )}
      </div>

      {/* Replace warning */}
      {willReplaceOldest && !adding && (
        <div className="flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
          <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
          <p className="text-yellow-300 text-xs">
            You have 5 scores. Adding a new score will automatically remove your oldest score ({scores.length > 0 ? format(parseISO(scores[scores.length - 1].score_date), 'dd MMM yyyy') : ''}).
          </p>
        </div>
      )}

      {/* Add form */}
      {adding && (
        <form onSubmit={handleAdd} className="bg-brand-surface border border-brand-accent/30 rounded-2xl p-5 space-y-4">
          <h3 className="font-medium text-brand-text text-sm">Add new score</h3>
          {willReplaceOldest && (
            <div className="flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
              <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
              <p className="text-yellow-300 text-xs">This will replace your oldest score.</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Score (1–45)"
              type="number"
              min={1}
              max={45}
              value={newValue}
              onChange={e => setNewValue(e.target.value)}
              placeholder="e.g. 32"
              required
            />
            <Input
              label="Date"
              type="date"
              value={newDate}
              onChange={e => setNewDate(e.target.value)}
              max={today}
              required
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" loading={isPending}>
              <Check className="w-4 h-4" />
              Save Score
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => { setAdding(false); setNewValue(''); setNewDate('') }}>
              <X className="w-4 h-4" />
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Score cards — Rule 6: reverse chronological */}
      {scores.length === 0 && !adding ? (
        <div className="text-center py-12 border border-dashed border-brand-border rounded-2xl">
          <Hash className="w-8 h-8 text-brand-muted mx-auto mb-3" />
          <p className="text-brand-subtext text-sm">No scores yet. Add your first Stableford score to enter the draw.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {scores.map((score, idx) => (
            <div
              key={score.id}
              className={`bg-brand-card border rounded-2xl overflow-hidden transition-all duration-300 ${flippedId === score.id ? 'border-brand-accent/50 animate-flip-in' : 'border-brand-border'}`}
            >
              {editingId === score.id ? (
                /* Edit mode */
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Score (1–45)"
                      type="number"
                      min={1}
                      max={45}
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                    />
                    <Input
                      label="Date"
                      type="date"
                      value={editDate}
                      onChange={e => setEditDate(e.target.value)}
                      max={today}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleUpdate(score.id)} loading={isPending}>
                      <Check className="w-4 h-4" />
                      Save
                    </Button>
                    <Button variant="ghost" size="sm" onClick={cancelEdit}>
                      <X className="w-4 h-4" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                /* View mode */
                <div className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-display font-bold text-2xl ${idx === 0 ? 'bg-brand-accent/15 text-brand-accent' : 'bg-brand-surface text-brand-text'}`}>
                      {score.score_value}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 text-brand-subtext text-sm">
                        <Calendar className="w-3.5 h-3.5" />
                        {format(parseISO(score.score_date), 'EEEE, d MMM yyyy')}
                      </div>
                      {idx === scores.length - 1 && scores.length === 5 && (
                        <span className="text-xs text-yellow-500/80 mt-0.5 block">Oldest — will be replaced next</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEdit(score)}
                      className="p-2 rounded-lg text-brand-muted hover:text-brand-accent hover:bg-brand-accent/10 transition-all"
                      title="Edit score"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(score.id)}
                      className="p-2 rounded-lg text-brand-muted hover:text-red-400 hover:bg-red-500/10 transition-all"
                      title="Delete score"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
