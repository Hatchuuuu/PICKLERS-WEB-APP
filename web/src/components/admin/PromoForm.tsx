"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Check } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";

interface PromoFormData {
  code: string;
  description: string;
  discount_type: "percentage" | "fixed_amount";
  discount_value: number;
  min_booking_amount: number;
  max_uses?: number;
  applicable_to: "all" | "new_users" | "returning_users";
  expires_at?: string;
}

interface PromoFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function PromoForm({ onSuccess, onCancel }: PromoFormProps) {
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<PromoFormData>({
    defaultValues: {
      code: "",
      description: "",
      discount_type: "percentage",
      discount_value: 15,
      min_booking_amount: 0,
      applicable_to: "all",
    },
  });

  const onSubmit = async (data: PromoFormData) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          code: data.code.trim().toUpperCase(),
        }),
      });

      if (res.ok) {
        showToast(`Promo code "${data.code.toUpperCase()}" created successfully!`, "success");
        onSuccess();
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to create promo code", "error");
      }
    } catch (e: any) {
      showToast(e.message || "Submission failed", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {/* Code Input */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold uppercase text-muted-foreground">
          Promo Code
        </label>
        <input
          type="text"
          {...register("code", { required: "Promo code is required" })}
          placeholder="e.g. PICKLE20"
          className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface-raised font-mono font-bold text-base text-foreground uppercase tracking-widest focus:outline-none focus:border-emerald-500/50"
        />
        {errors.code && (
          <span className="text-xs text-rose-400 font-semibold">{errors.code.message}</span>
        )}
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold uppercase text-muted-foreground">
          Description
        </label>
        <input
          type="text"
          {...register("description")}
          placeholder="e.g. 20% discount on first court booking"
          className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface-raised text-sm text-foreground focus:outline-none"
        />
      </div>

      {/* Discount Type & Value */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold uppercase text-muted-foreground">
            Discount Type
          </label>
          <select
            {...register("discount_type")}
            className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface-raised text-sm font-semibold text-foreground focus:outline-none"
          >
            <option value="percentage">Percentage (%)</option>
            <option value="fixed_amount">Fixed Amount (₱)</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold uppercase text-muted-foreground">
            Discount Value
          </label>
          <input
            type="number"
            step="0.01"
            {...register("discount_value", { required: true, min: 1 })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface-raised text-sm font-bold text-foreground focus:outline-none"
          />
        </div>
      </div>

      {/* Min Booking & Max Uses */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold uppercase text-muted-foreground">
            Min Booking Amount (₱)
          </label>
          <input
            type="number"
            {...register("min_booking_amount")}
            placeholder="0"
            className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface-raised text-sm font-semibold text-foreground focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold uppercase text-muted-foreground">
            Max Uses (Optional)
          </label>
          <input
            type="number"
            {...register("max_uses")}
            placeholder="Unlimited"
            className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface-raised text-sm font-semibold text-foreground focus:outline-none"
          />
        </div>
      </div>

      {/* Expiry */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold uppercase text-muted-foreground">
          Expiration Date (Optional)
        </label>
        <input
          type="date"
          {...register("expires_at")}
          className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface-raised text-sm text-foreground focus:outline-none"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl text-sm font-semibold bg-surface-raised hover:bg-surface-interactive"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 py-3 rounded-xl text-sm font-bold bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
        >
          {isSubmitting ? <span>Creating...</span> : <><Check className="w-4 h-4" /><span>Create Code</span></>}
        </button>
      </div>
    </form>
  );
}
