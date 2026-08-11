"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Search, X, ArrowRight } from "lucide-react";
import { ADMIN_NAV_ITEMS } from "./AdminSidebar";

export function AdminCommandPalette() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!isOpen) return null;

  const filteredNav = ADMIN_NAV_ITEMS.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (href: string) => {
    setIsOpen(false);
    setQuery("");
    router.push(href);
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-md flex items-start justify-center pt-20 px-4"
        onClick={() => setIsOpen(false)}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: -10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: -10 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-xl bg-surface-base border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Input Header */}
          <div className="p-4 border-b border-border flex items-center gap-3">
            <Search className="w-5 h-5 text-emerald-400 shrink-0" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type to search Admin Console (Cmd + K)..."
              className="w-full bg-transparent text-foreground placeholder:text-muted-foreground font-medium text-base focus:outline-none"
            />
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-surface-raised"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Results Area */}
          <div className="max-h-80 overflow-y-auto p-3 flex flex-col gap-1">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-3 py-1.5">
              Admin Navigation
            </div>

            {filteredNav.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No matching admin pages found.
              </div>
            ) : (
              filteredNav.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.href)}
                    className="w-full p-3 rounded-xl hover:bg-surface-raised flex items-center justify-between transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-bold text-foreground">
                        {item.label}
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-emerald-400 transition-colors" />
                  </button>
                );
              })
            )}
          </div>

          <div className="p-3 border-t border-border bg-surface-raised/40 text-[11px] text-muted-foreground flex items-center justify-between px-4">
            <span>Press <kbd className="px-1.5 py-0.5 rounded bg-surface-base border border-border text-foreground font-mono">ESC</kbd> to exit</span>
            <span className="text-emerald-400 font-bold">Picklers Command Palette</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
