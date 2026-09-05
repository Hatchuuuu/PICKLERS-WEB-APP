"use client";

import { Check } from "lucide-react";

/**
 * SubmittedView — success state shown after the application is sent.
 * F-203c: extracted from page.tsx.
 */
export function SubmittedView({
  email,
  onReturn,
}: {
  email: string;
  onReturn: () => void;
}) {
  return (
    <div className="p-6 max-w-xl mx-auto py-20 text-center">
      <div className="w-16 h-16 rounded-xl bg-emerald-500/10 border border-emerald-500/20 shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-2xl flex items-center justify-center mx-auto mb-6">
        <Check className="w-8 h-8 text-emerald-500 dark:text-emerald-400" aria-hidden="true" />
      </div>
      <h1 className="text-2xl font-bold mb-3 text-foreground">Application Submitted</h1>
      <p className="text-muted-foreground mb-8 leading-relaxed">
        Thank you for applying to be a Picklers partner! We have sent a confirmation email to{" "}
        <span className="text-foreground font-semibold">{email}</span>. Our team will review your application within 24-48 hours.
      </p>
      <button
        onClick={onReturn}
        className="px-6 py-3.5 rounded-xl font-bold active:scale-[0.98] transition-all bg-accent-primary text-surface-base shadow-[0_4px_14px_rgba(0,217,139,0.25)]"
      >
        Return to Dashboard
      </button>
    </div>
  );
}
