"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { KeyRound, X, Eye, EyeOff, CheckCircle2, ShieldAlert, Mail } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  identities?: any[];
  showToast: (message: string, type?: "success" | "error") => void;
}

export function ChangePasswordModal({
  isOpen,
  onClose,
  userEmail,
  identities = [],
  showToast
}: ChangePasswordModalProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSendingResetEmail, setIsSendingResetEmail] = useState(false);

  // Check if user is purely an OAuth user (Google/Facebook without email/password provider)
  const isPureOAuth = identities.length > 0 && identities.every(id => id.provider === "google" || id.provider === "facebook");

  useEffect(() => {
    if (isOpen) {
      setNewPassword("");
      setConfirmPassword("");
      setShowNewPass(false);
      setShowConfirmPass(false);
      setIsProcessing(false);
      setIsSendingResetEmail(false);
    }
  }, [isOpen]);

  // Password validation checks
  const isMinLength = newPassword.length >= 8;
  const hasNumOrSymbol = /[0-9!@#$%^&*(),.?":{}|<>]/.test(newPassword);
  const isMatching = newPassword !== "" && newPassword === confirmPassword;

  // Strength score: 0 to 3
  const getStrengthScore = () => {
    if (!newPassword) return 0;
    let score = 0;
    if (newPassword.length >= 8) score++;
    if (/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword)) score++;
    if (hasNumOrSymbol) score++;
    return score;
  };

  const strengthScore = getStrengthScore();

  const getStrengthLabel = () => {
    if (strengthScore === 1) return { label: "Weak", color: "bg-red-500", text: "text-red-400" };
    if (strengthScore === 2) return { label: "Good", color: "bg-amber-500", text: "text-amber-400" };
    if (strengthScore === 3) return { label: "Strong", color: "bg-emerald-500", text: "text-emerald-400" };
    return { label: "", color: "bg-border", text: "text-muted-foreground" };
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMinLength || !hasNumOrSymbol || !isMatching) {
      showToast("Please fulfill all password requirements.", "error");
      return;
    }

    setIsProcessing(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        showToast(error.message || "Failed to update password.", "error");
      } else {
        showToast("Password updated successfully!", "success");
        onClose();
      }
    } catch (err: any) {
      showToast(err?.message || "An unexpected error occurred.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendResetEmail = async () => {
    if (!userEmail) {
      showToast("No email address found for account.", "error");
      return;
    }
    setIsSendingResetEmail(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
        redirectTo: typeof window !== "undefined" ? `${window.location.origin}/app/settings` : undefined,
      });
      if (error) {
        showToast(error.message, "error");
      } else {
        showToast("Password reset link sent to your email.", "success");
        onClose();
      }
    } catch (err: any) {
      showToast(err?.message || "Failed to send reset email.", "error");
    } finally {
      setIsSendingResetEmail(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] dark:bg-black/50"
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 10 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="relative z-[610] w-full max-w-[400px] flex flex-col items-center"
          >
            <div className="w-full flex flex-col items-center gap-4 px-6 py-6 rounded-3xl border border-border dark:border-white/12 shadow-[0_25px_60px_rgba(0,0,0,0.5)] bg-surface-overlay dark:bg-[#13223F] relative">
              <button
                type="button"
                onClick={onClose}
                aria-label="Close password modal"
                className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full bg-surface-interactive hover:bg-surface-interactive/80 dark:bg-white/10 dark:hover:bg-white/20 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Icon Header */}
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mb-1 shadow-sm text-emerald-500 dark:text-emerald-400">
                <KeyRound className="w-6 h-6 stroke-[2.2]" />
              </div>

              <div className="flex flex-col items-center text-center w-full">
                <h3 className="text-lg font-bold text-foreground leading-tight mb-1" style={{ fontFamily: "var(--font-outfit), var(--font-montserrat), sans-serif" }}>
                  Change Password
                </h3>
                <p className="text-xs text-muted-foreground font-medium mb-4">
                  Update your security credentials for Picklers.
                </p>

                {/* Pure OAuth Social Login Notice */}
                {isPureOAuth ? (
                  <div className="w-full p-4 rounded-2xl border bg-amber-500/10 border-amber-500/20 text-amber-500 dark:text-amber-400 text-left mb-3 flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                    <div className="text-[12px] font-medium leading-relaxed">
                      <strong className="block text-[13px] font-bold mb-0.5">Social Login Active</strong>
                      Your account is authenticated using Google or Facebook. Password updates are managed directly through your social provider.
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleUpdatePassword} className="w-full text-left space-y-3.5">
                    {/* New Password Input */}
                    <div>
                      <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 pl-1">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPass ? "text" : "password"}
                          placeholder="Enter new password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          disabled={isProcessing}
                          className="w-full px-4 py-2.5 pr-10 rounded-2xl text-xs sm:text-sm font-medium outline-none bg-surface-interactive/70 dark:bg-white/[0.06] border border-border dark:border-white/12 text-foreground focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all disabled:opacity-50"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPass(!showNewPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                        >
                          {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password Input */}
                    <div>
                      <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 pl-1">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPass ? "text" : "password"}
                          placeholder="Confirm new password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          disabled={isProcessing}
                          className="w-full px-4 py-2.5 pr-10 rounded-2xl text-xs sm:text-sm font-medium outline-none bg-surface-interactive/70 dark:bg-white/[0.06] border border-border dark:border-white/12 text-foreground focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all disabled:opacity-50"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPass(!showConfirmPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                        >
                          {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Live Strength Bar */}
                    {newPassword && (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-[11px] font-semibold">
                          <span className="text-muted-foreground">Password Strength</span>
                          <span className={getStrengthLabel().text}>{getStrengthLabel().label}</span>
                        </div>
                        <div className="h-1.5 w-full bg-surface-interactive dark:bg-white/10 rounded-full overflow-hidden flex gap-1">
                          <div className={`h-full flex-1 transition-all duration-300 ${strengthScore >= 1 ? getStrengthLabel().color : "bg-border"}`} />
                          <div className={`h-full flex-1 transition-all duration-300 ${strengthScore >= 2 ? getStrengthLabel().color : "bg-border"}`} />
                          <div className={`h-full flex-1 transition-all duration-300 ${strengthScore >= 3 ? getStrengthLabel().color : "bg-border"}`} />
                        </div>
                      </div>
                    )}

                    {/* Checklist Requirements */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center gap-2 text-[12px] font-medium">
                        <CheckCircle2 className={`w-3.5 h-3.5 ${isMinLength ? "text-emerald-500" : "text-muted-foreground/40"}`} />
                        <span className={isMinLength ? "text-foreground" : "text-muted-foreground"}>At least 8 characters long</span>
                      </div>
                      <div className="flex items-center gap-2 text-[12px] font-medium">
                        <CheckCircle2 className={`w-3.5 h-3.5 ${hasNumOrSymbol ? "text-emerald-500" : "text-muted-foreground/40"}`} />
                        <span className={hasNumOrSymbol ? "text-foreground" : "text-muted-foreground"}>Contains a number or symbol</span>
                      </div>
                      <div className="flex items-center gap-2 text-[12px] font-medium">
                        <CheckCircle2 className={`w-3.5 h-3.5 ${isMatching ? "text-emerald-500" : "text-muted-foreground/40"}`} />
                        <span className={isMatching ? "text-foreground" : "text-muted-foreground"}>Passwords match</span>
                      </div>
                    </div>

                    {/* Save Button */}
                    <button
                      type="submit"
                      disabled={isProcessing || !isMinLength || !hasNumOrSymbol || !isMatching}
                      className="w-full py-3.5 mt-2 rounded-2xl font-bold text-xs sm:text-sm text-white bg-emerald-500 hover:bg-emerald-400 border border-emerald-400/40 shadow-lg active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
                    >
                      {isProcessing ? (
                        <>
                          <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                          <span>Updating...</span>
                        </>
                      ) : (
                        "Save New Password"
                      )}
                    </button>
                  </form>
                )}

                {/* Email Reset Link Fallback */}
                <div className="w-full pt-3 mt-3 border-t border-border/50 text-center">
                  <button
                    type="button"
                    onClick={handleSendResetEmail}
                    disabled={isSendingResetEmail}
                    className="text-[12px] font-medium text-muted-foreground hover:text-emerald-500 transition-colors inline-flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    {isSendingResetEmail ? "Sending reset link..." : "Send password reset link to email"}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
