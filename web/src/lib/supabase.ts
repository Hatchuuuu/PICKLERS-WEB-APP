import { createBrowserClient } from '@supabase/ssr';
import { isNativePlatform } from '@/lib/platform';
import { CapacitorStorageAdapter } from '@/lib/capacitor-storage';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials in environment variables');
}

// Global window unhandledrejection guard to catch network-level Supabase Auth token refresh failures on tab visibility change
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    if (
      event.reason &&
      (event.reason.message === 'Failed to fetch' || event.reason.name === 'TypeError') &&
      String(event.reason.stack || '').includes('@supabase')
    ) {
      event.preventDefault();
    }
  });
}

// Safe fetch wrapper to catch network drops or offline Failed to fetch errors during background token refresh
const safeFetch: typeof fetch = async (...args) => {
  try {
    return await fetch(...args);
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: "network_error", message: err?.message || "Failed to fetch" }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }
};

// Build auth options — on native mobile, use Capacitor Preferences for persistent token storage
const authOptions: Record<string, unknown> = {};
if (typeof window !== 'undefined' && isNativePlatform()) {
  authOptions.storage = CapacitorStorageAdapter;
  authOptions.autoRefreshToken = true;
  authOptions.persistSession = true;
  authOptions.detectSessionInUrl = true;
}

// Use SSR browser client so session is written to cookies, allowing middleware to read it
export const supabase = createBrowserClient(supabaseUrl, supabaseKey, {
  global: {
    fetch: safeFetch,
  },
  ...(Object.keys(authOptions).length > 0 ? { auth: authOptions } : {}),
});

