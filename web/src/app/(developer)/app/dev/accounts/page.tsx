"use client";

import { useState } from "react";
import {
  Search,
  ShieldCheck,
  UserCheck,
  UserX,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  ShieldAlert,
  ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AccountResult {
  id: string;
  name: string;
  accountType: string;
  accountStatus: string;
  consoleAccess: string[];
  adminAccess: boolean;
  developerAccess: boolean;
  adminRole: string | null;
  devRole: string | null;
  createdAt: string;
}

const ROLE_PERMISSIONS_MAP: Record<string, { title: string; grants: string[]; denies: string[] }> = {
  operations_admin: {
    title: "Operations Admin",
    grants: [
      "View & manage facilities and courts",
      "View booking schedules and player reservations",
      "Manage customer support tickets",
    ],
    denies: [
      "Refund authority & financial exports",
      "Developer console access",
      "Security administration & developer credentials",
    ],
  },
  platform_admin: {
    title: "Platform Admin",
    grants: [
      "Full administrative dashboard access",
      "Manage users & facility applications",
      "View financial analytics & reports",
    ],
    denies: [
      "Developer console access & system diagnostics",
      "Feature flag & database schema management",
    ],
  },
  super_admin: {
    title: "Super Admin",
    grants: [
      "Full administrative control across all domains",
      "Manage operational roles & platform configurations",
      "Override facility & user approvals",
    ],
    denies: [
      "Direct source code mutation (Dev console isolated)",
    ],
  },
  finance_admin: {
    title: "Finance Admin",
    grants: [
      "View ledger transactions & revenue reports",
      "Process payout settlements & refunds",
    ],
    denies: [
      "Facility layout editing",
      "Developer console & technical logs",
    ],
  },
  moderator: {
    title: "Community Moderator",
    grants: [
      "Moderate community feed posts & comments",
      "Review reported user content & flags",
    ],
    denies: [
      "Financial data & user billing details",
      "Facility management & system settings",
    ],
  },
};

export default function DevAccountManagementPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<AccountResult[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<AccountResult | null>(null);

  // Modal States
  const [promoteModalOpen, setPromoteModalOpen] = useState(false);
  const [demoteModalOpen, setDemoteModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState("operations_admin");
  const [reason, setReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Toast / Alert banner state
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setAccounts([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/dev/accounts/search?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      if (res.ok) {
        setAccounts(data.accounts || []);
      } else {
        setBanner({ type: "error", message: data.error || "Search failed" });
      }
    } catch (err) {
      setBanner({ type: "error", message: "Failed to connect to account lookup service" });
    } finally {
      setLoading(false);
    }
  };

  const handlePromoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) return;

    if (reason.trim().length < 5) {
      setBanner({ type: "error", message: "Please provide a valid justification reason (at least 5 characters)." });
      return;
    }

    setActionLoading(true);
    setBanner(null);

    try {
      const res = await fetch("/api/dev/accounts/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: selectedAccount.id,
          adminRole: selectedRole,
          reason: reason.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setBanner({ type: "success", message: `Successfully granted Admin Access (${selectedRole}) to ${selectedAccount.name}!` });
        setPromoteModalOpen(false);
        setReason("");
        handleSearch(searchQuery); // Refresh lookup
      } else {
        setBanner({ type: "error", message: data.error || "Promotion failed." });
      }
    } catch (err) {
      setBanner({ type: "error", message: "Network error while processing promotion." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDemoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) return;

    if (reason.trim().length < 5) {
      setBanner({ type: "error", message: "Please provide a valid justification reason (at least 5 characters)." });
      return;
    }

    setActionLoading(true);
    setBanner(null);

    try {
      const res = await fetch("/api/dev/accounts/demote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: selectedAccount.id,
          reason: reason.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setBanner({ type: "success", message: `Successfully revoked Admin Access from ${selectedAccount.name}.` });
        setDemoteModalOpen(false);
        setReason("");
        handleSearch(searchQuery); // Refresh lookup
      } else {
        setBanner({ type: "error", message: data.error || "Demotion failed." });
      }
    } catch (err) {
      setBanner({ type: "error", message: "Network error while processing demotion." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleDev = async (account: AccountResult, action: "grant" | "revoke") => {
    const actionReason = prompt(
      `Please provide a justification reason to ${action} Developer Console access for ${account.name}:`,
      action === "grant" ? "Onboarding to development team" : "Role transition update"
    );

    if (!actionReason || actionReason.trim().length < 5) {
      setBanner({ type: "error", message: "A justification reason of at least 5 characters is required." });
      return;
    }

    setBanner(null);
    try {
      const res = await fetch("/api/dev/accounts/promote-dev", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: account.id,
          action,
          reason: actionReason.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setBanner({ type: "success", message: data.message || `Developer access ${action}ed successfully.` });
        handleSearch(searchQuery);
      } else {
        setBanner({ type: "error", message: data.error || `Failed to ${action} developer access.` });
      }
    } catch (err) {
      setBanner({ type: "error", message: "Network error while updating developer access." });
    }
  };

  const activeRoleDetails = ROLE_PERMISSIONS_MAP[selectedRole] || ROLE_PERMISSIONS_MAP.operations_admin;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-100">Account Access & Role Management</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              DEV_CONTROL
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Search existing Picklers accounts to inspect console access levels and grant or revoke Admin capabilities.
          </p>
        </div>
      </div>

      {/* Banner / Toast Feedback */}
      {banner && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl border shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-2xl ${
            banner.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}
        >
          {banner.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-5 h-5 shrink-0 text-red-400" />
          )}
          <span className="text-xs font-medium flex-1">{banner.message}</span>
          <button onClick={() => setBanner(null)} className="text-xs opacity-60 hover:opacity-100">
            Dismiss
          </button>
        </motion.div>
      )}

      {/* Account Search Control */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search accounts by name, email, or user UUID..."
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs font-mono focus:outline-none focus:border-cyan-500/50 transition-colors shadow-inner"
        />
        {loading && (
          <Loader2 className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-cyan-400 animate-spin" />
        )}
      </div>

      {/* Account Lookup Results */}
      <div className="space-y-4">
        {accounts.length === 0 && searchQuery.length >= 2 && !loading ? (
          <div className="p-8 text-center bg-slate-900/40 border border-slate-800 rounded-2xl">
            <UserX className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400">No Picklers accounts matching "{searchQuery}" were found.</p>
          </div>
        ) : (
          accounts.map((acc) => (
            <div
              key={acc.id}
              className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700/80 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg"
            >
              {/* Left Details */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-sm text-slate-100">{acc.name}</span>
                  {/* Account Classification Pill */}
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      acc.accountType === "Admin + Developer"
                        ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                        : acc.accountType === "Developer"
                        ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                        : acc.accountType === "Admin"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-slate-800 text-slate-400 border border-slate-700/50"
                    }`}
                  >
                    {acc.accountType}
                  </span>

                  {acc.accountStatus === "suspended" && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-500/10 text-red-400 border border-red-500/20">
                      Suspended
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 font-mono">
                  <span>ID: <code className="text-slate-300">{acc.id}</code></span>
                  {acc.adminRole && (
                    <span className="text-emerald-400/90 font-sans font-medium">
                      Role: {acc.adminRole}
                    </span>
                  )}
                </div>

                {/* Console Access Badges */}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[11px] text-slate-500 font-semibold">Console Access:</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                    Player
                  </span>
                  {acc.adminAccess && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                      Admin ✓
                    </span>
                  )}
                  {acc.developerAccess && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300">
                      Developer ✓
                    </span>
                  )}
                </div>
              </div>

              {/* Right Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-slate-800">
                {/* Admin Access Actions */}
                {acc.adminAccess ? (
                  <>
                    <button
                      onClick={() => window.open("/app/admin", "_blank")}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Admin Console</span>
                      <ExternalLink className="w-3 h-3 ml-1 opacity-70" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedAccount(acc);
                        setDemoteModalOpen(true);
                      }}
                      className="px-3 py-2 rounded-xl text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all"
                    >
                      Revoke Admin
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedAccount(acc);
                      setPromoteModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Grant Admin</span>
                  </button>
                )}

                {/* Developer Access Actions */}
                {acc.developerAccess ? (
                  <button
                    onClick={() => handleToggleDev(acc, "revoke")}
                    className="px-3 py-2 rounded-xl text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all"
                  >
                    Revoke Dev
                  </button>
                ) : (
                  <button
                    onClick={() => handleToggleDev(acc, "grant")}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition-all"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Grant Dev</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* GRANT ADMIN ACCESS MODAL */}
      <AnimatePresence>
        {promoteModalOpen && selectedAccount && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] dark:bg-black/50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg rounded-3xl bg-surface-overlay dark:bg-[#13223F] border border-border dark:border-white/12 p-6 shadow-[0_25px_60px_rgba(0,0,0,0.5)] space-y-5 z-[610]"
            >
              <div className="flex items-center justify-between border-b border-border dark:border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-base font-bold text-foreground">Grant Admin Access</h2>
                </div>
                <button
                  onClick={() => setPromoteModalOpen(false)}
                  className="text-muted-foreground hover:text-foreground text-xs font-mono cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-3 rounded-xl bg-surface-interactive border border-border text-xs space-y-1">
                <div className="text-muted-foreground">Target Account:</div>
                <div className="font-bold text-foreground text-sm">{selectedAccount.name}</div>
                <div className="font-mono text-[11px] text-muted-foreground">{selectedAccount.id}</div>
              </div>

              <form onSubmit={handlePromoteSubmit} className="space-y-4">
                {/* Select Role */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                    Select Admin Role Template
                  </label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-interactive border border-border text-foreground text-xs font-mono focus:outline-none focus:border-cyan-500/50"
                  >
                    <option value="operations_admin">Operations Admin</option>
                    <option value="platform_admin">Platform Admin</option>
                    <option value="super_admin">Super Admin</option>
                    <option value="finance_admin">Finance Admin</option>
                    <option value="moderator">Community Moderator</option>
                  </select>
                </div>

                {/* Permission Preview */}
                <div className="p-4 rounded-xl bg-surface-interactive border border-border space-y-2 text-xs">
                  <div className="font-bold text-foreground flex items-center gap-1.5">
                    <span>Permission Preview:</span>
                    <span className="text-cyan-400">{activeRoleDetails.title}</span>
                  </div>

                  <div className="space-y-1">
                    <div className="text-[11px] font-semibold text-emerald-400">Granted Capabilities:</div>
                    {activeRoleDetails.grants.map((g, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{g}</span>
                      </div>
                    ))}
                  </div>

                  {activeRoleDetails.denies.length > 0 && (
                    <div className="space-y-1 pt-1.5 border-t border-border">
                      <div className="text-[11px] font-semibold text-red-400">Restricted Capabilities:</div>
                      {activeRoleDetails.denies.map((d, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                          <XCircle className="w-3.5 h-3.5 text-red-400/70 shrink-0" />
                          <span>{d}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Justification Reason */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                    Justification Reason (Required for Audit Log)
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g. Operations team onboarding approval for Q3..."
                    rows={2}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-interactive border border-border text-foreground text-xs focus:outline-none focus:border-cyan-500/50"
                    required
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setPromoteModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-cyan-600 text-white hover:bg-cyan-500 transition-all shadow-md cursor-pointer"
                  >
                    {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>Confirm & Grant Admin Access</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* REVOKE ADMIN ACCESS MODAL */}
      <AnimatePresence>
        {demoteModalOpen && selectedAccount && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] dark:bg-black/50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg rounded-3xl bg-surface-overlay dark:bg-[#13223F] border border-border dark:border-white/12 p-6 shadow-[0_25px_60px_rgba(0,0,0,0.5)] space-y-5 z-[610]"
            >
              <div className="flex items-center justify-between border-b border-border dark:border-white/10 pb-3">
                <div className="flex items-center gap-2 text-red-500 dark:text-red-400">
                  <ShieldAlert className="w-5 h-5" />
                  <h2 className="text-base font-bold text-foreground">Revoke Admin Access</h2>
                </div>
                <button
                  onClick={() => setDemoteModalOpen(false)}
                  className="text-muted-foreground hover:text-foreground text-xs font-mono cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-3 rounded-xl bg-surface-interactive border border-border text-xs space-y-1">
                <div className="text-muted-foreground">Target Account:</div>
                <div className="font-bold text-foreground text-sm">{selectedAccount.name}</div>
                <div className="font-mono text-[11px] text-muted-foreground">{selectedAccount.id}</div>
              </div>

              <form onSubmit={handleDemoteSubmit} className="space-y-4">
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>This account will immediately lose access to the Picklers Admin Console.</span>
                </div>

                {/* Justification Reason */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                    Revocation Reason (Required for Audit Log)
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g. Role transition complete, revoking admin privileges..."
                    rows={2}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-interactive border border-border text-foreground text-xs focus:outline-none focus:border-red-500/50"
                    required
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setDemoteModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-red-500 text-white hover:bg-red-600 transition-all shadow-md cursor-pointer"
                  >
                    {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>Confirm Revocation</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
