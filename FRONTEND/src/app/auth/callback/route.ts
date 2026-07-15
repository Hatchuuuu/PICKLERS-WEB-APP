import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  // Try to get redirect intent, otherwise fallback to generic app route
  let next = searchParams.get('next') ?? '/app'
  
  // Prevent Open Redirect vulnerability
  // Ensure the redirect is an absolute path starting with a single slash
  // If it starts with // it could be interpreted as a protocol-relative URL to a malicious domain
  if (!next.startsWith('/') || next.startsWith('//')) {
    next = '/app'
  }

  if (code) {
    const cookieStore = await cookies()
    
    // Create the secure server-side Supabase client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch (error) {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )

    // Securely exchange the OAuth code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const intent = searchParams.get('intent')
      if (intent === 'signup') {
        const role = next.includes('/app/owner') ? 'owner' : 'player'
        // Securely update the user metadata with their intended role using the established session
        await supabase.auth.updateUser({ data: { role } })
      }
      // Securely redirect to the intended destination with HTTP-only cookies established
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // If there was no code, or an error occurred during exchange, redirect to auth with an error flag
  return NextResponse.redirect(`${origin}/auth?error=OAuth_Session_Error`)
}
