



export function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

export function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function levelColor(level: string) {
  if (level === "Beginner") return "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
  if (level === "Intermediate") return "bg-amber-500/20 text-amber-400 border border-amber-500/30";
  return "bg-red-500/20 text-red-400 border border-red-500/30";
}

export function statusColor(status: string) {
  if (status === "upcoming") return "bg-cyan-500/20 text-cyan-400";
  if (status === "completed") return "bg-emerald-500/20 text-emerald-400";
  if (status === "cancelled") return "bg-red-500/20 text-red-400";
  return "bg-amber-500/20 text-amber-400";
}
