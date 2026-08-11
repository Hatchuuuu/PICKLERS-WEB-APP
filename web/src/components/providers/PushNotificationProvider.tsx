"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { isNativePlatform, getPlatform } from "@/lib/platform";
import {
  registerPushNotifications,
  setupPushListeners,
  saveDeviceToken,
} from "@/lib/push-notifications";
import { supabase } from "@/lib/supabase";

/**
 * PushNotificationProvider
 *
 * Initializes push notification registration and listeners after
 * the user authenticates. Only active on native platforms.
 *
 * On web browsers, this component renders children with no side effects.
 */
export function PushNotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const registeredRef = useRef(false);

  useEffect(() => {
    // Only initialize on native platforms when user is logged in
    if (!isNativePlatform() || !isAuthenticated || !user?.id) return;
    // Prevent duplicate registrations
    if (registeredRef.current) return;
    registeredRef.current = true;

    async function initPush() {
      // 1. Register for push notifications and get device token
      const token = await registerPushNotifications();

      if (token && user?.id) {
        // 2. Store the token in Supabase so the server can send pushes
        const platform = getPlatform() as 'android' | 'ios';
        await saveDeviceToken(supabase, user.id, token, platform);
      }

      // 3. Set up notification tap handler — routes to the relevant page
      await setupPushListeners((data) => {
        // Example data payload: { route: '/app/bookings', booking_id: '123' }
        const route = data?.route as string | undefined;
        if (route) {
          router.push(route);
        }
      });
    }

    initPush();
  }, [isAuthenticated, user?.id, router]);

  return <>{children}</>;
}
