'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { simulateDraw, publishDraw } from '@/features/draws/engine'
import type { DrawType, SimulationResult } from '@/types'

async function verifyAdmin() {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Not authenticated')
  const { data: dbUser } = await supabase.from('users').select('role').eq('id', user.id).single()
  if ((dbUser as any)?.role !== 'admin') throw new Error('Forbidden')
  return user
}

export async function runSimulation(drawType: DrawType): Promise<SimulationResult> {
  await verifyAdmin()
  return simulateDraw(drawType)
}

export async function runPublishDraw(drawType: DrawType, drawMonth: string): Promise<{ drawId: string }> {
  await verifyAdmin()
  const result = await publishDraw(drawType, drawMonth)
  revalidatePath('/admin/draws')
  revalidatePath('/admin')
  return result
}
