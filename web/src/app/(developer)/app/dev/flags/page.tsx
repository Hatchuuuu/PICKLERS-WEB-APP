"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Flag,
  Plus,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Loader2,
  RefreshCw,
  Sliders,
  X,
  Code,
} from "lucide-react";
import { FeatureFlag } from "@/types/developer";
import { useToast } from "@/contexts/ToastContext";

const INITIAL_FLAGS: FeatureFlag[] = [
  {
    id: "flag-1",
    key: "new_booking_flow",
    name: "Redesigned Court Booking Flow",
    description: "Enables multi-court checkout and split payment options for players.",
    is_enabled: true,
    environment: "production",
    rollout_percentage: 50,
    targeting_rules: { min_tier: "intermediate", beta_users: true },
    created_at: "2026-08-01T10:00:00Z",
    updated_at: "2026-08-10T14:30:00Z",
  },
  {
    id: "flag-2",
    key: "instant_owner_verification",
    name: "Automated Facility Verification AI",
    description: "Auto-verifies government IDs submitted in partner applications.",
    is_enabled: false,
    environment: "production",
    rollout_percentage: 0,
    created_at: "2026-08-05T09:12:00Z",
    updated_at: "2026-08-05T09:12:00Z",
  },
  {
    id: "flag-3",
    key: "tournament_live_bracket",
    name: "Real-time Tournament Bracket Streaming",
    description: "Live WebSocket updates for tournament standings and player scoring.",
    is_enabled: true,
    environment: "production",
    rollout_percentage: 100,
    created_at: "2026-07-20T11:00:00Z",
    updated_at: "2026-08-02T16:00:00Z",
  },
];

