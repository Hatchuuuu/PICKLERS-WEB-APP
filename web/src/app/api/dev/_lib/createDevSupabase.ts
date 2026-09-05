import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * F-578: dev/admin routes cannot silently fall back to anon when the
 * service role key is missing. Throw at request time so the caller returns
 * 500 instead of running with RLS that the dev console bypasses by design.
 */
function assertServiceKey(): string {
  const raw = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!raw || raw.trim() === '' || raw === 'your-service-role-key-here') {
    throw new Error(
      '[F-578] SUPABASE_SERVICE_ROLE_KEY is missing or set to a placeholder. ' +
      'Dev console routes require the service role key.'
    );
  }
  return raw;
}

export async function createDevSupabase() {
  const serviceKey = assertServiceKey();
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}
