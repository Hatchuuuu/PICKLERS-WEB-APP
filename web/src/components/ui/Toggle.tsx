"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
  id?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Toggle({
  checked,
  onChange,
  disabled = false,
  label,
  description,
  id,
  className,
  size = "md",
}: ToggleProps) {
  const toggleId = id || (label ? `toggle-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (!disabled) {
        onChange(!checked);
      }
    }
  };

  const trackSizes = {
    sm: "w-8 h-4",
    md: "w-11 h-6",
    lg: "w-14 h-7",
  };

  const thumbSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const thumbTranslate = {
    sm: checked ? "translate-x-4" : "translate-x-0.5",
    md: checked ? "translate-x-6" : "translate-x-1",
    lg: checked ? "translate-x-8" : "translate-x-1",
  };

  return (
    <div className={cn("flex items-center justify-between gap-4 select-none", className)}>
      {(label || description) && (
        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
          {label && (
            <label
              htmlFor={toggleId}
              className={cn(
                "text-xs sm:text-sm font-bold text-foreground cursor-pointer tracking-tight",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {label}
            </label>
          )}
          {description && (
            <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
              {description}
            </p>
          )}
        </div>
      )}

      <button
        id={toggleId}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label || "Toggle"}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        onKeyDown={handleKeyDown}
        className={cn(
          "relative inline-flex shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          trackSizes[size],
          checked ? "bg-emerald-500 shadow-sm shadow-emerald-500/30" : "bg-surface-raised border border-border",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block rounded-full bg-white shadow-md transform ring-0 transition duration-200 ease-in-out self-center",
            thumbSizes[size],
            thumbTranslate[size]
          )}
        />
      </button>
    </div>
  );
}
