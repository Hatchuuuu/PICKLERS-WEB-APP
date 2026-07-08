import { useState } from "react";
import { motion } from "motion/react";
import { CalendarDays,
  Wallet
} from "lucide-react";
import { cn, statusColor } from "@/lib/utils";
import { BOOKINGS } from "@/data/mockData";


export function BookingsTab() {
  const [tab, setTab] = useState("Upcoming");
  const [cancelConfirm, setCancelConfirm] = useState<string | null>(null);
  const [bookings, setBookings] = useState(BOOKINGS);
  const tabs = ["Upcoming", "Completed", "Refunds", "Cancelled", "Wallet"];
  const filtered = tab === "Wallet" || tab === "Refunds" ? [] : bookings.filter(b => b.status === tab.toLowerCase());

  function handleCancelConfirm(id: string) {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: "cancelled" } : b));
    setCancelConfirm(null);
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: "'Montserrat', sans-serif" }}>MY BOOKINGS</h1>
      <div className="flex gap-1 overflow-x-auto pb-1 mb-6 border-b border-border">
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} className="shrink-0 px-4 py-2.5 text-sm font-medium transition-colors relative"
            style={{ color: tab === t ? "#00d4ff" : "#6b82b8" }}>
            {t}
            {tab === t && <motion.div layoutId="booking-ul" className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ background: "#00d4ff" }} />}
          </button>
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
          <div className="rounded-2xl p-6 mb-6" style={{ background: "linear-gradient(135deg, #1a2d6e 0%, #0f1d47 100%)", border: "1px solid rgba(0,212,255,0.2)" }}>
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
          {filtered.map((b, i) => (
            <motion.div key={b.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, ease: "easeOut" }}
              className="rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3"
              style={{ background: "#0f1d47", border: "1px solid rgba(0,212,255,0.1)" }}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-muted-foreground">{b.id}</span>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", statusColor(b.status))}>
                    {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                  </span>
                </div>
                <div className="text-sm font-semibold text-foreground">{b.court}</div>
                <div className="text-xs text-muted-foreground">{b.facility}</div>
                <div className="text-xs text-muted-foreground mt-1">{b.date} · {b.time}</div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <div className="text-cyan-400 font-bold font-mono">₱{b.total.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">{b.payment}</div>
                </div>
                {b.status === "upcoming" && (
                  cancelConfirm === b.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-red-400 whitespace-nowrap">Sure?</span>
                      <button onClick={() => setCancelConfirm(null)}
                        className="text-xs px-2.5 py-2 rounded-lg active:scale-[0.97]"
                        style={{ background: "rgba(255,255,255,0.06)", color: "#a0b4e0", transition: "background-color 150ms ease-out" }}>
                        No
                      </button>
                      <button onClick={() => handleCancelConfirm(b.id)}
                        className="text-xs px-2.5 py-2 rounded-lg active:scale-[0.97]"
                        style={{ background: "rgba(239,68,68,0.18)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", transition: "background-color 150ms ease-out" }}>
                        Yes
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setCancelConfirm(b.id)}
                      className="text-xs px-3 py-2.5 rounded-lg active:scale-[0.97]"
                      style={{ border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", transition: "background-color 150ms ease-out" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.08)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      Cancel
                    </button>
                  )
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
