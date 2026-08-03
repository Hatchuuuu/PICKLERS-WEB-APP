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
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="relative z-10 w-full max-w-[400px] flex flex-col items-center"
          >
            <div className="w-full flex flex-col items-center gap-4 px-6 py-6 rounded-[var(--radius-xl)] border shadow-xl backdrop-blur-2xl bg-background/95 border-border/50 relative">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>

              {/* Icon Header */}
              <div className="w-12 h-12 rounded-[var(--radius-lg)] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-1 shadow-[0_10px_40px_rgba(16,185,129,0.15)]">
                <KeyRound className="w-6 h-6 text-emerald-500" />
              </div>

              <div className="flex flex-col items-center text-center w-full">
                <h3 className="text-[18px] font-bold text-foreground leading-tight mb-1">
                  Change Password
                </h3>
                <p className="text-[13px] text-muted-foreground font-medium mb-4">
                  Update your security credentials for Picklers.
                </p>

                {/* Pure OAuth Social Login Notice */}
                {isPureOAuth ? (
                  <div className="w-full p-4 rounded-xl border bg-amber-500/10 border-amber-500/20 text-amber-500 dark:text-amber-400 text-left mb-3 flex items-start gap-3">
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
                          className="w-full px-4 py-2.5 pr-10 rounded-[var(--radius-md)] text-[14px] font-medium outline-none bg-secondary border border-border text-foreground focus:border-emerald-500/50 focus:bg-emerald-500/5 transition-all disabled:opacity-50"
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
                          className="w-full px-4 py-2.5 pr-10 rounded-[var(--radius-md)] text-[14px] font-medium outline-none bg-secondary border border-border text-foreground focus:border-emerald-500/50 focus:bg-emerald-500/5 transition-all disabled:opacity-50"
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
                        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden flex gap-1">
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
                      className="w-full py-3 mt-2 rounded-[var(--radius-md)] text-[14px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isProcessing ? (
                        <>
                          <div className="w-4 h-4 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
                          Updating...
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
                    className="text-[12px] font-medium text-muted-foreground hover:text-emerald-500 transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
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
