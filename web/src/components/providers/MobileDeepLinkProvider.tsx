"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isNativePlatform } from "@/lib/platform";

/**
 * MobileDeepLinkProvider
 *
 * Listens for Capacitor `appUrlOpen` events that fire when the OS
 * opens the app via a custom URL scheme (e.g., `picklers://app/bookings`).
 *
 * Primary use case: Paymongo GCash/Maya payment redirects.
 * After a player completes a payment in the GCash/Maya app, the payment
 * gateway redirects to `picklers://checkout/success?booking_id=xyz`.
 * This provider intercepts that URL and routes the player to the
 * correct in-app page without losing their session.
 *
 * On web browsers, this component renders children with no side effects.
 */
export function MobileDeepLinkProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    // Only attach deep link listeners on native platforms
    if (!isNativePlatform()) return;

    let cleanup: (() => void) | undefined;

    // Dynamic import to avoid bundling @capacitor/app on web
    import("@capacitor/app").then(({ App }) => {
      const listener = App.addListener("appUrlOpen", (data) => {
        try {
          // Parse the incoming deep link URL
          // Example: picklers://app/bookings?status=paid&booking_id=abc123
          const url = new URL(data.url);
          const pathname = url.pathname; // e.g., /app/bookings
          const search = url.search; // e.g., ?status=paid&booking_id=abc123

          if (pathname) {
            router.push(`${pathname}${search}`);
          }
        } catch (err) {
          // Malformed URL — log and ignore
          console.warn("[DeepLink] Failed to parse URL:", data.url, err);
        }
      });

      // Store cleanup function
      cleanup = () => {
        listener.then((handle) => handle.remove());
      };
    });

    return () => {
      cleanup?.();
    };
  }, [router]);

  return <>{children}</>;
}
