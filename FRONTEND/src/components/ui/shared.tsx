import { motion } from "motion/react";
export function CapacityRing({ filled, max }: { filled: number; max: number }) {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const pct = filled / max;
  return (
    <div className="relative flex items-center justify-center w-14 h-14 shrink-0">
      <svg width="56" height="56" className="-rotate-90">
        <circle cx="28" cy="28" r={r} fill="none" className="stroke-black/5 dark:stroke-white/10" strokeWidth="4" />
        <circle cx="28" cy="28" r={r} fill="none" stroke="var(--accent-primary)" strokeWidth="4"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease-out" }} />
      </svg>
      <span className="absolute text-xs font-mono text-cyan-400 font-bold leading-none">{filled}/{max}</span>
    </div>
  );
}

export function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button onClick={() => onChange(!value)}
      aria-label={label ?? (value ? "Disable" : "Enable")}
      aria-checked={value}
      role="switch"
      className="flex items-center justify-center min-w-[44px] min-h-[44px]">
      <div className="relative w-12 h-6 rounded-full"
        style={{
          background: value ? "var(--accent-success)" : "var(--surface-interactive)",
          border: "1px solid var(--border-emphasis)",
          transition: "background-color 200ms ease-out" }}>
        <motion.div animate={{ x: value ? 24 : 2 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="absolute top-0.5 w-5 h-5 rounded-full bg-surface-raised border border-border" />
      </div>
    </button>
  );
}
