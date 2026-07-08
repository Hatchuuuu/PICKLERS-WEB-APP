import { useState } from "react";
import { motion } from "motion/react";
import { ChevronRight, Check, CreditCard
} from "lucide-react";
import { slotHours } from "@/lib/timeUtils";
import { type PaymentData } from "@/data/mockData";





export function PaymentView({ data, onBack, onDone }: { data: PaymentData; onBack: () => void; onDone: () => void }) {
  const [method, setMethod] = useState<"gcash" | "cash" | "credits">("gcash");
  const [stage, setStage] = useState<"idle" | "processing" | "success">("idle");

  const hours = slotHours(data.startTime, data.endTime);
  const subtotal = hours * data.court.price;
  const fee = Math.round(subtotal * 0.08);
  const total = subtotal + fee;

  const today = new Date();
  const dateLabel = data.date === today.toISOString().split("T")[0]
    ? "Today"
    : new Date(data.date + "T00:00:00").toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });

  function handleConfirm() {
    setStage("processing");
    setTimeout(() => setStage("success"), 1800);
  }

  if (stage === "success") {
    return (
      <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
          className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
          style={{ background: "rgba(34,197,94,0.15)", border: "2px solid rgba(34,197,94,0.4)" }}>
          <Check className="w-12 h-12 text-emerald-400" strokeWidth={2.5} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, ease: "easeOut" }}>
          <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: "'Montserrat', sans-serif" }}>BOOKING CONFIRMED!</h2>
          <p className="text-muted-foreground text-sm mb-1">
            <span className="text-foreground font-medium">{data.court.name}</span> at {data.facility.name}
          </p>
          <p className="text-muted-foreground text-sm mb-8">
            {dateLabel} · {data.startTime} – {data.endTime}
          </p>
          <div className="flex items-center justify-center gap-2 mb-8 px-5 py-3 rounded-xl"
            style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)" }}>
            <span className="text-emerald-400 text-sm font-medium">Total paid:</span>
            <span className="text-emerald-400 font-bold font-mono text-lg">₱{total.toLocaleString()}</span>
          </div>
          <button onClick={onDone}
            className="px-8 py-3.5 rounded-xl font-semibold text-sm active:scale-[0.97]"
            style={{ background: "#22c55e", color: "#fff", transition: "opacity 150ms ease-out, transform 100ms ease-out" }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
            Back to Courts
          </button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
      transition={{ ease: "easeOut", duration: 0.22 }} className="min-h-full">

      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border sticky top-0 z-10"
        style={{ background: "rgba(8,15,46,0.95)", backdropFilter: "blur(16px)" }}>
        <button onClick={onBack} aria-label="Back" className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/5"
          style={{ border: "1px solid rgba(0,212,255,0.15)", color: "#a0b4e0", transition: "background-color 150ms ease-out" }}>
          <ChevronRight className="w-4 h-4 rotate-180" />
        </button>
        <div>
          <h1 className="text-lg font-bold leading-none" style={{ fontFamily: "'Montserrat', sans-serif" }}>PAYMENT</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Review and confirm your booking</p>
        </div>
      </div>

      <div className="p-6 max-w-lg">

        {/* Booking summary card */}
        <div className="rounded-2xl overflow-hidden mb-6"
          style={{ background: "#0f1d47", border: "1px solid rgba(0,212,255,0.15)", boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}>

          {/* Court image strip */}
          <div className="h-28 relative overflow-hidden bg-secondary">
            <img src={data.facility.image} alt={data.facility.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(15,29,71,0.95) 0%, transparent 60%)" }} />
            <div className="absolute bottom-3 left-4 right-4">
              <div className="text-xs text-blue-200 mb-0.5">{data.facility.name}</div>
              <div className="text-base font-bold text-white" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                {data.court.name}
                <span className="ml-2 text-xs px-1.5 py-0.5 rounded-md font-medium align-middle"
                  style={{ background: data.court.type === "Indoor" ? "rgba(0,212,255,0.2)" : "rgba(251,191,36,0.2)", color: data.court.type === "Indoor" ? "#00d4ff" : "#fbbf24" }}>
                  {data.court.type}
                </span>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="px-5 py-4 space-y-3">
            {[
              { label: "Date", value: dateLabel },
              { label: "Time", value: `${data.startTime} – ${data.endTime}` },
              { label: "Duration", value: `${hours} hour${hours !== 1 ? "s" : ""}` },
              { label: "Surface", value: data.court.surface },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{row.label}</span>
                <span className="text-sm text-foreground font-medium">{row.value}</span>
              </div>
            ))}

            <div className="pt-3 mt-1 space-y-2 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Court fee ({hours}h × ₱{data.court.price})</span>
                <span className="text-sm font-mono text-foreground">₱{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Service fee (8%)</span>
                <span className="text-sm font-mono text-muted-foreground">₱{fee.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-sm font-semibold text-foreground">Total</span>
                <span className="text-xl font-bold font-mono text-cyan-400">₱{total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment method */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Payment Method</h3>
          <div className="flex flex-col gap-2">
            {([
              { id: "gcash", label: "GCash", sub: "Instant online payment", icon: "G", iconBg: "#007DFC", recommended: true },
              { id: "cash", label: "Cash on Site", sub: "Pay at the front desk", icon: "₱", iconBg: "#1a2d6e", recommended: false },
              { id: "credits", label: "Pickle Credits", sub: `Balance: ₱1,200`, icon: "P", iconBg: "#22c55e", recommended: false },
            ] as const).map(opt => (
              <button key={opt.id} onClick={() => setMethod(opt.id)}
                className="flex items-center gap-4 px-4 py-3.5 rounded-xl text-left w-full"
                style={{
                  background: method === opt.id ? "rgba(0,212,255,0.08)" : "#0f1d47",
                  border: method === opt.id ? "1px solid rgba(0,212,255,0.35)" : "1px solid rgba(0,212,255,0.1)",
                  transition: "background-color 150ms ease-out, border-color 150ms ease-out",
                }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 text-white"
                  style={{ background: opt.iconBg }}>
                  {opt.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{opt.label}</span>
                    {opt.recommended && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                        style={{ background: "rgba(0,212,255,0.15)", color: "#00d4ff" }}>Recommended</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">{opt.sub}</div>
                </div>
                <div className="w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center"
                  style={{ borderColor: method === opt.id ? "#00d4ff" : "rgba(107,130,184,0.4)" }}>
                  {method === opt.id && (
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#00d4ff" }} />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Confirm button */}
        <button onClick={handleConfirm} disabled={stage === "processing"}
          className="w-full py-4 rounded-2xl font-bold text-base active:scale-[0.97] disabled:opacity-70 flex items-center justify-center gap-3"
          style={{ background: "#22c55e", color: "#fff", boxShadow: "0 8px 32px rgba(34,197,94,0.3)", transition: "opacity 150ms ease-out, transform 100ms ease-out" }}
          onMouseEnter={e => { if (stage !== "processing") e.currentTarget.style.opacity = "0.88"; }}
          onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
          {stage === "processing" ? (
            <>
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
              Processing…
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5" />
              Confirm Payment · ₱{total.toLocaleString()}
            </>
          )}
        </button>

        <p className="text-xs text-center text-muted-foreground mt-4">
          By confirming, you agree to Picklers' booking and cancellation policy.
        </p>
      </div>
    </motion.div>
  );
}
