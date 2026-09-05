import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Reserved placeholder used in .env.example. Treat as "no key configured".
 */
const SERVICE_ROLE_PLACEHOLDER = 'your-service-role-key-here';

/**
 * Hardened check for whether the service role key is actually configured.
 * Returns true ONLY when the env var is set, non-empty, not whitespace, and
 * not the placeholder shipped in .env.example.
 */
export function hasServiceRoleKey(): boolean {
  const raw = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!raw) return false;
  const trimmed = raw.trim();
  if (!trimmed) return false;
  if (trimmed === SERVICE_ROLE_PLACEHOLDER) return false;
  return true;
}

/**
 * Returns an admin Supabase client using the service role key.
 *
 * IMPORTANT: this function used to silently fall back to the anon key when
 * the service role key was missing. That meant any code path that called
 * `createAdminSupabase()` while the env var was unset would, in production,
 * run with the user's RLS context — turning a misconfiguration into a security
 * incident instead of a loud 500. The fallback has been removed.
 *
 * Callers MUST check for a null return and respond with 500. Boot-time code
 * (Next.js init, startup scripts) should call `hasServiceRoleKey()` first
 * and refuse to start.
 */
export async function createAdminSupabase() {
  if (!hasServiceRoleKey()) {
    throw new Error(
      '[F-578] SUPABASE_SERVICE_ROLE_KEY is missing or set to a placeholder. ' +
      'Admin/dev routes cannot fall back to anon; failing closed. ' +
      'Configure the env var in your deploy (Vercel/Supabase) and redeploy.'
    );
  }

  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
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

export async function createSessionSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
