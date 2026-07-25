"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  subtitle,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 text-center px-6 ${className}`}>
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-sm"
        style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}
      >
        <Icon className="w-7 h-7" style={{ color: "var(--ink-muted)" }} />
      </div>
      <p className="text-sm font-semibold text-foreground mb-1">{title}</p>
      <p className="text-xs max-w-xs leading-relaxed mb-4" style={{ color: "var(--ink-muted)" }}>
        {subtitle}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}
