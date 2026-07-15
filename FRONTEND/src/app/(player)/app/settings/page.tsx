"use client";

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';

import {
  ChevronRight, User, Mail, Phone, Trophy, Bell, Smartphone, Users,
  CreditCard, Banknote, ShieldCheck, BadgeCheck, ShieldAlert
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { VerificationGate } from "@/components/shared/VerificationGate";
import { motion, AnimatePresence } from "motion/react";
import { LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import { SettingsGroup, SettingsRow, containerVariants, itemVariants } from "@/components/shared/SettingsUI";
import { WalletPill } from "@/components/shared/WalletPill";
import { supabase } from "@/lib/supabase";

function Toggle({ checked, onChange }: { checked: boolean; onChange: (e: React.MouseEvent) => void }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onChange(e);
      }}
      className={`w-12 h-[28px] rounded-full flex items-center px-0.5 transition-colors duration-300 shrink-0 ${checked ? "bg-emerald-500" : "bg-surface-interactive border border-black/5 dark:border-white/5"}`}
    >
      <motion.div
        className="w-[24px] h-[24px] rounded-full bg-surface-raised border border-border shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
        animate={{ x: checked ? 20 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </button>
  );
}

export default function PlayerSettingsTab() {
  const router = useRouter();
  const { user, logout, verifyAccount } = useAuth();

  const [profile, setProfile] = useState({
    name: user?.name || "Juan Dela Cruz",
    email: user?.email || "juan@picklers.ph",
    phone: "0917 123 4567",
    skill: "4.0+",
  });

  const [notifications, setNotifications] = useState({
    booking: true,
    matches: false,
    community: true,
  });

  const { theme, setTheme } = useTheme();

  const [payments, setPayments] = useState({
    gcash: "09xx xxx xxxx",
    maya: "09xx xxx xxxx",
    credits: "₱1,200",
  });

  const [cashEnabled, setCashEnabled] = useState(true);
  const [gcashEnabled, setGcashEnabled] = useState(true);
  const [mayaEnabled, setMayaEnabled] = useState(false);

  const [editingField, setEditingField] = useState<{ type: "profile" | "payment", key: string, label: string } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [identities, setIdentities] = useState<any[]>([]);

  useEffect(() => {
    async function fetchIdentities() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIdentities(user.identities || []);
      }
    }
    fetchIdentities();
  }, []);

  const handleConnect = async (provider: 'google' | 'facebook') => {
    const { error } = await supabase.auth.linkIdentity({
      provider,
      options: {
        redirectTo: window.location.origin + "/app/settings",
      }
    });
    if (error) alert(error.message);
  };

  const handleDisconnect = async (provider: 'google' | 'facebook') => {
    const identity = identities.find(id => id.provider === provider);
    if (!identity) return;

    // Prevent unlinking if it's the only identity (Supabase enforces this too)
    if (identities.length <= 1) {
      alert("You cannot unlink your only login method.");
      return;
    }

    const { error } = await supabase.auth.unlinkIdentity(identity);
    if (error) {
      alert(error.message);
    } else {
      setIdentities(identities.filter(id => id.identity_id !== identity.identity_id));
    }
  };

  const hasGoogle = identities.some(id => id.provider === 'google');
  const hasFacebook = identities.some(id => id.provider === 'facebook');

  const handleEditClick = (type: "profile" | "payment", key: string, label: string, currentValue: string) => {
    setEditValue(currentValue);
    setEditingField({ type, key, label });
  };

  const saveEdit = () => {
    if (editingField) {
      if (editingField.type === "profile") {
        setProfile({ ...profile, [editingField.key as keyof typeof profile]: editValue });
      } else {
        setPayments({ ...payments, [editingField.key as keyof typeof payments]: editValue });
      }
      setEditingField(null);
    }
  };

  return (
    <div className="min-h-full pb-20 pt-4 px-4 max-w-xl mx-auto w-full">

      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <AnimatePresence>
          <motion.div
            key="title"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 min-w-0"
          >
            <h1 className="text-[32px] font-extrabold tracking-tight leading-none mb-1.5" style={{ color: "var(--ink-primary)" }}>
              Settings
            </h1>
            <p className="text-sm text-muted-foreground truncate">Manage your account and app preferences</p>
          </motion.div>
        </AnimatePresence>
        <div className="shrink-0 flex items-center pt-1">
          <WalletPill />
        </div>
      </div>

      {/* Premium Apple ID Banner (Owner Access) */}
      {user?.role === "owner" ? (
        <div className="rounded-[20px] p-5 mb-8 relative overflow-hidden group cursor-pointer"
          onClick={() => router.push("/app/owner")}
          style={{ background: "var(--surface-raised)", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent pointer-events-none" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-14 h-14 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, #10B981 0%, #059669 100%)", boxShadow: "0 4px 12px rgba(16,185,129,0.3)" }}>
              <ShieldCheck className="w-7 h-7 text-foreground" />
            </div>
            <div className="flex-1">
              <div className="text-[17px] font-bold text-foreground mb-0.5">Owner Access Verified</div>
              <div className="text-[13px] text-foreground/50">Tap to open dashboard</div>
            </div>
            <ChevronRight className="w-5 h-5 text-foreground/30" />
          </div>
        </div>
      ) : (
        user?.role === "player" && (
          <motion.div variants={itemVariants} className="flex flex-col gap-4 mb-8">
            <VerificationGate onVerifiedClick={() => { }}>
              <div className="rounded-[16px] p-4 cursor-pointer relative overflow-hidden group active:scale-[0.98] transition-transform bg-gradient-to-br from-[#10B981]/10 to-teal-500/5 border border-[#10B981]/20">
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-12 h-12 rounded-[12px] flex items-center justify-center shrink-0 bg-[#10B981]/20 text-[#10B981] shadow-inner">
                    {user?.verificationStatus === "verified" ? (
                      <BadgeCheck className="w-6 h-6" />
                    ) : user?.verificationStatus === "pending" ? (
                      <ShieldAlert className="w-6 h-6 animate-pulse text-amber-500" />
                    ) : (
                      <ShieldAlert className="w-6 h-6" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-[16px] font-bold text-foreground mb-0.5">
                      {user?.verificationStatus === "verified" ? "Identity Verified" :
                        user?.verificationStatus === "pending" ? "Verification Pending" :
                          "Verify Identity"}
                    </div>
                    <div className="text-[14px] text-foreground/60 font-medium">
                      {user?.verificationStatus === "verified" ? "Your account is trusted & secure" :
                        user?.verificationStatus === "pending" ? "We are reviewing your ID" :
                          "Verify now to unlock all player features"}
                    </div>
                  </div>
                  {user?.verificationStatus !== "verified" && user?.verificationStatus !== "pending" && (
                    <ChevronRight className="w-5 h-5 text-foreground/30" />
                  )}
                </div>
              </div>
            </VerificationGate>

            <div onClick={() => router.push("/app/owner-onboarding")}
              className="rounded-[16px] p-4 cursor-pointer relative overflow-hidden group active:scale-[0.98] transition-transform bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border border-cyan-500/20">
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 rounded-[12px] flex items-center justify-center shrink-0 bg-cyan-500/20 text-cyan-500 shadow-inner">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="text-[16px] font-bold text-foreground mb-0.5">Own a court?</div>
                  <div className="text-[14px] text-foreground/60 font-medium">Apply to list your facility</div>
                </div>
                <ChevronRight className="w-5 h-5 text-foreground/30" />
              </div>
            </div>
          </motion.div>
        )
      )}

      <motion.div variants={containerVariants} initial="hidden" animate="show">
        {/* Profile Section */}
        <SettingsGroup title="Profile Details">
          <SettingsRow
            icon={User} iconBg="bg-blue-500/10" iconColor="text-blue-500"
            label="Name" value={profile.name}
            onClick={() => handleEditClick("profile", "name", "Full Name", profile.name)}
          />
          <SettingsRow
            icon={Mail} iconBg="bg-orange-500/10" iconColor="text-orange-500"
            label="Email" value={profile.email}
            onClick={() => handleEditClick("profile", "email", "Email Address", profile.email)}
          />
          <SettingsRow
            icon={Phone} iconBg="bg-emerald-500/10" iconColor="text-emerald-500"
            label="Phone" value={profile.phone}
            onClick={() => handleEditClick("profile", "phone", "Phone Number", profile.phone)}
          />
          <SettingsRow
            icon={Trophy} iconBg="bg-purple-500/10" iconColor="text-purple-500"
            label="Skill Level" value={profile.skill}
            hasBorder={false}
            onClick={() => handleEditClick("profile", "skill", "Skill Level", profile.skill)}
          />
        </SettingsGroup>

        <SettingsGroup title="Alerts & Preferences">
          <SettingsRow
            icon={Bell} iconBg="bg-red-500/10" iconColor="text-red-500"
            label="Booking Confirmations"
            rightContent={<Toggle checked={notifications.booking} onChange={() => setNotifications({ ...notifications, booking: !notifications.booking })} />}
          />
          <SettingsRow
            icon={Smartphone} iconBg="bg-cyan-500/10" iconColor="text-cyan-500"
            label="Open Match Alerts"
            rightContent={<Toggle checked={notifications.matches} onChange={() => setNotifications({ ...notifications, matches: !notifications.matches })} />}
          />
          <SettingsRow
            icon={Users} iconBg="bg-indigo-500/10" iconColor="text-indigo-500"
            label="Community Updates" hasBorder={false}
            rightContent={<Toggle checked={notifications.community} onChange={() => setNotifications({ ...notifications, community: !notifications.community })} />}
          />
        </SettingsGroup>

        <SettingsGroup title="Appearance">
          <SettingsRow
            icon={() => <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></svg>}
            iconBg="bg-zinc-500/10" iconColor="text-zinc-500 dark:text-zinc-400"
            label="Dark Mode" hasBorder={false}
            rightContent={<Toggle checked={theme === "dark"} onChange={() => setTheme(theme === "dark" ? "light" : "dark")} />}
          />
        </SettingsGroup>

        <SettingsGroup title="Connected Accounts">
          <SettingsRow
            icon={() => <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>}
            iconBg="bg-white dark:bg-white/5" iconColor="text-[#4285F4]"
            label="Google"
            rightContent={<Toggle checked={hasGoogle} onChange={() => hasGoogle ? handleDisconnect('google') : handleConnect('google')} />}
          />
          <SettingsRow
            icon={() => <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>}
            iconBg="bg-[#1877F2]/10" iconColor="text-[#1877F2]"
            label="Facebook" hasBorder={false}
            rightContent={<Toggle checked={hasFacebook} onChange={() => hasFacebook ? handleDisconnect('facebook') : handleConnect('facebook')} />}
          />
        </SettingsGroup>

        <SettingsGroup title="Payment">
          <SettingsRow
            icon={CreditCard} iconBg="bg-[#0055FE]/10" iconColor="text-[#0055FE]"
            label="GCash"
            onClick={() => handleEditClick("payment", "gcash", "GCash Number", payments.gcash)}
            rightContent={
              <div className="flex items-center gap-3">
                <span className="text-[15px] font-semibold text-foreground/50">{payments.gcash}</span>
                <ChevronRight className="w-5 h-5 text-foreground/20" />
                <Toggle checked={gcashEnabled} onChange={() => setGcashEnabled(!gcashEnabled)} />
              </div>
            }
          />
          <SettingsRow
            icon={() => <span className="font-black text-lg leading-none mt-0.5">M</span>} iconBg="bg-zinc-800/10 dark:bg-white/10" iconColor="text-zinc-800 dark:text-white"
            label="Maya"
            onClick={() => handleEditClick("payment", "maya", "Maya Number", payments.maya)}
            rightContent={
              <div className="flex items-center gap-3">
                <span className="text-[15px] font-semibold text-foreground/50">{payments.maya}</span>
                <ChevronRight className="w-5 h-5 text-foreground/20" />
                <Toggle checked={mayaEnabled} onChange={() => setMayaEnabled(!mayaEnabled)} />
              </div>
            }
          />
          <SettingsRow
            icon={Banknote} iconBg="bg-emerald-500/10" iconColor="text-emerald-500"
            label="Cash on Site" hasBorder={false}
            rightContent={<Toggle checked={cashEnabled} onChange={() => setCashEnabled(!cashEnabled)} />}
          />
        </SettingsGroup>

        <motion.div variants={itemVariants} className="mb-12">
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center justify-center gap-3 p-4 rounded-[24px] text-[16px] font-bold text-[#FF453A] hover:bg-surface-interactive/80 transition-colors active:scale-[0.98] bg-surface-base dark:bg-white/[0.03] border border-border shadow-sm">
            <LogOut className="w-5 h-5 stroke-[2.5]" />
            SIGN OUT
          </button>
        </motion.div>

        {/* Developer Zone (Only visible when pending) */}
        {user?.verificationStatus === "pending" && (
          <motion.div variants={itemVariants} className="mb-8">
            <h3 className="text-sm font-medium tracking-tight mb-2 px-4">Developer Tools</h3>
            <div className="rounded-[16px] overflow-hidden" style={{ background: "rgba(239, 68, 68, 0.05)", border: "1px dashed rgba(239, 68, 68, 0.2)" }}>
              <button onClick={() => verifyAccount()} className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-surface-interactive/80 transition-colors text-left">
                <div>
                  <div className="text-[15px] font-bold text-red-400">Instantly Approve Account</div>
                  <div className="text-[12px] text-red-400/60">Bypass the manual review state for testing.</div>
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Edit Modal State */}
      <AnimatePresence>
        {editingField && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">

            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="w-full max-w-sm rounded-[24px] overflow-hidden bg-white/95 dark:bg-[#1C1C1E]/95 border border-black/5 dark:border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.2)] dark:shadow-[0_20px_40px_rgba(0,0,0,0.5)]">

              <div className="px-6 pt-6 pb-4">
                <h2 className="text-[20px] font-bold text-foreground mb-1" >Edit {editingField.label}</h2>
                <p className="text-[13px] text-foreground/50 mb-4">Update your profile information.</p>

                <input
                  autoFocus
                  type="text"
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-[16px] outline-none bg-black/5 border border-black/10 text-foreground dark:bg-white/5 dark:border-white/10 dark:text-white"
                />
              </div>

              <div className="flex border-t border-white/5">
                <button onClick={() => setEditingField(null)}
                  className="flex-1 py-4 text-[16px] font-medium text-foreground/60 hover:bg-surface-interactive/80 transition-colors">
                  Cancel
                </button>
                <div className="w-px bg-surface-interactive/80" />
                <button onClick={saveEdit}
                  className="flex-1 py-4 text-[16px] font-bold text-blue-500 hover:bg-surface-interactive/80 transition-colors">
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logout Confirm Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/20 dark:bg-[#0B132B]/80 backdrop-blur-3xl"
              onClick={() => setShowLogoutConfirm(false)} />
            <motion.div initial={{ y: "100%", opacity: 0.5 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="relative w-full max-w-sm flex flex-col gap-2 z-10 items-center">
              <div className="w-[340px] bg-background dark:bg-gradient-to-b dark:from-[#1A2235] dark:to-[#0B132B] rounded-2xl overflow-hidden shadow-xl dark:shadow-2xl ring-1 ring-black/5 dark:ring-0 relative p-[1px]">
                <div className="absolute inset-0 bg-gradient-to-br from-[#FF453A]/20 via-transparent to-transparent opacity-50"></div>
                <div className="relative bg-surface-base dark:bg-[#0A1124] rounded-[27px] p-6 pb-7 text-center overflow-hidden flex flex-col items-center">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-[#FF453A]/20 blur-[50px] rounded-full pointer-events-none"></div>
                  <div className="relative mb-5 mt-2">
                    <div className="absolute inset-0 bg-[#FF453A] blur-xl opacity-30 rounded-full animate-pulse"></div>
                    <div className="w-14 h-14 relative z-10 rounded-[18px] bg-gradient-to-b from-[#FF453A]/20 to-[#FF3B30]/5 flex items-center justify-center border border-[#FF453A]/30 shadow-[inset_0_1px_2px_rgba(255,255,255,0.2)]">
                      <LogOut className="w-6 h-6 text-[#FF453A]" style={{ marginLeft: "-2px" }} strokeWidth={2.5} />
                    </div>
                  </div>
                  <h3 className="text-[19px] font-bold text-foreground dark:text-white tracking-tight mb-2">Sign Out?</h3>
                  <p className="text-[14px] text-muted-foreground dark:text-slate-400 font-medium leading-relaxed px-1">
                    You will need to sign in again to access your bookings and profile.
                  </p>
                  <div className="flex gap-3 w-full mt-7">
                    <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-3.5 rounded-xl text-[14px] font-semibold text-foreground/80 dark:text-slate-300 bg-black/5 dark:bg-white/[0.03] border border-black/10 dark:border-white/[0.08] hover:bg-black/10 dark:hover:bg-white/[0.06] hover:text-foreground dark:hover:text-white transition-all active:scale-[0.98]">
                      Cancel
                    </button>
                    <button onClick={logout} className="flex-1 py-3.5 rounded-xl text-[14px] font-bold text-white bg-gradient-to-b from-[#FF453A] to-[#E02D23] shadow-[0_8px_20px_rgba(255,59,48,0.3),inset_0_1px_1px_rgba(255,255,255,0.2)] hover:shadow-[0_10px_25px_rgba(255,59,48,0.4)] transition-all active:scale-[0.98]">
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
