"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "@/contexts/AuthContext";
import { Compass, ArrowRight, Info, X, Repeat, MapPin, ShieldCheck } from "lucide-react";

export function DemoBanner() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const isDemo = user?.isDemo || user?.role === "demo";

  if (!isDemo) return null;

  return (
    <>
      <AnimatePresence>
        {!isDismissed && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9, filter: "blur(10px)" }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed bottom-20 md:bottom-24 left-0 right-0 z-[110] flex justify-center pointer-events-none px-4"
          >
            <div className="pointer-events-auto flex items-center p-1.5 rounded-full bg-black/90 dark:bg-[#0A0A0A]/90 backdrop-blur-2xl border border-white/10 shadow-[0_12px_32px_rgba(0,0,0,0.6)]">

              {/* Clickable Info Area */}
              <button
                onClick={() => setShowInfoModal(true)}
                className="flex items-center gap-2.5 pl-1.5 pr-3 hover:opacity-80 transition-opacity active:scale-95"
              >
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white/10 text-white/90">
                  <Info className="w-3.5 h-3.5" />
                </div>
                <span className="text-[11px] sm:text-xs font-semibold text-white/90 tracking-wide whitespace-nowrap">
                  THIS IS JUST A DEMO ACCOUNT!!!
                </span>
              </button>

              {/* Dismiss Button */}
              <button
                onClick={() => setIsDismissed(true)}
                className="flex items-center justify-center w-7 h-7 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors active:scale-95 shrink-0"
                aria-label="Dismiss banner"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interactive Apple WWDC / VisionOS Grade Glass Guide Modal */}
      <AnimatePresence>
        {showInfoModal && (
          <motion.div
            key="demo-info-modal-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[150] flex flex-col justify-center items-center p-4 pb-[max(1rem,env(safe-area-inset-bottom,16px))] overflow-hidden"
          >
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
              onClick={() => setShowInfoModal(false)}
            />
            <motion.div
              key="demo-info-modal-content"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-md max-h-[85vh] overflow-y-auto scrollbar-none rounded-[28px] border border-white/10 bg-[#121214]/95 shadow-[0_24px_80px_rgba(0,0,0,0.8)] backdrop-blur-3xl p-7 text-white z-10"
            >
              <div className="flex items-center justify-between mb-5 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-white shadow-inner">
                    <Compass className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold tracking-tight text-white">
                      Picklers Showcase
                    </h3>
                    <p className="text-xs text-white/60">
                      Full-access exploration account
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowInfoModal(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs leading-relaxed text-white/80 mb-6 font-normal">
                You are currently exploring Picklers using our showcase demo account. We pre-loaded this workspace with Philippine pickleball facilities, tournaments, and match activity so you can experience the complete application seamlessly.
              </p>

              <div className="space-y-2.5 mb-7">
                <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
                  <div className="p-2 rounded-xl bg-white/10 text-white shrink-0">
                    <Repeat className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">
                      Player & Owner Switching
                    </div>
                    <div className="text-[11.5px] text-white/60 leading-normal mt-0.5">
                      Use the sidebar switcher to move between the Player Dashboard and Court Owner Management Portal.
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
                  <div className="p-2 rounded-xl bg-white/10 text-white shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">
                      Philippine Courts & Tournaments
                    </div>
                    <div className="text-[11.5px] text-white/60 leading-normal mt-0.5">
                      Explore Metro Manila and Cebu facilities, test match scoring, and inspect live tournament brackets.
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
                  <div className="p-2 rounded-xl bg-white/10 text-white shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">
                      Sandbox Protected
                    </div>
                    <div className="text-[11.5px] text-white/60 leading-normal mt-0.5">
                      Real court reservations and live tournament creations are disabled in showcase mode to preserve sample data.
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-5 border-t border-white/10 shrink-0 sticky bottom-0 bg-[#121214] pb-2">
                <button
                  onClick={() => setShowInfoModal(false)}
                  className="px-4 py-2 rounded-full text-xs font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Continue Exploring
                </button>
                <button
                  onClick={async () => {
                    setShowInfoModal(false);
                    await logout();
                    router.push("/auth?tab=signup");
                  }}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-bold bg-white text-slate-950 hover:bg-white/90 shadow-sm transition-all"
                >
                  <span>Create Free Account</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
