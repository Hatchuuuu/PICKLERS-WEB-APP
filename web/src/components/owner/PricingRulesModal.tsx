"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, DollarSign, Plus } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";

interface PricingRule {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  days: string;
  multiplier: number;
  isActive: boolean;
}

interface PricingRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PricingRulesModal({ isOpen, onClose }: PricingRulesModalProps) {
  const { showToast } = useToast();
  const [rules, setRules] = useState<PricingRule[]>([
    { id: "1", name: "Peak Hour Rate (6 PM - 10 PM)", startTime: "18:00", endTime: "22:00", days: "Mon-Fri", multiplier: 1.25, isActive: true },
    { id: "2", name: "Weekend Rate", startTime: "06:00", endTime: "22:00", days: "Sat-Sun", multiplier: 1.20, isActive: true },
    { id: "3", name: "Early Bird Discount", startTime: "06:00", endTime: "09:00", days: "Mon-Fri", multiplier: 0.85, isActive: true }
  ]);

  const [ruleName, setRuleName] = useState("");
  const [multiplier, setMultiplier] = useState("1.10");

  if (!isOpen) return null;

  function handleAddRule(e: React.FormEvent) {
    e.preventDefault();
    if (!ruleName.trim()) return;

    const newRule: PricingRule = {
      id: Date.now().toString(),
      name: ruleName,
      startTime: "17:00",
      endTime: "21:00",
      days: "Daily",
      multiplier: parseFloat(multiplier) || 1.1,
      isActive: true
    };

    setRules((prev) => [...prev, newRule]);
    setRuleName("");
    showToast(`Pricing rule '${ruleName}' created!`, "success");
  }

  function toggleRule(id: string) {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r))
    );
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] dark:bg-black/50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-lg bg-surface-overlay dark:bg-[#13223F] border border-border dark:border-white/12 rounded-3xl p-6 shadow-[0_25px_60px_rgba(0,0,0,0.5)] overflow-hidden text-foreground"
        >
          <div className="flex items-center justify-between border-b border-border pb-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Dynamic Pricing Rules</h3>
                <p className="text-xs text-muted-foreground">Configure peak rates, early bird discounts & member pricing</p>
              </div>
            </div>
            <button onClick={onClose} aria-label="Close dialog" className="p-2 rounded-xl text-muted-foreground hover:text-foreground bg-surface-interactive border border-border cursor-pointer transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Add Rule Form */}
          <form onSubmit={handleAddRule} className="p-3 bg-surface-base border border-border rounded-xl mb-5 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Add Custom Pricing Rule</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
                placeholder="Rule Name (e.g. Night Lights Rate)"
                className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-surface-interactive text-foreground focus:outline-none focus:border-emerald-500"
                required
              />
              <select
                value={multiplier}
                onChange={(e) => setMultiplier(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-surface-interactive text-foreground focus:outline-none focus:border-emerald-500"
              >
                <option value="1.25" className="bg-surface-base text-foreground">+25% Peak Rate</option>
                <option value="1.15" className="bg-surface-base text-foreground">+15% Peak Rate</option>
                <option value="0.90" className="bg-surface-base text-foreground">-10% Discount</option>
                <option value="0.80" className="bg-surface-base text-foreground">-20% Discount</option>
              </select>
            </div>
            <button type="submit" className="w-full py-2 bg-emerald-500 text-white font-bold text-xs rounded-lg hover:bg-emerald-600 transition-colors flex items-center justify-center gap-1 cursor-pointer">
              <Plus className="w-3.5 h-3.5" /> Add Rule
            </button>
          </form>

          {/* Active Rules List */}
          <div className="space-y-2.5">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Active Facility Rules</div>
            {rules.map((r) => (
              <div
                key={r.id}
                className="p-3 rounded-xl border border-border bg-surface-base flex items-center justify-between gap-3"
              >
                <div>
                  <div className="font-bold text-xs flex items-center gap-2">
                    {r.name}
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      r.multiplier >= 1 ? "bg-amber-500/10 text-amber-500" : "bg-emerald-500/10 text-emerald-500"
                    }`}>
                      {r.multiplier >= 1 ? `+${Math.round((r.multiplier - 1) * 100)}%` : `-${Math.round((1 - r.multiplier) * 100)}%`}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {r.days} • {r.startTime} - {r.endTime}
                  </div>
                </div>

                <button
                  onClick={() => toggleRule(r.id)}
                  aria-label="Toggle rule"
                  className={`w-9 h-5 rounded-full px-0.5 flex items-center transition-colors cursor-pointer ${
                    r.isActive ? "bg-emerald-500 justify-end" : "bg-surface-interactive border border-border justify-start"
                  }`}
                >
                  <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                </button>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-border mt-5 flex justify-end">
            <button onClick={onClose} className="px-5 py-2.5 rounded-xl bg-emerald-500 text-white font-bold text-xs hover:bg-emerald-600 transition-colors cursor-pointer">
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
