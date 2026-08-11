import { Preferences } from '@capacitor/preferences';

/**
 * Supabase-compatible storage adapter using Capacitor Preferences.
 *
 * On native mobile devices, `localStorage` inside a WebView can be
 * cleared by the OS under memory pressure. This adapter stores auth
 * tokens via the native Preferences API which persists across app
 * restarts and OS memory reclaims.
 *
 * Usage: Pass this object as `auth.storage` in `createClient()` options.
 */
export const CapacitorStorageAdapter = {
  async getItem(key: string): Promise<string | null> {
    const { value } = await Preferences.get({ key });
    return value;
  },

  async setItem(key: string, value: string): Promise<void> {
    await Preferences.set({ key, value });
  },

  async removeItem(key: string): Promise<void> {
    await Preferences.remove({ key });
  },
};
