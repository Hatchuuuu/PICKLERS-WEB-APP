"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Tag, X, Power, Trash2, AlertTriangle, Search, Edit2, RotateCcw } from "lucide-react";
import { PromoForm } from "@/components/admin/PromoForm";
import type { Promotion } from "@/types/admin";
import { useToast } from "@/contexts/ToastContext";
import { SkeletonTableRows } from "@/components/admin/AdminSkeleton";
import { cn } from "@/lib/utils";

export default function PromotionsPage() {
  const { showToast } = useToast();
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
  const [promoToDelete, setPromoToDelete] = useState<Promotion | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPromos = useCallback(async (querySearch?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const q = querySearch !== undefined ? querySearch : search;
      const url = q.trim()
        ? `/api/admin/promotions?search=${encodeURIComponent(q.trim())}`
        : "/api/admin/promotions";
      const res = await fetch(url);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Failed to load promotion codes");
      }
      const json = await res.json();
      setPromos(json.data || []);
    } catch (e: unknown) {
      console.error("Failed to load promotions:", e);
      setError(e instanceof Error ? e.message : "Failed to load promotions");
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPromos(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, fetchPromos]);

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/promotions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !currentActive }),
      });

      if (res.ok) {
        showToast(
          currentActive ? "Promo code deactivated." : "Promo code activated!",
          "success"
        );
        fetchPromos();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || "Failed to update promo status", "error");
      }
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Failed to update promo status", "error");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!promoToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/promotions/${promoToDelete.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        showToast(`Promo code "${promoToDelete.code}" deleted.`, "success");
        fetchPromos();
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to delete promotion", "error");
      }
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Deletion failed", "error");
    } finally {
      setIsDeleting(false);
      setPromoToDelete(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            Promotions & Marketing Engine
          </h1>
          <p className="text-sm font-medium text-muted-foreground">
            Create discount codes, referral multipliers, and booking vouchers
          </p>
        </div>
        <button
          onClick={() => setIsFormModalOpen(true)}
          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create Promo Code</span>
        </button>
      </div>

      {/* Error Alert Banner */}
      {error && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border bg-red-500/10 border-red-500/20 text-red-500 dark:text-red-400 backdrop-blur-2xl shadow-lg">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchPromos()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500/20 hover:bg-red-500/30 transition-colors text-red-400"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Search Controls */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by promo code or description…"
          className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-border bg-surface-base text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-emerald-500/50"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-surface-base/80 backdrop-blur-2xl shadow-xl overflow-hidden">
        {isLoading ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface-raised/60 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-4">Code</th>
                  <th className="p-4">Discount</th>
                  <th className="p-4">Uses</th>
                  <th className="p-4">Expires</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                <SkeletonTableRows rows={5} cols={6} />
              </tbody>
            </table>
          </div>
        ) : promos.filter((p) =>
            search.trim()
              ? p.code.toLowerCase().includes(search.toLowerCase()) ||
                (p.description || "").toLowerCase().includes(search.toLowerCase())
              : true
          ).length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center gap-3">
            <Tag className="w-8 h-8 opacity-40" />
            <div className="text-sm font-bold text-foreground">
              {search ? "No matching promo codes" : "No promo codes created yet"}
            </div>
            <p className="text-xs text-muted-foreground">
              {search ? `No promo codes match "${search}".` : 'Click "Create Promo Code" to launch a campaign.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface-raised/60 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-4">Code</th>
                  <th className="p-4">Discount</th>
                  <th className="p-4">Uses</th>
                  <th className="p-4">Expires</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 font-medium">
                {promos
                  .filter((p) =>
                    search.trim()
                      ? p.code.toLowerCase().includes(search.toLowerCase()) ||
                        (p.description || "").toLowerCase().includes(search.toLowerCase())
                      : true
                  )
                  .map((p) => (
                    <tr key={p.id} className="hover:bg-surface-interactive/50 transition-colors">
                      <td className="p-4">
                        <div className="font-mono font-bold text-emerald-400 text-base">{p.code}</div>
                        {p.description && <div className="text-xs text-muted-foreground">{p.description}</div>}
                      </td>

                      <td className="p-4 font-bold text-foreground">
                        {p.discount_type === "percentage" ? `${p.discount_value}% OFF` : `₱${p.discount_value} OFF`}
                      </td>

                      <td className="p-4 text-xs font-semibold">
                        {p.current_uses} / {p.max_uses ?? "∞"}
                      </td>

                      <td className="p-4 text-xs text-muted-foreground">
                        {p.expires_at ? new Date(p.expires_at).toLocaleDateString() : "Never"}
                      </td>

                      <td className="p-4">
                        <span
                          className={cn(
                            "px-2.5 py-1 rounded-full text-xs font-bold border",
                            p.is_active
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                              : "bg-surface-raised border-border text-muted-foreground"
                          )}
                        >
                          {p.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditingPromo(p)}
                            className="p-1.5 rounded-xl border border-border bg-surface-raised text-foreground hover:bg-surface-interactive transition-colors"
                            title="Edit Promo Code"
                            aria-label="Edit Promo Code"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleToggleActive(p.id, p.is_active)}
                            className={cn(
                              "px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-colors",
                              p.is_active
                                ? "bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20"
                                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                            )}
                          >
                            <Power className="w-3.5 h-3.5" />
                            <span>{p.is_active ? "Deactivate" : "Activate"}</span>
                          </button>

                          <button
                            onClick={() => setPromoToDelete(p)}
                            className="p-1.5 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
                            title="Delete Promo Code"
                            aria-label="Delete Promo Code"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Modal (Create or Edit) */}
      {(isFormModalOpen || editingPromo) && (
        <div className="fixed inset-0 z-[600] bg-black/40 backdrop-blur-[2px] dark:bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-surface-overlay dark:bg-[#13223F] border border-border dark:border-white/12 rounded-3xl p-6 shadow-[0_25px_60px_rgba(0,0,0,0.5)] flex flex-col gap-4 z-[610]">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">
                {editingPromo ? `Edit Promo Code "${editingPromo.code}"` : "Create New Promo Code"}
              </h3>
              <button
                onClick={() => {
                  setIsFormModalOpen(false);
                  setEditingPromo(null);
                }}
                className="p-2 rounded-xl bg-surface-interactive hover:bg-surface-interactive/80 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                aria-label="Close Modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <PromoForm
              initialData={editingPromo}
              onSuccess={() => {
                setIsFormModalOpen(false);
                setEditingPromo(null);
                fetchPromos();
              }}
              onCancel={() => {
                setIsFormModalOpen(false);
                setEditingPromo(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {promoToDelete && (
        <div className="fixed inset-0 z-[600] bg-black/40 backdrop-blur-[2px] dark:bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface-overlay dark:bg-[#13223F] border border-border dark:border-white/12 rounded-3xl p-6 shadow-[0_25px_60px_rgba(0,0,0,0.5)] flex flex-col gap-4 z-[610]">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Delete Promo Code</h3>
                <p className="text-xs text-muted-foreground">
                  Are you sure you want to permanently delete{" "}
                  <span className="font-bold text-emerald-500 dark:text-emerald-400">{promoToDelete.code}</span>?
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground bg-surface-interactive p-3 rounded-xl border border-border">
              This action cannot be undone. Users will no longer be able to redeem this promo code.
            </p>

            <div className="flex gap-2.5 pt-1">
              <button
                onClick={() => setPromoToDelete(null)}
                className="flex-1 py-3 rounded-xl text-xs font-semibold bg-surface-interactive hover:bg-surface-interactive/80 text-foreground transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="flex-1 py-3 rounded-xl text-xs font-bold bg-red-500 text-white hover:bg-red-600 shadow-md transition-colors disabled:opacity-60 cursor-pointer"
              >
                {isDeleting ? "Deleting…" : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
