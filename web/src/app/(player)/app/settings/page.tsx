"use client";

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';

import {
  ChevronRight, User, Phone, Bell, Smartphone, Users,
  ShieldCheck, BadgeCheck, ShieldAlert,
  LogOut, KeyRound
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { AvatarUpload } from "@/components/shared/AvatarUpload";
import { VerificationGate } from "@/components/shared/VerificationGate";
import { motion, AnimatePresence } from "motion/react";
import { useTheme } from "next-themes";
import { SettingsGroup, SettingsRow, containerVariants, itemVariants } from "@/components/shared/SettingsUI";
import { WalletPill } from "@/components/shared/WalletPill";
import { FacilitySetupWizard } from "@/components/shared/FacilitySetupWizard";
import { supabase } from "@/lib/supabase";

import { EditFieldModal } from "@/components/shared/modals/EditFieldModal";
import { EmailUpdateModal } from "@/components/shared/modals/EmailUpdateModal";
import { PhoneSetupModal } from "@/components/shared/modals/PhoneSetupModal";
import { DeleteAccountModal } from "@/components/shared/modals/DeleteAccountModal";
import { LogoutConfirmModal } from "@/components/shared/modals/LogoutConfirmModal";

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (e: React.MouseEvent) => void, disabled?: boolean }) {
  return (
    <button
      disabled={disabled}
      onClick={(e) => {
        if (disabled) return;
        e.stopPropagation();
        onChange(e);
      }}
      className={`w-12 h-[28px] rounded-full flex items-center px-0.5 transition-colors duration-300 shrink-0 ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${checked ? "bg-emerald-500" : "bg-surface-interactive border border-black/5 dark:border-white/5"}`}
    >
      <motion.div
        className="w-[24px] h-[24px] rounded-full bg-surface-raised border border-border shadow-[0_2px_4px_rgba(0,0,0,0.3)] flex items-center justify-center"
        animate={{ x: checked ? 20 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      >
      </motion.div>
    </button>
  );
}

export default function PlayerSettingsTab() {
  const router = useRouter();
  const { user, logout, verifyAccount, updateUser } = useAuth();
  const { showToast } = useToast();

  // Fallback defaults if user metadata is not yet populated
  const [profile, setProfile] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
  });

  const [notifications, setNotifications] = useState({
    booking: user?.notifications?.booking ?? true,
    matches: user?.notifications?.matches ?? false,
    community: user?.notifications?.community ?? true,
  });

  const { theme, setTheme } = useTheme();

  // Modal states
  const [editingField, setEditingField] = useState<{ key: string, label: string } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessingSocial, setIsProcessingSocial] = useState<{google: boolean, facebook: boolean}>({ google: false, facebook: false });
  const [identities, setIdentities] = useState<any[]>([]);

  useEffect(() => {
    async function fetchIdentities() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          console.error("Supabase auth error:", error);
          return;
        }
        if (user) {
          setIdentities(user.identities || []);
        }
      } catch (err) {
        console.error("Failed to fetch identities:", err);
      }
    }
    fetchIdentities();
  }, []);

  // Sync profile when user changes
  useEffect(() => {
    if (user) {
      setProfile(prev => ({
        ...prev,
        name: user.name || prev.name,
        phone: user.phone || prev.phone,
      }));
    }
  }, [user]);

  const handleConnect = async (provider: 'google' | 'facebook') => {
    setIsProcessingSocial(prev => ({ ...prev, [provider]: true }));
    const { error } = await supabase.auth.linkIdentity({
      provider,
      options: {
        redirectTo: window.location.origin + "/app/settings",
      }
    });
    if (error) {
      showToast(error.message, "error");
      setIsProcessingSocial(prev => ({ ...prev, [provider]: false }));
    }
  };

  const handleDisconnect = async (provider: 'google' | 'facebook') => {
    const identity = identities.find(id => id.provider === provider);
    if (!identity) return;

    if (identities.length <= 1) {
      showToast("You cannot unlink your only login method.", "error");
      return;
    }

    const previousIdentities = [...identities];
    setIdentities(prev => prev.filter(id => id.identity_id !== identity.identity_id));
    setIsProcessingSocial(prev => ({ ...prev, [provider]: true }));

    const { error } = await supabase.auth.unlinkIdentity(identity);
    if (error) {
      setIdentities(previousIdentities);
      showToast(`Failed to disconnect: ${error.message}`, "error");
    } else {
      showToast(`${provider === 'google' ? 'Google' : 'Facebook'} disconnected.`, "success");
    }
    setIsProcessingSocial(prev => ({ ...prev, [provider]: false }));
  };

  const googleIdentity = identities.find(id => id.provider === 'google');
  const facebookIdentity = identities.find(id => id.provider === 'facebook');
  const hasGoogle = !!googleIdentity;
  const hasFacebook = !!facebookIdentity;
  const googleDisplay = googleIdentity?.identity_data?.email || googleIdentity?.identity_data?.name || googleIdentity?.identity_data?.full_name || undefined;
  const facebookDisplay = facebookIdentity?.identity_data?.name || facebookIdentity?.identity_data?.full_name || facebookIdentity?.identity_data?.email || undefined;

  const handleEditClick = (key: string, label: string, currentValue: string) => {
    setEditValue(currentValue);
    setEditingField({ key, label });
  };

  const saveEdit = async (newValue: string) => {
    if (!editingField) return;
    setIsProcessing(true);
    
    // Update local state optimistically
    const newProfile = { ...profile, [editingField.key]: newValue };
    setProfile(newProfile);
    
    // Update Context/DB
    await updateUser({ [editingField.key]: newValue });
    
    setIsProcessing(false);
    setEditingField(null);
    showToast(`${editingField.label} updated.`, "success");
  };

  const handleUpdateEmail = async (email: string) => {
    setIsProcessing(true);
    const { error } = await supabase.auth.updateUser({ email });
    setIsProcessing(false);
    
    if (error) {
      if (error.message.includes('already registered')) {
        showToast("This email is already connected to another account.", "error");
      } else {
        showToast(error.message, "error");
      }
    } else {
      setShowEmailModal(false);
      showToast("Verification link sent to your new email!", "success");
    }
  };

  const handleConnectPhone = async (phone: string) => {
    setIsProcessing(true);
    setProfile({ ...profile, phone });
    await updateUser({ phone });
    setIsProcessing(false);
    setShowPhoneModal(false);
    showToast("Phone connected successfully.", "success");
  };

  const handleResetPassword = async () => {
    if (!user?.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: window.location.origin + "/app/settings",
    });
    if (error) {
      showToast(error.message, "error");
    } else {
      showToast("Password reset link sent to your email.", "success");
    }
  };

  const handleDeleteAccount = async () => {
    setIsProcessing(true);
    const { error } = await supabase.rpc('delete_user');
    setIsProcessing(false);
    
    if (error) {
      showToast(error.message, "error");
    } else {
      logout();
    }
  };

  const handleToggleNotification = async (key: keyof typeof notifications) => {
    const newValue = !notifications[key];
    const newNotifications = { ...notifications, [key]: newValue };
    
    // Optimistic update
    setNotifications(newNotifications);
    // Persist to backend/context
    await updateUser({ notifications: newNotifications });
  };

  return (
    <div className="min-h-full pb-20 pt-4 px-4 max-w-xl mx-auto w-full relative">
      
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
      </div>

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="mb-6 flex flex-col items-center">
        <AvatarUpload />
      </motion.div>

      {(user?.role === "owner" || user?.isDemo || user?.verificationStatus === "verified") ? (
        <div className="flex flex-col gap-4 mb-8">
          <WalletPill />
          {!user?.facilitySetupComplete && (
            <div className="rounded-[20px] p-5 relative overflow-hidden group cursor-pointer"
              onClick={() => setShowSetup(true)}
              style={{ background: "var(--surface-raised)", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent pointer-events-none" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-14 h-14 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: "linear-gradient(135deg, #10B981 0%, #059669 100%)", boxShadow: "0 4px 12px rgba(16,185,129,0.3)" }}>
                  <ShieldCheck className="w-7 h-7 text-foreground" />
                </div>
                <div className="flex-1">
                  <div className="text-[17px] font-bold text-foreground mb-0.5">Finish Facility Setup</div>
                  <div className="text-[13px] text-foreground/50">Tap to complete your onboarding</div>
                </div>
                <ChevronRight className="w-5 h-5 text-foreground/30" />
              </div>
            </div>
          )}
          

        </div>
      ) : (
        (user?.role === "player" || user?.role === "demo") && (
          <motion.div variants={itemVariants} className="flex flex-col gap-4 mb-8">
            <WalletPill />
            
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

            <div onClick={() => router.push("/app/owner-application")}
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
        <SettingsGroup className="mb-0">
          <SettingsRow
            icon={User} iconBg="bg-blue-500/10" iconColor="text-blue-500"
            label="Name" value={profile.name}
            onClick={() => {
              if (user?.verificationStatus === "verified") {
                showToast("Your name is locked to your verified identity.", "error");
              } else {
                handleEditClick("name", "Full Name", profile.name);
              }
            }}
            rightContent={
              user?.verificationStatus === "verified" ? (
                <div className="text-[14px] font-medium text-muted-foreground mr-2">
                  {profile.name}
                </div>
              ) : undefined
            }
          />

          <SettingsRow
            icon={Phone} iconBg="bg-emerald-500/10" iconColor="text-emerald-500"
            label="Phone Number" value={profile.phone || "Not connected"}
            onClick={() => setShowPhoneModal(true)}
            rightContent={
              profile.phone ? (
                <div className="text-[13px] font-bold text-emerald-500 mr-2">Connected</div>
              ) : (
                <button className="px-3.5 py-1.5 rounded-full text-[12px] font-bold bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-colors mr-1">Connect</button>
              )
            }
          />
          <SettingsRow
            icon={() => <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>}
            iconBg="bg-zinc-500/10" iconColor="text-[#4285F4]"
            label="Google" value={googleDisplay}
            rightContent={
                isProcessingSocial['google'] ? (
                  <div className="mr-3"><div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground animate-spin" /></div>
                ) : hasGoogle ? (
                  <button onClick={(e) => { e.stopPropagation(); handleDisconnect('google'); }} className="text-[13px] font-bold text-emerald-500 mr-2 hover:text-red-500 transition-colors">Connected</button>
                ) : (
                  <button onClick={(e) => { e.stopPropagation(); handleConnect('google'); }} className="px-3.5 py-1.5 rounded-full text-[12px] font-bold bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-colors mr-1">Connect</button>
                )
              }
          />
          <SettingsRow
            icon={() => <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>}
            iconBg="bg-[#1877F2]/10" iconColor="text-[#1877F2]"
            label="Facebook" value={facebookDisplay}
            rightContent={
                isProcessingSocial['facebook'] ? (
                  <div className="mr-3"><div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground animate-spin" /></div>
                ) : hasFacebook ? (
                  <button onClick={(e) => { e.stopPropagation(); handleDisconnect('facebook'); }} className="text-[13px] font-bold text-emerald-500 mr-2 hover:text-red-500 transition-colors">Connected</button>
                ) : (
                  <button onClick={(e) => { e.stopPropagation(); handleConnect('facebook'); }} className="px-3.5 py-1.5 rounded-full text-[12px] font-bold bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-colors mr-1">Connect</button>
                )
              }
          />
        
          <SettingsRow
            icon={KeyRound} iconBg="bg-zinc-500/10" iconColor="text-zinc-500 dark:text-zinc-400"
            label="Change Password"
            onClick={handleResetPassword}
          />
          <SettingsRow
            icon={() => <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></svg>}
            iconBg="bg-zinc-500/10" iconColor="text-zinc-500 dark:text-zinc-400"
            label="Dark Mode"
            rightContent={<Toggle checked={theme === "dark"} onChange={() => setTheme(theme === "dark" ? "light" : "dark")} />}
          />
        
          <SettingsRow
            icon={Bell} iconBg="bg-red-500/10" iconColor="text-red-500"
            label="Booking Confirmations"
            rightContent={<Toggle checked={notifications.booking} onChange={() => handleToggleNotification('booking')} />}
          />
          <SettingsRow
            icon={Smartphone} iconBg="bg-cyan-500/10" iconColor="text-cyan-500"
            label="Open Match Alerts"
            rightContent={<Toggle checked={notifications.matches} onChange={() => handleToggleNotification('matches')} />}
          />
          <SettingsRow
            icon={Users} iconBg="bg-indigo-500/10" iconColor="text-indigo-500"
            label="Community Updates" hasBorder={false}
            rightContent={<Toggle checked={notifications.community} onChange={() => handleToggleNotification('community')} />}
          />
        
        </SettingsGroup>

        <motion.div variants={itemVariants} className="mb-4">
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center justify-center gap-3 p-4 rounded-[28px] text-[16px] font-bold text-[#FF453A] hover:bg-surface-interactive/80 transition-colors active:scale-[0.98] bg-surface-base dark:bg-white/[0.03] border border-border shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
            <LogOut className="w-5 h-5 stroke-[2.5]" />
            SIGN OUT
          </button>
        </motion.div>
        
        <motion.div variants={itemVariants} className="mt-8 mb-12">
          <h3 className="text-sm font-bold tracking-tight mb-2 px-4 text-[#FF453A]">Danger Zone</h3>
          <div className="bg-surface-base dark:bg-white/[0.03] border border-[#FF453A]/20 rounded-[28px] p-4 flex flex-col gap-3 shadow-[0_8px_24px_rgba(255,69,58,0.08)]">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FF453A]/10 flex items-center justify-center shrink-0">
                <LogOut className="w-5 h-5 text-[#FF453A]" />
              </div>
              <div>
                <div className="text-[15px] font-bold text-foreground">Delete Account</div>
                <div className="text-[13px] text-foreground/60 leading-snug">Permanently remove your account and all data. This action cannot be undone.</div>
              </div>
            </div>
            <button 
              onClick={() => setShowDeleteModal(true)}
              className="w-full mt-2 py-3.5 rounded-[20px] text-[14px] font-bold text-[#FF453A] bg-[#FF453A]/10 hover:bg-[#FF453A]/20 transition-colors active:scale-[0.98]">
              Delete My Account
            </button>
          </div>
        </motion.div>

        {/* Developer Zone (Only visible when pending) */}
        {user?.verificationStatus === "pending" && process.env.NODE_ENV === 'development' && (
          <motion.div variants={itemVariants} className="mb-8">
            <h3 className="text-sm font-medium tracking-tight mb-2 px-4">Developer Tools</h3>
            <div className="rounded-[28px] overflow-hidden" style={{ background: "rgba(239, 68, 68, 0.05)", border: "1px dashed rgba(239, 68, 68, 0.2)" }}>
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

      {/* Extracted Modals */}
      <EditFieldModal 
        isOpen={!!editingField}
        onClose={() => setEditingField(null)}
        onSave={saveEdit}
        title={editingField?.label || ""}
        initialValue={editValue}
        isSaving={isProcessing}
      />

      <EmailUpdateModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        onUpdate={handleUpdateEmail}
        isProcessing={isProcessing}
      />

      <PhoneSetupModal 
        isOpen={showPhoneModal}
        onClose={() => setShowPhoneModal(false)}
        onConnect={handleConnectPhone}
        isProcessing={isProcessing}
      />

      <DeleteAccountModal 
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onDelete={handleDeleteAccount}
        isProcessing={isProcessing}
      />

      <LogoutConfirmModal 
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={logout}
      />
      
      {showSetup && <FacilitySetupWizard onClose={() => setShowSetup(false)} />}
    </div>
  );
}
