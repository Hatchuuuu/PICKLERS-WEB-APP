import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

function getSupabaseAdmin(): SupabaseClient {
  if (_client) return _client;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("[FATAL] NEXT_PUBLIC_SUPABASE_URL is not set. Admin operations unavailable.");
  }
  if (!serviceRoleKey || serviceRoleKey === 'your-service-role-key-here' || serviceRoleKey.trim() === '') {
    throw new Error("[FATAL] SUPABASE_SERVICE_ROLE_KEY is not set or invalid. Privileged admin operations require a valid service role key.");
  }

  _client = createClient(supabaseUrl, serviceRoleKey, {
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