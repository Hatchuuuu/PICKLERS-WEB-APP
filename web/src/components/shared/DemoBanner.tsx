"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "@/contexts/AuthContext";
import { Sparkles, ArrowRight, Info, X, Repeat, MapPin, ShieldCheck } from "lucide-react";

export function DemoBanner() {
  const { user } = useAuth();
  const router = useRouter();
  const [showInfoModal, setShowInfoModal] = useState(false);

  const isDemo = user?.isDemo || user?.role === "demo";

  if (!isDemo) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full px-3 py-2 sm:px-6 sm:py-2.5 relative z-40 shrink-0 bg-transparent"
      >
        {/* Floating Apple-Grade Frosted Glass Capsule */}
        <div className="w-full max-w-7xl mx-auto rounded-2xl sm:rounded-full relative overflow-hidden bg-gradient-to-r from-[#0d1614]/95 via-[#11221b]/95 to-[#0d1614]/95 dark:from-[#0d1715]/95 dark:via-[#11221c]/95 dark:to-[#0d1715]/95 border border-white/10 dark:border-white/[0.12] px-3.5 py-2 sm:px-5 sm:py-2.5 flex items-center justify-between gap-2 shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-3xl">
          {/* Subtle Ambient Emerald Shimmer */}
          <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent pointer-events-none" />

          {/* Left: Luminous Icon Badge + Typography */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 relative z-10">
            {/* Sparkling Emerald Circle Icon */}
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-tr from-emerald-400 via-emerald-300 to-teal-300 text-slate-950 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.4)] shrink-0">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
            </div>

            {/* Desktop / Tablet Copy */}
            <div className="hidden sm:flex items-center gap-2 text-xs truncate">
              <span className="font-bold text-white tracking-tight">Showcase Mode</span>
              <span className="text-white/20 font-light">•</span>
              <span className="text-white/70 font-medium truncate">
                Full-access exploration with pre-loaded Philippine courts & events
              </span>
              <button
                onClick={() => setShowInfoModal(true)}
                className="inline-flex items-center gap-1 ml-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-emerald-300 bg-white/10 hover:bg-white/15 hover:text-white transition-all border border-white/10 shrink-0"
              >
                <span>About Mode</span>
                <Info className="w-3 h-3" />
              </button>
            </div>

            {/* Mobile Copy (Compact & Tailored) */}
            <div className="flex sm:hidden items-center gap-1.5 text-xs truncate">
              <span className="font-bold text-white tracking-tight">Showcase</span>
              <span className="text-white/25 font-light">•</span>
              <button
                onClick={() => setShowInfoModal(true)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium text-emerald-300 bg-white/10 hover:bg-white/15 transition-all border border-white/10 shrink-0"
              >
                <span>About</span>
                <Info className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Right: Apple Signature CTA Button */}
          <div className="flex items-center shrink-0 relative z-10">
            <button
              onClick={() => router.push("/auth")}
              className="group inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-1.5 rounded-full font-bold text-[11.5px] sm:text-xs bg-white text-slate-950 hover:bg-white/90 shadow-[0_0_20px_rgba(255,255,255,0.15)] active:scale-[0.97] transition-all duration-200"
            >
              <span className="font-semibold">Sign Up Free</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform shrink-0" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Interactive Apple WWDC / VisionOS Grade Glass Guide Modal */}
      <AnimatePresence>
        {showInfoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInfoModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-md rounded-[28px] overflow-hidden border border-white/10 bg-[#0e1614]/95 shadow-[0_24px_80px_rgba(0,0,0,0.7)] backdrop-blur-3xl p-7 text-white z-10"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500" />

              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold tracking-tight text-white">
                      Picklers Showcase
                    </h3>
                    <p className="text-xs text-emerald-300/70">
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

              <p className="text-xs leading-relaxed text-emerald-100/80 mb-6 font-normal">
                You are currently exploring Picklers using our showcase demo account. We pre-loaded this workspace with Philippine pickleball facilities, tournaments, and match activity so you can experience the complete application seamlessly.
              </p>

              <div className="space-y-2.5 mb-7">
                <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
                  <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 shrink-0">
                    <Repeat className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">
                      Player & Owner Switching
                    </div>
                    <div className="text-[11.5px] text-emerald-200/70 leading-normal mt-0.5">
                      Use the sidebar switcher to move between the Player Dashboard and Court Owner Management Portal.
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
                  <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">
                      Philippine Courts & Tournaments
                    </div>
                    <div className="text-[11.5px] text-emerald-200/70 leading-normal mt-0.5">
                      Explore Metro Manila and Cebu facilities, test match scoring, and inspect live tournament brackets.
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
                  <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">
                      Sandbox Protected
                    </div>
                    <div className="text-[11.5px] text-emerald-200/70 leading-normal mt-0.5">
                      Real court reservations and live tournament creations are disabled in showcase mode to preserve sample data.
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-5 border-t border-white/10">
                <button
                  onClick={() => setShowInfoModal(false)}
                  className="px-4 py-2 rounded-full text-xs font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Continue Exploring
                </button>
                <button
                  onClick={() => {
                    setShowInfoModal(false);
                    router.push("/auth");
                  }}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-bold bg-white text-slate-950 hover:bg-white/90 shadow-sm transition-all"
                >
                  <span>Create Free Account</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}



