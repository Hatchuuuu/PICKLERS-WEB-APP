"use client";

import { useEffect, useState } from "react";
import { Plus, Tag, X, Power } from "lucide-react";
import { PromoForm } from "@/components/admin/PromoForm";
import type { Promotion } from "@/types/admin";
import { useToast } from "@/contexts/ToastContext";
import { cn } from "@/lib/utils";

export default function PromotionsPage() {
  const { showToast } = useToast();
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);

  const fetchPromos = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/promotions");
      if (res.ok) {
        const json = await res.json();
        setPromos(json.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPromos();
  }, []);

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
      }
    } catch (e: any) {
      showToast(e.message || "Failed to update promo status", "error");
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

      {/* Table */}
      <div className="rounded-2xl border border-border bg-surface-base/80 backdrop-blur-2xl shadow-xl overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-sm font-medium text-muted-foreground animate-pulse">
            Loading promotions...
          </div>
        ) : promos.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center gap-3">
            <Tag className="w-8 h-8 opacity-40" />
            <div className="text-sm font-bold text-foreground">No promo codes created yet</div>
            <p className="text-xs text-muted-foreground">Click "Create Promo Code" to launch a campaign.</p>
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
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 font-medium">
                {promos.map((p) => (
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
                      <button
                        onClick={() => handleToggleActive(p.id, p.is_active)}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 ml-auto transition-colors",
                          p.is_active
                            ? "bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20"
                            : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                        )}
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span>{p.is_active ? "Deactivate" : "Activate"}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-surface-base border border-border rounded-3xl p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">Create New Promo Code</h3>
              <button onClick={() => setIsFormModalOpen(false)} className="p-2 text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <PromoForm
              onSuccess={() => {
                setIsFormModalOpen(false);
                fetchPromos();
              }}
              onCancel={() => setIsFormModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
