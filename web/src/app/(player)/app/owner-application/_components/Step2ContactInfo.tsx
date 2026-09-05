"use client";

import type { UseFormRegister, FieldErrors } from "react-hook-form";
import { User, Mail, Phone, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ApplicationForm } from "./schema";

/**
 * Step 2: first / last name, business email, phone. F-203b: extracted
 * as a self-contained client component. The parent page owns the
 * react-hook-form state; this component just renders the four fields.
 */
export function Step2ContactInfo({
  register,
  errors,
}: {
  register: UseFormRegister<ApplicationForm>;
  errors: FieldErrors<ApplicationForm>;
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
        <User className="w-5 h-5 text-emerald-500" aria-hidden="true" />
        <span>Contact Information</span>
      </h2>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="firstName" className={labelCls}>First Name</label>
          <div className="relative">
            <input
              id="firstName"
              {...register("firstName")}
              type="text"
              placeholder="First Name"
              className={cn(inputBase, errors.firstName && inputError)}
            />
            <User className={iconCls} aria-hidden="true" />
          </div>
          {errors.firstName?.message && (
            <span className={errCls} role="alert">
              <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" /> {errors.firstName.message}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="lastName" className={labelCls}>Last Name</label>
          <div className="relative">
            <input
              id="lastName"
              {...register("lastName")}
              type="text"
              placeholder="Last Name"
              className={cn(inputBase, errors.lastName && inputError)}
            />
            <User className={iconCls} aria-hidden="true" />
          </div>
          {errors.lastName?.message && (
            <span className={errCls} role="alert">
              <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" /> {errors.lastName.message}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="email" className={labelCls}>Business Email</label>
        <div className="relative">
          <input
            id="email"
            {...register("email")}
            type="email"
            placeholder="owner@facility.com"
            className={cn(inputBase, errors.email && inputError)}
          />
          <Mail className={iconCls} aria-hidden="true" />
        </div>
        {errors.email?.message && (
          <span className={errCls} role="alert">
            <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" /> {errors.email.message}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="phone" className={labelCls}>Phone Number</label>
        <div className="relative">
          <input
            id="phone"
            {...register("phone")}
            type="tel"
            placeholder="+63 9XX XXX XXXX"
            className={cn(inputBase, errors.phone && inputError)}
          />
          <Phone className={iconCls} aria-hidden="true" />
        </div>
        {errors.phone?.message && (
          <span className={errCls} role="alert">
            <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" /> {errors.phone.message}
          </span>
        )}
      </div>
    </div>
  );
}
