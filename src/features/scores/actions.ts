'use server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const ScoreSchema = z.object({
  score_value: z.number().int().min(1, 'Score must be at least 1').max(45, 'Score cannot exceed 45'),
  score_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
})

async function getAuthenticatedUser() {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Not authenticated')
  return { supabase, userId: user.id }
}

export async function getUserScores(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase.from('scores').select('id, score_value, score_date, created_at').eq('user_id', userId).order('score_date', { ascending: false }).limit(5)
  if (error) throw error
  return data ?? []
}

export async function addScore(formData: FormData) {
  const { userId } = await getAuthenticatedUser()
  const raw = { score_value: Number(formData.get('score_value')), score_date: formData.get('score_date') as string }
  const parsed = ScoreSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  const { score_value, score_date } = parsed.data
  const service = createServiceClient()
  const { data: existing } = await service.from('scores').select('id').eq('user_id', userId).eq('score_date', score_date).single()
  if (existing) return { error: 'You already have a score for ' + score_date + '. Please edit or delete it instead.' }
  const { data: currentScores } = await service.from('scores').select('id, score_date').eq('user_id', userId).order('score_date', { ascending: true })
  if (currentScores && currentScores.length >= 5) {
    const { error: deleteError } = await service.from('scores').delete().eq('id', currentScores[0].id).eq('user_id', userId)
    if (deleteError) return { error: 'Failed to replace oldest score' }
  }
  const { error: insertError } = await service.from('scores').insert({ user_id: userId, score_value, score_date })
  if (insertError) return { error: insertError.message }
  revalidatePath('/dashboard/scores')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function updateScore(scoreId: string, formData: FormData) {
  const { userId } = await getAuthenticatedUser()
  const raw = { score_value: Number(formData.get('score_value')), score_date: formData.get('score_date') as string }
  const parsed = ScoreSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  const { score_value, score_date } = parsed.data
  const service = createServiceClient()
  const { data: owned } = await service.from('scores').select('id').eq('id', scoreId).eq('user_id', userId).single()
  if (!owned) return { error: 'Score not found' }
  const { data: duplicate } = await service.from('scores').select('id').eq('user_id', userId).eq('score_date', score_date).neq('id', scoreId).single()
  if (duplicate) return { error: 'You already have a score for ' + score_date + '.' }
  const { error } = await service.from('scores').update({ score_value, score_date }).eq('id', scoreId).eq('user_id', userId)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/scores')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteScore(scoreId: string) {
  const { userId } = await getAuthenticatedUser()
  const service = createServiceClient()
  const { error } = await service.from('scores').delete().eq('id', scoreId).eq('user_id', userId)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/scores')
  revalidatePath('/dashboard')
  return { success: true }
}
