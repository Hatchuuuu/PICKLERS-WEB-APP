import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CalendarDays, Wallet, AlertTriangle, Clock, Navigation } from "lucide-react";
import { cn, statusColor } from "@/lib/utils";
import { useApp } from "@/contexts/AppContext";
import { NavigationOverlay } from "@/components/shared/NavigationOverlay";

export function BookingsTab() {
  const { bookings, setBookings, setJoinedMatches } = useApp();
  type BookingType = typeof bookings[0];
  
  const [tab, setTab] = useState("Upcoming");
  const [cancelModal, setCancelModal] = useState<BookingType | null>(null);
  const [navigatingTo, setNavigatingTo] = useState<BookingType | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  
  const tabs = ["Upcoming", "Completed", "Refunds", "Cancelled", "Wallet"];
  const filtered = tab === "Wallet" || tab === "Refunds" ? [] : bookings.filter(b => b.status === tab.toLowerCase());

  function handleCancelConfirm() {
    if (!cancelModal) return;
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

    // Show toast
    setToast(`Booking cancelled. ₱${cancelModal.total} Pickle Credits refunded.`);
    setTimeout(() => setToast(null), 4000);
    setCancelModal(null);
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
            className="absolute left-0 top-0"
          >
            <h1 className="text-[32px] font-extrabold tracking-tight leading-none mb-1.5" style={{ color: "var(--ink-primary)" }}>
              Bookings
            </h1>
            <p className="text-sm text-muted-foreground">Manage your upcoming matches and reservations</p>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="flex gap-1.5 mb-6 overflow-x-auto pb-2 scrollbar-none">
        {tabs.map(t => (
          <motion.button key={t} onClick={() => setTab(t)}
            whileTap={{ scale: 0.95 }}
            animate={{ 
              backgroundColor: tab === t ? "var(--accent-primary)" : "var(--surface-interactive)",
              color: tab === t ? "var(--surface-base)" : "var(--ink-secondary)",
              borderColor: tab === t ? "var(--accent-primary)" : "var(--border-subtle)",
              boxShadow: tab === t ? "0 4px 12px rgba(0, 217, 139, 0.3)" : "0 0px 0px rgba(0,0,0,0)"
            }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-semibold tracking-wide border border-solid relative overflow-hidden"
            style={{ backdropFilter: "blur(12px)" }}>
            {t}
          </motion.button>
        ))}
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
            <div className="text-4xl font-bold text-cyan-400 font-mono">₱1,200</div>
            <div className="text-xs text-muted-foreground mt-1">~≈ 3 court sessions</div>
          </div>
          <div className="text-xs text-muted-foreground mb-3">Recent Transactions</div>
          {[
            { label: "Refund — BGC Hub Court 2", amount: "+₱400", date: "Jun 28" },
            { label: "Refund — SM Southmall Court 1", amount: "+₱800", date: "Jun 15" },
          ].map((tx, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <div className="text-sm text-foreground">{tx.label}</div>
                <div className="text-xs text-muted-foreground">{tx.date}</div>
              </div>
              <span className="text-emerald-400 font-mono text-sm font-medium">{tx.amount}</span>
            </div>
          ))}
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
                className="rounded-[24px] p-5 flex flex-col sm:flex-row sm:items-center gap-4 transition-transform duration-500 hover:-translate-y-1 relative bg-surface-base shadow-md border border-border dark:bg-white/[0.03] dark:shadow-[0_16px_40px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.1)] dark:border-white/[0.12] backdrop-blur-xl">
                {("isNew" in b && b.isNew) && (
                  <motion.div className="absolute inset-0 rounded-[24px] border border-emerald-400 pointer-events-none"
                    initial={{ opacity: 0, boxShadow: "inset 0 0 0px rgba(52,211,139,0)" }}
                    animate={{ opacity: [0, 1, 0, 1, 0], boxShadow: ["inset 0 0 0px rgba(52,211,139,0)", "inset 0 0 20px rgba(52,211,139,0.2)", "inset 0 0 0px rgba(52,211,139,0)", "inset 0 0 20px rgba(52,211,139,0.2)", "inset 0 0 0px rgba(52,211,139,0)"] }}
                    transition={{ duration: 4, times: [0, 0.1, 0.5, 0.6, 1] }}
                  />
                )}
                <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-mono text-muted-foreground mr-1">{b.id}</span>
                  <span className={cn("text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-surface-interactive border border-border dark:bg-transparent dark:border-white/[0.05] backdrop-blur-md", statusColor(b.status))}>
                    {b.status}
                  </span>
                  {b.status === "upcoming" && (
                    <button onClick={() => setNavigatingTo(b)}
                      className="text-[12px] px-3 py-1 ml-auto rounded-full font-bold active:scale-[0.95] transition-all duration-300 shadow-md flex items-center gap-1.5"
                      style={{ 
                        background: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)", 
                        color: "white",
                        boxShadow: "0 4px 12px rgba(37,99,235,0.3)"
                      }}>
                      <Navigation className="w-3 h-3" fill="currentColor" />
                      Navigate
                    </button>
                  )}
                </div>
                <div className="text-[17px] font-bold tracking-tight text-foreground">{b.court}</div>
                <div className="text-[13px] font-medium text-muted-foreground mt-0.5">{b.facility}</div>
                <div className="text-[12px] font-medium text-muted-foreground mt-1">{b.date} · {b.time}</div>
              </div>
              <div className="flex items-center justify-between w-full sm:w-auto gap-3 shrink-0 mt-2 sm:mt-0 pt-3 sm:pt-0 border-t border-white/5 sm:border-0">
                <div className="text-left sm:text-right">
                  <div className="text-cyan-400 font-bold font-mono text-[16px]">₱{b.total.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">{b.payment}</div>
                </div>
                {b.status === "upcoming" && (
                  <button onClick={() => setCancelModal(b)}
                    className="text-[13px] px-5 py-2 rounded-full font-bold active:scale-[0.95] transition-all duration-300 bg-red-500/10"
                    style={{ border: "1px solid rgba(239,68,68,0.2)", color: "var(--accent-danger)" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.2)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.4)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.2)"; }}>
                    Cancel
                  </button>
                )}
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
              <div className="w-[320px] bg-surface-raised/95 backdrop-blur-[40px] rounded-[32px] overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)] border border-border">
                 <div className="p-8 text-center pb-6">
                   <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-5 border border-red-500/20 shadow-[0_0_24px_rgba(239,68,68,0.2)]">
                     <span className="text-[24px] font-black text-red-400">!</span>
                   </div>
                   <h3 className="text-[22px] font-black text-foreground tracking-tight" >Cancel Booking?</h3>
                   <p className="text-[15px] text-foreground/60 mt-3 leading-relaxed">
                     Cancel reservation for <span className="font-bold text-foreground">{cancelModal.court}</span>? You will be refunded <span className="font-bold text-foreground">₱{cancelModal.total.toLocaleString()}</span>.
                   </p>
                 </div>
                 <div className="flex flex-col p-5 pt-0 gap-3">
                   <button onClick={handleCancelConfirm} className="w-full py-4 rounded-[18px] text-[16px] font-extrabold text-red-400 bg-red-500/10 hover:bg-red-500/20 active:scale-[0.98] transition-all border border-red-500/20">
                     Cancel Booking
                   </button>
                   <button onClick={() => setCancelModal(null)} className="w-full py-4 rounded-[18px] text-[16px] font-semibold text-black bg-surface-raised border border-border hover:bg-surface-raised border border-border/90 active:scale-[0.98] transition-all">
                     Keep Booking
                   </button>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-3 rounded-xl border border-solid shadow-lg z-50 flex items-center gap-3 bg-surface-base/95 border-emerald-500/30 backdrop-blur-md">
            <div className="w-2 h-2 rounded-full" style={{ background: "var(--accent-success)" }} />
            <span className="text-sm font-medium" style={{ color: "var(--ink-primary)" }}>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
      {navigatingTo && (
        <NavigationOverlay 
          destination={navigatingTo.facility} 
          onClose={() => setNavigatingTo(null)} 
        />
      )}
    </div>
  );
}
