import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const SERVICE_ROLE_PLACEHOLDER = 'your-service-role-key-here';

/**
 * Creates an elevated Supabase client for developer operations requiring
 * service-role permissions (such as mutating user roles, reading system logs,
 * or managing feature flags).
 *
 * P2.1: this previously fell back to the anon key when SUPABASE_SERVICE_ROLE_KEY
 * was missing — the F-578 cascade. Dev tools would then silently run as the
 * current user, RLS would block them, and the dev would see a 500 with no clue
 * why. Now we fail closed: missing or placeholder key throws a clear error so
 * the operator can see the misconfig immediately.
 */
export async function createDevServiceSupabase() {
  const cookieStore = await cookies();
  const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const trimmed = rawKey?.trim();
  if (!trimmed || trimmed === SERVICE_ROLE_PLACEHOLDER) {
    throw new Error(
      '[F-578] SUPABASE_SERVICE_ROLE_KEY is missing or set to a placeholder. ' +
      'Dev console routes require service-role access and will not silently ' +
      'fall back to anon. Set the env var in your deployment.'
    );
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    trimmed,
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