export default function FeatureFlagsPage() {
  const { showToast } = useToast();
  const [flags, setFlags] = useState<FeatureFlag[]>(INITIAL_FLAGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState<FeatureFlag | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Edit Form state
  const [targetEnabled, setTargetEnabled] = useState(false);
  const [targetRollout, setTargetRollout] = useState(100);
  const [targetRulesJson, setTargetRulesJson] = useState("{}");
  const [actionReason, setActionReason] = useState("");

  // Create Form state
  const [newKey, setNewKey] = useState("");
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newEnabled, setNewEnabled] = useState(false);
  const [newRollout, setNewRollout] = useState(100);
  const [newRulesJson, setNewRulesJson] = useState("{}");
  const [newReason, setNewReason] = useState("");

  const [envFilter, setEnvFilter] = useState<string>("all");

  const fetchFlags = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dev/flags");
      if (res.ok) {
        const data = await res.json();
        if (data.flags && data.flags.length > 0) {
          setFlags(data.flags);
        }
      }
    } catch {
      // Keep default fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowConfirmModal(false);
        setShowCreateModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleEditClick = (flag: FeatureFlag) => {
    setSelectedFlag(flag);
    setTargetEnabled(flag.is_enabled);
    setTargetRollout(flag.rollout_percentage);
    setTargetRulesJson(JSON.stringify(flag.targeting_rules || {}, null, 2));
    setActionReason("");
    setShowConfirmModal(true);
  };

  const handleQuickToggle = (flag: FeatureFlag, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFlag(flag);
    setTargetEnabled(!flag.is_enabled);
    setTargetRollout(flag.rollout_percentage);
    setTargetRulesJson(JSON.stringify(flag.targeting_rules || {}, null, 2));
    setActionReason("");
    setShowConfirmModal(true);
  };

  const handleSaveFlag = async () => {
    if (!selectedFlag) return;
    if (!actionReason.trim()) {
      showToast("A justification reason is required for compliance audit logs.", "error");
      return;
    }

    let parsedRules = {};
    try {
      if (targetRulesJson.trim()) {
        parsedRules = JSON.parse(targetRulesJson);
      }
    } catch {
      showToast("Invalid Targeting Rules JSON syntax", "error");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/dev/flags/${selectedFlag.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_enabled: targetEnabled,
          rollout_percentage: targetRollout,
          targeting_rules: parsedRules,
          reason: actionReason.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setFlags((prev) =>
          prev.map((f) => (f.id === selectedFlag.id ? data.flag : f))
        );
        showToast(`Feature flag "${selectedFlag.key}" updated successfully.`, "success");
        setShowConfirmModal(false);
        setSelectedFlag(null);
      } else {
        showToast(data.error || "Failed to update feature flag.", "error");
      }
    } catch {
      showToast("Network error updating feature flag.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateFlag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim() || !newName.trim()) return;
    if (!newReason.trim()) {
      showToast("An audit reason is required for creating feature flags.", "error");
      return;
    }

    let parsedRules = {};
    try {
      if (newRulesJson.trim()) {
        parsedRules = JSON.parse(newRulesJson);
      }
    } catch {
      showToast("Invalid Targeting Rules JSON syntax", "error");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/dev/flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: newKey,
          name: newName,
          description: newDesc,
          is_enabled: newEnabled,
          rollout_percentage: newRollout,
          targeting_rules: parsedRules,
          reason: newReason.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setFlags((prev) => [data.flag, ...prev]);
        showToast(`Feature flag "${newKey}" created successfully!`, "success");
        setShowCreateModal(false);
        setNewKey("");
        setNewName("");
        setNewDesc("");
        setNewRulesJson("{}");
        setNewReason("");
      } else {
        showToast(data.error || "Failed to create feature flag.", "error");
      }
    } catch {
      showToast("Network error creating feature flag.", "error");
    } finally {
      setSaving(false);
    }
  };

  const filteredFlags = flags.filter((f) =>
    envFilter === "all" ? true : f.environment === envFilter
  );

  return (
    <div className="space-y-6 font-mono">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">
              RUNTIME FEATURE FLAGS & ROLLOUTS
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            Safely control feature rollouts, percentage splits, and runtime behavior across environments.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
          <select
            value={envFilter}
            onChange={(e) => setEnvFilter(e.target.value)}
            aria-label="Filter feature flags by environment"
            className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500/50"
          >
            <option value="all">All Environments</option>
            <option value="production">Production</option>
            <option value="staging">Staging</option>
            <option value="development">Development</option>
          </select>

          <button
            onClick={fetchFlags}
            disabled={loading}
            aria-label="Refresh feature flags"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-mono transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            aria-label="Create new feature flag"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 hover:bg-cyan-500/20 text-xs font-semibold transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Feature Flag</span>
          </button>
        </div>
      </div>

      {/* Flag Cards Grid */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-slate-900/40 border border-slate-800 animate-pulse" />
          ))
        ) : filteredFlags.length === 0 ? (
          <div className="py-12 text-center text-slate-500 font-mono bg-slate-900/20 border border-slate-800 rounded-2xl text-xs">
            No feature flags found for environment: {envFilter}
          </div>
        ) : (
          filteredFlags.map((flag) => (
            <div
              key={flag.id}
              className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2 max-w-xl flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-cyan-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                    {flag.key}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-amber-400 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                    {flag.environment}
                  </span>
                  {flag.is_enabled ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                      <CheckCircle2 className="w-3 h-3" />
                      ENABLED ({flag.rollout_percentage}%)
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                      <XCircle className="w-3 h-3" />
                      DISABLED
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-bold text-slate-200 font-sans">{flag.name}</h3>
                <p className="text-xs text-slate-400 font-sans">{flag.description}</p>
                
                {/* Visual Rollout Progress Bar */}
                <div className="w-full max-w-xs pt-1">
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        flag.is_enabled
                          ? flag.rollout_percentage === 100
                            ? "bg-emerald-400"
                            : "bg-cyan-400"
                          : "bg-slate-600"
                      }`}
                      style={{
                        width: `${flag.is_enabled ? flag.rollout_percentage : 0}%`,
                      }}
                    />
                  </div>
                </div>

                {flag.targeting_rules && Object.keys(flag.targeting_rules).length > 0 && (
                  <div className="flex items-center gap-1 pt-1 text-[10px] text-cyan-400 font-mono">
                    <Code className="w-3 h-3" />
                    <span>Targeting: {JSON.stringify(flag.targeting_rules)}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                <button
                  onClick={(e) => handleQuickToggle(flag, e)}
                  aria-label={`Toggle feature flag ${flag.key}`}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                    flag.is_enabled
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                      : "bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {flag.is_enabled ? "ENABLED" : "DISABLED"}
                </button>

                <button
                  onClick={() => handleEditClick(flag)}
                  aria-label={`Configure feature flag ${flag.key}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs text-slate-200 transition-colors"
                >
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Configure</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit & Rollout Modal */}
      {showConfirmModal && selectedFlag && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] dark:bg-black/50">
          <div className="w-full max-w-md bg-surface-overlay dark:bg-[#13223F] border border-border dark:border-white/12 rounded-3xl p-6 space-y-4 shadow-[0_25px_60px_rgba(0,0,0,0.5)] z-[610]">
            <div className="flex items-center justify-between border-b border-border dark:border-white/10 pb-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <ShieldAlert className="w-5 h-5" />
                <span>CONFIGURE FEATURE FLAG</span>
              </div>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground font-sans">
              Modifying flag <strong className="text-cyan-400 font-mono">{selectedFlag.key}</strong> in production.
            </p>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-sans">Flag State</span>
                <button
                  type="button"
                  onClick={() => setTargetEnabled(!targetEnabled)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                    targetEnabled
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : "bg-surface-interactive border-border text-muted-foreground"
                  }`}
                >
                  {targetEnabled ? "ENABLED" : "DISABLED"}
                </button>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground font-sans">Rollout Percentage</span>
                  <span className="text-cyan-400 font-mono font-bold">{targetRollout}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={targetRollout}
                  onChange={(e) => setTargetRollout(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-sans">Targeting Rules (JSON)</label>
                <textarea
                  rows={2}
                  value={targetRulesJson}
                  onChange={(e) => setTargetRulesJson(e.target.value)}
                  placeholder='{"tier": "pro"}'
                  className="w-full px-3 py-2 bg-surface-interactive border border-border rounded-xl text-xs font-mono text-cyan-400 focus:outline-none focus:border-cyan-500/50 resize-none"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground font-sans flex items-center justify-between">
                  <span>Audit Reason / Ticket Reference</span>
                  <span className="text-[10px] text-amber-400 font-bold">REQUIRED</span>
                </label>
                <input
                  type="text"
                  required
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="e.g. JIRA-4029 Rollout investigation"
                  className="w-full px-3 py-2 bg-surface-interactive border border-border rounded-xl text-xs text-foreground focus:outline-none focus:border-cyan-500/50"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl bg-surface-interactive text-muted-foreground hover:text-foreground text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveFlag}
                disabled={saving || !actionReason.trim()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 text-white font-bold text-xs hover:bg-cyan-500 transition-colors disabled:opacity-50 cursor-pointer shadow-md"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Confirm Production Change
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Feature Flag Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] dark:bg-black/50">
          <form
            onSubmit={handleCreateFlag}
            className="w-full max-w-md bg-surface-overlay dark:bg-[#13223F] border border-border dark:border-white/12 rounded-3xl p-6 space-y-4 shadow-[0_25px_60px_rgba(0,0,0,0.5)] z-[610]"
          >
            <div className="flex items-center justify-between border-b border-border dark:border-white/10 pb-3">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                <Plus className="w-5 h-5" />
                <span>NEW FEATURE FLAG</span>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground font-sans">Flag Key (slug)</label>
                <input
                  type="text"
                  required
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder="e.g. split_payments_v2"
                  className="w-full px-3 py-2 bg-surface-interactive border border-border rounded-xl text-xs font-mono text-foreground focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground font-sans">Display Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Split Payments V2"
                  className="w-full px-3 py-2 bg-surface-interactive border border-border rounded-xl text-xs font-sans text-foreground focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground font-sans">Description</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="What does this feature flag toggle?"
                  rows={2}
                  className="w-full px-3 py-2 bg-surface-interactive border border-border rounded-xl text-xs font-sans text-foreground focus:outline-none focus:border-cyan-500/50 resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-sans">Targeting Rules (JSON)</label>
                <textarea
                  rows={2}
                  value={newRulesJson}
                  onChange={(e) => setNewRulesJson(e.target.value)}
                  placeholder='{"beta_users": true}'
                  className="w-full px-3 py-2 bg-surface-interactive border border-border rounded-xl text-xs font-mono text-cyan-400 focus:outline-none focus:border-cyan-500/50 resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-muted-foreground font-sans">Initial State</span>
                <button
                  type="button"
                  onClick={() => setNewEnabled(!newEnabled)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                    newEnabled
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : "bg-surface-interactive border-border text-muted-foreground"
                  }`}
                >
                  {newEnabled ? "ENABLED" : "DISABLED"}
                </button>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground font-sans">Rollout Target</span>
                  <span className="text-cyan-400 font-mono font-bold">{newRollout}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={newRollout}
                  onChange={(e) => setNewRollout(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground font-sans flex items-center justify-between">
                  <span>Audit Reason / Justification</span>
                  <span className="text-[10px] text-amber-400 font-bold">REQUIRED</span>
                </label>
                <input
                  type="text"
                  required
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  placeholder="e.g. PROD-104: Launching new checkout experiment"
                  className="w-full px-3 py-2 bg-surface-interactive border border-border rounded-xl text-xs font-sans text-foreground focus:outline-none focus:border-cyan-500/50"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl bg-surface-interactive text-muted-foreground hover:text-foreground text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !newKey.trim() || !newName.trim() || !newReason.trim()}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-cyan-600 text-white font-bold text-xs hover:bg-cyan-500 transition-colors disabled:opacity-50 cursor-pointer shadow-md"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Create Flag
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
