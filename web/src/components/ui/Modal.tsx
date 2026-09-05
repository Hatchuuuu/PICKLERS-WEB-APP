"use client";

import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { FocusTrap } from "@/components/a11y/FocusTrap";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
  className?: string;
  showCloseButton?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = "md",
  className,
  showCloseButton = true,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
  };

  return (
    <div
      className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] dark:bg-black/50 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className={cn(
          "w-full rounded-3xl border border-border dark:border-white/12 bg-surface-overlay dark:bg-[#13223F] shadow-[0_25px_60px_rgba(0,0,0,0.5)] p-6 relative flex flex-col gap-4 animate-in zoom-in-95 duration-200",
          maxWidthClasses[maxWidth],
          className
        )}
      >
        <FocusTrap
          onEscape={onClose}
          role="dialog"
          ariaModal={true}
          ariaLabel={typeof title === "string" ? title : undefined}
          ariaLabelledBy={title && typeof title !== "string" ? "modal-title" : undefined}
        >
          {(title || showCloseButton) && (
            <div className="flex items-start justify-between gap-4 border-b border-border dark:border-white/10 pb-4">
              <div>
                {title && (
                  <h3 id="modal-title" className="text-base sm:text-lg font-bold text-foreground tracking-tight" style={{ fontFamily: "var(--font-outfit), var(--font-montserrat), sans-serif" }}>
                    {title}
                  </h3>
                )}
                {description && (
                  <p id="modal-description" className="text-xs text-muted-foreground mt-0.5 font-medium">
                    {description}
                  </p>
                )}
              </div>

              {showCloseButton && (
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close dialog"
                  className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground bg-surface-interactive hover:bg-surface-interactive/80 dark:bg-white/10 dark:hover:bg-white/20 border border-border dark:border-white/10 transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4 stroke-[2.5]" />
                </button>
              )}
            </div>
          )}

          {children}
        </FocusTrap>
      </div>
    </div>
  );
}
