import { useState } from "react";
import { motion } from "motion/react";


import { cn, levelColor } from "@/lib/utils";
import { OPEN_MATCHES } from "@/data/mockData";
import { CapacityRing } from "@/components/ui/shared";


export function MatchCard({ m, joined, onJoin }: { m: typeof OPEN_MATCHES[0]; joined?: boolean; onJoin?: () => void }) {
  const [loading, setLoading] = useState(false);
  const filled = joined ? m.slots + 1 : m.slots;
  const full = filled >= m.max;

  function handleJoin() {
    if (joined || full || loading) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); onJoin?.(); }, 900);
  }

  return (
    <div className="rounded-xl border bg-card p-4 flex gap-4 items-center"
      style={{ borderColor: joined ? "rgba(34,197,94,0.3)" : "rgba(0,212,255,0.12)", boxShadow: "0 4px 24px rgba(0,0,0,0.3)" }}>
      <CapacityRing filled={filled} max={m.max} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", levelColor(m.level))}>{m.level}</span>
          {joined && <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Joined ✓</span>}
        </div>
        <div className="text-sm font-semibold text-foreground truncate">{m.facility}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{m.date} · {m.time}</div>
        <div className="text-xs text-muted-foreground">Host: {m.host}</div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-cyan-400 font-bold font-mono text-sm">₱{m.price}</div>
        <div className="text-xs text-muted-foreground mb-2">your share</div>
        <button onClick={handleJoin} disabled={joined || full}
          className="text-xs px-4 py-2.5 rounded-lg font-medium active:scale-[0.97] disabled:opacity-60 flex items-center justify-center gap-1.5"
          style={{
            background: joined ? "rgba(34,197,94,0.15)" : full ? "rgba(255,255,255,0.06)" : "#22c55e",
            color: joined ? "#22c55e" : full ? "#6b82b8" : "#fff",
            border: joined ? "1px solid rgba(34,197,94,0.3)" : "none",
            minWidth: "64px",
            transition: "opacity 150ms ease-out, transform 100ms ease-out",
          }}
          onMouseEnter={e => { if (!joined && !full) e.currentTarget.style.opacity = "0.88"; }}
          onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
          {loading ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.7, ease: "linear" }} className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full" /> : joined ? "Joined" : full ? "Full" : "Join"}
        </button>
      </div>
    </div>
  );
}
