import { useState } from "react";
import { motion } from "motion/react";
import { X, Check
} from "lucide-react";
import { slotIndex, TIME_SLOTS } from "@/lib/timeUtils";


export function WalkInModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: (name: string, court: string) => void }) {
  const [playerName, setPlayerName] = useState("");
  const [court, setCourt] = useState("Court 1");
  const [startTime, setStartTime] = useState("8:00 AM");
  const [endTime, setEndTime] = useState("10:00 AM");
  const [payMethod, setPayMethod] = useState<"cash" | "gcash">("cash");
  const courts = ["Court 1", "Court 2", "Court 3", "Center Court", "Court 5", "Court 6"];
  const endSlots = TIME_SLOTS.slice(slotIndex(startTime) + 1);

  function handleConfirm() {
    if (!playerName.trim()) return;
    onConfirm(playerName, court);
  }

  return (
    <>
      <motion.div key="walkin-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }} />
      <motion.div key="walkin-modal"
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        transition={{ ease: "easeOut", duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl p-6"
          style={{ background: "#0b1640", border: "1px solid rgba(0,212,255,0.2)", boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold" style={{ fontFamily: "'Montserrat', sans-serif" }}>LOG WALK-IN</h2>
              <p className="text-xs text-muted-foreground">Register a front-desk booking instantly</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5"
              style={{ border: "1px solid rgba(0,212,255,0.15)", color: "#6b82b8" }}>
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Player Name</label>
              <input value={playerName} onChange={e => setPlayerName(e.target.value)} placeholder="e.g. Juan Dela Cruz (or leave blank)"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-ring"
                style={{ background: "rgba(26,45,110,0.5)", border: "1px solid rgba(0,212,255,0.15)", color: "#e8eeff" }} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Court</label>
              <select value={court} onChange={e => setCourt(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-ring appearance-none"
                style={{ background: "rgba(26,45,110,0.5)", border: "1px solid rgba(0,212,255,0.15)", color: "#e8eeff", colorScheme: "dark" }}>
                {courts.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Start</label>
                <select value={startTime} onChange={e => { setStartTime(e.target.value); setEndTime(TIME_SLOTS[slotIndex(e.target.value) + 2] ?? TIME_SLOTS[slotIndex(e.target.value) + 1]); }}
                  className="w-full px-3 py-3 rounded-xl text-sm outline-none appearance-none"
                  style={{ background: "rgba(26,45,110,0.5)", border: "1px solid rgba(0,212,255,0.15)", color: "#e8eeff", colorScheme: "dark" }}>
                  {TIME_SLOTS.slice(0, -1).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">End</label>
                <select value={endTime} onChange={e => setEndTime(e.target.value)}
                  className="w-full px-3 py-3 rounded-xl text-sm outline-none appearance-none"
                  style={{ background: "rgba(26,45,110,0.5)", border: "1px solid rgba(0,212,255,0.15)", color: "#e8eeff", colorScheme: "dark" }}>
                  {endSlots.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Payment</label>
              <div className="flex gap-2">
                {(["cash", "gcash"] as const).map(m => (
                  <button key={m} onClick={() => setPayMethod(m)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium active:scale-[0.97]"
                    style={{
                      background: payMethod === m ? "rgba(0,212,255,0.15)" : "rgba(26,45,110,0.4)",
                      border: payMethod === m ? "1px solid rgba(0,212,255,0.4)" : "1px solid rgba(0,212,255,0.12)",
                      color: payMethod === m ? "#00d4ff" : "#6b82b8",
                      transition: "all 150ms ease-out",
                    }}>
                    {m === "cash" ? "Cash on Site" : "GCash (Counter)"}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button onClick={handleConfirm}
            className="w-full mt-5 py-3.5 rounded-2xl font-bold text-sm active:scale-[0.97] flex items-center justify-center gap-2"
            style={{ background: "#22c55e", color: "#fff", boxShadow: "0 6px 24px rgba(34,197,94,0.3)", transition: "opacity 150ms ease-out" }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
            <Check className="w-4 h-4" /> Confirm Walk-in
          </button>
        </div>
      </motion.div>
    </>
  );
}
