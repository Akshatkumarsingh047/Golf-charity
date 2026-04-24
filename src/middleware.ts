import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_PATHS = [
  '/',
  '/charities',
  '/how-it-works',
  '/pricing',
  '/auth/login',
  '/auth/signup',
  '/auth/callback',
  '/admin-login',
]

const AUTH_ONLY_PATHS = [
  '/dashboard/billing',
  '/dashboard/profile',
]

function isPublic(p: string) {
  return PUBLIC_PATHS.some(x => p === x || p.startsWith(x + '/'))
}

function isAuthOnly(p: string) {
  return AUTH_ONLY_PATHS.some(x => p === x || p.startsWith(x + '/'))
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // ── Skip middleware entirely for these — no auth calls at all ──────────────
  if (pathname.startsWith('/api/')) return NextResponse.next()
  if (pathname === '/admin-login')  return NextResponse.next()
  if (isPublic(pathname))           return NextResponse.next()

  // ── Set up Supabase SSR client (needed to refresh cookies) ───────────────
  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string)                        { return request.cookies.get(name)?.value },
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

  // ── Single auth call — getSession() refreshes cookie, low rate-limit cost ─
  // We use getSession here (not getUser) to minimise server round-trips.
  // getUser() (network call to Supabase) only happens in API routes/pages
  // where we need to verify the JWT cryptographically.
  const { data: { session } } = await supabase.auth.getSession()

  // ── Not logged in ─────────────────────────────────────────────────────────
  if (!session) {
    // Admin routes → admin login
    if (pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/admin-login', request.url))
    }
    // All other protected routes → user login
    return NextResponse.redirect(
      new URL('/auth/login?next=' + encodeURIComponent(pathname), request.url)
    )
  }

  // ── Logged in — check role from DB (single query, cached by Supabase) ─────
  const { data: dbUser } = await supabase
    .from('users')
    .select('role, subscription_status, subscription_end')
    .eq('id', session.user.id)
    .single()

  const role     = (dbUser as any)?.role ?? 'user'
  const isAdmin  = role === 'admin'

  // ── Admin routes: require admin role ─────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/admin-login?error=forbidden', request.url))
    }
    return response
  }

  // ── Admin user visiting /dashboard → send to /admin ──────────────────────
  if (isAdmin && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  // ── Auth-only pages (billing, profile) — skip subscription check ──────────
  if (isAuthOnly(pathname)) return response

  // ── All other pages — require active subscription ─────────────────────────
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