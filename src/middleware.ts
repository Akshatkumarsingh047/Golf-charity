import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_PAGES = [
  '/',
  '/charities',
  '/how-it-works',
  '/pricing',
  '/auth/login',
  '/auth/signup',
  '/auth/callback',
]

const AUTH_ONLY_PAGES = [
  '/dashboard/billing',
  '/dashboard/profile',
]

function isPublicPage(p: string) {
  return PUBLIC_PAGES.some(x => p === x || p.startsWith(x + '/'))
}

function isAuthOnlyPage(p: string) {
  return AUTH_ONLY_PAGES.some(x => p === x || p.startsWith(x + '/'))
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // ── 1. All /api/* routes handle their own auth internally
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // Required by @supabase/ssr to refresh cookies
  await supabase.auth.getSession()
  // Secure auth check
  const { data: { user } } = await supabase.auth.getUser()

  // ── 2. Admin pages — only admins allowed
  if (pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/auth/login?next=/admin', request.url))
    }
    const { data: dbUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    if (!dbUser || (dbUser as any).role !== 'admin') {
      return new NextResponse('Forbidden', { status: 403 })
    }
    return response
  }

  // ── 3. Public pages — always allow
  if (isPublicPage(pathname)) return response

  // ── 4. Not logged in
  if (!user) {
    return NextResponse.redirect(
      new URL('/auth/login?next=' + encodeURIComponent(pathname), request.url)
    )
  }

  // ── 5. Fetch role + subscription in one query
  const { data: dbUser } = await supabase
    .from('users')
    .select('role, subscription_status, subscription_end')
    .eq('id', user.id)
    .single()

  const isAdmin = (dbUser as any)?.role === 'admin'

  // ── 6. Admin users are NEVER allowed on /dashboard/* — redirect to /admin
  if (isAdmin && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  // ── 7. Auth-only pages (billing, profile) — no subscription check
  if (isAuthOnlyPage(pathname)) return response

  // ── 8. All other pages require active subscription
  const isActive =
    dbUser?.subscription_status === 'active' &&
    dbUser?.subscription_end &&
    new Date(dbUser.subscription_end) > new Date()

  if (!isActive) {
    const url = new URL('/dashboard/billing', request.url)
    url.searchParams.set('reactivate', '1')
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}