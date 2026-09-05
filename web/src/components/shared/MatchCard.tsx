"use client";
import { memo, useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, MapPin, Calendar, Clock, User } from "lucide-react";
import { createPortal } from "react-dom";
import { VerificationGate } from "@/components/shared/VerificationGate";

import { useActionLock } from "@/hooks/useActionLock";

import { formatSkillLevel } from "@/lib/utils";
import { formatFullDate } from "@/lib/timeUtils";

export interface CardMatchData {
  id: string | number;
  level: string;
  slots: number;
  max: number;
  facility: string;
  location?: string;
  date: string;
  time: string;
  host: string;
  price: number | string;
}

export function formatTimeRange(timeStr: string): string {
  if (!timeStr) return "";
  if (timeStr.includes("-") || timeStr.includes("–") || timeStr.includes("to")) {
    return timeStr;
  }

  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return timeStr;

  const [, hoursStr, minsStr, rawPeriod] = match;
  let hours = parseInt(hoursStr, 10);
  const mins = minsStr;
  const period = rawPeriod.toUpperCase();

  if (period === "PM" && hours < 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;

  const endHours = (hours + 2) % 24;
  const endPeriod = endHours >= 12 ? "PM" : "AM";
  let endDisplayHours = endHours % 12;
  if (endDisplayHours === 0) endDisplayHours = 12;

  const endStr = `${endDisplayHours.toString().padStart(2, '0')}:${mins} ${endPeriod}`;
  return `${timeStr} – ${endStr}`;
}

function MatchCardInner({ m, publicMode, onJoin, joined = false }: { m: CardMatchData, publicMode?: boolean, onJoin?: () => void, joined?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [showJoinConfirm, setShowJoinConfirm] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simSuccess, setSimSuccess] = useState(false);
  const { isLocked, runWithLock } = useActionLock();
  const isMountedRef = useRef(true);

  const isUnlimited = !m.max || m.max === 0;

  const CapacityRing = ({ filled, max }: { filled: number, max: number }) => {
    const isUnlim = !max || max === 0;
    return (
      <div className="relative w-12 h-12 shrink-0 flex items-center justify-center bg-black/5 dark:bg-white/5 rounded-full border border-black/10 dark:border-white/10 shadow-inner">
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 48 48">
          <circle cx="24" cy="24" r="22" fill="none" stroke="currentColor" strokeWidth="3" className="text-black/5 dark:text-white/5" />
          <circle cx="24" cy="24" r="22" fill="none" stroke="currentColor" strokeWidth="3"
            className="text-[#3B82F6]"
            strokeDasharray={isUnlim ? "138 138" : `${Math.min(1, filled / max) * 138} 138`}
            strokeLinecap="round" />
        </svg>
        <div className="text-[14px] font-black tracking-tighter leading-none whitespace-nowrap text-foreground">
          {isUnlim ? "∞" : `${filled}/${max}`}
        </div>
      </div>
    );
  };

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    isMountedRef.current = true;
    setMounted(true);
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const filled = joined ? m.slots + 1 : m.slots;
  const full = !isUnlimited && filled >= m.max;

  function handleJoin() {
    if (joined || full || loading || isSimulating || simSuccess || isLocked) return;
    setShowJoinConfirm(true);
  }

  async function confirmJoin() {
    if (isSimulating || simSuccess || isLocked) return;

    await runWithLock(async () => {
      if (!isMountedRef.current) return;
      setIsSimulating(true);

      // Simulate high-concurrency network latency
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (!isMountedRef.current) return;

      setIsSimulating(false);
      setSimSuccess(true);

      // Give the user 400ms to visually register the satisfying checkmark before closing
      await new Promise((resolve) => setTimeout(resolve, 400));
      if (!isMountedRef.current) return;

      setShowJoinConfirm(false);
      setSimSuccess(false);
      setLoading(true);

      await new Promise((resolve) => setTimeout(resolve, 300));
      if (!isMountedRef.current) return;

      setLoading(false);
      onJoin?.();
    });
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={`p-5 flex flex-col justify-between cursor-default h-full rounded-[24px] border backdrop-blur-[20px] transition-all duration-300 ${joined
        ? 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_8px_32px_rgba(16,185,129,0.15)]'
        : 'bg-surface-base border-border shadow-lg dark:bg-gradient-to-br dark:from-white/[0.07] dark:to-white/[0.02] dark:border-white/[0.1] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]'
        }`}
    >
      {/* Header: Facility Title & Location (Left), Skill Badge (Right) */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex flex-col min-w-0 flex-1">
          <h4 className="text-[17px] font-extrabold tracking-tight truncate leading-snug" style={{ color: "var(--ink-primary)" }}>
            {m.facility}
          </h4>
          <div className="text-[12.5px] font-medium truncate mt-0.5 flex items-center gap-1.5" style={{ color: "var(--ink-muted)" }}>
            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">{m.location && m.location !== m.facility ? m.location : "Bonifacio Global City, Taguig"}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[11.5px] px-3 py-1 rounded-full font-bold tracking-wide bg-black/5 text-accent-primary border border-border dark:bg-white/5 dark:border-white/5 backdrop-blur-[8px]">
            {formatSkillLevel(m.level)}
          </span>
          {joined && (
            <span
              className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold border border-solid"
              style={{
                background: "rgba(52,211,153,0.1)",
                color: "var(--accent-success)",
                borderColor: "rgba(52,211,153,0.25)"
              }}
            >
              Joined ✓
            </span>
          )}
        </div>
      </div>

      {/* Metadata List (Date, Time, Host & Price) */}
      <div className="mb-3 flex flex-col gap-2 text-[13px] font-medium" style={{ color: "var(--ink-secondary)" }}>
        {/* Date Row */}
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span className="font-semibold text-foreground">{formatFullDate(m.date)}</span>
        </div>

        {/* Time Row */}
        <div className="flex items-center gap-2 font-bold" style={{ color: "var(--ink-primary)" }}>
          <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>{formatTimeRange(m.time)}</span>
        </div>

        {/* Host & Pricing Row */}
        <div className="flex items-center justify-between gap-2 text-[12px]" style={{ color: "var(--ink-muted)" }}>
          <div className="flex items-center gap-2 truncate">
            <User className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span>Host: <strong className="font-bold text-foreground/80">{m.host}</strong></span>
          </div>

          <div className="text-right shrink-0 flex items-baseline gap-1">
            <span className="font-bold text-[16px]" style={{ color: "var(--accent-primary)" }}>
              ₱{m.price}
            </span>
            <span className="text-[11px] font-medium" style={{ color: "var(--ink-muted)" }}>
              your share
            </span>
          </div>
        </div>
      </div>

      {/* Footer: Capacity Ring + Spots on Left, Join CTA on Right (Below Border Line) */}
      <div className="pt-3 border-t border-border/60 dark:border-white/10 flex items-center justify-between gap-3">
        {/* Capacity Indicator & Label */}
        <div className="flex items-center gap-3">
          <CapacityRing filled={filled} max={m.max} />
          <div className="flex flex-col">
            <span className="text-[12.5px] font-bold text-foreground leading-tight">
              {isUnlimited ? `${filled} players joined` : `${filled} of ${m.max} spots filled`}
            </span>
            <span className="text-[11px] text-muted-foreground font-medium">
              {isUnlimited ? "Unlimited Spots" : full ? "Session full" : `${m.max - filled} spot${m.max - filled === 1 ? '' : 's'} left`}
            </span>
          </div>
        </div>

        {/* Join CTA Button */}
        <div className="shrink-0">
          {publicMode ? (
            <button
              onClick={onJoin}
              disabled={joined || full}
              className={`text-[14px] px-7 py-2.5 rounded-full font-bold active:scale-[0.95] transition-all duration-300 disabled:opacity-60 flex items-center justify-center gap-2 min-w-[84px] ${joined
                ? 'bg-transparent text-emerald-400 border-[1.5px] border-emerald-400 shadow-none'
                : full
                  ? 'bg-black/5 dark:bg-white/5 text-muted-foreground border-none shadow-none'
                  : 'bg-[#3B82F6] text-white border-none shadow-[0_4px_16px_rgba(59,130,246,0.35)] hover:opacity-90'
                }`}
            >
              {joined ? "Joined" : full ? "Full" : "Join"}
            </button>
          ) : (
            <VerificationGate disabled={joined || full} onVerifiedClick={handleJoin}>
              <button
                disabled={joined || full}
                className={`text-[14px] px-7 py-2.5 rounded-full font-bold active:scale-[0.95] transition-all duration-300 disabled:opacity-60 flex items-center justify-center gap-2 min-w-[84px] ${joined
                  ? 'bg-transparent text-emerald-400 border-[1.5px] border-emerald-400 shadow-none'
                  : full
                    ? 'bg-black/5 dark:bg-white/5 text-muted-foreground border-none shadow-none'
                    : 'bg-[#3B82F6] text-white border-none shadow-[0_4px_16px_rgba(59,130,246,0.35)] hover:opacity-90'
                  }`}
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.7, ease: "linear" }}
                    className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full"
                  />
                ) : joined ? (
                  "Joined"
                ) : full ? (
                  "Full"
                ) : (
                  "Join"
                )}
              </button>
            </VerificationGate>
          )}
        </div>
      </div>

      {/* Join Confirm Modal */}
      {mounted && createPortal(
        <AnimatePresence>
          {showJoinConfirm && (
            <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/40 backdrop-blur-[2px] dark:bg-black/50"
                onClick={() => setShowJoinConfirm(false)}
              />
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 400 }}
                className="relative w-full max-w-sm flex flex-col gap-2 z-[610] items-center"
              >
                <div className="w-full max-w-[340px] bg-surface-overlay dark:bg-[#13223F] rounded-3xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.5)] border border-border dark:border-white/12">
                  <div className="p-6 text-center pb-5">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4 text-emerald-500 dark:text-emerald-400">
                      <span className="text-[24px]">🤝</span>
                    </div>
                    <h3 className="text-lg font-bold text-foreground tracking-tight mb-2">Join Match?</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed font-medium px-2">
                      Join <span className="font-bold text-foreground">{m.level}</span> match at <span className="font-bold text-foreground">{m.facility}</span> on <span className="font-bold text-foreground">{formatFullDate(m.date)}</span> for <span className="font-bold text-emerald-500 dark:text-emerald-400">₱{m.price}</span>?
                    </p>
                  </div>
                  <div className="p-5 pt-0 flex gap-2.5">
                    <button
                      onClick={() => setShowJoinConfirm(false)}
                      className="flex-1 py-3 rounded-xl text-xs font-semibold text-foreground bg-surface-interactive hover:bg-surface-interactive/80 border border-border active:scale-[0.98] transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmJoin}
                      disabled={isSimulating || simSuccess}
                      className="flex-[1.5] py-3 rounded-xl text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSimulating ? (
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.7, ease: "linear" }}
                          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                      ) : simSuccess ? (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
                          <Check className="w-5 h-5 text-white" />
                        </motion.div>
                      ) : (
                        "Confirm & Join"
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </motion.div>
  );
}

// Custom comparison function for React.memo that skips function prop comparison
function areEqual(prevProps: any, nextProps: any) {
  // Compare the match object reference (if it changes, we want to re-render)
  if (prevProps.m !== nextProps.m) return false;
  // Compare primitive props
  if (prevProps.publicMode !== nextProps.publicMode) return false;
  if (prevProps.joined !== nextProps.joined) return false;
  // We do not compare onJoin because it may be a new function each render.
  // If the parent wraps onJoin in useCallback, this will still work.
  // If not, the component will re-render when onJoin changes, which is fine.
  return true;
}

export const MatchCard = memo(MatchCardInner, areEqual);
export default MatchCard;