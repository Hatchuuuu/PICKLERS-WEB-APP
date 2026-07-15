"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from 'next/navigation';

import { motion, AnimatePresence } from "motion/react";
import { Check, Wallet, ScanFace, Fingerprint, Moon, Camera, MapPin, Sun, ArrowRight } from "lucide-react";
import { Toggle } from "@/components/ui/shared";
import { useTheme } from "next-themes";
import { TimePicker } from "@/components/shared/TimePicker";
import { cn } from "@/lib/utils";
import { SettingsGroup, containerVariants } from "@/components/shared/SettingsUI";

export default function OwnerSettings() {
  const router = useRouter();
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
    <div className="p-4 max-w-6xl mx-auto w-full min-h-full pb-24">
      {/* SECURE ENCLAVE (AUTH GATE) */}
      <AnimatePresence>
        {!isAuthenticated && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80"
            style={{ backdropFilter: "blur(40px) saturate(1.5)" }}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 400, damping: 30 }}
              className="flex flex-col items-center max-w-sm w-full relative"
            >
              {/* Pulsing background glow */}
              <motion.div 
                animate={{ scale: isScanning ? [1, 1.2, 1] : 1, opacity: isScanning ? [0.2, 0.4, 0.2] : 0.1 }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                className="absolute w-64 h-64 rounded-full bg-emerald-500/20 blur-[60px] -z-10 pointer-events-none"
              />

              <div className="relative w-28 h-28 mb-8 flex items-center justify-center">
                <motion.div 
                  className="absolute inset-0 rounded-full border border-emerald-500/30"
                  animate={{ scale: isScanning ? [1, 1.1, 1] : 1 }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                />
                <motion.div 
                  className="absolute inset-2 rounded-full border border-emerald-500/20"
                  animate={{ scale: isScanning ? [1, 1.15, 1] : 1 }}
                  transition={{ repeat: Infinity, duration: 2, delay: 0.2, ease: "easeInOut" }}
                />
                
                {isScanning && (
                  <motion.div 
                    animate={{ top: ["0%", "100%", "0%"] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                    className="absolute left-0 right-0 h-[2px] shadow-[0_0_15px_rgba(16,185,129,1)] z-10 bg-emerald-400"
                  />
                )}
                
                <ScanFace className={cn("w-12 h-12 transition-colors duration-300", isScanning ? "text-emerald-400" : "text-foreground/80")} />
              </div>
              
              <h2 className="text-[28px] font-extrabold tracking-tight text-foreground mb-3 text-center">
                Secure Enclave
              </h2>
              <p className="text-[15px] text-muted-foreground text-center mb-10 leading-relaxed max-w-[280px]">
                Verify your identity to access sensitive facility configurations.
              </p>
              
              <button 
                onClick={handleBiometricAuth}
                disabled={isScanning}
                className={cn("w-full py-4 rounded-xl font-bold text-[15px] active:scale-[0.98] transition-all flex items-center justify-center gap-3 relative overflow-hidden",
                  isScanning 
                    ? "bg-surface-interactive text-muted-foreground border border-border" 
                    : "bg-emerald-500 text-white shadow-[0_8px_25px_rgba(16,185,129,0.3)] hover:shadow-[0_12px_30px_rgba(16,185,129,0.4)] hover:-translate-y-0.5"
                )}
              >
                {isScanning ? (
                  "Scanning Face ID..."
                ) : (
                  <>
                    <Fingerprint className="w-5 h-5" />
                    Authenticate
                  </>
                )}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <div className="relative mb-8 flex items-end justify-between">
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
          <h1 className="text-[32px] md:text-[40px] font-extrabold tracking-tight leading-none mb-2 text-foreground">
            Settings
          </h1>
          <p className="text-[15px] font-medium text-muted-foreground">
            Manage your facility operations and branding
          </p>
        </motion.div>

        {/* Floating Save Button on Desktop */}
        <div className="hidden md:block">
          <button onClick={handleSave} disabled={saveStage === "saving"}
            className="px-6 py-2.5 rounded-full font-bold text-[14px] active:scale-[0.97] flex items-center justify-center gap-2 transition-all bg-emerald-500 text-white shadow-[0_6px_20px_rgba(16,185,129,0.25)] hover:shadow-[0_8px_25px_rgba(16,185,129,0.35)] disabled:opacity-80">
            {saveStage === "saving" ? (
              <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.7, ease: "linear" }}
                className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />Saving</>
            ) : saveStage === "saved" ? (
              <><Check className="w-4 h-4" />Saved!</>
            ) : "Save Changes"}
          </button>
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />

      {/* GRID LAYOUT */}
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-0">
        
        {/* LEFT COLUMN */}
        <div className="flex flex-col">
          
          {/* FACILITY BRANDING */}
          <SettingsGroup title="Facility Identity">
            <div className="p-5">
              {/* Logo Upload */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full flex items-center justify-center shrink-0 overflow-hidden shadow-sm bg-surface-interactive border border-border relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <span className="text-lg font-black text-foreground tracking-tighter">BGC</span>
                  )}
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Camera className="w-5 h-5 text-white mb-0.5" />
                  </div>
                </div>
                <div>
                  <div className="text-[15px] font-bold text-foreground mb-0.5">Brand Logo</div>
                  <div className="text-[13px] text-muted-foreground max-w-[200px] leading-relaxed">Upload a high-res square image.</div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium tracking-tight mb-2 block">Facility Name</label>
                  <div className="relative">
                    <input value={facilityName} onChange={e => setFacilityName(e.target.value)}
                      className="w-full bg-surface-interactive/50 border border-border rounded-[14px] px-4 py-3 text-[15px] font-bold text-foreground outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium tracking-tight mb-2 block">Location</label>
                  <div className="relative flex items-center">
                    <MapPin className="w-4 h-4 absolute left-4 text-muted-foreground" />
                    <input value={location} onChange={e => setLocation(e.target.value)}
                      className="w-full bg-surface-interactive/50 border border-border rounded-[14px] pl-11 pr-4 py-3 text-[15px] font-bold text-foreground outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all" />
                  </div>
                </div>
              </div>
            </div>
          </SettingsGroup>

          {/* APPEARANCE */}
          <SettingsGroup title="Interface">
            <div className="flex items-center justify-between p-4 bg-transparent">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-[14px] flex items-center justify-center bg-zinc-500/10 text-zinc-500 dark:text-zinc-400 shadow-inner">
                  <Moon className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[16px] font-bold text-foreground">Dark Mode</span>
                </div>
              </div>
              <Toggle checked={darkMode} onChange={() => setTheme(darkMode ? "light" : "dark")} />
            </div>
          </SettingsGroup>
        </div>



        {/* RIGHT COLUMN */}
        <div className="flex flex-col">

          {/* OPERATING HOURS */}
          <SettingsGroup title="Operating Hours">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-[14px] flex items-center justify-center bg-amber-500/10 text-amber-500 shadow-inner">
                  <Sun className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[16px] font-bold text-foreground">Open 24 Hours</span>
                </div>
              </div>
              <Toggle checked={open24h} onChange={() => setOpen24h(!open24h)} />
            </div>

            <AnimatePresence initial={false}>
              {!open24h && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }} 
                  animate={{ height: "auto", opacity: 1 }} 
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }} 
                  className="overflow-hidden bg-surface-interactive/30"
                >
                  <div className="p-4 grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium tracking-tight">Opening Time</label>
                      <TimePicker value={openTime} onChange={setOpenTime} />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium tracking-tight">Closing Time</label>
                      <TimePicker value={closeTime} onChange={setCloseTime} />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </SettingsGroup>

          {/* PAYMENT CONFIGURATION */}
          <SettingsGroup title="Payment Methods">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-[14px] flex items-center justify-center bg-[#007DFC] text-white shadow-[0_4px_10px_rgba(0,125,252,0.3)]">
                  <span className="font-black text-lg">G</span>
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[16px] font-bold text-foreground">GCash Payouts</span>
                </div>
              </div>
              <Toggle checked={gcashEnabled} onChange={() => setGcashEnabled(!gcashEnabled)} />
            </div>

            <AnimatePresence initial={false}>
              {gcashEnabled && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }} 
                  animate={{ height: "auto", opacity: 1 }} 
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }} 
                  className="overflow-hidden bg-surface-interactive/30 border-b border-border"
                >
                  <div className="p-4 flex flex-col gap-3">
                    <div className="relative">
                      <label className="text-sm font-medium tracking-tight mb-1.5 block">GCash Number</label>
                      <input value={gcashNumber} onChange={e => { setGcashNumber(e.target.value); setOtpSent(false); setOtpVerified(false); }}
                        className="w-full bg-background border border-border rounded-[12px] px-3 py-2 text-[15px] font-mono font-bold tracking-wide text-foreground outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all" />
                    </div>

                    {!otpVerified && (
                      <div className="flex items-center justify-between bg-blue-500/5 border border-blue-500/10 rounded-lg p-2.5">
                        {otpSent ? (
                          <div className="flex items-center justify-between w-full">
                            <input value={otpValue} onChange={e => setOtpValue(e.target.value.slice(0, 6))} maxLength={6} placeholder="Enter 6-digit OTP" 
                              className="bg-transparent text-[14px] outline-none w-32 font-mono tracking-widest text-foreground font-bold placeholder:font-sans placeholder:tracking-normal placeholder:font-normal" />
                            <button onClick={handleVerifyOtp} disabled={otpValue.length < 4} 
                              className="px-3 py-1.5 rounded-md text-[12px] font-bold bg-[#007DFC] text-white disabled:opacity-50 transition-all active:scale-95">Verify</button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between w-full">
                            <span className="text-[12px] font-medium text-blue-600 dark:text-blue-400">Number verification required</span>
                            <button onClick={handleSendCode} 
                              className="px-3 py-1.5 rounded-md text-[12px] font-bold bg-[#007DFC]/10 text-[#007DFC] hover:bg-[#007DFC]/20 transition-all active:scale-95">Send OTP</button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-[14px] flex items-center justify-center bg-emerald-500/10 text-emerald-500 shadow-inner">
                  <Wallet className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[16px] font-bold text-foreground">Cash on Site</span>
                </div>
              </div>
              <div className="px-3 py-1.5 rounded-[8px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-medium tracking-tight">
                Active
              </div>
            </div>
          </SettingsGroup>

        </div>
      </motion.div>

      {/* MOBILE SAVE BUTTON */}
      <div className="md:hidden fixed bottom-6 left-4 right-4 z-40">
        <button onClick={handleSave} disabled={saveStage === "saving"}
          className="w-full py-3.5 rounded-xl font-bold text-[15px] active:scale-[0.98] flex items-center justify-center gap-2 transition-all bg-emerald-500 text-white shadow-[0_8px_30px_rgba(16,185,129,0.3)] disabled:opacity-80 backdrop-blur-md">
          {saveStage === "saving" ? (
            <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.7, ease: "linear" }}
              className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />Saving Configurations…</>
          ) : saveStage === "saved" ? (
            <><Check className="w-5 h-5" />Settings Saved!</>
          ) : "Save Changes"}
        </button>
      </div>

      {/* SWITCH TO PLAYER VIEW */}
      <div className="mt-10 flex justify-center pb-8">
        <button onClick={() => router.push("/app")}
          className="group flex items-center gap-2 text-[13px] font-bold text-muted-foreground hover:text-foreground transition-colors">
          Switch to Player Dashboard <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

    </div>
  );
}
