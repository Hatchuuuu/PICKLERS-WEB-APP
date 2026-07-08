import { useState, useEffect } from "react";
import { AlertTriangle
} from "lucide-react";
import { cn, formatTime } from "@/lib/utils";
import { LIVE_COURTS } from "@/data/mockData";


export function CourtCard({ court, onEnd }: { court: typeof LIVE_COURTS[0]; onEnd?: () => void }) {
  const [seconds, setSeconds] = useState(court.remaining);
  const isAlert = seconds <= 0 && court.status === "occupied";

  useEffect(() => {
    if (court.status !== "occupied" || seconds <= 0) return;
    const t = setInterval(() => setSeconds(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [court.status]);

  const pct = court.maxTime > 0 ? seconds / court.maxTime : 0;

  return (
    <div className="rounded-xl p-4 transition-all"
      style={{
        background: "#0f1d47",
        border: isAlert ? "2px solid rgba(239,68,68,0.8)" : court.status === "occupied" ? "1px solid rgba(0,212,255,0.2)" : court.status === "available" ? "1px solid rgba(34,197,94,0.25)" : "1px solid rgba(107,130,184,0.2)",
        boxShadow: isAlert ? "0 0 20px rgba(239,68,68,0.2)" : "0 4px 16px rgba(0,0,0,0.2)",
        animation: isAlert ? "pulseRed 1s ease-in-out infinite" : "none",
      }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-foreground">{court.name}</span>
        <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",
          court.status === "occupied" ? "bg-cyan-500/20 text-cyan-400" :
          court.status === "available" ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-muted-foreground")}>
          {court.status.toUpperCase()}
        </span>
      </div>
      {court.status === "occupied" && (
        <>
          <div className="text-xs text-muted-foreground mb-1 truncate">{court.player}</div>
          <div className={cn("text-xl font-bold font-mono mb-2", isAlert ? "text-red-400" : "text-cyan-400")}>
            {isAlert ? "TIME UP" : formatTime(seconds)}
          </div>
          <div className="w-full h-1 rounded-full mb-3" style={{ background: "rgba(255,255,255,0.08)" }}>
            <div className="h-1 rounded-full transition-all duration-1000"
              style={{ width: `${pct * 100}%`, background: pct > 0.2 ? "#00d4ff" : "#ef4444" }} />
          </div>
          <button onClick={onEnd}
            className="w-full text-xs py-2 rounded-lg active:scale-[0.97]"
            style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)", color: "#ef4444", transition: "background-color 150ms ease-out" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.2)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(239,68,68,0.12)")}>
            Skip / End Session
          </button>
        </>
      )}
      {court.status === "available" && (
        <div className="flex items-center gap-2 mt-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-emerald-400">Ready for booking</span>
        </div>
      )}
      {court.status === "maintenance" && (
        <div className="flex items-center gap-2 mt-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs text-amber-400">Under maintenance</span>
        </div>
      )}
    </div>
  );
}
