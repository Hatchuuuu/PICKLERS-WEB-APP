"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { PicklersLogo } from "@/components/ui/PicklersLogo";
import { motion } from "motion/react";

function sanitizeRedirect(targetUrl: string | null): string {
  if (!targetUrl) return "/app";
  try {
    if (targetUrl.startsWith("//") || targetUrl.startsWith("/\\") || targetUrl.includes("\\")) {
      return "/app";
    }
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    const parsed = new URL(targetUrl, origin);
    if (parsed.origin === origin && parsed.pathname.startsWith("/")) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
  } catch (e) {
    console.warn("Invalid redirect URL target:", targetUrl, e);
  }
  return "/app";
}

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let authSub: { unsubscribe: () => void } | undefined;

    const handleCallback = async () => {
      // Check for OAuth configuration errors returned by Supabase in the URL
      const urlError = searchParams.get("error");
      const urlErrorDesc = searchParams.get("error_description");
      if (urlError) {
        console.warn("OAuth URL error:", urlError, urlErrorDesc);
        router.replace(`/auth?error=${encodeURIComponent(urlError)}&error_description=${encodeURIComponent(urlErrorDesc || "")}`);
        return;
      }

      // With Implicit Grant, Supabase auto-reads the hash fragment and establishes the session.
      // We just need to wait a moment for it to complete.
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.warn("OAuth session error:", error);
        router.replace("/auth?error=OAuth_Session_Error");
        return;
      }

      if (session) {
        const intent = searchParams.get("intent");
        const next = sanitizeRedirect(searchParams.get("next"));

        if (intent === "signup") {
          const role = next.includes("/owner") ? "owner" : "player";
          await supabase.auth.updateUser({ data: { role } });
        }
        
        let targetDestination = next;
        if (next === '/app' || next === '/') {
          const { data: profile } = await supabase
            .from('player_profiles')
            .select('console_access, role')
            .eq('id', session.user.id)
            .maybeSingle();

          const consoleAccess: string[] = Array.isArray(profile?.console_access) ? profile.console_access : ['player'];
          if (consoleAccess.includes('dev') || profile?.role === 'dev') {
            targetDestination = '/app/dev';
          }
        }

        router.replace(targetDestination);
      } else {
        // If there's no session yet, we might need to wait for onAuthStateChange
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
          if (event === 'SIGNED_IN' && newSession) {
            subscription.unsubscribe();
            const intent = searchParams.get("intent");
            const next = sanitizeRedirect(searchParams.get("next"));
            
            if (intent === "signup") {
              const role = next.includes("/owner") ? "owner" : "player";
              await supabase.auth.updateUser({ data: { role } });
            }

            let targetDestination = next;
            if (next === '/app' || next === '/') {
              const { data: profile } = await supabase
                .from('player_profiles')
                .select('console_access, role')
                .eq('id', newSession.user.id)
                .maybeSingle();

              const consoleAccess: string[] = Array.isArray(profile?.console_access) ? profile.console_access : ['player'];
              if (consoleAccess.includes('dev') || profile?.role === 'dev') {
                targetDestination = '/app/dev';
              }
            }

            router.replace(targetDestination);
          }
        });
        authSub = subscription;

        // Timeout fallback just in case
        timeoutId = setTimeout(() => {
          subscription.unsubscribe();
          router.replace("/auth?error=OAuth_Timeout");
        }, 5000);
      }
    };

    handleCallback();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (authSub) authSub.unsubscribe();
    };
  }, [router, searchParams]);

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background">
      <motion.div animate={{ scale: [1, 1.05, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }}>
        <PicklersLogo size={64} />
      </motion.div>
      <p className="mt-6 text-ink-muted font-medium animate-pulse">Completing sign in...</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background">
        <PicklersLogo size={64} />
      </div>
    }>
      <AuthCallbackInner />
    </Suspense>
  );
}
