"use client";

import { useEffect, useState, useCallback } from "react";
import { DollarSign, TrendingUp, ShieldCheck, CreditCard, ArrowUpRight, AlertTriangle, RotateCcw, X, Loader2, CheckCircle2, Download } from "lucide-react";
import { StatCard } from "@/components/admin/StatCard";
import { SkeletonStatCard, SkeletonTableRows } from "@/components/admin/AdminSkeleton";
import { useToast } from "@/contexts/ToastContext";

interface PayoutBatchItem {
  id: string;
  total_amount: number;
  recipient_count: number;
  status: string;
  triggered_at: string;
}

interface FinanceMetrics {
  total_gmv: number;
  platform_revenue: number;
  escrow_balance: number;
  active_payouts_pending: number;
  batches?: PayoutBatchItem[];
}

export default function AdminFinancePage() {
  const { showToast } = useToast();
  const [metrics, setMetrics] = useState<FinanceMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/finance");
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Failed to load financial ledger metrics");
      }
      const json = await res.json();
      setMetrics(json.data);
    } catch (err: unknown) {
      console.error("Failed to load finance metrics:", err);
      setError(err instanceof Error ? err.message : "Failed to load financial telemetry");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const res = await fetch("/api/admin/finance/export");
      if (!res.ok) {
        throw new Error("Failed to generate CSV export");
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `finance_ledger_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast("Ledger CSV exported successfully", "success");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Export failed", "error");
    } finally {
      setIsExporting(false);
    }
  };

  const handleConfirmPayout = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/admin/finance/process-payouts", {
        method: "POST",
      });

      if (res.ok) {
        showToast("Payout batch settlement processed successfully!", "success");
        setShowConfirmModal(false);
        fetchMetrics();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || "Failed to process payouts", "error");
      }
    } catch {
      showToast("Payout settlement transaction failed", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight flex items-center gap-2.5">
            <DollarSign className="w-7 h-7 text-emerald-400" />
            <span>Financial Ledger & Payouts Engine</span>
          </h1>
          <p className="text-sm font-medium text-muted-foreground">
            Platform GMV accounting, commission breakdown, escrow holds, and partner payout controls
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleExportCSV}
            disabled={isExporting}
            className="px-3.5 py-2.5 rounded-xl text-xs font-bold border border-border bg-surface-base hover:bg-surface-interactive text-foreground disabled:opacity-50 transition-colors flex items-center gap-1.5"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin text-emerald-400" /> : <Download className="w-4 h-4 text-emerald-400" />}
            <span>{isExporting ? "Exporting..." : "Export Ledger CSV"}</span>
          </button>

          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={isLoading || isProcessing}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors shadow-lg shadow-emerald-500/20 flex items-center gap-2"
          >
            <span>Process Pending Payouts</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border bg-red-500/10 border-red-500/20 text-red-500 dark:text-red-400 backdrop-blur-2xl shadow-lg">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchMetrics}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500/20 text-red-400 hover:bg-red-500/30"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Financial KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {isLoading ? (
          <>
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
          </>
        ) : (
          <>
            <StatCard
              title="Platform Gross Volume (GMV)"
              value={`₱${metrics?.total_gmv?.toLocaleString() ?? 0}`}
              icon={DollarSign}
              color="emerald"
              description="Lifetime transaction volume"
            />
            <StatCard
              title="Platform Revenue (10%)"
              value={`₱${metrics?.platform_revenue?.toLocaleString() ?? 0}`}
              icon={TrendingUp}
              color="blue"
              description="Net commission earnings"
            />
            <StatCard
              title="Escrow Balance"
              value={`₱${metrics?.escrow_balance?.toLocaleString() ?? 0}`}
              icon={ShieldCheck}
              color="violet"
              description="Player wallet balances in escrow"
            />
            <StatCard
              title="Pending Payout Batches"
              value={metrics?.active_payouts_pending ?? 0}
              icon={CreditCard}
              color="amber"
              pulse={(metrics?.active_payouts_pending ?? 0) > 0}
              description="Awaiting venue settlement"
            />
          </>
        )}
      </div>

      {/* Financial Activity Summary */}
      <div className="p-6 rounded-2xl border border-border bg-surface-base/80 backdrop-blur-2xl shadow-xl flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-foreground">Recent Transaction Batches</h3>
          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Settlement Synchronization Active</span>
          </span>
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-surface-raised/60 font-bold uppercase text-muted-foreground">
              <tr>
                <th className="p-3">Batch ID</th>
                <th className="p-3">Triggered At</th>
                <th className="p-3">Recipients</th>
                <th className="p-3">Total Disbursed</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-medium">
              {isLoading ? (
                <SkeletonTableRows rows={3} cols={5} />
              ) : !metrics?.batches || metrics.batches.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-muted-foreground">
                    No payout batches processed yet. Click "Process Pending Payouts" to trigger settlement.
                  </td>
                </tr>
              ) : (
                metrics.batches.map((batch) => (
                  <tr key={batch.id} className="hover:bg-surface-raised/40 transition-colors">
                    <td className="p-3 font-mono font-bold text-emerald-400">#{batch.id.slice(0, 8)}</td>
                    <td className="p-3 font-mono text-muted-foreground">{new Date(batch.triggered_at).toLocaleString()}</td>
                    <td className="p-3 font-bold text-foreground">{batch.recipient_count} partner(s)</td>
                    <td className="p-3 font-mono font-bold text-emerald-400">₱{Number(batch.total_amount).toLocaleString()}</td>
                    <td className="p-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 uppercase">
                        {batch.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Responsive Cards View */}
        <div className="sm:hidden flex flex-col gap-3">
          {isLoading ? (
            <div className="p-4 rounded-xl bg-surface-raised animate-pulse h-24" />
          ) : !metrics?.batches || metrics.batches.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground">
              No payout batches processed yet.
            </div>
          ) : (
            metrics.batches.map((batch) => (
              <div key={batch.id} className="p-3.5 rounded-xl border border-border bg-surface-raised/40 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-emerald-400">#{batch.id.slice(0, 8)}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 uppercase">
                    {batch.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-border/40">
                  <span className="text-muted-foreground">{new Date(batch.triggered_at).toLocaleDateString()}</span>
                  <span className="font-bold text-foreground">{batch.recipient_count} partner(s)</span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono font-bold text-emerald-400 pt-1">
                  <span className="text-[11px] text-muted-foreground font-normal">Disbursed:</span>
                  <span>₱{Number(batch.total_amount).toLocaleString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[600] bg-black/40 backdrop-blur-[2px] dark:bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface-overlay dark:bg-[#13223F] border border-border dark:border-white/12 rounded-3xl p-6 shadow-[0_25px_60px_rgba(0,0,0,0.5)] flex flex-col gap-4 z-[610]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Process Partner Payouts</h3>
                  <p className="text-xs text-muted-foreground">Confirm venue settlement payout batch execution</p>
                </div>
              </div>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="p-1.5 rounded-xl bg-surface-interactive hover:bg-surface-interactive/80 border border-border text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-interactive border border-border flex flex-col gap-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Escrow Balance Pending:</span>
                <span className="font-mono font-bold text-emerald-500 dark:text-emerald-400">₱{metrics?.escrow_balance?.toLocaleString() ?? 0}</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-border/50">
                <span className="text-muted-foreground">Retained Platform Revenue (10%):</span>
                <span className="font-mono font-bold text-blue-500 dark:text-blue-400">₱{metrics?.platform_revenue?.toLocaleString() ?? 0}</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground bg-surface-interactive p-3 rounded-xl border border-border">
              This action will calculate pending court revenue shares (net of 10% platform commission) and disburse payout funds to verified facility owners.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 rounded-xl text-xs font-semibold bg-surface-interactive hover:bg-surface-interactive/80 text-foreground transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPayout}
                disabled={isProcessing}
                className="flex-1 py-3 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-white transition-colors shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUpRight className="w-4 h-4" />}
                <span>{isProcessing ? "Processing..." : "Confirm & Execute Payout"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
