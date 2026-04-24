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

export async function GET(req: NextRequest) {
  const admin = await verifyAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') ?? ''
  const page = Number(searchParams.get('page') ?? 1)
  const limit = 20
  const offset = (page - 1) * limit
  const exportCsv = searchParams.get('export') === 'csv'
  const supabase = createServiceClient()

  let query = supabase.from('users').select('id, email, full_name, subscription_status, subscription_plan, subscription_end, created_at, charities(name)', { count: 'exact' }).order('created_at', { ascending: false })
  if (search) query = query.or('email.ilike.%' + search + '%,full_name.ilike.%' + search + '%')
  if (!exportCsv) query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (exportCsv) {
    const header = 'ID,Email,Full Name,Subscription Status,Plan,Subscription End,Charity,Created At\n'
    const rows = (data ?? []).map((u: any) => {
      const charity = u.charities?.name ?? ''
      return u.id + ',' + u.email + ',"' + (u.full_name ?? '') + '",' + u.subscription_status + ',' + (u.subscription_plan ?? '') + ',' + (u.subscription_end ?? '') + ',' + charity + ',' + u.created_at
    }).join('\n')
    return new NextResponse(header + rows, { headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="golfdraw-users.csv"' } })
  }

  return NextResponse.json({ users: data, count, page, totalPages: Math.ceil((count ?? 0) / limit) })
}

export async function PATCH(req: NextRequest) {
  const admin = await verifyAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { userId, subscription_status } = await req.json()
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
  const supabase = createServiceClient()
  const { error } = await supabase.from('users').update({ subscription_status, updated_at: new Date().toISOString() }).eq('id', userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
