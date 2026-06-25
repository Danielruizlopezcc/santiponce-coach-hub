import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', request.nextUrl.pathname)

  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  const isPrivateRoute =
    request.nextUrl.pathname.startsWith('/app') ||
    request.nextUrl.pathname.startsWith('/admin')

  if (!isPrivateRoute) {
    return response
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value),
          )

          response = NextResponse.next({
            request: {
              headers: requestHeaders,
            },
          })

          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  try {
    await supabase.auth.getClaims()
  } catch (error) {
    console.warn('No se ha podido refrescar la sesión de Supabase.', error)
  }

  return response
}
