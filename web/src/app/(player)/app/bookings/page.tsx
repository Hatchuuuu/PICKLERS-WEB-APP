"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CalendarDays, Wallet, AlertTriangle, Navigation, Map } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/contexts/AppContext";
import { useToast } from "@/contexts/ToastContext";
import { NavigationOverlay } from "@/components/shared/NavigationOverlay";
import { useWallet } from "@/hooks/useWallet";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

import { QRTicketModal } from "@/components/modals/QRTicketModal";
import { QrCode } from "lucide-react";

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

  const [transactions, setTransactions] = useState<{ id: string; label: string; amount: string; date: string }[]>([
    { id: "1", label: "Refund — BGC Hub Court 2", amount: "+₱400", date: "Jun 28" },
    { id: "2", label: "Refund — SM Southmall Court 1", amount: "+₱800", date: "Jun 15" },
  ]);

  useEffect(() => {
    async function fetchTransactions() {
      if (!user?.id) return;
      try {
        const { data, error } = await supabase
          .from("wallet_transactions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0) {
          const formatted = data.map((t: any) => ({
            id: t.id,
            label: t.label,
            amount: `+₱${Number(t.amount).toLocaleString()}`,
            date: new Date(t.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric" }),
          }));
          setTransactions(formatted);
        }
      } catch (err) {
        console.warn("Wallet transactions fetch warning:", err);
      }
    }
    fetchTransactions();
  }, [user?.id]);
  
  const tabs = ["Upcoming", "Completed", "Refunds", "Cancelled", "Wallet"];
  const filtered = tab === "Wallet" || tab === "Refunds" ? [] : bookings.filter(b => b.status === tab.toLowerCase());

  async function handleCancelConfirm() {
    if (!cancelModal) return;

    // Check if cancellation is within 24 hours
    const isWithin24Hours = isBookingWithin24Hours(cancelModal.date, cancelModal.time);

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

    // Show toast with appropriate message based on timing
    if (isWithin24Hours) {
      showToast(`Booking cancelled. No refund available for cancellations within 24 hours (venue policy applies).`, "error");
    } else {
      const refundAmount = cancelModal.total ?? cancelModal.price ?? 0;
      const label = `Refund — ${cancelModal.court || cancelModal.facility}`;
      const todayLabel = new Date().toLocaleDateString("en-PH", { month: "short", day: "numeric" });
      
      // Update local transactions state optimistically
      setTransactions(prev => [{ id: String(Date.now()), label, amount: `+₱${refundAmount.toLocaleString()}`, date: todayLabel }, ...prev]);

      // Save to Supabase if logged in
      if (user?.id) {
        try {
          await supabase.from("wallet_transactions").insert({
            user_id: user.id,
            label,
            amount: refundAmount,
            type: "refund"
          });
        } catch (e) {
          console.warn("Could not insert transaction to DB:", e);
        }
      }

      showToast(`Booking cancelled. ₱${refundAmount.toLocaleString()} Pickle Credits refunded.`, "success");
    }
    setCancelModal(null);
  }

// Helper function to check if a booking is within 24 hours
  function isBookingWithin24Hours(dateStr: string, timeStr: string): boolean {
    try {
      // Get current time once to ensure consistency
      const now = new Date();

      // Parse the date string (handles formats like "Tomorrow", "Today", "July 20, 2026", etc.)
      let bookingDate: Date;

      // Today at 00:00:00
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const lowerDate = dateStr.toLowerCase().trim();

      if (lowerDate === "today") {
        bookingDate = today;
      } else if (lowerDate === "tomorrow") {
        bookingDate = new Date(today);
        bookingDate.setDate(bookingDate.getDate() + 1);
      } else if (lowerDate === "yesterday") {
        bookingDate = new Date(today);
        bookingDate.setDate(bookingDate.getDate() - 1);
      } else {
        // Try to parse as a standard date format
        const parsedDate = new Date(dateStr);
        if (isNaN(parsedDate.getTime())) {
          // If parsing fails, assume it's not within 24 hours to be safe
          return false;
        }
        bookingDate = parsedDate;
      }

      // Parse the time string (format: "6:00 PM - 8:00 PM")
      // We'll use the start time for our calculation
      const timeMatch = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (!timeMatch) {
        // If we can't parse the time, check if the date is today
        return bookingDate.getTime() === now.getTime();
      }

      let hours = parseInt(timeMatch[1]);
      const minutes = parseInt(timeMatch[2]);
      const ampm = timeMatch[3].toUpperCase();

      // Convert to 24-hour format
      if (ampm === "PM" && hours !== 12) {
        hours += 12;
      } else if (ampm === "AM" && hours === 12) {
        hours = 0;
      }

      // Set the booking date to the parsed time
      bookingDate.setHours(hours, minutes, 0, 0);

      // Calculate the difference in hours
      const timeDiff = bookingDate.getTime() - now.getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);

      // Return true if the booking is within 24 hours (and in the future)
      return hoursDiff > 0 && hoursDiff <= 24;
    } catch (error) {
      // If there's any error in parsing, assume it's not within 24 hours to be safe
      console.warn("Error parsing date/time for cancellation check:", error);
      return false;
    }
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
            <p className="text-sm text-muted-foreground truncate">Manage your bookings</p>
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
                active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
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
        <div className="max-w-sm">
          <div className="rounded-2xl p-6 mb-6" style={{ background: "linear-gradient(135deg, var(--surface-interactive) 0%, var(--surface-raised) 100%)", border: "1px solid var(--border-emphasis)" }}>
            <div className="text-xs text-muted-foreground mb-1">Pickle Credits Balance</div>
            <div className="text-4xl font-bold text-cyan-400 font-mono">₱{(wallet?.balance || 0).toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-1">~≈ {Math.floor((wallet?.balance || 0) / 400)} court sessions</div>
          </div>
          <div className="text-xs text-muted-foreground mb-3">Recent Transactions</div>
          {transactions.length === 0 ? (
            <div className="text-xs text-muted-foreground py-4 text-center">No recent wallet transactions</div>
          ) : (
            transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <div className="text-sm text-foreground">{tx.label}</div>
                  <div className="text-xs text-muted-foreground">{tx.date}</div>
                </div>
                <span className="text-emerald-400 font-mono text-sm font-medium">{tx.amount}</span>
              </div>
            ))
          )}
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-surface-base/40 backdrop-blur-sm"
              onClick={() => setCancelModal(null)}
            />
            
            <motion.div 
              initial={{ scale: 1.1, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 400 }}>
              <div className="w-[340px] bg-background dark:bg-surface-base border border-border rounded-3xl shadow-2xl relative p-6 pb-7 text-center flex flex-col items-center">
                 <div className="w-14 h-14 relative z-10 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20 mb-5 mt-2">
                   <AlertTriangle className="w-6 h-6 text-red-500" strokeWidth={2.5} />
                 </div>
                 <h3 className="text-[19px] font-bold text-foreground tracking-tight mb-2">Cancel Booking?</h3>
                 <p className="text-[14px] text-muted-foreground font-medium leading-relaxed px-1">
                   {isBookingWithin24Hours(cancelModal.date, cancelModal.time) ? (
                    <>Cancel reservation for <span className="text-foreground font-semibold">{cancelModal.court}</span>? <span className="text-red-400 font-semibold block mt-1">⚠️ No refund available for cancellations within 24 hours of start time (venue policy).</span></>
                   ) : (
                    <>Cancel reservation for <span className="text-foreground font-semibold">{cancelModal.court}</span>? You will receive <span className="text-emerald-400 font-semibold">₱{(cancelModal.total ?? cancelModal.price ?? 0).toLocaleString()}</span> in Pickle Credits.</>
                   )}
                 </p>
                 <div className="flex gap-3 w-full mt-7">
                   <button onClick={() => setCancelModal(null)} className="flex-1 py-3.5 rounded-xl text-[14px] font-semibold text-foreground/80 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-all active:scale-[0.98]">
                     Keep It
                   </button>
                   <button onClick={handleCancelConfirm} className="flex-1 py-3.5 rounded-xl text-[14px] font-bold text-white bg-red-500 hover:bg-red-600 transition-all active:scale-[0.98]">
                     Cancel
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
