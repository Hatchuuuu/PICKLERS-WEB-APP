"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { CalendarDays, Wallet, AlertTriangle, Navigation, Map, PlusCircle, ArrowDownLeft, ArrowUpRight, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/contexts/AppContext";
import { useToast } from "@/contexts/ToastContext";
import { NavigationOverlay } from "@/components/shared/NavigationOverlay";
import { useWallet } from "@/hooks/useWallet";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { QRTicketModal } from "@/components/modals/QRTicketModal";

export default function BookingsTab() {
  const { bookings, setBookings, setJoinedMatches } = useApp();
  type BookingType = typeof bookings[0];
  const { user } = useAuth();
  
  const [tab, setTab] = useState("Upcoming");
  const [cancelModal, setCancelModal] = useState<BookingType | null>(null);
  const [ticketModalBooking, setTicketModalBooking] = useState<BookingType | null>(null);
  const [navigatingTo, setNavigatingTo] = useState<BookingType | null>(null);
  const { showToast } = useToast();
  const { data: wallet } = useWallet();

  const [transactions, setTransactions] = useState<{ id: string; label: string; amount: string; date: string; isDebit: boolean }[]>([]);

  useEffect(() => {
    async function fetchTransactions() {
      const isDemo = user?.isDemo || user?.role === "demo";
      if (isDemo) {
        setTransactions([
          { id: "1", label: "Refund — BGC Hub Court 2", amount: "+₱400", date: "Jun 28", isDebit: false },
          { id: "2", label: "Refund — SM Southmall Court 1", amount: "+₱800", date: "Jun 15", isDebit: false },
        ]);
        return;
      }

      if (!user?.id || !supabase?.from) return;
      try {
        const { data, error } = await supabase
          .from("wallet_transactions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0) {
          const formatted = data.map((t: any) => {
            const numAmount = Number(t.amount);
            const isDebit = t.type === "payment" || numAmount < 0;
            const absVal = Math.abs(numAmount);
            return {
              id: t.id,
              label: t.label,
              amount: `${isDebit ? "-" : "+"}₱${absVal.toLocaleString()}`,
              date: new Date(t.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric" }),
              isDebit,
            };
          });
          setTransactions(formatted);
        } else {
          setTransactions([]);
        }
      } catch (err) {
        console.warn("Wallet transactions fetch warning:", err);
      }
    }
    fetchTransactions();
  }, [user]);
  
  const tabs = ["Upcoming", "Completed", "Refunds", "Cancelled", "Wallet"];
  const filtered = tab === "Wallet" || tab === "Refunds" ? [] : bookings.filter(b => b.status === tab.toLowerCase());

  async function handleCancelConfirm() {
    if (!cancelModal) return;

    try {
      const res = await fetch("/api/bookings/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: cancelModal.id }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        showToast(data.error || "Failed to cancel booking.", "error");
        setCancelModal(null);
        return;
      }

      setBookings(prev => prev.map(b => b.id === cancelModal.id ? { ...b, status: "cancelled" } : b));

      // Clear joinedMatches for open play
      if (cancelModal.id.startsWith("PKL-OP-")) {
        const matchId = parseInt(cancelModal.id.replace("PKL-OP-", "").slice(0, -3));
        if (!isNaN(matchId)) {
          setJoinedMatches(prev => {
            const next = new Set(prev);
            next.delete(matchId);
            return next;
          });
        }
      }

      const refundAmount = data.result?.refund_amount || 0;
      if (data.result?.refunded) {
        const label = `Refund — ${cancelModal.court || cancelModal.facility}`;
        const todayLabel = new Date().toLocaleDateString("en-PH", { month: "short", day: "numeric" });
        setTransactions(prev => [{ id: String(Date.now()), label, amount: `+₱${refundAmount.toLocaleString()}`, date: todayLabel, isDebit: false }, ...prev]);
        showToast(`Booking cancelled. ₱${refundAmount.toLocaleString()} Pickle Credits refunded.`, "success");
      } else {
        showToast("Booking cancelled. No refund available for cancellations within 24 hours (venue policy applies).", "error");
      }
    } catch (err: unknown) {
      console.error("Error cancelling booking:", err);
      showToast("Error processing cancellation. Please try again.", "error");
    } finally {
      setCancelModal(null);
    }
  }

  // Helper function to check if a booking is within 24 hours of its
  // start time. P1.3: the previous version parsed the date string three
  // times (today/tomorrow/yesterday aliases, then `new Date(dateStr)`, then
  // the time regex). It also had a silent fallback that returned
  // `today === today` when the time format didn't match, which gave a
  // false "within 24h" for any same-day booking. The new implementation
  // does a single parse, accepts both 12h and 24h formats, and refuses
  // ambiguous input rather than guessing.
  function isBookingWithin24Hours(dateStr: string, timeStr: string): boolean {
    const startTime = parseBookingStart(dateStr, timeStr);
    if (!startTime) {
      // Refuse to refund: a booking we can't parse is conservatively
      // treated as imminent. The product team should fix the data
      // upstream rather than silently granting refunds on bad input.
      console.warn('[bookings] unable to parse date/time for refund check', { dateStr, timeStr });
      return true;
    }
    const hoursUntil = (startTime.getTime() - Date.now()) / (1000 * 60 * 60);
    return hoursUntil > 0 && hoursUntil <= 24;
  }

  // Single-pass parser. Accepts:
  //   dateStr: "YYYY-MM-DD" (ISO), "Today", "Tomorrow", "Yesterday", or
  //            any string Date() can parse unambiguously.
  //   timeStr: "10:00 AM", "10:00am", "14:00", or a slot like
  //            "10:00 AM – 11:00 AM" (we use the start).
  function parseBookingStart(dateStr: string, timeStr: string): Date | null {
    if (!dateStr) return null;
    const lowerDate = dateStr.toLowerCase().trim();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let baseDate: Date | null = null;
    if (lowerDate === 'today') {
      baseDate = new Date(today);
    } else if (lowerDate === 'tomorrow') {
      baseDate = new Date(today);
      baseDate.setDate(baseDate.getDate() + 1);
    } else if (lowerDate === 'yesterday') {
      baseDate = new Date(today);
      baseDate.setDate(baseDate.getDate() - 1);
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      // ISO date: parse as LOCAL midnight, not UTC. `new Date("YYYY-MM-DD")`
      // is UTC, which shifts by the timezone offset and gives wrong results.
      const [y, m, d] = dateStr.split('-').map(Number);
      if (!y || !m || !d) return null;
      baseDate = new Date(y, m - 1, d, 0, 0, 0, 0);
    } else {
      const parsed = new Date(dateStr);
      if (Number.isNaN(parsed.getTime())) return null;
      baseDate = parsed;
      baseDate.setHours(0, 0, 0, 0);
    }
    if (!baseDate) return null;

    // Parse the start of the time slot. "10:00 AM – 11:00 AM" → "10:00 AM".
    const timeOnly = (timeStr || '').split(/[–—\-]/)[0].trim();
    if (!timeOnly) return null;

    const m = timeOnly.match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
    if (!m) return null;
    let hours = parseInt(m[1], 10);
    const minutes = parseInt(m[2], 10);
    const ampm = (m[3] || '').toUpperCase();
    if (hours < 0 || hours > 24 || minutes < 0 || minutes > 59) return null;
    if (ampm === 'PM' && hours !== 12) hours += 12;
    else if (ampm === 'AM' && hours === 12) hours = 0;
    if (ampm === '' && hours > 23) return null;

    baseDate.setHours(hours, minutes, 0, 0);
    return baseDate;
  }

  return (
    <div className="p-4 relative max-w-6xl mx-auto w-full">
      <div className="relative h-[68px] mb-4 -mt-[1px] flex items-center justify-between">
        <AnimatePresence>
          <motion.div 
            key="title" 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: -20 }}
            className="absolute left-0 top-0 max-w-[calc(100%-20px)]"
          >
            <h1 className="text-[32px] font-extrabold tracking-tight leading-none mb-1.5" style={{ color: "var(--ink-primary)" }}>
              Bookings
            </h1>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 truncate">Manage your bookings</p>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="flex gap-6 mb-6 overflow-x-auto pb-0 scrollbar-none -mx-4 px-4 md:mx-0 md:px-0 border-b border-border">
        {tabs.map(t => {
          const active = tab === t;
          return (
            <button key={t} onClick={() => setTab(t)}
              className={cn(
                "relative pb-3 text-[14px] font-bold tracking-wide transition-colors whitespace-nowrap",
                active ? "text-foreground" : "text-slate-500 dark:text-slate-400 hover:text-foreground"
              )}>
              {t}
              {active && (
                <motion.div
                  layoutId="bookings-tab-underline"
                  className="absolute left-0 right-0 bottom-0 h-[3px] bg-emerald-500 rounded-t-full"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}
        {/* Spacer to fix right padding on horizontal scroll */}
        <div className="w-3 shrink-0 md:hidden" />
      </div>

      {tab === "Refunds" ? (
        <div className="text-center py-20 text-muted-foreground">
          <Wallet className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium text-foreground mb-1">No Refunds</p>
          <p className="text-xs">Cancelled bookings within the safe window appear here as Pickle Credits.</p>
        </div>
      ) : tab === "Wallet" ? (
        <div className="max-w-3xl space-y-6">
          {/* Main Balance Card */}
          <div className="relative overflow-hidden rounded-3xl p-6 sm:p-7 border border-emerald-500/25 bg-gradient-to-br from-emerald-950/60 via-slate-900 to-emerald-900/40 shadow-xl backdrop-blur-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            {/* Decorative Glow */}
            <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

            <div className="flex flex-col min-w-0">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 mb-1">
                <Wallet className="w-3.5 h-3.5" /> Pickle Credits Balance
              </div>
              <div className="text-4xl sm:text-5xl font-black tracking-tight text-white font-sans my-1">
                ₱{(wallet?.balance || 0).toLocaleString()}
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-[11.5px] font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-3 py-0.5 rounded-full inline-flex items-center gap-1">
                  ~≈ {Math.floor((wallet?.balance || 0) / 400)} court sessions
                </span>
              </div>
            </div>

            <Link
              href="/app/wallet"
              className="shrink-0 text-xs sm:text-sm font-extrabold px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white shadow-[0_4px_16px_rgba(16,185,129,0.4)] border border-emerald-400/40 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-4 h-4" /> Top Up Credits
            </Link>
          </div>

          {/* Recent Transactions List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[11px] sm:text-[12px] font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 px-1">
              <span>Recent Transactions</span>
              <span className="text-slate-400 font-semibold lowercase">({transactions.length})</span>
            </div>

            <div className="bg-surface-base dark:bg-white/[0.03] border border-border dark:border-white/10 rounded-2xl p-2 sm:p-3 shadow-sm backdrop-blur-xl divide-y divide-border/60 dark:divide-white/5">
              {transactions.length === 0 ? (
                <div className="text-xs text-slate-400 dark:text-slate-400 py-8 text-center font-medium">
                  No recent wallet transactions
                </div>
              ) : (
                transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border ${
                        tx.isDebit 
                          ? "bg-red-500/10 border-red-500/20 text-red-500 dark:text-red-400" 
                          : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500 dark:text-emerald-400"
                      }`}>
                        {tx.isDebit ? (
                          <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                        ) : (
                          <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-foreground dark:text-white truncate">{tx.label}</div>
                        <div className="text-[12px] font-medium text-slate-500 dark:text-slate-400">{tx.date}</div>
                      </div>
                    </div>
                    <span className={`text-[15px] font-black tracking-tight shrink-0 ${
                      tx.isDebit ? "text-red-500 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"
                    }`}>
                      {tx.amount}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No {tab.toLowerCase()} bookings</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((b, i) => (
              <motion.div key={b.id} layout initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95, y: -16 }} transition={{ delay: i * 0.04, ease: [0.23, 1, 0.32, 1], duration: 0.6 }}
                className="rounded-[24px] p-5 flex flex-col gap-4 transition-transform duration-500 hover:-translate-y-1 relative bg-surface-base shadow-md border border-border dark:bg-white/[0.03] dark:shadow-[0_16px_40px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.1)] dark:border-white/[0.12] backdrop-blur-xl">
                {b.isNew && (
                  <motion.div className="absolute inset-0 rounded-[24px] border border-emerald-400 pointer-events-none"
                    initial={{ opacity: 0, boxShadow: "inset 0 0 0px rgba(52,211,139,0)" }}
                    animate={{ opacity: [0, 1, 0, 1, 0], boxShadow: ["inset 0 0 0px rgba(52,211,139,0)", "inset 0 0 20px rgba(52,211,139,0.2)", "inset 0 0 0px rgba(52,211,139,0)", "inset 0 0 20px rgba(52,211,139,0.2)", "inset 0 0 0px rgba(52,211,139,0)"] }}
                    transition={{ duration: 4, times: [0, 0.1, 0.5, 0.6, 1] }}
                  />
                )}
                
                {/* Header: Court Title & Price */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-[18px] font-bold tracking-tight text-foreground leading-snug">{b.court}</div>
                    <div className="mt-1">
                      <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-secondary border border-border text-muted-foreground inline-block">
                        #{b.id.replace(/[^A-Za-z0-9]/g, '').slice(-6).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-cyan-400 font-bold font-mono text-[16px]">₱{(b.total ?? b.price ?? 0).toLocaleString()}</div>
                    {b.payment && <div className="text-[10px] text-muted-foreground">{b.payment}</div>}
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-medium text-muted-foreground flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center shrink-0">
                      <Map className="w-3 h-3 text-muted-foreground" />
                    </span>
                    {b.facility}
                  </div>
                  <div className="text-[13px] font-medium text-muted-foreground mt-1.5 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center shrink-0">
                      <CalendarDays className="w-3 h-3 text-muted-foreground" />
                    </span>
                    {b.date} • {b.time}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between gap-2 pt-3.5 border-t border-border dark:border-white/[0.05]">
                  <div>
                    {b.status === "upcoming" && (
                      <button
                        onClick={() => setCancelModal(b)}
                        className="px-3 py-1.5 rounded-xl text-[12px] font-semibold text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {(b.status === "upcoming" || b.status === "completed") && (
                      <button 
                        onClick={() => setTicketModalBooking(b)}
                        className="px-3.5 py-2 rounded-xl text-[12px] font-bold transition-all active:scale-[0.95] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 flex items-center gap-1.5"
                      >
                        <QrCode className="w-3.5 h-3.5" /> View Pass
                      </button>
                    )}
                    {b.status === "upcoming" && (
                      <button
                        onClick={() => setNavigatingTo(b)}
                        className="px-4 py-2 rounded-full text-[12px] font-bold transition-all active:scale-[0.95] bg-[#3B82F6] text-white border-none shadow-[0_4px_16px_rgba(59,130,246,0.35)] hover:opacity-90 flex items-center gap-1.5"
                      >
                        <Navigation className="w-3.5 h-3.5 text-white" /> Navigate
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Cancellation Modal */}
      <AnimatePresence>
        {cancelModal && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-[2px] dark:bg-black/50"
              onClick={() => setCancelModal(null)}
            />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: "spring", damping: 25, stiffness: 400 }}
              className="relative z-[610] w-full max-w-[360px]"
            >
              <div className="bg-surface-overlay dark:bg-[#13223F] border border-border dark:border-white/12 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.5)] p-6 text-center flex flex-col items-center">
                 <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20 mb-4 text-red-500 dark:text-red-400">
                   <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
                 </div>
                 <h3 className="text-[20px] font-black text-foreground tracking-tight mb-2">Cancel Booking?</h3>
                 <p className="text-[13.5px] text-muted-foreground font-medium leading-relaxed px-1 mb-2">
                   {isBookingWithin24Hours(cancelModal.date, cancelModal.time) ? (
                    <>Cancel reservation for <span className="text-foreground font-extrabold">{cancelModal.court}</span>? <span className="text-red-500 dark:text-red-400 font-bold block mt-2 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-[12.5px]">⚠️ No refund available for cancellations within 24 hours of start time (venue policy).</span></>
                   ) : (
                    <>Cancel reservation for <span className="text-foreground font-extrabold">{cancelModal.court}</span>? You will receive <span className="text-emerald-500 dark:text-emerald-400 font-black">₱{(cancelModal.total ?? cancelModal.price ?? 0).toLocaleString()}</span> in Pickle Credits.</>
                   )}
                 </p>
                 <div className="flex gap-3 w-full mt-5">
                   <button
                     type="button"
                     onClick={() => setCancelModal(null)}
                     className="flex-1 py-3 rounded-xl text-[14px] font-bold text-foreground bg-surface-interactive hover:bg-surface-interactive/80 border border-border transition-all active:scale-[0.98] cursor-pointer"
                   >
                     No
                   </button>
                   <button
                     type="button"
                     onClick={handleCancelConfirm}
                     className="flex-1 py-3 rounded-xl text-[14px] font-extrabold text-white bg-red-500 hover:bg-red-600 shadow-md transition-all active:scale-[0.98] cursor-pointer"
                   >
                     Yes
                   </button>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {navigatingTo && (
        <NavigationOverlay 
          destination={navigatingTo.facility} 
          destLat={(navigatingTo as any).destLat || (navigatingTo as any).lat}
          destLng={(navigatingTo as any).destLng || (navigatingTo as any).lng}
          onClose={() => setNavigatingTo(null)} 
        />
      )}

      <QRTicketModal 
        isOpen={!!ticketModalBooking}
        onClose={() => setTicketModalBooking(null)}
        booking={ticketModalBooking}
      />
    </div>
  );
}
