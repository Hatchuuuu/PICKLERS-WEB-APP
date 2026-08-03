"use client";

import React from "react";
import { motion, type Variants } from "motion/react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 400, damping: 30 } }
};

export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
};

export const SettingsGroup = ({ title, children, className }: { title?: string, children: React.ReactNode, className?: string }) => (
  <motion.div variants={itemVariants} className={cn("mb-6", className)}>
    {title && (
      <h3 className="text-[11.5px] font-black text-foreground/50 dark:text-white/50 uppercase tracking-[0.15em] mb-2 px-3" style={{ fontFamily: "var(--font-outfit), var(--font-montserrat), sans-serif" }}>
        {title}
      </h3>
    )}
    <div className="flex flex-col rounded-[26px] overflow-hidden bg-surface-interactive/30 dark:bg-white/[0.03] backdrop-blur-xl border border-border/50 dark:border-white/[0.1] shadow-md p-1.5 gap-0.5">
      {children}
    </div>
  </motion.div>
);

export const SettingsRow = ({ 
  icon: Icon, 
  iconBg, 
  iconColor, 
  label, 
  value, 
  subtitle,
  onClick, 
  hasBorder = true, 
  rightContent 
}: {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  label: string;
  value?: string | React.ReactNode;
  subtitle?: string;
  onClick?: () => void;
  hasBorder?: boolean;
  rightContent?: React.ReactNode;
}) => {
  return (
    <div 
      onClick={onClick} 
      {...(onClick ? { role: "button", tabIndex: 0 } : {})}
      className={cn(
        "w-full flex items-center justify-between py-3 px-2.5 bg-transparent transition-all text-left gap-3 min-w-0",
        onClick ? "hover:bg-surface-interactive/60 dark:hover:bg-white/[0.06] active:scale-[0.99] cursor-pointer rounded-2xl" : "cursor-default",
        hasBorder && "border-b border-border/40 dark:border-white/[0.06]"
      )}
    >
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        <div className={cn("w-10 h-10 rounded-[14px] flex items-center justify-center shrink-0 shadow-inner", iconBg, iconColor)}>
          <Icon className="w-5 h-5 stroke-[2.25]" />
        </div>
        <div className="flex flex-col min-w-0 flex-1 text-left justify-center">
          <span className="text-[15px] font-extrabold text-foreground leading-snug truncate" style={{ fontFamily: "var(--font-outfit), var(--font-montserrat), sans-serif" }}>
            {label}
          </span>
          {subtitle && (
            <span className="text-[11.5px] font-medium text-muted-foreground truncate leading-snug mt-0.5">
              {subtitle}
            </span>
          )}
        </div>
      </div>
      {rightContent ? (
        <div className="shrink-0 flex items-center">{rightContent}</div>
      ) : (
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {value && <span className="text-[13px] font-bold text-muted-foreground truncate max-w-[120px] text-right">{value}</span>}
          {onClick && <ChevronRight className="w-4.5 h-4.5 text-foreground/30 shrink-0" />}
        </div>
      )}
    </div>
  );
};
