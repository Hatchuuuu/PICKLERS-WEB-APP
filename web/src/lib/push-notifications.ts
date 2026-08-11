import type { SupabaseClient } from '@supabase/supabase-js';
import { isNativePlatform } from '@/lib/platform';

/**
 * Push notification utilities for Capacitor native platforms.
 *
 * Handles:
 * - Permission requests
 * - FCM/APNs device token registration
 * - Foreground notification display
 * - Notification tap → deep link routing
 *
 * All functions are no-ops on web browsers.
 */

export interface PushNotificationToken {
  value: string;
}

/**
 * Request push notification permissions and register the device.
 * Returns the FCM/APNs device token string, or null if denied/unavailable.
 */
export async function registerPushNotifications(): Promise<string | null> {
  if (!isNativePlatform()) return null;

  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');

    // Check current permission status
    const permResult = await PushNotifications.checkPermissions();

    if (permResult.receive === 'prompt' || permResult.receive === 'prompt-with-rationale') {
      const requestResult = await PushNotifications.requestPermissions();
      if (requestResult.receive !== 'granted') {
        console.warn('[Push] Permission denied by user');
        return null;
      }
    } else if (permResult.receive !== 'granted') {
      console.warn('[Push] Permission not granted:', permResult.receive);
      return null;
    }

    // Register with FCM/APNs
    await PushNotifications.register();

    // Wait for the registration token
    return new Promise<string | null>((resolve) => {
      PushNotifications.addListener('registration', (token) => {
        console.log('[Push] Device token received:', token.value);
        resolve(token.value);
      });

      PushNotifications.addListener('registrationError', (err) => {
        console.error('[Push] Registration failed:', err);
        resolve(null);
      });

      // Timeout after 10 seconds
      setTimeout(() => resolve(null), 10_000);
    });
  } catch (err) {
    console.error('[Push] Registration error:', err);
    return null;
  }
}

/**
 * Set up foreground notification listeners.
 * Call this once after successful registration.
 *
 * @param onNotificationTap - Callback when user taps a notification.
 *   Receives the notification data payload.
 */
export async function setupPushListeners(
  onNotificationTap?: (data: Record<string, unknown>) => void
): Promise<void> {
  if (!isNativePlatform()) return;

  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');

    // Notification received while app is in foreground
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('[Push] Foreground notification:', notification.title);
      // On Android, Capacitor shows the notification automatically via presentationOptions.
      // On iOS, the presentationOptions in capacitor.config.ts control this.
    });

    // User tapped on a notification (app was in background or killed)
    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('[Push] Notification tapped:', action.notification.data);
      onNotificationTap?.(action.notification.data as Record<string, unknown>);
    });
  } catch (err) {
    console.error('[Push] Listener setup error:', err);
  }
}

/**
 * Store the device push token in Supabase for the given user.
 * This enables server-side push notification delivery.
 *
 * @param supabase - Supabase client instance
 * @param userId - The authenticated user's ID
 * @param token - The FCM/APNs device token
 * @param platform - 'android' or 'ios'
 */
export async function saveDeviceToken(
  supabase: SupabaseClient,
  userId: string,
  token: string,
  platform: 'android' | 'ios'
): Promise<void> {
  const { error } = await supabase
    .from('device_tokens')
    .upsert(
      {
        user_id: userId,
        token,
        platform,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,platform' }
    );

  if (error) {
    console.error('[Push] Failed to save device token:', error);
  }
}
