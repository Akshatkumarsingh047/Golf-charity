import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

async function verifyAdmin() {
  const supabase = createClient()
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
  if (authError || !authUser) return null
  const { data: dbUser } = await supabase.from('users').select('role').eq('id', authUser.id).single()
  if ((dbUser as any)?.role !== 'admin') return null
  return authUser
}

export async function POST(req: NextRequest) {
  const admin = await verifyAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) return NextResponse.json({ error: 'Invalid file type. JPG, PNG or WEBP only.' }, { status: 400 })
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'File must be under 5MB' }, { status: 400 })

  const ext = file.name.split('.').pop()
  const filename = 'charities/' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.' + ext
  const arrayBuffer = await file.arrayBuffer()

  const supabase = createServiceClient()
  const { error: uploadError } = await supabase.storage.from('charity-images').upload(filename, Buffer.from(arrayBuffer), { contentType: file.type, upsert: false })
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: { publicUrl } } = supabase.storage.from('charity-images').getPublicUrl(filename)
  return NextResponse.json({ url: publicUrl })
}
