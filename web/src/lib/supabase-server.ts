import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Shared helper for creating a Supabase SSR client in Route Handlers and Server Actions.
 */
export async function createSupabaseServerClient() {
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
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Can be ignored if called in context where cookies cannot be mutated
          }
        },
      },
    }
  );
}
