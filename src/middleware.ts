import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Tentar refresh automático da sessão
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Se tem sessão, tentar refresh para manter viva
  if (session) {
    await supabase.auth.refreshSession()
  }

  // Proteger rotas /admin/*
  if (request.nextUrl.pathname.startsWith('/admin') && request.nextUrl.pathname !== '/admin/login') {
    if (!session) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/admin/login'
      redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Cache da verificação de role (usar user_metadata se disponível)
    const userRole = session.user.user_metadata?.role || session.user.app_metadata?.role

    // Se role está no metadata, não precisa query no banco
    if (userRole === 'superadmin') {
      return supabaseResponse
    }

    // Apenas fazer query se não tem role no metadata
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('auth_id', session.user.id)
      .single()

    if (!user || user.role !== 'superadmin') {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/admin/login'
      return NextResponse.redirect(redirectUrl)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}


