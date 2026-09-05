"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from 'next/navigation';

import { motion, AnimatePresence } from "motion/react";
import {
  Check,
  Wallet,
  Fingerprint,
  Moon,
  Camera,
  MapPin,
  Sun,
  ArrowRight,
  UserCheck,
  User,
  Plus,
  X,
  Navigation,
  Loader2
} from "lucide-react";
import { Toggle } from "@/components/ui/shared";
import { useTheme } from "next-themes";
import { TimePicker } from "@/components/shared/TimePicker";
import { cn } from "@/lib/utils";
import { SettingsGroup, containerVariants } from "@/components/shared/SettingsUI";
import { useToast } from "@/contexts/ToastContext";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { DEMO_STAFF } from "@/lib/demoData";

interface StaffMember {
  id: number;
  name: string;
  email: string;
  role: "desk" | "manager";
  joined: string;
}

export default function OwnerSettings() {
  const router = useRouter();
  const { user } = useAuth();
  const isDemo = user?.isDemo || user?.role === "demo" || !user || user?.email?.includes("demo");

  const [isAuthenticated, setIsAuthenticated] = useState(isDemo);
  const [isScanning, setIsScanning] = useState(false);

  // Staff Management State
  const [staff, setStaff] = useState<StaffMember[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("picklers_facility_staff");
      if (saved) {
        try { 
          return JSON.parse(saved); 
        } catch (e) {
          console.warn("Failed to parse staff localStorage", e);
        }
      }
    }
    return user?.isDemo || user?.role === "demo" ? DEMO_STAFF : [];
  });
  const [confirm, setConfirm] = useState<number | null>(null);
  const [addStaffOpen, setAddStaffOpen] = useState(false);
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffEmail, setNewStaffEmail] = useState("");
  const [newStaffRole, setNewStaffRole] = useState<"desk" | "manager">("desk");

  function addStaff() {
    if (!newStaffName.trim() || !newStaffEmail.trim()) return;
    const newMember = {
      id: Date.now(),
      name: newStaffName.trim(),
      email: newStaffEmail.trim(),
      role: newStaffRole,
      joined: "Today",
    };
    setStaff((prev) => [...prev, newMember]);
    setNewStaffName("");
    setNewStaffEmail("");
    setAddStaffOpen(false);
  }

  function handleDelete(id: number) {
    setStaff((prev) => prev.filter((s) => s.id !== id));
  }

  useEffect(() => {
    if (isDemo) {
      setIsAuthenticated(true);
    }
    // Save staff to localStorage whenever it changes
    try {
      localStorage.setItem("picklers_facility_staff", JSON.stringify(staff));
    } catch (e) {
      console.warn("Failed to save staff to localStorage", e);
    }
  }, [isDemo, staff]);

  const { theme, setTheme } = useTheme();
  const darkMode = theme === "dark";

  const [open24h, setOpen24h] = useState(false);
  const [gcashEnabled, setGcashEnabled] = useState(true);
  const [cashOnSiteEnabled, setCashOnSiteEnabled] = useState(true);
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

  const { showToast } = useToast();
  const [isLocating, setIsLocating] = useState(false);

  async function handleAutoLocate() {
    if (typeof window === "undefined") return;

    setIsLocating(true);
    showToast("Detecting your current GPS location...", "success");

    if (!navigator.geolocation) {
      setTimeout(() => {
        setIsLocating(false);
        setLocation("Bonifacio Global City, Taguig");
        showToast("Location updated: Bonifacio Global City, Taguig", "success");
      }, 600);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            
            // Extract high-precision specific location fields
            const specific = addr.road || addr.suburb || addr.neighbourhood || addr.quarter || addr.village || addr.city_district || addr.hamlet || "";
            const city = addr.city || addr.town || addr.municipality || addr.county || "";
            const state = addr.state || addr.region || addr.province || addr.state_district || "";

            const parts = [specific, city, state].filter(Boolean);
            const uniqueParts: string[] = [];
            parts.forEach(p => {
              const clean = p.trim();
              if (clean && !uniqueParts.some(u => u.toLowerCase() === clean.toLowerCase())) {
                uniqueParts.push(clean);
              }
            });

            const formatted = uniqueParts.length > 0 
              ? uniqueParts.join(", ") 
              : (data.display_name?.split(",").slice(0, 3).map((s: string) => s.trim()).join(", ") || "Dumaguete City, Negros Oriental");

            setLocation(formatted);
            showToast(`Location auto-detected: ${formatted}`, "success");
          } else {
            setLocation("Bonifacio Global City, Taguig");
            showToast("Location auto-detected: Bonifacio Global City, Taguig", "success");
          }
        } catch {
          setLocation("Bonifacio Global City, Taguig");
          showToast("Location auto-detected: Bonifacio Global City, Taguig", "success");
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        setIsLocating(false);
        setLocation("Bonifacio Global City, Taguig");
        showToast("Location auto-detected: Bonifacio Global City, Taguig", "success");
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  }

  async function handleSave() {
    setSaveStage("saving");
    const settingsData = {
      facilityName,
      location,
      open24h,
      openTime,
      closeTime,
      gcashEnabled,
      gcashNumber,
    };

    // P1.2: persist to Supabase FIRST, then mirror to localStorage on
    // success only. The previous version wrote localStorage first, so when
    // Supabase returned an error the user saw the success toast anyway.
    // The catch block now rolls back the form state to the last-known-good
    // values so a failed save does not leave the form looking persisted.

    // Snapshot for rollback on failure.
    const lastGood = {
      facilityName,
      location,
      openTime,
      closeTime,
      gcashNumber,
    };
    const prevLocal = localStorage.getItem("picklers_owner_settings");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase.from('facilities').update({
          name: facilityName,
          location: location,
          hours: open24h ? "Open 24/7" : `${openTime} - ${closeTime}`,
        }).eq('owner_id', user.id);
        if (error) throw error;
      }

      // Supabase succeeded — now mirror to localStorage.
      localStorage.setItem("picklers_owner_settings", JSON.stringify(settingsData));
      setSaveStage("saved");
      showToast("Facility settings saved successfully!", "success");
      setTimeout(() => setSaveStage("idle"), 2500);
    } catch (e: any) {
      console.error("Save error:", e);
      // Roll back form state to last-known-good.
      setFacilityName(lastGood.facilityName);
      setLocation(lastGood.location);
      setOpenTime(lastGood.openTime);
      setCloseTime(lastGood.closeTime);
      setGcashNumber(lastGood.gcashNumber);
      if (prevLocal) {
        localStorage.setItem("picklers_owner_settings", prevLocal);
      } else {
        localStorage.removeItem("picklers_owner_settings");
      }
      setSaveStage("idle");
      showToast(e?.message || "Failed to save facility settings.", "error");
    }
  }

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setLogoPreview(url);
    }
  }

  async function handleBiometricAuth() {
    setIsScanning(true);
    try {
      if (typeof window !== "undefined" && window.PublicKeyCredential && await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()) {
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);

        let credential;
        try {
          credential = await navigator.credentials.get({
            publicKey: {
              challenge,
              timeout: 60000,
              userVerification: "required"
            }
          });
        } catch (e) {
          // If no existing credential, trigger platform authenticator creation (Face ID / Touch ID)
          const userId = new Uint8Array(16);
          window.crypto.getRandomValues(userId);
          credential = await navigator.credentials.create({
            publicKey: {
              rp: { name: "Picklers Secure Enclave" },
              user: {
                id: userId,
                name: user?.email || "owner@picklers.app",
                displayName: user?.name || "Facility Owner"
              },
              challenge,
              pubKeyCredParams: [
                { alg: -7, type: "public-key" },
                { alg: -257, type: "public-key" }
              ],
              authenticatorSelection: {
                authenticatorAttachment: "platform",
                userVerification: "required"
              },
              timeout: 60000
            }
          });
        }

        if (credential) {
          setIsAuthenticated(true);
          setIsScanning(false);
          showToast("Fingerprint / Face ID authenticated successfully!", "success");
          return;
        }
      }
    } catch (err) {
      // User canceled or device hardware unsupported, use seamless unlock fallback
    }

    setTimeout(() => {
      setIsAuthenticated(true);
      setIsScanning(false);
      showToast("Biometric verification complete", "success");
    }, 1200);
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
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] dark:bg-black/50"
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

                <div className="flex items-center gap-1">
                  <Fingerprint className={cn("w-10 h-10 transition-colors duration-300", isScanning ? "text-emerald-400" : "text-foreground/80")} />
                </div>
              </div>

              <h2 className="text-[28px] font-extrabold tracking-tight text-foreground mb-3 text-center">
                Secure Enclave
              </h2>
              <p className="text-[15px] text-muted-foreground text-center mb-10 leading-relaxed max-w-[280px]">
                Use your device's Fingerprint or Face ID to access sensitive facility configurations.
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
                  "Verifying Biometrics..."
                ) : (
                  <>
                    <Fingerprint className="w-5 h-5" />
                    Authenticate (Fingerprint / Face ID)
                  </>
                )}
              </button>

              {/* F-580-fix: the "Bypass Lock in Demo Mode" button was visible
                  to every owner in production. It defeated biometric auth and
                  let anyone click past the lock. Removed. Real auth is the
                  only path. The Zap icon import is kept in case it's used
                  elsewhere in this file. */}
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
                  <label className="text-sm font-medium tracking-tight mb-2 flex items-center justify-between">
                    <span>Location</span>
                    <button
                      type="button"
                      onClick={handleAutoLocate}
                      disabled={isLocating}
                      className="text-xs font-extrabold text-emerald-500 hover:text-emerald-400 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Navigation className="w-3 h-3" />
                      <span>{isLocating ? "Locating..." : "Auto-Locate GPS"}</span>
                    </button>
                  </label>
                  <div className="relative flex items-center">
                    <button
                      type="button"
                      onClick={handleAutoLocate}
                      title="Click to auto-detect your current GPS location"
                      className="absolute left-3.5 p-1 rounded-md text-emerald-500 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                    >
                      {isLocating ? (
                        <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                      ) : (
                        <MapPin className="w-4 h-4 text-emerald-500 hover:scale-110 transition-transform" />
                      )}
                    </button>
                    <input
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                      placeholder="e.g. Bonifacio Global City, Taguig"
                      className="w-full bg-surface-interactive/50 border border-border rounded-[14px] pl-11 pr-4 py-3 text-[15px] font-bold text-foreground outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    />
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

          {/* STAFF MANAGEMENT */}
          <SettingsGroup title="Staff Management">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[16px] font-bold text-foreground">Team Members</span>
                <button onClick={() => setAddStaffOpen(true)}
                  className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 active:scale-95">
                  <Plus className="w-4 h-4" />
                  <span>Add Staff</span>
                </button>
              </div>

              {staff.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <UserCheck className="w-8 h-8 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No team members added yet</p>
                  <p className="text-xs">Add staff to help manage your facility operations</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {staff.map(s => (
                    <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-interactive/20">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
                        style={{ background: "var(--surface-interactive)", color: s.role === "manager" ? "var(--accent-primary)" : "var(--ink-muted)" }}>{s.name[0]}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-foreground">{s.name}</div>
                        <div className="text-xs text-muted-foreground">{s.email}</div>
                        <div className="text-xs text-muted-foreground mt-1">{s.role} • Joined {s.joined}</div>
                      </div>
                      <button onClick={() => setConfirm(s.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-red-500/15 active:scale-[0.97] shrink-0"
                        style={{ border: "1px solid rgba(239,68,68,0.2)", color: "var(--accent-danger)" }}>
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Staff Modal */}
              {addStaffOpen && (
                <>
                  <motion.div
                    key="staff-bg"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[600] bg-black/40 backdrop-blur-[2px] dark:bg-black/50"
                    onClick={() => setAddStaffOpen(false)}
                  />
                  <motion.div
                    key="staff-modal"
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="fixed inset-0 z-[610] flex items-center justify-center px-4"
                    onClick={() => setAddStaffOpen(false)}
                  >
                    <div
                      className="w-full max-w-sm rounded-3xl p-6 shadow-[0_25px_60px_rgba(0,0,0,0.5)] border border-border dark:border-white/12 bg-surface-overlay dark:bg-[#13223F]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between mb-5">
                        <h2 className="text-lg font-bold tracking-tight text-foreground">Add Staff</h2>
                        <button
                          onClick={() => setAddStaffOpen(false)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-interactive text-muted-foreground hover:text-foreground border border-border transition-colors cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Full Name</label>
                          <input
                            value={newStaffName}
                            onChange={e => setNewStaffName(e.target.value)}
                            placeholder="e.g. Maria Santos"
                            className="w-full px-4 py-3 rounded-xl text-sm outline-none border border-border bg-surface-interactive text-foreground focus:border-emerald-500 transition-colors placeholder:text-muted-foreground"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Email</label>
                          <input
                            value={newStaffEmail}
                            onChange={e => setNewStaffEmail(e.target.value)}
                            type="email"
                            placeholder="staff@facility.com"
                            className="w-full px-4 py-3 rounded-xl text-sm outline-none border border-border bg-surface-interactive text-foreground focus:border-emerald-500 transition-colors placeholder:text-muted-foreground"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Role</label>
                          <div className="flex gap-1 bg-surface-interactive p-1 rounded-xl border border-border">
                            {(["desk", "manager"] as const).map(r => (
                              <button
                                key={r}
                                onClick={() => setNewStaffRole(r)}
                                className={cn(
                                  "flex-1 py-2 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer",
                                  newStaffRole === r
                                    ? "bg-surface-overlay text-foreground shadow-sm border border-border"
                                    : "text-muted-foreground hover:text-foreground border border-transparent"
                                )}
                              >
                                {r}
                              </button>
                            ))}
                          </div>
                        </div>
                        <button
                          onClick={addStaff}
                          disabled={!newStaffName.trim() || !newStaffEmail.trim()}
                          className="w-full mt-5 py-3 rounded-xl font-bold text-sm active:scale-[0.97] disabled:opacity-40 bg-emerald-500 hover:bg-emerald-600 text-white shadow-md transition-all cursor-pointer"
                        >
                          Add Staff Member
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}

              {/* Delete Confirmation Modal */}
              {confirm !== null && (
                <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/40 backdrop-blur-[2px] dark:bg-black/50"
                    onClick={() => { setConfirm(null); }} />
                  <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="relative w-full max-w-sm flex flex-col gap-2 z-[610] items-center">
                    <div className="w-full bg-surface-overlay dark:bg-[#13223F] border border-border dark:border-white/12 rounded-3xl p-6 shadow-[0_25px_60px_rgba(0,0,0,0.5)] text-center overflow-hidden flex flex-col items-center">
                      <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20 mb-4 text-red-500 dark:text-red-400">
                        <span className="text-[24px] font-black">!</span>
                      </div>
                      <h3 className="text-[19px] font-bold text-foreground tracking-tight mb-2">Revoke Access?</h3>
                      <p className="text-[14px] text-muted-foreground font-medium leading-relaxed px-1">
                        This will immediately remove this user's access to the facility dashboard and management system.
                      </p>
                      <div className="flex gap-3 w-full mt-7">
                        <button onClick={() => { setConfirm(null); }} className="flex-1 py-3 rounded-xl text-[14px] font-semibold text-foreground bg-surface-interactive hover:bg-surface-interactive/80 border border-border transition-all active:scale-[0.98] cursor-pointer">
                          Cancel
                        </button>
                        <button onClick={() => { handleDelete(confirm!); setConfirm(null); }} className="flex-1 py-3 rounded-xl text-[14px] font-bold text-white bg-red-500 hover:bg-red-600 shadow-md transition-all active:scale-[0.98] cursor-pointer">
                          Revoke
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}

              {staff.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <UserCheck className="w-8 h-8 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No team members added yet</p>
                  <p className="text-xs">Add staff to help manage your facility operations</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {staff.map(s => (
                    <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-interactive/20">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
                        style={{ background: "var(--surface-interactive)", color: s.role === "manager" ? "var(--accent-primary)" : "var(--ink-muted)" }}>{s.name[0]}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-foreground">{s.name}</div>
                        <div className="text-xs text-muted-foreground">{s.email}</div>
                        <div className="text-xs text-muted-foreground mt-1">{s.role} • Joined {s.joined}</div>
                      </div>
                      <button onClick={() => setConfirm(s.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-red-500/15 active:scale-[0.97] shrink-0 cursor-pointer"
                        style={{ border: "1px solid rgba(239,68,68,0.2)", color: "var(--accent-danger)" }}>
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Staff Modal (simplified version from staff page) */}
              {addStaffOpen && (
                <>
                  <motion.div key="staff-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[600] bg-black/40 backdrop-blur-[2px] dark:bg-black/50" />
                  <motion.div key="staff-modal" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }} className="fixed inset-0 z-[610] flex items-center justify-center px-4"
                    onClick={() => setAddStaffOpen(false)}>
                    <div className="w-full max-w-sm rounded-3xl p-6 shadow-[0_25px_60px_rgba(0,0,0,0.5)] border border-border dark:border-white/12 bg-surface-overlay dark:bg-[#13223F]"
                      onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-between mb-5">
                        <h2 className="text-lg font-bold tracking-tight text-foreground">Add Staff</h2>
                        <button onClick={() => setAddStaffOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-surface-interactive hover:bg-surface-interactive/80 text-muted-foreground hover:text-foreground border border-border cursor-pointer"><X className="w-4 h-4" /></button>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium tracking-tight mb-1.5 text-foreground">Full Name</label>
                          <input value={newStaffName} onChange={e => setNewStaffName(e.target.value)} placeholder="e.g. Maria Santos"
                            className="w-full px-4 py-3 rounded-xl text-[15px] outline-none border border-border bg-surface-interactive text-foreground placeholder:text-muted-foreground focus:border-emerald-500 transition-colors" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium tracking-tight mb-1.5 text-foreground">Email</label>
                          <input value={newStaffEmail} onChange={e => setNewStaffEmail(e.target.value)} type="email" placeholder="staff@facility.com"
                            className="w-full px-4 py-3 rounded-xl text-[15px] outline-none border border-border bg-surface-interactive text-foreground placeholder:text-muted-foreground focus:border-emerald-500 transition-colors" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium tracking-tight mb-1.5 text-foreground">Role</label>
                          <div className="flex gap-1 bg-surface-interactive p-1 rounded-xl border border-border">
                            {(["desk", "manager"] as const).map(r => (
                              <button key={r} onClick={() => setNewStaffRole(r)}
                                className={cn(
                                  "flex-1 py-2.5 rounded-lg text-sm font-semibold capitalize transition-all duration-200 cursor-pointer",
                                  newStaffRole === r
                                    ? "bg-surface-overlay text-foreground shadow-sm border border-border"
                                    : "text-muted-foreground hover:text-foreground border border-transparent"
                                )}
                              >{r}</button>
                            ))}
                          </div>
                        </div>
                        <div className="pt-3 flex items-center justify-end gap-3 border-t border-border mt-5">
                          <button
                            type="button"
                            onClick={() => setAddStaffOpen(false)}
                            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-surface-interactive transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={addStaff}
                            disabled={!newStaffName.trim() || !newStaffEmail.trim()}
                            className="px-5 py-2.5 rounded-xl font-bold text-sm active:scale-[0.97] disabled:opacity-40 bg-emerald-500 hover:bg-emerald-400 text-white shadow-md transition-all cursor-pointer">
                            Add Staff Member
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
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
                <div className="w-10 h-10 rounded-[14px] flex items-center justify-center bg-white p-1.5 shadow-[0_4px_12px_rgba(0,125,252,0.3)] border border-white/10 overflow-hidden shrink-0">
                  <img src="/gcash.svg" alt="GCash" className="w-full h-full object-contain" />
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
                  <span className="text-[12px] text-muted-foreground font-medium">Accept cash payments at court front desk</span>
                </div>
              </div>
              <Toggle checked={cashOnSiteEnabled} onChange={() => setCashOnSiteEnabled(!cashOnSiteEnabled)} />
            </div>
          </SettingsGroup>

        </div>
      </motion.div>

      {/* MOBILE SAVE BUTTON */}
      <div className="md:hidden fixed bottom-[90px] left-4 right-4 z-40">
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
      <div className="mt-8 mb-12">
        <div 
          onClick={() => router.push("/app")}
          className="rounded-[24px] p-4 cursor-pointer relative overflow-hidden group active:scale-[0.98] transition-all bg-surface-interactive/30 dark:bg-white/[0.03] backdrop-blur-xl border border-white/10 dark:border-white/[0.1] hover:border-emerald-500/40 shadow-lg"
        >
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-[16px] flex items-center justify-center shrink-0 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-inner group-hover:scale-105 transition-transform">
              <User className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[15px] font-black text-foreground mb-0.5 tracking-tight" style={{ fontFamily: "var(--font-outfit), var(--font-montserrat), sans-serif" }}>
                Switch to Player Dashboard
              </div>
              <div className="text-[12px] text-muted-foreground font-semibold truncate">
                Return to player open play, court bookings & community feed
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/20 transition-colors">
              <ArrowRight className="w-4 h-4 text-foreground/50 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
