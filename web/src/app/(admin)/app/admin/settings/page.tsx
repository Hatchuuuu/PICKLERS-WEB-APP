"use client";

import { useEffect, useState, useCallback } from "react";
import { Settings, Shield, Sliders, Save, AlertTriangle, RotateCcw, Loader2 } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { Toggle } from "@/components/ui/Toggle";

export default function AdminSettingsPage() {
  const { showToast } = useToast();
  const [initialSettings, setInitialSettings] = useState({
    platformFee: 10,
    maintenanceMode: false,
    autoVerify: false,
    advanceDays: 14,
    allowDemo: true,
  });

  const [platformFee, setPlatformFee] = useState(10);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [autoVerify, setAutoVerify] = useState(false);
  const [advanceDays, setAdvanceDays] = useState(14);
  const [allowDemo, setAllowDemo] = useState(true);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDirty =
    platformFee !== initialSettings.platformFee ||
    maintenanceMode !== initialSettings.maintenanceMode ||
    autoVerify !== initialSettings.autoVerify ||
    advanceDays !== initialSettings.advanceDays ||
    allowDemo !== initialSettings.allowDemo;

  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/settings");
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Failed to load platform settings");
      }
      const json = await res.json();
      const data = json.data || {};

      const fee = Number(data.platform_fee_percent ?? 10);
      const maint = Boolean(data.maintenance_mode ?? false);
      const verify = Boolean(data.auto_verify_owners ?? false);
      const days = Number(data.max_booking_advance_days ?? 14);
      const demo = Boolean(data.allow_demo_accounts ?? true);

      setPlatformFee(fee);
      setMaintenanceMode(maint);
      setAutoVerify(verify);
      setAdvanceDays(days);
      setAllowDemo(demo);

      setInitialSettings({
        platformFee: fee,
        maintenanceMode: maint,
        autoVerify: verify,
        advanceDays: days,
        allowDemo: demo,
      });
    } catch (err: unknown) {
      console.error("Failed to load settings:", err);
      setError(err instanceof Error ? err.message : "Failed to load settings");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform_fee_percent: platformFee,
          maintenance_mode: maintenanceMode,
          auto_verify_owners: autoVerify,
          max_booking_advance_days: advanceDays,
          allow_demo_accounts: allowDemo,
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Failed to update platform settings");
      }

      showToast("Platform policies and operational matrix saved successfully!", "success");
      setInitialSettings({
        platformFee,
        maintenanceMode,
        autoVerify,
        advanceDays,
        allowDemo,
      });
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to save settings", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const isFeeInvalid = isNaN(platformFee) || platformFee < 0.5 || platformFee > 50;
  const isDaysInvalid = isNaN(advanceDays) || advanceDays < 1 || advanceDays > 365;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight flex items-center gap-2.5">
              <Settings className="w-7 h-7 text-emerald-400 shrink-0" />
              <span>Platform Settings & Policy Matrix</span>
            </h1>
            {isDirty && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400 uppercase tracking-wider">
                Unsaved Changes
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            Configure global fee rates, operational thresholds, and system environment toggles
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isLoading || isSaving || !isDirty || isFeeInvalid || isDaysInvalid}
          aria-label="Save platform settings"
          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors shadow-lg shadow-emerald-500/20 flex items-center gap-2 self-start sm:self-auto"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{isSaving ? "Saving..." : "Save Changes"}</span>
        </button>
      </div>

      {/* Global Maintenance Alert Banner */}
      {maintenanceMode && (
        <div className="flex items-center justify-between p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 shadow-lg">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400" />
            <div className="flex flex-col">
              <span className="text-sm font-bold">Platform Maintenance Mode is Currently ACTIVE</span>
              <span className="text-xs text-amber-400/80">
                New player court bookings are globally suspended until maintenance mode is turned off.
              </span>
            </div>
          </div>
          <button
            onClick={() => setMaintenanceMode(false)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 transition-colors shrink-0"
          >
            Disable Maintenance
          </button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border bg-red-500/10 border-red-500/20 text-red-500 dark:text-red-400 backdrop-blur-2xl shadow-lg">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchSettings}
            aria-label="Retry loading settings"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500/20 text-red-400 hover:bg-red-500/30"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Financial & Booking Policy */}
        <div className="p-5 rounded-2xl border border-border bg-surface-base/80 backdrop-blur-2xl shadow-xl flex flex-col gap-4">
          <div className="flex items-center gap-2.5 border-b border-border pb-3">
            <Sliders className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-foreground">Global Commercial Parameters</h3>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground">Global Platform Commission Fee (%)</label>
              {isFeeInvalid && (
                <span className="text-[10px] font-bold text-red-400">Must be 0.5% – 50%</span>
              )}
            </div>
            <input
              type="number"
              min={0.5}
              max={50}
              step={0.5}
              disabled={isLoading}
              value={platformFee}
              onChange={(e) => setPlatformFee(Number(e.target.value))}
              onBlur={() => {
                if (isNaN(platformFee)) setPlatformFee(10);
                else setPlatformFee(Math.max(0.5, Math.min(50, platformFee)));
              }}
              aria-label="Platform commission fee percentage"
              className={`px-3.5 py-2 rounded-xl border text-xs font-semibold focus:outline-none disabled:opacity-50 transition-colors ${
                isFeeInvalid
                  ? "border-red-500/50 bg-red-500/5 focus:border-red-500 text-red-300"
                  : "border-border bg-surface-raised/60 focus:border-emerald-500/50"
              }`}
            />
            <span className="text-[11px] text-muted-foreground">Percentage retained by Picklers on each court booking (0.5% - 50%).</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground">Max Advance Booking Window (Days)</label>
              {isDaysInvalid && (
                <span className="text-[10px] font-bold text-red-400">Must be 1 – 365 days</span>
              )}
            </div>
            <input
              type="number"
              min={1}
              max={365}
              disabled={isLoading}
              value={advanceDays}
              onChange={(e) => setAdvanceDays(Number(e.target.value))}
              onBlur={() => {
                if (isNaN(advanceDays)) setAdvanceDays(14);
                else setAdvanceDays(Math.max(1, Math.min(365, Math.round(advanceDays))));
              }}
              aria-label="Max advance booking window in days"
              className={`px-3.5 py-2 rounded-xl border text-xs font-semibold focus:outline-none disabled:opacity-50 transition-colors ${
                isDaysInvalid
                  ? "border-red-500/50 bg-red-500/5 focus:border-red-500 text-red-300"
                  : "border-border bg-surface-raised/60 focus:border-emerald-500/50"
              }`}
            />
            <span className="text-[11px] text-muted-foreground">Maximum days in advance players can reserve a court (1 - 365 days).</span>
          </div>
        </div>

        {/* Operational Toggles */}
        <div className="p-5 rounded-2xl border border-border bg-surface-base/80 backdrop-blur-2xl shadow-xl flex flex-col gap-4">
          <div className="flex items-center gap-2.5 border-b border-border pb-3">
            <Shield className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-foreground">Operational Safety Controls</h3>
          </div>

          <div className="p-3.5 rounded-xl border border-border bg-surface-raised/40">
            <Toggle
              checked={maintenanceMode}
              onChange={setMaintenanceMode}
              disabled={isLoading}
              label="Platform Maintenance Mode"
              description="Temporarily block player booking creations globally for scheduled maintenance."
            />
          </div>

          <div className="p-3.5 rounded-xl border border-border bg-surface-raised/40">
            <Toggle
              checked={autoVerify}
              onChange={setAutoVerify}
              disabled={isLoading}
              label="Auto-Verify Owner Applications"
              description="Bypass manual admin review for partner verification."
            />
          </div>

          <div className="p-3.5 rounded-xl border border-border bg-surface-raised/40">
            <Toggle
              checked={allowDemo}
              onChange={setAllowDemo}
              disabled={isLoading}
              label="Allow Demo & Sandbox Accounts"
              description="Permit demo users to access sandbox feature previews."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
