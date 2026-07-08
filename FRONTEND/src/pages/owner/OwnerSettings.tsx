import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check,
  Wallet
} from "lucide-react";
import { Toggle } from "@/components/ui/shared";


export function OwnerSettings() {
  const [open24h, setOpen24h] = useState(false);
  const [gcashEnabled, setGcashEnabled] = useState(true);
  const [gcashNumber, setGcashNumber] = useState("09123489758");
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [saveStage, setSaveStage] = useState<"idle" | "saving" | "saved">("idle");
  const [facilityName, setFacilityName] = useState("BGC Pickleball Hub");
  const [location, setLocation] = useState("Bonifacio Global City, Taguig");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  function handleSendCode() {
    setOtpSent(true);
    setOtpVerified(false);
    setOtpValue("");
  }

  function handleVerifyOtp() {
    if (otpValue.length >= 4) setOtpVerified(true);
  }

  function handleSave() {
    setSaveStage("saving");
    setTimeout(() => { setSaveStage("saved"); setTimeout(() => setSaveStage("idle"), 2500); }, 1200);
  }

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setLogoPreview(url);
    }
  }

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: "'Montserrat', sans-serif" }}>SETTINGS</h1>

      <section className="mb-8">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">Facility Branding</h2>
        <div className="rounded-xl p-4" style={{ background: "#0f1d47", border: "1px solid rgba(0,212,255,0.1)" }}>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
              style={{ background: "#1a2d6e", border: "1px dashed rgba(0,212,255,0.3)" }}>
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl font-bold" style={{ fontFamily: "'Montserrat', sans-serif", color: "#00d4ff" }}>BGC</span>
              )}
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground mb-1">{facilityName}</div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              <button onClick={() => fileInputRef.current?.click()} className="text-xs text-cyan-400 hover:opacity-80 transition-opacity">
                {logoPreview ? "Change logo" : "Upload logo"}
              </button>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Facility Name</label>
              <input value={facilityName} onChange={e => setFacilityName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-ring"
                style={{ background: "rgba(26,45,110,0.6)", border: "1px solid rgba(0,212,255,0.15)", color: "#e8eeff" }} />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Location</label>
              <input value={location} onChange={e => setLocation(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-ring"
                style={{ background: "rgba(26,45,110,0.6)", border: "1px solid rgba(0,212,255,0.15)", color: "#e8eeff" }} />
            </div>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">Operating Hours</h2>
        <div className="rounded-xl overflow-hidden" style={{ background: "#0f1d47", border: "1px solid rgba(0,212,255,0.1)" }}>
          <div className="flex items-center justify-between px-4 py-4">
            <div>
              <div className="text-sm font-medium text-foreground">Open 24 Hours</div>
              <div className="text-xs text-muted-foreground">Court available around the clock</div>
            </div>
            <Toggle value={open24h} onChange={setOpen24h} />
          </div>
          <AnimatePresence>
            {!open24h && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                transition={{ ease: "easeOut", duration: 0.2 }} className="overflow-hidden">
                <div className="border-t border-border px-4 py-4 grid grid-cols-2 gap-4">
                  {["Open", "Close"].map(label => (
                    <div key={label}>
                      <label className="block text-xs text-muted-foreground mb-1">{label} Time</label>
                      <input type="time" defaultValue={label === "Open" ? "06:00" : "22:00"}
                        className="w-full px-3 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-ring font-mono"
                        style={{ background: "rgba(26,45,110,0.6)", border: "1px solid rgba(0,212,255,0.15)", color: "#e8eeff" }} />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">Payment Configuration</h2>
        <div className="rounded-xl p-4 mb-3" style={{ background: "#0f1d47", border: "1px solid rgba(0,212,255,0.1)" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white" style={{ background: "#007DFC" }}>G</div>
              <div>
                <div className="text-sm font-medium text-foreground">GCash</div>
                <div className="text-xs text-muted-foreground">Instant online payment</div>
              </div>
            </div>
            <Toggle value={gcashEnabled} onChange={setGcashEnabled} />
          </div>
          <AnimatePresence>
            {gcashEnabled && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                transition={{ ease: "easeOut", duration: 0.2 }} className="overflow-hidden">
                <div className="border-t border-border pt-4">
                  <label className="block text-xs text-muted-foreground mb-1.5">Payout GCash Number</label>
                  <div className="flex gap-2 mb-2">
                    <input value={gcashNumber} onChange={e => { setGcashNumber(e.target.value); setOtpSent(false); setOtpVerified(false); }}
                      className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-ring font-mono"
                      style={{ background: "rgba(26,45,110,0.6)", border: "1px solid rgba(0,212,255,0.15)", color: "#e8eeff" }} />
                    <button onClick={handleSendCode}
                      className="px-4 py-2.5 rounded-xl text-sm font-medium active:scale-[0.97] text-white shrink-0"
                      style={{ background: otpVerified ? "#22c55e" : "#007DFC", transition: "background-color 200ms ease-out" }}>
                      {otpVerified ? "Verified ✓" : otpSent ? "Resend" : "Send Code"}
                    </button>
                  </div>
                  <AnimatePresence>
                    {otpSent && !otpVerified && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        transition={{ ease: "easeOut", duration: 0.2 }} className="overflow-hidden">
                        <div className="text-xs text-muted-foreground mb-2">Enter the 6-digit code sent to {gcashNumber}</div>
                        <div className="flex gap-2">
                          <input value={otpValue} onChange={e => setOtpValue(e.target.value.slice(0, 6))} maxLength={6} placeholder="000000"
                            className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-ring font-mono text-center tracking-widest"
                            style={{ background: "rgba(26,45,110,0.6)", border: "1px solid rgba(0,212,255,0.2)", color: "#e8eeff" }} />
                          <button onClick={handleVerifyOtp} disabled={otpValue.length < 4}
                            className="px-4 py-2.5 rounded-xl text-sm font-medium active:scale-[0.97] disabled:opacity-40 text-white"
                            style={{ background: "#007DFC" }}>
                            Verify
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="rounded-xl p-4" style={{ background: "#0f1d47", border: "1px solid rgba(0,212,255,0.1)" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,255,255,0.08)" }}>
                <Wallet className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">Cash on Site</div>
                <div className="text-xs text-muted-foreground">Walk-in payments</div>
              </div>
            </div>
            <span className="text-xs text-emerald-400 font-medium">Always enabled</span>
          </div>
        </div>
      </section>

      <AnimatePresence>
        {saveStage === "saved" && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-2 px-4 py-3 rounded-xl mb-4"
            style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)" }}>
            <Check className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-emerald-400 font-medium">Settings saved successfully!</span>
          </motion.div>
        )}
      </AnimatePresence>

      <button onClick={handleSave} disabled={saveStage === "saving"}
        className="w-full py-3.5 rounded-2xl font-bold text-sm active:scale-[0.97] flex items-center justify-center gap-2 disabled:opacity-70"
        style={{ background: "#22c55e", color: "#fff", boxShadow: "0 6px 20px rgba(34,197,94,0.25)", transition: "opacity 150ms ease-out, transform 100ms ease-out" }}
        onMouseEnter={e => { if (saveStage === "idle") e.currentTarget.style.opacity = "0.88"; }}
        onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
        {saveStage === "saving" ? (
          <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.7, ease: "linear" }}
            className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />Saving…</>
        ) : "Save Changes"}
      </button>
    </div>
  );
}
