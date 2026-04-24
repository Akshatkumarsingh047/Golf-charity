'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const CharityUpdateSchema = z.object({
  charity_id: z.string().uuid().nullable(),
  charity_percentage: z.number().int().min(10).max(100),
})

export async function updateCharityPreferences(formData: FormData) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Not authenticated' }
  const raw = { charity_id: formData.get('charity_id') as string | null, charity_percentage: Number(formData.get('charity_percentage')) }
  const parsed = CharityUpdateSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  const { error } = await supabase.from('users').update({ charity_id: parsed.data.charity_id, charity_percentage: parsed.data.charity_percentage, updated_at: new Date().toISOString() }).eq('id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/charity')
  revalidatePath('/dashboard')
  return { success: true }
}
