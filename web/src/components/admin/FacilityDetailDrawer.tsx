"use client";

import { motion, AnimatePresence } from "motion/react";
import { X, Building2, MapPin, DollarSign, Clock, Star, User, ShieldCheck } from "lucide-react";

export interface FacilityDetail {
  id: number | string;
  name: string;
  location: string;
  type: string;
  price: number;
  rating: number;
  hours: string;
  image?: string;
  owner?: {
    id: string;
    name: string;
    avatar_url?: string;
    email?: string;
  };
}

interface FacilityDetailDrawerProps {
  facility: FacilityDetail | null;
  onClose: () => void;
}

export function FacilityDetailDrawer({ facility, onClose }: FacilityDetailDrawerProps) {
  if (!facility) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] dark:bg-black/50 z-[600]"
      />

      <motion.aside
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-surface-overlay dark:bg-[#13223F] border-l border-border dark:border-white/12 z-[610] shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="p-5 border-b border-border flex items-center justify-between bg-surface-interactive/30">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-foreground truncate">
                {facility.name}
              </h2>
              <p className="text-xs text-muted-foreground font-mono">
                FACILITY #{facility.id} • {facility.type.toUpperCase()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close drawer"
            className="w-8 h-8 rounded-full bg-surface-interactive hover:bg-surface-interactive/80 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Main Info Card */}
          <div className="rounded-2xl border border-border bg-surface-raised/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Venue Status
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="w-3.5 h-3.5" /> Active & Operational
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-surface border border-border/60">
                <div className="text-[11px] text-muted-foreground flex items-center gap-1 mb-1">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Hourly Rate
                </div>
                <div className="text-lg font-black font-mono text-emerald-400">
                  ₱{facility.price}/hr
                </div>
              </div>

              <div className="p-3 rounded-xl bg-surface border border-border/60">
                <div className="text-[11px] text-muted-foreground flex items-center gap-1 mb-1">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> Rating
                </div>
                <div className="text-lg font-black font-mono text-amber-400">
                  {facility.rating || "4.5"} / 5.0
                </div>
              </div>
            </div>
          </div>

          {/* Location & Schedule */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Location & Schedule
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-surface border border-border">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-foreground">Address</div>
                  <div className="text-muted-foreground">{facility.location}</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-surface border border-border">
                <Clock className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-foreground">Operating Hours</div>
                  <div className="text-muted-foreground">{facility.hours || "6:00 AM - 10:00 PM"}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Owner Information */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Facility Owner
            </h3>
            <div className="p-3.5 rounded-xl bg-surface border border-border flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
                {facility.owner?.name ? facility.owner.name.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-sm text-foreground truncate">
                  {facility.owner?.name || "Verified Owner"}
                </div>
                <div className="text-xs text-muted-foreground">
                  Registered Partner
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-surface-raised/40 flex items-center justify-end gap-2.5 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border hover:bg-surface-raised text-xs font-bold text-foreground transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}
