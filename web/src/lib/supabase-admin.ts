import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;
let _initError: Error | null = null;

function getSupabaseAdmin(): SupabaseClient {
  if (_client) return _client;
  if (_initError) throw _initError;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    _initError = new Error("NEXT_PUBLIC_SUPABASE_URL is not set. Admin operations unavailable.");
    throw _initError;
  }
  if (!supabaseServiceKey) {
    _initError = new Error("SUPABASE_SERVICE_ROLE_KEY is not set. Admin operations unavailable.");
    throw _initError;
  }

  _client = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return _client;
}

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseAdmin();
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
  has(_target, key) {
    return key in getSupabaseAdmin();
  },
  ownKeys(_target) {
    if (_client) return Reflect.ownKeys(_client);
    return [];
  },
  getOwnPropertyDescriptor(_target, key) {
    const client = getSupabaseAdmin();
    return Object.getOwnPropertyDescriptor(client, key);
  },
});