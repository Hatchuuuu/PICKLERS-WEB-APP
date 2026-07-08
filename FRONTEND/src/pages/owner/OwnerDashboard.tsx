import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, X, Check
} from "lucide-react";
import { LIVE_COURTS, BOOKING_REQUESTS } from "@/data/mockData";
import { CourtCard } from "@/pages/owner/CourtCard";


export function OwnerDashboard() {
  const [requests, setRequests] = useState(BOOKING_REQUESTS);
  const [courts, setCourts] = useState(LIVE_COURTS);
  const [walkInOpen, setWalkInOpen] = useState(false);
  const [walkInSuccess, setWalkInSuccess] = useState<string | null>(null);

  function handleEndSession(id: number) {
    setCourts(prev => prev.map(c => c.id === id ? { ...c, status: "available", player: null, remaining: 0, maxTime: 0 } as typeof LIVE_COURTS[0] : c));
  }

  function handleWalkIn(name: string, court: string) {
    setWalkInOpen(false);
    setWalkInSuccess(`${name || "Walk-in guest"} logged for ${court}`);
    setTimeout(() => setWalkInSuccess(null), 3000);
  }

  return (
    <div className="p-6">
      <style>{`@keyframes pulseRed{0%,100%{box-shadow:0 0 10px rgba(239,68,68,.2);border-color:rgba(239,68,68,.5)}50%{box-shadow:0 0 28px rgba(239,68,68,.5);border-color:rgba(239,68,68,.9)}}`}</style>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Montserrat', sans-serif" }}>FACILITY DASHBOARD</h1>
          <p className="text-sm text-muted-foreground">Manage your courts and track performance</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-emerald-400 font-medium">Live</span>
        </div>
      </div>

      <AnimatePresence>
        {walkInSuccess && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl mb-5"
            style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)" }}>
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-sm text-emerald-400 font-medium">Walk-in confirmed: {walkInSuccess}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
        {[
          { label: "Monthly Revenue", value: "₱48,200", change: "+12%" },
          { label: "Today's Revenue", value: "₱3,200", change: "+5%" },
          { label: "Active Bookings", value: "12", change: "now" },
          { label: "New Players", value: "8", change: "today" },
          { label: "Repeaters", value: "45%", change: "+3%" },
        ].map((m, i) => (
          <div key={i} className="rounded-xl p-4" style={{ background: "#0f1d47", border: "1px solid rgba(0,212,255,0.1)" }}>
            <div className="text-xs text-muted-foreground mb-1">{m.label}</div>
            <div className="text-xl font-bold font-mono text-foreground">{m.value}</div>
            <div className="text-xs mt-0.5 text-emerald-400">{m.change}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Live Courts</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {courts.map(c => <CourtCard key={c.id} court={c} onEnd={() => handleEndSession(c.id)} />)}
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Requests</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400">{requests.length}</span>
          </div>
          <div className="flex flex-col gap-3">
            {requests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">No pending requests</div>
            ) : requests.map(r => (
              <div key={r.id} className="rounded-xl p-4" style={{ background: "#0f1d47", border: "1px solid rgba(0,212,255,0.1)" }}>
                <div className="text-sm font-semibold text-foreground mb-0.5">{r.player}</div>
                <div className="text-xs text-muted-foreground">{r.court}</div>
                <div className="text-xs text-muted-foreground">{r.time}</div>
                <div className="text-cyan-400 font-mono text-sm font-bold mt-1">₱{r.total.toLocaleString()}</div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => setRequests(prev => prev.filter(x => x.id !== r.id))}
                    className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium active:scale-[0.97]"
                    style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", color: "#22c55e", transition: "background-color 150ms ease-out" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(34,197,94,0.25)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "rgba(34,197,94,0.15)")}>
                    <Check className="w-3 h-3" /> Accept
                  </button>
                  <button onClick={() => setRequests(prev => prev.filter(x => x.id !== r.id))}
                    className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium active:scale-[0.97]"
                    style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)", color: "#ef4444", transition: "background-color 150ms ease-out" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.22)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "rgba(239,68,68,0.12)")}>
                    <X className="w-3 h-3" /> Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button onClick={() => setWalkInOpen(true)}
        className="fixed bottom-24 right-6 md:bottom-8 md:right-8 flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold text-sm shadow-2xl active:scale-[0.97] z-30"
        style={{ background: "#22c55e", color: "#fff", boxShadow: "0 8px 32px rgba(34,197,94,0.4)", transition: "opacity 150ms ease-out, transform 100ms ease-out" }}
        onMouseEnter={e => (e.currentTarget.style.opacity = "0.9")}
        onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
        <Plus className="w-5 h-5" />Log Walk-in
      </button>

      <AnimatePresence>
        {walkInOpen && <WalkInModal onClose={() => setWalkInOpen(false)} onConfirm={handleWalkIn} />}
      </AnimatePresence>
    </div>
  );
}
