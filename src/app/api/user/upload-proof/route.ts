import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    // Secure auth check
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const drawEntryId = formData.get('drawEntryId') as string | null

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (!drawEntryId) return NextResponse.json({ error: 'No drawEntryId provided' }, { status: 400 })

    // Validate file type and size
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Only JPG, PNG, WEBP or GIF images accepted' }, { status: 400 })
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File must be under 5MB' }, { status: 400 })
    }

    // Verify this draw entry belongs to the authenticated user
    const service = createServiceClient()
    const { data: entry } = await service
      .from('draw_entries')
      .select('id, user_id, match_count')
      .eq('id', drawEntryId)
      .eq('user_id', user.id)
      .single()

    if (!entry) {
      return NextResponse.json({ error: 'Draw entry not found or does not belong to you' }, { status: 404 })
    }

    if (!entry.match_count || entry.match_count < 3) {
      return NextResponse.json({ error: 'Only winners (3+ matches) can upload proof' }, { status: 403 })
    }

    // Upload to Supabase Storage via service role
    const ext = file.name.split('.').pop() ?? 'jpg'
    const storagePath = `winners/${user.id}/${drawEntryId}.${ext}`
    const arrayBuffer = await file.arrayBuffer()

    const { error: uploadError } = await service.storage
      .from('winner-proofs')
      .upload(storagePath, Buffer.from(arrayBuffer), {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json({ error: 'File upload failed: ' + uploadError.message }, { status: 500 })
    }

    const { data: { publicUrl } } = service.storage
      .from('winner-proofs')
      .getPublicUrl(storagePath)

    // Write to DB via service role — bypasses RLS entirely
    const { error: dbError } = await service
      .from('winner_verifications')
      .upsert({
        draw_entry_id: drawEntryId,
        user_id: user.id,
        proof_url: publicUrl,
        status: 'pending',
        payout_status: 'pending',
      }, { onConflict: 'draw_entry_id' })

    if (dbError) {
      console.error('DB upsert error:', dbError)
      return NextResponse.json({ error: 'Failed to save verification: ' + dbError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, proof_url: publicUrl })

  } catch (err: any) {
    console.error('Upload proof error:', err)
    return NextResponse.json({ error: err?.message ?? 'Internal server error' }, { status: 500 })
  }
}