import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { HONEYPOT_PATHS } from '@/lib/security/threatDetector'
import { checkIsPrivilegedEmail } from '@/types/permissions'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Honeypot Interceptor: Trap automated vulnerability scanners
  const normalizedPath = pathname.toLowerCase();
  if (HONEYPOT_PATHS.some(hp => normalizedPath === hp || normalizedPath.startsWith(`${hp}/`))) {
    const honeypotUrl = request.nextUrl.clone();
    honeypotUrl.pathname = `/api/honeypot${pathname}`;
    return NextResponse.rewrite(honeypotUrl);
  }

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
      setTimeout(() => resolve({ data: { session: null } }), 15000)
    );

    const {
      data: { session },
    } = await Promise.race([sessionPromise, timeoutPromise]);
    
    const user = session?.user;

      // Protect /app, /app/owner, /app/admin, and /app/dev routes
      if (pathname.startsWith('/app')) {
        if (!user) {
          // If unauthenticated on protected routes, redirect to /auth
          const url = request.nextUrl.clone();
          url.pathname = '/auth';
          return NextResponse.redirect(url);
        }

        // Fetch user profile state
        const isPrivilegedEmail = checkIsPrivilegedEmail(user.email);

        try {
          const profilePromise = supabase
            .from('player_profiles')
            .select('account_status, is_banned, console_access, is_admin, role, admin_role, dev_role')
            .eq('id', user.id)
            .maybeSingle();

          const profileTimeout = new Promise<any>((resolve) =>
            setTimeout(() => resolve({ data: null }), 10000)
          );

          const { data: profileData } = await Promise.race([profilePromise, profileTimeout]);

          if (profileData) {
            // Check account status suspension / ban
            const isSuspended = profileData.account_status === 'suspended' || profileData.account_status === 'deactivated' || Boolean(profileData.is_banned);
            if (isSuspended) {
              const url = request.nextUrl.clone();
              url.pathname = '/auth';
              url.searchParams.set('error', 'Account_Suspended');
              return NextResponse.redirect(url);
            }

            const consoleAccess: string[] = Array.isArray(profileData.console_access) ? profileData.console_access : ['player'];

            // Admin route protection (/app/admin)
            if (pathname.startsWith('/app/admin')) {
              const hasAdminAccess = isPrivilegedEmail || consoleAccess.includes('admin') || Boolean(profileData.is_admin) || profileData.role === 'admin' || profileData.role === 'dev' || Boolean(profileData.admin_role) || Boolean(profileData.dev_role);
              if (!hasAdminAccess) {
                const url = request.nextUrl.clone();
                url.pathname = '/app';
                return NextResponse.redirect(url);
              }
            }

            // Developer Console route protection (/app/dev)
            if (pathname.startsWith('/app/dev')) {
              const hasDevAccess = isPrivilegedEmail || consoleAccess.includes('dev') || profileData.role === 'dev' || Boolean(profileData.is_admin) || profileData.role === 'admin' || Boolean(profileData.dev_role) || Boolean(profileData.admin_role);
              if (!hasDevAccess) {
                const url = request.nextUrl.clone();
                url.pathname = '/app';
                return NextResponse.redirect(url);
              }
            }

            // Role-based protection for /owner and /create-tournament
            if (pathname.startsWith('/app/owner') || pathname.startsWith('/app/create-tournament')) {
              const ownerAccessRoles = ['owner', 'demo', 'admin', 'dev'];
              const hasOwnerAccess = isPrivilegedEmail || ownerAccessRoles.includes(profileData.role) || consoleAccess.includes('admin') || Boolean(profileData.is_admin);
              if (!hasOwnerAccess) {
                const url = request.nextUrl.clone();
                url.pathname = '/app';
                return NextResponse.redirect(url);
              }
            }
          } else if (isPrivilegedEmail) {
            // Profile query timed out or profile row not found, but the user
            // is on the privileged-email allowlist. Grant access ONLY to the
            // /app/admin and /app/dev surfaces. For /app/owner and the
            // /app/create-tournament write surfaces, fail closed — a stale
            // read must not let an unprivileged user into a write surface.
            if (pathname.startsWith('/app/admin') || pathname.startsWith('/app/dev')) {
              return supabaseResponse;
            }
            if (pathname.startsWith('/app/owner') || pathname.startsWith('/app/create-tournament')) {
              const url = request.nextUrl.clone();
              url.pathname = '/app';
              return NextResponse.redirect(url);
            }
          } else if (pathname.startsWith('/app/admin') || pathname.startsWith('/app/dev') || pathname.startsWith('/app/owner') || pathname.startsWith('/app/create-tournament')) {
            // Fail-closed on timeout for unprivileged users
            const url = request.nextUrl.clone();
            url.pathname = '/app';
            return NextResponse.redirect(url);
          }
        } catch (e) {
          // On any error in the profile fetch, only grant the privileged-email
          // allowlist to the read-side admin/dev consoles. Write surfaces
          // (/app/owner, /app/create-tournament) fail closed.
          if (isPrivilegedEmail && (pathname.startsWith('/app/admin') || pathname.startsWith('/app/dev'))) {
            return supabaseResponse;
          }
          if (pathname.startsWith('/app/admin') || pathname.startsWith('/app/dev') || pathname.startsWith('/app/owner') || pathname.startsWith('/app/create-tournament')) {
            const url = request.nextUrl.clone();
            url.pathname = '/app';
            return NextResponse.redirect(url);
          }
        }
      }

  } catch (err) {
    const { pathname } = request.nextUrl;
    if (pathname.startsWith('/app/admin') || pathname.startsWith('/app/dev') || pathname.startsWith('/app/owner') || pathname.startsWith('/app/create-tournament')) {
      const url = request.nextUrl.clone();
      url.pathname = '/app';
      return NextResponse.redirect(url);
    }
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
