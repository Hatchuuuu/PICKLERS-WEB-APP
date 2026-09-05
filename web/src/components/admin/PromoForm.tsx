"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Check } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import type { Promotion } from "@/types/admin";

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
  initialData?: Promotion | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function PromoForm({ initialData, onSuccess, onCancel }: PromoFormProps) {
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = Boolean(initialData);

  const formattedInitialExpiry = initialData?.expires_at
    ? new Date(initialData.expires_at).toISOString().split("T")[0]
    : "";

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PromoFormData>({
    defaultValues: {
      code: initialData?.code || "",
      description: initialData?.description || "",
      discount_type: initialData?.discount_type || "percentage",
      discount_value: initialData?.discount_value || 15,
      min_booking_amount: initialData?.min_booking_amount || 0,
      max_uses: initialData?.max_uses || undefined,
      applicable_to: initialData?.applicable_to || "all",
      expires_at: formattedInitialExpiry,
    },
  });

  const discountType = watch("discount_type");

  const onSubmit = async (data: PromoFormData) => {
    setIsSubmitting(true);
    try {
      const url = isEditMode && initialData
        ? `/api/admin/promotions/${initialData.id}`
        : "/api/admin/promotions";
      
      const method = isEditMode ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          code: data.code.trim().toUpperCase(),
        }),
      });

      if (res.ok) {
        showToast(
          isEditMode
            ? `Promo code "${data.code.toUpperCase()}" updated!`
            : `Promo code "${data.code.toUpperCase()}" created successfully!`,
          "success"
        );
        onSuccess();
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to save promo code", "error");
      }
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Submission failed", "error");
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
            {...register("discount_value", {
              required: "Discount value is required",
              min: { value: 1, message: "Must be at least 1" },
              validate: (val) =>
                discountType !== "percentage" || val <= 100 || "Percentage cannot exceed 100%",
            })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface-raised text-sm font-bold text-foreground focus:outline-none"
          />
          {errors.discount_value && (
            <span className="text-xs text-rose-400 font-semibold">
              {errors.discount_value.message}
            </span>
          )}
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
          {isSubmitting ? (
            <span>{isEditMode ? "Saving…" : "Creating…"}</span>
          ) : (
            <>
              <Check className="w-4 h-4" />
              <span>{isEditMode ? "Save Changes" : "Create Code"}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
