import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Check, Wallet, ScanFace, Fingerprint, Moon } from "lucide-react";
import { Toggle } from "@/components/ui/shared";
import { useTheme } from "next-themes";
import { TimePicker } from "@/components/shared/TimePicker";
import { cn } from "@/lib/utils";


export function OwnerSettings() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  
  const { theme, setTheme } = useTheme();
  const darkMode = theme === "dark";
  
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
  
  const [openTime, setOpenTime] = useState("06:00");
  const [closeTime, setCloseTime] = useState("22:00");

  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
    };
  }, [logoPreview]);

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

  function handleBiometricAuth() {
    setIsScanning(true);
    setTimeout(() => {
      setIsAuthenticated(true);
      setIsScanning(false);
    }, 1500);
  }

  return (
    <div className="p-4 max-w-6xl mx-auto w-full max-w-xl relative min-h-full">
      <AnimatePresence>
        {!isAuthenticated && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80"
            style={{ 
              backdropFilter: "blur(40px) saturate(1.5)", 
            }}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 400, damping: 30 }}
              className="flex flex-col items-center max-w-sm w-full"
            >
              <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
                <motion.div 
                  className="absolute inset-0 rounded-[28px] border-[1.5px]"
                  style={{ borderColor: "rgba(0, 217, 139, 0.3)" }}
                />
                
                {isScanning && (
                  <motion.div 
                    animate={{ top: ["0%", "100%", "0%"] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className="absolute left-0 right-0 h-[2px] shadow-[0_0_12px_rgba(0,217,139,1)] z-10"
                    style={{ background: "var(--accent-primary)" }}
                  />
                )}
                
                <ScanFace className="w-11 h-11 text-emerald-400 opacity-90" />
              </div>
              <h2 className="text-[24px] font-extrabold tracking-tight text-foreground mb-2" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display'" }}>
                Secure Enclave
              </h2>
              <p className="text-[14px] text-muted-foreground text-center mb-8 leading-relaxed max-w-[260px]">
                Confirm your identity to access facility settings and sensitive data.
              </p>
              
              <button 
                onClick={handleBiometricAuth}
                disabled={isScanning}
                className={cn("w-full py-4 rounded-[20px] font-bold text-[15px] shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 border border-border",
                  isScanning 
                    ? "bg-black/5 dark:bg-white/5 text-muted-foreground" 
                    : "bg-black/[0.04] hover:bg-black/5 dark:bg-white/[0.08] dark:hover:bg-white/[0.12] text-foreground"
                )}
              >
                {isScanning ? (
                  "Scanning..."
                ) : (
                  <>
                    <Fingerprint className="w-4 h-4 text-emerald-400" />
                    Authenticate
                  </>
                )}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative h-[68px] mb-4 -mt-[1px] flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <h1 className="text-[26px] min-[390px]:text-[28px] md:text-[32px] font-extrabold tracking-tight leading-none mb-1.5 whitespace-nowrap" style={{ color: "var(--ink-primary)" }}>
              Facility Settings
            </h1>
            <p className="text-[13px] font-medium leading-relaxed" style={{ color: "var(--ink-muted)" }}>
              Manage your business profile and preferences
            </p>
          </motion.div>
      </div>

      <section className="mb-8">
        <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.1em] mb-2 px-4">Facility Branding</h2>
        <div className="rounded-2xl overflow-hidden shadow-sm bg-surface-raised border border-border">
          
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-[15px] text-foreground">Logo</span>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 overflow-hidden shadow-sm bg-surface-interactive border border-border">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-foreground">BGC</span>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              <button onClick={() => fileInputRef.current?.click()} className="text-[15px] text-[#0a84ff] active:opacity-70 transition-opacity">
                {logoPreview ? "Change" : "Upload"}
              </button>
            </div>
          </div>

          <div className="flex items-center px-4 min-h-[44px] border-b border-border">
            <label className="text-[15px] text-foreground w-[120px] shrink-0">Name</label>
            <input value={facilityName} onChange={e => setFacilityName(e.target.value)}
              className="flex-1 bg-transparent text-[15px] text-right outline-none placeholder:text-muted-foreground text-muted-foreground" />
          </div>

          <div className="flex items-center px-4 min-h-[44px]">
            <label className="text-[15px] text-foreground w-[120px] shrink-0">Location</label>
            <input value={location} onChange={e => setLocation(e.target.value)}
              className="flex-1 bg-transparent text-[15px] text-right outline-none placeholder:text-muted-foreground text-muted-foreground" />
          </div>

        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.1em] mb-2 px-4">Operating Hours</h2>
        <div className="rounded-2xl overflow-hidden shadow-sm bg-surface-raised border border-border">
          <div className="flex items-center justify-between px-4 min-h-[44px]">
            <div className="text-[15px] text-foreground">Open 24 Hours</div>
            <Toggle value={open24h} onChange={setOpen24h} />
          </div>
          <AnimatePresence>
            {!open24h && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                transition={{ ease: "easeOut", duration: 0.2 }} className="overflow-hidden">
                <div className="border-t border-border">
                  <div className="flex items-center justify-between px-4 min-h-[44px] border-b border-border">
                    <label className="text-[15px] text-foreground">Open</label>
                    <TimePicker value={openTime} onChange={setOpenTime} />
                  </div>
                  <div className="flex items-center justify-between px-4 min-h-[44px]">
                    <label className="text-[15px] text-foreground">Close</label>
                    <TimePicker value={closeTime} onChange={setCloseTime} />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <p className="text-[12px] text-muted-foreground mt-2 px-4">Courts are available around the clock when Open 24 Hours is enabled.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.1em] mb-2 px-4">Payment Configuration</h2>
        
        <div className="rounded-2xl overflow-hidden shadow-sm mb-4 bg-surface-raised border border-border">
          <div className="flex items-center justify-between px-4 min-h-[44px]">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded flex items-center justify-center text-[11px] font-bold text-foreground shadow-sm" style={{ background: "#007DFC" }}>G</div>
              <div className="text-[15px] text-foreground">GCash</div>
            </div>
            <Toggle value={gcashEnabled} onChange={setGcashEnabled} />
          </div>
          
          <AnimatePresence>
            {gcashEnabled && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                transition={{ ease: "easeOut", duration: 0.2 }} className="overflow-hidden">
                <div className="flex items-center px-4 min-h-[44px] border-t border-border">
                  <label className="text-[15px] text-foreground w-[120px] shrink-0">Number</label>
                  <input value={gcashNumber} onChange={e => { setGcashNumber(e.target.value); setOtpSent(false); setOtpVerified(false); }}
                    className="flex-1 bg-transparent text-[15px] text-right outline-none font-mono text-muted-foreground" />
                </div>
                
                {!otpVerified && (
                  <div className="flex items-center justify-between px-4 min-h-[44px] border-t border-border">
                    {otpSent ? (
                      <>
                        <input value={otpValue} onChange={e => setOtpValue(e.target.value.slice(0, 6))} maxLength={6} placeholder="Code" className="bg-transparent text-[15px] outline-none w-20 font-mono tracking-widest text-foreground/90" />
                        <button onClick={handleVerifyOtp} disabled={otpValue.length < 4} className="text-[15px] text-[#007DFC] disabled:opacity-40 active:opacity-70 font-medium">Verify</button>
                      </>
                    ) : (
                      <>
                        <span className="text-[13px] text-muted-foreground">Verification required</span>
                        <button onClick={handleSendCode} className="text-[15px] text-[#0a84ff] active:opacity-70 font-medium">Send OTP</button>
                      </>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="rounded-2xl overflow-hidden shadow-sm bg-surface-raised border border-border">
          <div className="flex items-center justify-between px-4 min-h-[44px]">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded flex items-center justify-center shadow-sm bg-black/5 dark:bg-white/[0.08]">
                <Wallet className="w-3.5 h-3.5 text-foreground" />
              </div>
              <div className="text-[15px] text-foreground">Cash on Site</div>
            </div>
            <span className="text-[13px] text-emerald-400 font-medium">Always enabled</span>
          </div>
        </div>
        <p className="text-[12px] text-muted-foreground mt-2 px-4">Instant online payouts will be transferred to your GCash number.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.1em] mb-2 px-4">Appearance</h2>
        <div className="rounded-2xl overflow-hidden shadow-sm bg-surface-raised border border-border">
          <div className="flex items-center justify-between px-4 min-h-[44px]">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded flex items-center justify-center shadow-sm bg-zinc-700">
                <Moon className="w-3.5 h-3.5 text-foreground" />
              </div>
              <div className="text-[15px] text-foreground">Dark Mode</div>
            </div>
            <Toggle value={darkMode} onChange={() => setTheme(darkMode ? "light" : "dark")} />
          </div>
        </div>
      </section>

      <AnimatePresence>
        {saveStage === "saved" && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-2 px-4 py-3 rounded-xl mb-4 bg-emerald-500/10 border border-emerald-500/20">
            <Check className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Settings saved successfully!</span>
          </motion.div>
        )}
      </AnimatePresence>

      <button onClick={handleSave} disabled={saveStage === "saving"}
        className="w-full py-3.5 rounded-2xl font-bold text-sm active:scale-[0.97] flex items-center justify-center gap-2 disabled:opacity-70 mb-8 bg-accent-success text-white" style={{ boxShadow: "0 6px 20px rgba(34,197,94,0.25)", transition: "opacity 150ms ease-out, transform 100ms ease-out" }}
        onMouseEnter={e => { if (saveStage === "idle") e.currentTarget.style.opacity = "0.88"; }}
        onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
        {saveStage === "saving" ? (
          <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.7, ease: "linear" }}
            className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />Saving…</>
        ) : "Save Changes"}
      </button>

      <div className="pt-6 border-t border-solid mb-4" style={{ borderColor: "var(--border-subtle)" }}>
        <button onClick={() => navigate("/app")}
          className="w-full py-3.5 rounded-2xl font-bold text-sm active:scale-[0.97] transition-all border border-solid flex items-center justify-center gap-2"
          style={{ 
            borderColor: "var(--border-default)", 
            color: "var(--ink-secondary)", 
            background: "transparent" 
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "var(--surface-raised)"; e.currentTarget.style.color = "var(--ink-primary)" }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--ink-secondary)" }}>
          Switch to Player View
        </button>
      </div>
    </div>
  );
}
