"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  Activity,
  Terminal,
  AlertTriangle,
  Code2,
  Webhook,
  Flag,
  Globe,
  Database,
  ShieldAlert,
  Cpu,
  ArrowRight,
  X,
} from "lucide-react";

interface CommandItem {
  id: string;
  title: string;
  category: string;
  href: string;
  icon: React.ElementType;
}

const COMMANDS: CommandItem[] = [
  { id: "dashboard", title: "Open Control Center Dashboard", category: "Navigation", href: "/app/dev", icon: Cpu },
  { id: "health", title: "View System Health & Services", category: "Observability", href: "/app/dev/health", icon: Activity },
  { id: "logs", title: "Explore Application Logs", category: "Observability", href: "/app/dev/logs", icon: Terminal },
  { id: "errors", title: "Inspect Grouped System Errors", category: "Observability", href: "/app/dev/errors", icon: AlertTriangle },
  { id: "api-explorer", title: "Launch Interactive API Explorer", category: "APIs", href: "/app/dev/api-explorer", icon: Code2 },
  { id: "webhooks", title: "Inspect Webhook Deliveries & Retries", category: "Integrations", href: "/app/dev/webhooks", icon: Webhook },
  { id: "flags", title: "Manage Runtime Feature Flags", category: "Configuration", href: "/app/dev/flags", icon: Flag },
  { id: "environments", title: "Inspect Environment Configuration", category: "Configuration", href: "/app/dev/environments", icon: Globe },
  { id: "entity-inspector", title: "Open Read-Only Entity Inspector", category: "Diagnostics", href: "/app/dev/entity-inspector", icon: Database },
  { id: "user-diagnostics", title: "Run User Account Diagnostics", category: "Diagnostics", href: "/app/dev/user-diagnostics", icon: Search },
  { id: "audit", title: "Review Technical Audit Log", category: "Audit & Security", href: "/app/dev/audit", icon: ShieldAlert },
];

export function DevCommandPalette({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredCommands = COMMANDS.filter(
    (cmd) =>
      cmd.title.toLowerCase().includes(query.toLowerCase()) ||
      cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isOpen) return;

      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filteredCommands.length || 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev === 0 ? Math.max(0, filteredCommands.length - 1) : prev - 1
        );
      } else if (e.key === "Enter" && filteredCommands[selectedIndex]) {
        e.preventDefault();
        router.push(filteredCommands[selectedIndex].href);
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, router, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[600] flex items-start justify-center pt-[max(1.5rem,env(safe-area-inset-top,1.5rem))] sm:pt-20 px-3 sm:px-4 bg-black/40 backdrop-blur-[2px] dark:bg-black/50" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-xl bg-surface-overlay dark:bg-[#13223F] border border-border dark:border-white/12 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.5)] overflow-hidden z-[610]"
        >
          {/* Search Header */}
          <div className="flex items-center px-4 border-b border-border bg-surface-interactive/30">
            <Search className="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search developer tools, diagnostic commands, logs..."
              className="w-full py-4 px-3 bg-transparent text-foreground placeholder:text-muted-foreground text-sm focus:outline-none font-mono"
            />
            <button
              onClick={onClose}
              aria-label="Close command palette"
              className="p-1.5 rounded-lg hover:bg-surface-interactive text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Command List */}
          <div className="max-h-80 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {filteredCommands.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500 font-mono">
                No matching developer commands found.
              </div>
            ) : (
              filteredCommands.map((cmd, idx) => {
                const Icon = cmd.icon;
                const isSelected = idx === selectedIndex;

                return (
                  <button
                    key={cmd.id}
                    onClick={() => {
                      router.push(cmd.href);
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all ${
                      isSelected
                        ? "bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 shadow-sm"
                        : "text-slate-300 hover:bg-slate-800/50 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          isSelected
                            ? "bg-cyan-500/20 text-cyan-400"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold">{cmd.title}</div>
                        <div className="text-[10px] font-mono text-slate-500">
                          {cmd.category}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-slate-500">
                        {cmd.href}
                      </span>
                      <ArrowRight
                        className={`w-3.5 h-3.5 ${
                          isSelected ? "text-cyan-400" : "text-slate-600"
                        }`}
                      />
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer Shortcuts */}
          <div className="px-4 py-2.5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-[11px] font-mono text-slate-500">
            <div className="flex items-center gap-3">
              <span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                  ↑↓
                </kbd>{" "}
                Navigate
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                  ↵
                </kbd>{" "}
                Select
              </span>
            </div>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                ESC
              </kbd>{" "}
              Close
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
