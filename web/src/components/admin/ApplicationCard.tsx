"use client";

import { motion } from "motion/react";
import { Building2, Calendar, MapPin, Check } from "lucide-react";
import type { OwnerApplication } from "@/types/admin";
import { cn } from "@/lib/utils";

interface ApplicationCardProps {
  application: OwnerApplication;
  onClick: () => void;
  isSelected?: boolean;
  onToggleSelect?: (id: string, e: React.MouseEvent) => void;
}

export function ApplicationCard({ application, onClick, isSelected, onToggleSelect }: ApplicationCardProps) {
  const statusStyles = {
    pending: "bg-amber-500/10 border-amber-500/30 text-amber-400",
    in_review: "bg-blue-500/10 border-blue-500/30 text-blue-400",
    approved: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
    rejected: "bg-rose-500/10 border-rose-500/30 text-rose-400",
    more_info_requested: "bg-violet-500/10 border-violet-500/30 text-violet-400",
  };

  const statusLabels = {
    pending: "Pending Review",
    in_review: "In Review",
    approved: "Approved",
    rejected: "Rejected",
    more_info_requested: "Needs Info",
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      onClick={onClick}
      className={cn(
        "p-5 rounded-2xl border bg-surface-base/80 backdrop-blur-2xl shadow-lg cursor-pointer flex flex-col justify-between transition-all group relative",
        isSelected
          ? "border-emerald-500/80 ring-2 ring-emerald-500/30 bg-emerald-500/[0.03]"
          : "border-border hover:border-emerald-500/40"
      )}
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            {onToggleSelect && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSelect(application.id, e);
                }}
                className={cn(
                  "w-5 h-5 rounded-lg border flex items-center justify-center transition-colors shrink-0",
                  isSelected
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : "border-border hover:border-emerald-500/60 bg-surface-raised"
                )}
                aria-label="Select application"
              >
                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </button>
            )}

            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-lg shrink-0">
              {application.facility_name[0]?.toUpperCase() || "F"}
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-foreground tracking-tight group-hover:text-emerald-400 transition-colors truncate">
                {application.facility_name}
              </h3>
              <p className="text-xs text-muted-foreground font-medium truncate">
                {application.business_name}
              </p>
            </div>
          </div>

          <span
            className={cn(
              "px-3 py-1 rounded-full text-xs font-bold border uppercase shrink-0",
              statusStyles[application.status] || statusStyles.pending
            )}
          >
            {statusLabels[application.status] || application.status}
          </span>
        </div>

        <div className="flex flex-col gap-2 py-3 border-y border-border/60 text-xs font-medium text-muted-foreground my-2">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">{application.facility_address}</span>
          </div>
          <div className="flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>
              {application.court_count} court(s) • {application.indoor_outdoor || "Indoor"} • {application.surface_type || "Standard"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 text-[11px] text-muted-foreground font-medium">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
          <span>
            {new Date(application.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
        <span className="text-emerald-400 font-semibold group-hover:translate-x-1 transition-transform">
          Inspect Application →
        </span>
      </div>
    </motion.div>
  );
}
