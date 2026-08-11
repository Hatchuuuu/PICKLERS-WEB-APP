import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
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

  try {
    const sessionPromise = supabase.auth.getSession();
    const timeoutPromise = new Promise<{ data: { session: null } }>((resolve) =>
      setTimeout(() => resolve({ data: { session: null } }), 1200)
    );

    const {
      data: { session },
    } = await Promise.race([sessionPromise, timeoutPromise]);
    
    const user = session?.user;
    const { pathname } = request.nextUrl;

      // Protect /app, /app/owner, and /app/admin routes
      if (pathname.startsWith('/app')) {
        if (!user) {
          // If unauthenticated on protected routes, redirect to /auth
          const url = request.nextUrl.clone();
          url.pathname = '/auth';
          return NextResponse.redirect(url);
        }

        // Admin route protection
        if (pathname.startsWith('/app/admin')) {
          try {
            const adminCheckPromise = supabase
              .from('player_profiles')
              .select('is_admin, role')
              .eq('id', user.id)
              .single();

            const adminTimeout = new Promise<any>((resolve) =>
              setTimeout(() => resolve({ data: null }), 1200)
            );

            const { data: adminData } = await Promise.race([adminCheckPromise, adminTimeout]);
            const isAdminOrDev = Boolean(adminData?.is_admin) || adminData?.role === 'admin' || adminData?.role === 'dev';

            if (adminData && !isAdminOrDev) {
              const url = request.nextUrl.clone();
              url.pathname = '/app';
              return NextResponse.redirect(url);
            }
          } catch (e) {
            // Ignore check timeout
          }
        }

        // Role-based protection for /owner
        if (pathname.startsWith('/app/owner') || pathname.startsWith('/app/create-tournament')) {
          try {
            const rolePromise = supabase
              .from('player_profiles')
              .select('role')
              .eq('id', user.id)
              .single();

            const roleTimeout = new Promise<any>((resolve) =>
              setTimeout(() => resolve({ data: null }), 1200)
            );

            const { data: roleData } = await Promise.race([rolePromise, roleTimeout]);

            const ownerAccessRoles = ['owner', 'demo', 'admin'];
            if (roleData && !ownerAccessRoles.includes(roleData.role)) {
              const url = request.nextUrl.clone();
              url.pathname = '/app';
              return NextResponse.redirect(url);
            }
          } catch (e) {
            // Ignore role check timeout
          }
        }
      }

  } catch (err) {
    // Fallback on network delay
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
