"use client";

/**
 * FocusTrap
 * ─────────────────────────────────────────────────────────────────────────────
 * Constrains keyboard focus within a container while active (WCAG 2.1 AA §2.1).
 * Wrap any modal, drawer, or popover that must trap focus.
 *
 * Usage:
 *   <FocusTrap active={isOpen} onEscape={() => setIsOpen(false)}>
 *     <dialog ...> … </dialog>
 *   </FocusTrap>
 *
 * Behaviour:
 * - On mount (active=true): moves focus to the first focusable descendant.
 * - Tab / Shift+Tab: wraps within the container.
 * - Escape: calls onEscape (caller is responsible for closing the modal).
 * - On unmount or active=false: restores focus to the element that was focused
 *   before the trap was activated (e.g. the trigger button).
 */

import { useEffect, useRef, type ReactNode } from "react";

const FOCUSABLE_SELECTORS = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

interface FocusTrapProps {
  /** Whether the trap is active. When false, no focus management occurs. */
  active: boolean;
  /** Called when the user presses Escape inside the trap. */
  onEscape?: () => void;
  children: ReactNode;
}

export function FocusTrap({ active, onEscape, children }: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;

    // Store the currently focused element so we can restore it on close
    previouslyFocused.current = document.activeElement as HTMLElement;

    // Move focus to the first focusable element in the trap
    const focusables = containerRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS);
    const first = focusables?.[0];
    first?.focus();

    // Tab / Shift+Tab handler
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current) return;

      const focusableEls = Array.from(
        containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
      ).filter((el) => !el.closest("[aria-hidden='true']"));

      if (focusableEls.length === 0) return;

      const firstEl = focusableEls[0];
      const lastEl = focusableEls[focusableEls.length - 1];

      if (e.key === "Escape") {
        e.preventDefault();
        onEscape?.();
        return;
      }

      if (e.key === "Tab") {
        if (focusableEls.length === 1) {
          e.preventDefault();
          return;
        }
        if (e.shiftKey) {
          if (document.activeElement === firstEl) {
            e.preventDefault();
            lastEl.focus();
          }
        } else {
          if (document.activeElement === lastEl) {
            e.preventDefault();
            firstEl.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      // Restore focus to trigger element
      previouslyFocused.current?.focus();
    };
  }, [active, onEscape]);

  return (
    <div ref={containerRef} style={{ display: "contents" }}>
      {children}
    </div>
  );
}
