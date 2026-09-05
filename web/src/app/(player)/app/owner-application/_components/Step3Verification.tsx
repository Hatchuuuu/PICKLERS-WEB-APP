"use client";

import type { RefObject } from "react";
import { FileText, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Step 3: permit + ID upload dropzones. F-203b: extracted as a
 * self-contained client component. The parent page owns the file refs
 * and the currently-attached file names; this component just renders
 * the two dropzones.
 */
export function Step3Verification({
  permitInputRef,
  idInputRef,
  permitFileName,
  idFileName,
}: {
  permitInputRef: RefObject<HTMLInputElement | null>;
  idInputRef: RefObject<HTMLInputElement | null>;
  permitFileName: string | null;
  idFileName: string | null;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-black text-foreground tracking-tight flex items-center gap-2 mb-1">
          <FileText className="w-5 h-5 text-emerald-500" aria-hidden="true" />
          <span>Verification Documents</span>
        </h2>
        <p className="text-xs font-medium text-ink-secondary">
          To ensure trust on Picklers, please provide basic verification of facility ownership or operation.
        </p>
      </div>

      <DocumentDropzone
        label="Business Permit / DTI Registration"
        fileName={permitFileName}
        attachedLabel="Click to upload Business Permit"
        onClick={() => permitInputRef.current?.click()}
      />

      <DocumentDropzone
        label="Proof of Identity (Valid Government ID)"
        fileName={idFileName}
        attachedLabel="Click to upload Valid ID"
        onClick={() => idInputRef.current?.click()}
      />
    </div>
  );
}

function DocumentDropzone({
  label,
  fileName,
  attachedLabel,
  onClick,
}: {
  label: string;
  fileName: string | null;
  attachedLabel: string;
  onClick: () => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-bold uppercase tracking-wider text-ink-secondary">
        {label}
      </label>
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick();
          }
        }}
        className={cn(
          "border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2.5",
          fileName
            ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
            : "bg-surface-interactive border-border hover:border-emerald-500/40 hover:bg-surface-raised"
        )}
      >
        {fileName ? (
          <>
            <FileText className="w-9 h-9 text-emerald-400" aria-hidden="true" />
            <div className="text-sm font-extrabold text-emerald-400">{fileName}</div>
            <div className="text-xs text-emerald-500/90 font-bold bg-emerald-500/10 px-3 py-1 rounded-full">
              Click to change attached file
            </div>
          </>
        ) : (
          <>
            <Upload className="w-8 h-8 text-emerald-500" aria-hidden="true" />
            <div className="text-sm font-bold text-foreground">{attachedLabel}</div>
            <div className="text-xs font-semibold text-muted-foreground">
              Supports PDF, JPG, PNG, WEBP up to 10MB
            </div>
          </>
        )}
      </div>
    </div>
  );
}
