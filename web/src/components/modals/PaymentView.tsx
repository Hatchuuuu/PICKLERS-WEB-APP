"use client";

import { useState } from "react";
import { useRouter } from 'next/navigation';
import { supabase } from "@/lib/supabase";

import { motion, AnimatePresence } from "motion/react";
import { ChevronRight, Check, CreditCard, Banknote, Coins } from "lucide-react";
import { slotHours } from "@/lib/timeUtils";
import { PaymentData } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import { LockedFeatureWrapper } from "@/components/ui/LockedFeatureWrapper";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";

export function PaymentView({ data, onBack, onDone }: { data: PaymentData; onBack: () => void; onDone: () => void }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setBookings } = useApp();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [method, setMethod] = useState<"gcash" | "maya" | "cash" | "credits">("gcash");
  const [stage, setStage] = useState<"idle" | "processing" | "success" | "failed">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const hours = slotHours(data.startTime, data.endTime);
  const subtotal = hours * data.court.price;
  const fee = Math.round(subtotal * 0.08);
  const total = subtotal + fee;

  const today = new Date();
  const dateLabel = data.date === today.toISOString().split("T")[0]
    ? "Today"
    : new Date(data.date + "T00:00:00").toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });

  async function handleConfirm() {
    if (user?.isDemo || user?.role === "demo") {
      showToast("This is a demo — sign up to book for real!", "error");
      return;
    }
    setStage("processing");
    try {

      if (navigator.vibrate) navigator.vibrate([20, 10, 40]);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setStage("failed");
        setErrorMsg("You must be logged in to book a court.");
        return;
      }

      const { data: insertedBooking, error } = await supabase.from('bookings').insert({
        user_id: session.user.id,
        facility_id: data.facility.id,
        court_name: data.court.name,
        date: data.date,
        time: `${data.startTime} – ${data.endTime}`,
        duration: `${hours}h`,
        price: total,
        status: "upcoming"
      }).select('*, facilities(name)').single();

      if (error) throw error;

      if (insertedBooking) {
        setBookings(prev => [{
            id: String(insertedBooking.id),
            facility_id: Number(insertedBooking.facility_id),
            facility: String((insertedBooking.facilities as any)?.name || data.facility.name),
            court: String(insertedBooking.court_name),
            court_name: String(insertedBooking.court_name),
            date: String(insertedBooking.date),
            time: String(insertedBooking.time),
            duration: String(insertedBooking.duration),
            price: Number(insertedBooking.price),
            status: "upcoming",
            players: []
        }, ...prev]);
      }

      // Update react-query cache for the owner view
      const newRequest = {
        id: `PKL-${Math.floor(Math.random() * 10000)}`,
        player: session.user.user_metadata?.full_name || "Player",
        court: data.court.name,
        time: `${data.date} · ${data.startTime} – ${data.endTime}`,
        total: total
      };
      queryClient.setQueryData(['bookingRequests'], (old: unknown) => [newRequest, ...((old as Record<string, unknown>[]) || [])]);

      setStage("success");
    } catch (err: unknown) {
      console.error(err);
      setStage("failed");
      setErrorMsg("Failed to connect to the database. Please try again.");
    }
  }

  return (
    <AnimatePresence mode="wait">
      {stage === "success" ? (
      <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="flex flex-col items-center justify-center min-h-[85vh] px-6 text-center">
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 30, delay: 0.1 }}
          className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
          style={{ background: "rgba(52,211,153,0.15)", border: "2px solid rgba(34,197,94,0.4)" }}>
          <motion.svg className="w-12 h-12 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
            <motion.path
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
              d="M20 6L9 17l-5-5"
            />
          </motion.svg>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, ease: "easeOut" }}>
          <h2 className="text-3xl font-bold mb-2" >BOOKING CONFIRMED!</h2>
          <p className="text-muted-foreground text-sm mb-1">
            <span className="text-foreground font-medium">{data.court.name}</span> at {data.facility.name}
          </p>
          <p className="text-muted-foreground text-sm mb-8">
            {dateLabel} · {data.startTime} – {data.endTime}
          </p>
          <div className="flex items-center justify-center gap-2 mb-8 px-5 py-3 rounded-xl"
            style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)" }}>
            <span className="text-emerald-400 text-sm font-medium">Total paid:</span>
            <span className="text-emerald-400 font-bold font-mono text-lg">₱{total.toLocaleString()}</span>
          </div>
          <button onClick={() => {
              router.push("/app/bookings");
              onDone();
            }}
            className="px-8 py-3.5 rounded-xl font-semibold text-sm active:scale-[0.97]"
            style={{ background: "var(--accent-success)", color: "#fff", transition: "opacity 150ms ease-out, transform 100ms ease-out" }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
            View Bookings
          </button>
        </motion.div>
      </motion.div>
      ) : stage === "failed" ? (
      <motion.div key="failed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 30, delay: 0.1 }}
          className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
          style={{ background: "rgba(239,68,68,0.15)", border: "2px solid rgba(239,68,68,0.4)" }}>
          <div className="w-12 h-12 flex items-center justify-center">
            <span className="text-4xl text-red-500 font-bold" >!</span>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, ease: "easeOut" }}>
          <h2 className="text-2xl font-bold mb-2 text-foreground" >PAYMENT FAILED</h2>
          <p className="text-muted-foreground text-sm mb-8 max-w-[280px] mx-auto">
            {errorMsg || "Your payment could not be processed at this time."}
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => setStage("idle")}
              className="px-6 py-3 rounded-xl font-semibold text-sm active:scale-[0.97]"
              style={{ background: "var(--accent-primary)", color: "#fff" }}>
              Try Again
            </button>
            <button onClick={onBack}
              className="px-6 py-3 rounded-xl font-semibold text-sm active:scale-[0.97]"
              style={{ background: "var(--surface-raised)", color: "var(--ink-primary)", border: "1px solid var(--border-default)" }}>
              Cancel
            </button>
          </div>
        </motion.div>
      </motion.div>
      ) : (
    <motion.div key="idle" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
      transition={{ ease: "easeOut", duration: 0.22 }} className="min-h-full">

      {/* Header */}
      <div className="sticky top-0 z-10 bg-surface-base/95 dark:bg-[#080f2e]/95 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-3 px-6 py-5 w-full">
          <button onClick={onBack} aria-label="Go Back"
            className="group flex items-center justify-center shrink-0 w-11 h-11 rounded-full transition-all active:scale-95 shadow-sm bg-surface-interactive border border-border text-muted-foreground hover:bg-black/5 hover:text-foreground dark:bg-white/[0.03] dark:border-white/[0.08] dark:text-[var(--ink-secondary)] dark:hover:bg-white/[0.08] dark:hover:text-[var(--ink-primary)]"
          >
            <ChevronRight className="w-6 h-6 rotate-180 transition-transform group-hover:-translate-x-0.5" />
          </button>
          <div>
            <h1 className="text-lg font-bold leading-none" >PAYMENT</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Review and confirm your booking</p>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-lg mx-auto w-full">

        {/* Booking summary card */}
        <div className="rounded-2xl overflow-hidden mb-6"
          style={{ background: "var(--surface-raised)", border: "1px solid var(--border-default)", boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}>

          {/* Court image strip */}
          <div className="h-28 relative overflow-hidden bg-secondary">
            <img src={data.facility.image} alt={data.facility.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent dark:from-[#0f1d47]/95" />
            <div className="absolute bottom-3 left-4 right-4">
              <div className="text-xs text-white/80 dark:text-blue-200 mb-0.5">{data.facility.name}</div>
              <div className="text-base font-bold text-white" >
                {data.court.name}
                <span className="ml-2 text-xs px-1.5 py-0.5 rounded-md font-medium align-middle"
                  style={{ background: data.court.type === "Indoor" ? "var(--border-emphasis)" : "rgba(251,191,36,0.2)", color: data.court.type === "Indoor" ? "var(--accent-primary)" : "#fbbf24" }}>
                  {data.court.type}
                </span>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="px-5 py-4 space-y-3">
            {[
              { label: "Date", value: dateLabel },
              { label: "Time", value: `${data.startTime} – ${data.endTime}` },
              { label: "Duration", value: `${hours} hour${hours !== 1 ? "s" : ""}` },
              { label: "Surface", value: data.court.surface },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{row.label}</span>
                <span className="text-sm text-foreground font-medium">{row.value}</span>
              </div>
            ))}

            <div className="pt-3 mt-1 space-y-2 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Court fee ({hours}h × ₱{data.court.price})</span>
                <span className="text-sm font-mono text-foreground">₱{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Service fee (8%)</span>
                <span className="text-sm font-mono text-muted-foreground">₱{fee.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-sm font-semibold text-foreground">Total</span>
                <span className="text-xl font-bold font-mono text-cyan-400">₱{total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment method */}
        <div className="mb-8">
          <h3 className="text-[13px] font-medium text-muted-foreground uppercase tracking-wide mb-2 px-4">Payment</h3>
          <div className="flex flex-col rounded-[16px] overflow-hidden bg-surface-base/60 backdrop-blur-3xl border border-border shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)]">
            {([
              { id: "gcash", label: "GCash", sub: "Instant online payment", icon: <img src="/gcash.svg" alt="GCash" className="w-[115%] h-[115%] object-contain" />, iconBg: "#fff", recommended: true },
              { id: "maya", label: "Maya", sub: "Pay via Maya wallet", icon: <span className="font-black text-[15px] tracking-tighter" style={{ color: "#42d6a4", fontFamily: "system-ui, sans-serif", letterSpacing: "-0.5px" }}>maya</span>, iconBg: "#fff", recommended: false },
              { id: "cash", label: "Cash on Site", sub: "Pay at the front desk", icon: <Banknote className="w-5 h-5 text-foreground" strokeWidth={2.5} />, iconBg: "#8E8E93", recommended: false },
              { id: "credits", label: "Pickle Credits", sub: `Balance: ₱1,200`, icon: <Coins className="w-5 h-5 text-foreground" strokeWidth={2.5} />, iconBg: "#34C759", recommended: false },
            ] as const).map((opt, i) => {
              const optionNode = (
                <button onClick={() => setMethod(opt.id)}
                  className="flex items-center pl-4 text-left w-full transition-colors hover:bg-surface-interactive border border-border active:bg-surface-raised border border-border/[0.12]">

                  {/* iOS Style Icon */}
                  <div className="w-[30px] h-[30px] rounded-[7px] flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden shadow-sm border border-black/10"
                    style={{ background: opt.iconBg }}>
                    {opt.icon}
                  </div>

                  {/* Text Container with iOS inset divider */}
                  <div className="flex-1 min-w-0 py-3 ml-3.5 pr-4 flex items-center border-b border-border"
                    style={{ borderBottomWidth: i === 3 ? 0 : 1 }}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[17px] text-foreground tracking-[-0.3px] leading-tight" style={{ fontFamily: "system-ui, -apple-system, sans-serif", fontWeight: 500 }}>{opt.label}</span>
                        {opt.recommended && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold tracking-tight border border-[var(--accent-primary)]/20"
                            style={{ background: "rgba(0, 212, 255, 0.1)", color: "var(--accent-primary)" }}>Recommended</span>
                        )}
                      </div>
                      <div className="text-[14px] text-[#8e8e93] mt-0.5 tracking-[-0.1px] leading-tight" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>{opt.sub}</div>
                    </div>

                    {/* iOS Blue Checkmark */}
                    <div className="shrink-0 flex items-center justify-center w-6 h-6">
                      {method === opt.id && (
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        >
                          <Check className="w-5 h-5 text-[#0A84FF]" strokeWidth={3} />
                        </motion.div>
                      )}
                    </div>
                  </div>
                </button>
              );

              return (
                <div key={opt.id} className="relative group">
                  {opt.id === "cash" ? (
                    <LockedFeatureWrapper featureLabel="use Cash on Site payment" showLockIcon={false}>
                      {optionNode}
                    </LockedFeatureWrapper>
                  ) : (
                    optionNode
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Confirm button */}
        <button onClick={() => setShowConfirm(true)} disabled={stage === "processing"}
          className="w-full py-3.5 rounded-[14px] font-semibold text-[17px] active:scale-[0.97] disabled:opacity-70 flex items-center justify-center gap-3 transition-transform"
          style={{
            background: "var(--accent-primary)",
            color: "#000",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
          }}>
          {stage === "processing" ? (
            <>
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full" />
              Processing…
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5 opacity-80" />
              Pay ₱{total.toLocaleString()}
            </>
          )}
        </button>

        <p className="text-xs text-center text-muted-foreground mt-4">
          By confirming, you agree to Picklers' booking and cancellation policy.
        </p>
      </div>

      {/* Payment Confirmation Action Sheet */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-4 pb-24 sm:pb-8">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-surface-base/40 backdrop-blur-sm"
              onClick={() => setShowConfirm(false)}
            />

            <motion.div
              initial={{ y: "100%", opacity: 0.5 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="relative w-full max-w-sm flex flex-col gap-2 z-10"
            >
              <div className="w-full max-w-sm bg-black/20 dark:bg-[#0A1118]/80 backdrop-blur-3xl rounded-[24px] overflow-hidden shadow-xl dark:shadow-2xl border border-black/5 dark:border-white/[0.08]">
                <div className="p-6 text-center pb-6">
                  <div className="w-16 h-16 rounded-[22px] bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 flex items-center justify-center mx-auto mb-6 ring-1 ring-emerald-500/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
                    <CreditCard className="w-8 h-8 text-emerald-400 drop-shadow-[0_2px_8px_rgba(16,185,129,0.4)]" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-[22px] font-bold text-foreground tracking-tight mb-2">Confirm Payment</h3>
                  <p className="text-[15px] text-foreground/70 leading-relaxed font-medium">
                    You will be charged <span className="font-semibold text-foreground">₱{total.toLocaleString()}</span> via <span className="font-semibold text-foreground">{method === 'gcash' ? 'GCash' : method === 'maya' ? 'Maya' : method === 'cash' ? 'Cash on Site' : 'Pickle Credits'}</span>.
                  </p>
                </div>
                <div className="p-5 pt-0 flex gap-3">
                  <button onClick={() => setShowConfirm(false)} className="flex-1 py-4 rounded-[20px] text-[16px] font-semibold text-foreground bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 active:scale-[0.98] transition-all">
                    Cancel
                  </button>
                  <button onClick={() => { setShowConfirm(false); handleConfirm(); }} className="flex-[1.5] py-4 rounded-[20px] text-[16px] font-bold text-white bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-400 active:scale-[0.98] transition-all shadow-[0_8px_20px_rgba(16,185,129,0.25)] ring-1 ring-emerald-400/50">
                    Pay Now
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
      )}
    </AnimatePresence>
  );
}
