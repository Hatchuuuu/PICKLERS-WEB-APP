import { useNavigate } from "react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";


import { PicklersLogo } from "@/components/ui/PicklersLogo";


export function AuthPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); navigate("/app"); }, 900);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, #00d4ff 0%, transparent 70%)" }} />
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ ease: "easeOut", duration: 0.25 }}
        className="w-full max-w-md rounded-2xl p-8 relative z-10"
        style={{ background: "#0f1d47", border: "1px solid rgba(0,212,255,0.15)", boxShadow: "0 24px 80px rgba(0,0,0,0.5)" }}>

        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-1">
            <PicklersLogo size={28} />
            <span className="text-2xl font-bold tracking-widest" style={{ fontFamily: "'Montserrat', sans-serif", color: "#00d4ff" }}>PICKLERS</span>
          </div>
          <p className="text-sm text-muted-foreground">Philippine Pickleball Booking</p>
        </div>

        <div className="flex relative mb-6 border-b border-border">
          {(["signin", "signup"] as const).map((val) => (
            <button key={val} onClick={() => setTab(val)} className="flex-1 py-3 text-sm font-medium transition-colors"
              style={{ color: tab === val ? "#00d4ff" : "#6b82b8" }}>
              {val === "signin" ? "Sign In" : "Create Account"}
            </button>
          ))}
          <motion.div layout className="absolute bottom-0 h-0.5 rounded-full"
            style={{ background: "#00d4ff", left: tab === "signin" ? "0%" : "50%", width: "50%" }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }} />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <AnimatePresence>
            {tab === "signup" && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                transition={{ ease: "easeOut", duration: 0.2 }} className="overflow-hidden">
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Full Name</label>
                <input type="text" placeholder="Maria Santos" className="w-full rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring transition-all"
                  style={{ background: "rgba(26,45,110,0.6)", border: "1px solid rgba(0,212,255,0.15)", color: "#e8eeff" }} />
              </motion.div>
            )}
          </AnimatePresence>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Email address</label>
            <input type="email" placeholder="you@example.com" className="w-full rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring transition-all"
              style={{ background: "rgba(26,45,110,0.6)", border: "1px solid rgba(0,212,255,0.15)", color: "#e8eeff" }} />
          </div>
          {tab === "signin" && (
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Password</label>
              <input type="password" placeholder="••••••••" className="w-full rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring transition-all"
                style={{ background: "rgba(26,45,110,0.6)", border: "1px solid rgba(0,212,255,0.15)", color: "#e8eeff" }} />
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-3.5 rounded-xl font-semibold text-sm active:scale-[0.97] disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: "#22c55e", color: "#fff", boxShadow: "0 6px 20px rgba(34,197,94,0.25)", transition: "opacity 150ms ease-out, transform 100ms ease-out" }}>
            {loading ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.7, ease: "linear" }}
                className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
            ) : (tab === "signin" ? "Sign In" : "Create Account")}
          </button>

          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 h-px" style={{ background: "rgba(0,212,255,0.12)" }} />
            <span className="text-xs text-muted-foreground">or continue with</span>
            <div className="flex-1 h-px" style={{ background: "rgba(0,212,255,0.12)" }} />
          </div>

          <div className="flex gap-3">
            {["Google", "Facebook"].map(provider => (
              <button key={provider} type="button"
                className="flex-1 py-3 rounded-xl text-sm font-medium active:scale-[0.97] hover:opacity-80 transition-all"
                style={{ background: "rgba(26,45,110,0.6)", border: "1px solid rgba(0,212,255,0.15)", color: "#e8eeff" }}>
                {provider}
              </button>
            ))}
          </div>
        </form>

        <button onClick={() => navigate("/")} className="mt-6 text-xs text-muted-foreground hover:text-foreground transition-colors block text-center w-full">
          ← Back to home
        </button>
      </motion.div>
    </div>
  );
}
