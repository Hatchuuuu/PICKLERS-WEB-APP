import React from "react";
import { motion } from "motion/react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const itemVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 400, damping: 30 } }
};

export const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
};

export const SettingsGroup = ({ title, children, className }: { title: string, children: React.ReactNode, className?: string }) => (
  <motion.div variants={itemVariants} className={cn("mb-10", className)}>
    <h3 className="text-[12.5px] font-black text-foreground/40 uppercase tracking-[0.15em] mb-3 px-4">{title}</h3>
    <div className="flex flex-col bg-surface-base dark:bg-white/[0.03] rounded-[24px] overflow-hidden border border-border shadow-sm">
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
  onClick, 
  hasBorder = true, 
  rightContent 
}: {
  icon: any;
  iconBg: string;
  iconColor: string;
  label: string;
  value?: string | React.ReactNode;
  onClick?: () => void;
  hasBorder?: boolean;
  rightContent?: React.ReactNode;
}) => (
  <button 
    onClick={onClick} 
    disabled={!onClick}
    className={cn(
      "w-full flex items-center justify-between p-4 bg-transparent transition-colors",
      onClick ? "hover:bg-surface-interactive/50 active:bg-surface-interactive cursor-pointer" : "cursor-default",
      hasBorder && "border-b border-border"
    )}
  >
    <div className="flex items-center gap-4">
      <div className={cn("w-10 h-10 rounded-[14px] flex items-center justify-center shadow-inner", iconBg, iconColor)}>
        <Icon className="w-5 h-5 stroke-[2.5]" />
      </div>
      <div className="flex flex-col items-start text-left">
        <span className="text-[16px] font-bold text-foreground">{label}</span>
      </div>
    </div>
    {rightContent ? rightContent : (
      <div className="flex items-center gap-2">
        <span className="text-[15px] font-semibold text-foreground/50 truncate max-w-[140px]">{value}</span>
        {onClick && <ChevronRight className="w-5 h-5 text-foreground/20" />}
      </div>
    )}
  </button>
);
