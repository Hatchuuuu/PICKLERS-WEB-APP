import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't need auth
  const publicPaths = ['/', '/auth'];
  if (publicPaths.some(p => pathname === p || pathname.startsWith('/auth'))) {
    return NextResponse.next();
  }

  // Check for Supabase auth tokens in cookies
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const projectId = supabaseUrl.split('//')[1]?.split('.')[0];
  
  const accessToken = request.cookies.get('sb-access-token')?.value
    || request.cookies.get(`sb-${projectId}-auth-token`)?.value;

  // If no auth cookie exists, redirect to login
  if (!accessToken) {
    const loginUrl = new URL('/auth', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/app/:path*'],
};
