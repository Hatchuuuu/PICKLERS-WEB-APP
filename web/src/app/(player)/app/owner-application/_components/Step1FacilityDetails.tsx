"use client";

import type { UseFormRegister, FieldErrors } from "react-hook-form";
import { Building2, MapPin, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ApplicationForm } from "./schema";

/**
 * Step 1: facility name, complete address (with geolocation auto-detect
 * button), court count. F-203b: extracted as a self-contained client
 * component. The parent page owns the react-hook-form state and
 * the geolocation handler; this component just renders the three
 * fields.
 */
export function Step1FacilityDetails({
  register,
  errors,
  onDetectLocation,
  isLocating,
}: {
  register: UseFormRegister<ApplicationForm>;
  errors: FieldErrors<ApplicationForm>;
  onDetectLocation: () => void;
  isLocating: boolean;
}) {
  const inputBase =
    "w-full pl-10 pr-4 py-3.5 rounded-xl text-sm outline-none transition-all font-bold text-foreground bg-surface-interactive border border-border placeholder:text-muted-foreground/70 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20";
  const inputError = "border-red-500 focus:border-red-500";
  const labelCls =
    "text-xs font-bold uppercase tracking-wider text-ink-secondary";
  const errCls = "text-[12px] text-red-400 flex items-center gap-1";
  const iconCls = "w-4 h-4 text-emerald-500 absolute left-3.5 top-1/2 -translate-y-1/2";

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-black text-foreground tracking-tight flex items-center gap-2">
        <Building2 className="w-5 h-5 text-emerald-500" aria-hidden="true" />
        <span>Facility & Court Details</span>
      </h2>

      <div className="flex flex-col gap-2">
        <label htmlFor="facilityName" className={labelCls}>Facility Name</label>
        <div className="relative">
          <input
            id="facilityName"
            {...register("facilityName")}
            type="text"
            placeholder="e.g. BGC Pickleball Hub"
            className={cn(inputBase, errors.facilityName && inputError)}
          />
          <Building2 className={iconCls} aria-hidden="true" />
        </div>
        {errors.facilityName?.message && (
          <span className={errCls} role="alert">
            <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" /> {errors.facilityName.message}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label htmlFor="address" className={labelCls}>Complete Address</label>
          <button
            type="button"
            onClick={onDetectLocation}
            disabled={isLocating}
            className="inline-flex items-center gap-1.5 text-[12px] font-bold text-emerald-500 hover:text-emerald-400 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isLocating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
            )}
            <span>{isLocating ? "Detecting..." : "Auto-detect location"}</span>
          </button>
        </div>
        <div className="relative">
          <input
            id="address"
            {...register("address")}
            type="text"
            placeholder="Unit, Building, Street, City"
            className={cn(inputBase, errors.address && inputError)}
          />
          <button
            type="button"
            onClick={onDetectLocation}
            disabled={isLocating}
            title="Auto-detect location"
            aria-label="Auto-detect location"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 hover:text-emerald-400 p-1 cursor-pointer"
          >
            {isLocating ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : (
              <MapPin className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
        </div>
        {errors.address?.message && (
          <span className={errCls} role="alert">
            <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" /> {errors.address.message}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="courtsCount" className={labelCls}>Total Number of Courts</label>
        <input
          id="courtsCount"
          {...register("courtsCount")}
          type="number"
          min="1"
          placeholder="e.g. 4"
          className={cn(
            "w-full px-4 py-3.5 rounded-xl text-sm outline-none transition-all font-bold text-foreground bg-surface-interactive border border-border focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20",
            errors.courtsCount && inputError
          )}
        />
        {errors.courtsCount?.message && (
          <span className={errCls} role="alert">
            <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" /> {errors.courtsCount.message}
          </span>
        )}
      </div>
    </div>
  );
}
