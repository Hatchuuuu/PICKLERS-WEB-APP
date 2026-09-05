"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Shield, Calendar, Mail, User, AlertCircle, Ban, UserCheck, ShieldCheck, ChevronDown, Check } from "lucide-react";
import type { AdminUser } from "@/types/admin";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface UserDetailDrawerProps {
  user: AdminUser | null;
  onClose: () => void;
  onAction: (user: AdminUser, action: "ban" | "unban" | "promote_admin" | "demote_admin", extra?: Record<string, unknown>) => void;
}

const ADMIN_ROLES_OPTIONS = [
  { value: "moderator", label: "Moderator", description: "Content moderation and user suspension rights" },
  { value: "operations_admin", label: "Operations Admin", description: "Facility, application, and booking management" },
  { value: "finance_admin", label: "Finance Admin", description: "Ledger, promo codes, and payout approvals" },
  { value: "platform_admin", label: "Platform Admin", description: "Full operational access and platform settings" },
  { value: "super_admin", label: "Super Admin", description: "Unrestricted master administration privileges" },
];

export function UserDetailDrawer({ user, onClose, onAction }: UserDetailDrawerProps) {
  const [selectedRole, setSelectedRole] = useState<string>(user?.admin_role || "moderator");
  const [showRoleSelect, setShowRoleSelect] = useState(false);

  useEffect(() => {
    if (user?.admin_role) {
      setSelectedRole(user.admin_role);
    } else {
      setSelectedRole("moderator");
    }
  }, [user]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && user) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [user, onClose]);

  if (!user) return null;

  const handlePromote = () => {
    onAction(user, "promote_admin", { admin_role: selectedRole });
    setShowRoleSelect(false);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[600] flex justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-[2px] dark:bg-black/50"
        />

        {/* Drawer */}
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 250 }}
          className="relative w-full max-w-lg bg-surface-overlay dark:bg-[#13223F] border-l border-border dark:border-white/12 h-full flex flex-col shadow-2xl overflow-hidden z-[610]"
        >
          {/* Header */}
          <div className="p-6 border-b border-border flex items-center justify-between bg-surface-interactive/30">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 dark:text-emerald-400 font-bold text-lg overflow-hidden shrink-0">
                {user.avatar_url ? (
                  <div className="w-12 h-12">
                    <Image
                      src={user.avatar_url}
                      alt=""
                      width={1}
                      height={1}
                      layout="responsive"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  user.name?.[0]?.toUpperCase() || "U"
                )}
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">{user.name}</h2>
                <p className="text-xs text-muted-foreground">{user.email || "No email provided"}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close drawer"
              className="w-8 h-8 rounded-full bg-surface-interactive hover:bg-surface-interactive/80 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Role & Status Pill Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold border capitalize flex items-center gap-1.5",
                  user.is_admin
                    ? "bg-violet-500/10 border-violet-500/30 text-violet-400"
                    : user.role === "dev"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-surface-raised border-border text-foreground"
                )}
              >
                <Shield className="w-3.5 h-3.5" />
                {user.is_admin ? `Admin (${user.admin_role || "Moderator"})` : user.role === "dev" ? "Developer" : user.role || "User"}
              </span>

              {user.is_banned ? (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" /> Banned
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5" /> Active Account
                </span>
              )}
            </div>

            {/* Banned Details Card */}
            {user.is_banned && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex flex-col gap-2 backdrop-blur-xl">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>Account Suspension Details</span>
                </div>
                <p className="text-xs text-rose-300 leading-relaxed">
                  {user.banned_reason || "Violation of community rules or suspicious activity."}
                </p>
              </div>
            )}

            {/* Details List */}
            <div className="space-y-4 rounded-2xl border border-border p-4 bg-surface-base/50">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Account Information</h3>
              
              <div className="grid grid-cols-1 gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-muted-foreground font-medium">User ID</span>
                    <span className="font-mono text-foreground select-all">{user.id}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-muted-foreground font-medium">Email Address</span>
                    <span className="text-foreground font-medium">{user.email || "N/A"}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-muted-foreground font-medium">Joined Platform</span>
                    <span className="text-foreground font-medium">{new Date(user.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Header */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Administrative Operations</h3>
              <div className="flex flex-col gap-2">
                {user.is_banned ? (
                  <button
                    onClick={() => onAction(user, "unban")}
                    className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 flex items-center justify-center gap-2 transition-colors"
                  >
                    <UserCheck className="w-4 h-4" /> Restore User Account (Unban)
                  </button>
                ) : (
                  <button
                    onClick={() => onAction(user, "ban")}
                    className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 flex items-center justify-center gap-2 transition-colors"
                  >
                    <Ban className="w-4 h-4" /> Suspend User Account (Ban)
                  </button>
                )}

                {!user.is_admin ? (
                  <div className="space-y-2">
                    {!showRoleSelect ? (
                      <button
                        onClick={() => setShowRoleSelect(true)}
                        className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-violet-500/10 border border-violet-500/30 text-violet-400 hover:bg-violet-500/20 flex items-center justify-center gap-2 transition-colors"
                      >
                        <ShieldCheck className="w-4 h-4" /> Grant Administrative Access (Promote)
                      </button>
                    ) : (
                      <div className="p-4 rounded-xl border border-violet-500/30 bg-violet-500/5 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-violet-300">Select Admin Role:</span>
                          <button
                            onClick={() => setShowRoleSelect(false)}
                            className="text-xs text-muted-foreground hover:text-foreground"
                          >
                            Cancel
                          </button>
                        </div>
                        <div className="space-y-1.5">
                          {ADMIN_ROLES_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              onClick={() => setSelectedRole(opt.value)}
                              className={cn(
                                "w-full text-left p-2.5 rounded-lg border text-xs transition-all flex items-start justify-between",
                                selectedRole === opt.value
                                  ? "bg-violet-500/20 border-violet-500/50 text-foreground font-semibold"
                                  : "bg-surface-base border-border text-muted-foreground hover:text-foreground"
                              )}
                            >
                              <div>
                                <div className="font-bold text-foreground">{opt.label}</div>
                                <div className="text-[10px] text-muted-foreground leading-tight">{opt.description}</div>
                              </div>
                              {selectedRole === opt.value && <Check className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5" />}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={handlePromote}
                          className="w-full py-2.5 px-3 rounded-lg text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white shadow-lg transition-colors flex items-center justify-center gap-2"
                        >
                          Confirm & Assign Role
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <button
                      onClick={() => setShowRoleSelect(!showRoleSelect)}
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-surface-raised border border-border text-foreground hover:bg-surface-interactive flex items-center justify-center gap-2 transition-colors"
                    >
                      <Shield className="w-3.5 h-3.5 text-violet-400" /> Change Role ({user.admin_role || "Moderator"}) <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    {showRoleSelect && (
                      <div className="p-4 rounded-xl border border-border bg-surface-raised space-y-3">
                        <div className="text-xs font-bold text-foreground">Select New Role:</div>
                        <div className="space-y-1.5">
                          {ADMIN_ROLES_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              onClick={() => setSelectedRole(opt.value)}
                              className={cn(
                                "w-full text-left p-2.5 rounded-lg border text-xs transition-all flex items-start justify-between",
                                selectedRole === opt.value
                                  ? "bg-violet-500/20 border-violet-500/50 text-foreground font-semibold"
                                  : "bg-surface-base border-border text-muted-foreground hover:text-foreground"
                              )}
                            >
                              <div>
                                <div className="font-bold text-foreground">{opt.label}</div>
                                <div className="text-[10px] text-muted-foreground leading-tight">{opt.description}</div>
                              </div>
                              {selectedRole === opt.value && <Check className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5" />}
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={handlePromote}
                            className="flex-1 py-2 px-3 rounded-lg text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white transition-colors"
                          >
                            Update Role
                          </button>
                          <button
                            onClick={() => setShowRoleSelect(false)}
                            className="py-2 px-3 rounded-lg text-xs font-medium border border-border hover:bg-surface-interactive transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                    <button
                      onClick={() => onAction(user, "demote_admin")}
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 flex items-center justify-center gap-2 transition-colors"
                    >
                      Revoke Administrative Access (Demote)
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
