import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Clock, Search, X, CreditCard
} from "lucide-react";
import { slotIndex, slotHours, TIME_SLOTS } from "@/lib/timeUtils";
import { FACILITIES, type CourtData } from "@/data/mockData";


export function QuickBookModal({
  facility, courts, onClose, onBook,
}: {
  facility: typeof FACILITIES[0];
  courts: CourtData[];
  onClose: () => void;
  onBook: (court: CourtData, date: string, start: string, end: string) => void;
}) {
  const todayStr = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(todayStr);
  const [startTime, setStartTime] = useState("8:00 AM");
  const [endTime, setEndTime] = useState("10:00 AM");
  const [stage, setStage] = useState<"form" | "scanning" | "results">("form");
  const [results, setResults] = useState<CourtData[]>([]);

  const endSlots = TIME_SLOTS.slice(slotIndex(startTime) + 1);

  function handleSearch() {
    setStage("scanning");
    setTimeout(() => {
      const available = courts.filter(c => c.status === "available");
      setResults(available);
      setStage("results");
    }, 1600);
  }

  const hours = slotHours(startTime, endTime);

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }} />

      {/* Sheet */}
      <motion.div key="sheet"
        initial={{ y: "100%", opacity: 0.8 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 38 }}
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl overflow-hidden"
        style={{ background: "#0b1640", border: "1px solid rgba(0,212,255,0.15)", borderBottom: "none", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 -16px 64px rgba(0,0,0,0.5)" }}>

        {/* Handle + header */}
        <div className="flex flex-col items-center pt-3 pb-0 px-6 sticky top-0 z-10" style={{ background: "#0b1640" }}>
          <div className="w-10 h-1 rounded-full mb-4" style={{ background: "rgba(0,212,255,0.2)" }} />
          <div className="flex items-center justify-between w-full pb-4 border-b border-border">
            <div>
              <h2 className="text-lg font-bold" style={{ fontFamily: "'Montserrat', sans-serif" }}>QUICK BOOK</h2>
              <p className="text-xs text-muted-foreground">{facility.name}</p>
            </div>
            <button onClick={onClose} aria-label="Close" className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/5"
              style={{ border: "1px solid rgba(0,212,255,0.15)", color: "#6b82b8", transition: "background-color 150ms ease-out" }}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-6 pt-5 pb-8">
          {stage === "form" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Date</label>
                <input type="date" min={todayStr} value={date} onChange={e => setDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-ring font-mono"
                  style={{ background: "rgba(26,45,110,0.5)", border: "1px solid rgba(0,212,255,0.15)", color: "#e8eeff", colorScheme: "dark" }} />
              </div>

              {/* Times — side by side */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Start Time</label>
                  <select value={startTime}
                    onChange={e => {
                      setStartTime(e.target.value);
                      const newEnd = TIME_SLOTS[slotIndex(e.target.value) + 2] ?? TIME_SLOTS[slotIndex(e.target.value) + 1];
                      if (newEnd) setEndTime(newEnd);
                    }}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-ring appearance-none"
                    style={{ background: "rgba(26,45,110,0.5)", border: "1px solid rgba(0,212,255,0.15)", color: "#e8eeff", colorScheme: "dark" }}>
                    {TIME_SLOTS.slice(0, -1).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">End Time</label>
                  <select value={endTime} onChange={e => setEndTime(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-ring appearance-none"
                    style={{ background: "rgba(26,45,110,0.5)", border: "1px solid rgba(0,212,255,0.15)", color: "#e8eeff", colorScheme: "dark" }}>
                    {endSlots.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {/* Duration badge */}
              {hours > 0 && (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
                  style={{ background: "rgba(0,212,255,0.07)", border: "1px solid rgba(0,212,255,0.15)" }}>
                  <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="text-sm text-cyan-400">
                    <span className="font-bold">{hours} hour{hours !== 1 ? "s" : ""}</span>
                    <span className="text-muted-foreground ml-2">{startTime} – {endTime}</span>
                  </span>
                </div>
              )}

              <button onClick={handleSearch} disabled={hours <= 0}
                className="w-full py-4 rounded-2xl font-bold text-base active:scale-[0.97] disabled:opacity-40 flex items-center justify-center gap-2"
                style={{ background: "#00d4ff", color: "#080f2e", transition: "opacity 150ms ease-out, transform 100ms ease-out" }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
                <Search className="w-5 h-5" />
                Find Available Courts
              </button>
            </motion.div>
          )}

          {stage === "scanning" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-10 flex flex-col items-center gap-5">
              {/* Animated radar scan */}
              <div className="relative w-20 h-20">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                  className="absolute inset-0 rounded-full border-2 border-t-cyan-400 border-r-cyan-400/30 border-b-transparent border-l-transparent" />
                <motion.div animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 1.8, ease: "linear" }}
                  className="absolute inset-2 rounded-full border border-t-transparent border-r-transparent border-b-cyan-400/50 border-l-cyan-400/20" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Search className="w-6 h-6 text-cyan-400" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground mb-1">Scanning availability…</p>
                <p className="text-xs text-muted-foreground">{startTime} – {endTime} · {hours}h</p>
              </div>
              {/* Animated dots */}
              <div className="flex gap-1.5">
                {[0, 1, 2, 3, 4].map(i => (
                  <motion.div key={i} className="w-1.5 h-1.5 rounded-full"
                    style={{ background: "#00d4ff" }}
                    animate={{ opacity: [0.2, 1, 0.2] }}
                    transition={{ repeat: Infinity, duration: 1, delay: i * 0.15 }} />
                ))}
              </div>
            </motion.div>
          )}

          {stage === "results" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ ease: "easeOut", duration: 0.2 }}>
              {/* Results header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    {results.length} Court{results.length !== 1 ? "s" : ""} Available
                  </h3>
                  <p className="text-xs text-muted-foreground">{startTime} – {endTime} · {date}</p>
                </div>
                <button onClick={() => setStage("form")}
                  className="text-xs px-3 py-1.5 rounded-lg"
                  style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)", color: "#00d4ff", transition: "background-color 150ms ease-out" }}>
                  Change Time
                </button>
              </div>

              {results.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
                    style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
                    <X className="w-7 h-7 text-red-400" />
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">No courts available</p>
                  <p className="text-xs text-muted-foreground">Try a different time slot.</p>
                  <button onClick={() => setStage("form")} className="mt-4 text-xs text-cyan-400 hover:opacity-80">← Try another time</button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {results.map((court, i) => {
                    const courtTotal = hours * court.price;
                    const courtFee = Math.round(courtTotal * 0.08);
                    return (
                      <motion.div key={court.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06, ease: "easeOut" }}
                        className="rounded-xl p-4"
                        style={{ background: "#0f1d47", border: "1px solid rgba(34,197,94,0.2)", boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }}>
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-bold text-foreground" style={{ fontFamily: "'Montserrat', sans-serif" }}>{court.name}</span>
                              <span className="text-xs px-1.5 py-0.5 rounded-md font-medium"
                                style={{ background: court.type === "Indoor" ? "rgba(0,212,255,0.1)" : "rgba(251,191,36,0.1)", color: court.type === "Indoor" ? "#00d4ff" : "#fbbf24" }}>
                                {court.type}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">{court.surface}</p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-xs text-emerald-400 font-medium">Available</span>
                          </div>
                        </div>

                        {/* Price breakdown */}
                        <div className="flex items-center gap-3 mb-4 px-3 py-2.5 rounded-lg"
                          style={{ background: "rgba(0,212,255,0.05)", border: "1px solid rgba(0,212,255,0.1)" }}>
                          <div className="flex-1 text-xs text-muted-foreground">
                            ₱{court.price}/hr × {hours}h
                          </div>
                          <div className="text-xs text-muted-foreground">+₱{courtFee} fee</div>
                          <div className="text-sm font-bold font-mono text-cyan-400">₱{(courtTotal + courtFee).toLocaleString()}</div>
                        </div>

                        <button onClick={() => onBook(court, date, startTime, endTime)}
                          className="w-full py-3 rounded-xl font-bold text-sm active:scale-[0.97] flex items-center justify-center gap-2"
                          style={{ background: "#22c55e", color: "#fff", boxShadow: "0 4px 16px rgba(34,197,94,0.3)", transition: "opacity 150ms ease-out, transform 100ms ease-out" }}
                          onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")}
                          onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
                          <CreditCard className="w-4 h-4" />
                          Book Now
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
