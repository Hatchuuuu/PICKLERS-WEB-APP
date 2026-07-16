"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { PicklersLogo } from "@/components/ui/PicklersLogo";
import { motion } from "motion/react";

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
        let next = searchParams.get("next") || "/app";
        
        // Prevent open redirects
        if (!next.startsWith("/") || next.startsWith("//")) {
          next = "/app";
        }

        if (intent === "signup") {
          const role = next.includes("/owner") ? "owner" : "player";
          await supabase.auth.updateUser({ data: { role } });
        }
        
        router.replace(next);
      } else {
        // If there's no session yet, we might need to wait for onAuthStateChange
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
          if (event === 'SIGNED_IN' && newSession) {
            subscription.unsubscribe();
            const intent = searchParams.get("intent");
            let next = searchParams.get("next") || "/app";
            if (!next.startsWith("/") || next.startsWith("//")) next = "/app";
            
            if (intent === "signup") {
              const role = next.includes("/owner") ? "owner" : "player";
              await supabase.auth.updateUser({ data: { role } });
            }
            router.replace(next);
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
