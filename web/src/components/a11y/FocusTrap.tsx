"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * FocusTrap — wraps a modal and traps Tab focus inside it.
 *
 * P1.4: modals in the Picklers app let Tab escape into the page behind
 * the overlay, which screen readers don't announce and which lets a
 * keyboard user accidentally submit a background form. This component:
 *   1. Stores the previously-focused element on mount.
 *   2. On Tab/Shift+Tab, wraps focus to the first/last focusable child.
 *   3. Restores focus to the previously-focused element on unmount.
 *   4. Closes on Escape (caller passes onClose).
 *
 * It does NOT move focus on mount — that's a separate decision the
 * caller makes (e.g. focus the first input vs. focus the close button).
 * Use the `initialFocus` ref to point at the element that should be
 * focused on mount.
 */
export function FocusTrap({
  children,
  onEscape,
  initialFocus,
  className,
  role = "dialog",
  ariaLabel,
  ariaLabelledBy,
  ariaModal = true,
}: {
  children: ReactNode;
  onEscape?: () => void;
  initialFocus?: React.RefObject<HTMLElement>;
  className?: string;
  role?: string;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  ariaModal?: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  // Save the previously-focused element on mount, restore on unmount.
  useEffect(() => {
    if (typeof document === "undefined") return;
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    const root = rootRef.current;
    if (!root) return;

    // Focus the requested element, or the first focusable descendant.
    if (initialFocus?.current) {
      initialFocus.current.focus();
    } else {
      const first = root.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      first?.focus();
    }

    return () => {
      // Restore focus on unmount.
      previouslyFocusedRef.current?.focus?.();
    };
  }, [initialFocus]);

  // Keyboard handlers: Tab trap + Escape close.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onEscape) {
        e.stopPropagation();
        onEscape();
        return;
      }
      if (e.key !== "Tab") return;

      const focusables = Array.from(
        root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      ).filter((el) => !el.hasAttribute("disabled"));
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey) {
        if (active === first || !root.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last || !root.contains(active)) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handler, true);
    return () => document.removeEventListener("keydown", handler, true);
  }, [onEscape]);

  return (
    <div
      ref={rootRef}
      role={role}
      aria-modal={ariaModal}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      className={className}
    >
      {children}
    </div>
  );
}

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "area[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "iframe",
  "object",
  "embed",
  "[contenteditable='true']",
  "[tabindex]:not([tabindex='-1'])",
].join(",");
