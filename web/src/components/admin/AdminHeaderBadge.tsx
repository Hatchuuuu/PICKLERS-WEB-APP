"use client";

import { motion } from "motion/react";
import { ShieldCheck, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useUserStore } from "@/store/useUserStore";

interface AdminHeaderBadgeProps {
  variant?: "compact" | "sidebar";
}

export function AdminHeaderBadge({ variant = "compact" }: AdminHeaderBadgeProps) {
  const { user } = useAuth();
  const { isAdmin: storeIsAdmin, adminMode, toggleAdminMode } = useUserStore();
  const router = useRouter();

  const isAdmin = Boolean(storeIsAdmin || user?.isAdmin || user?.role === 'admin' || user?.role === 'dev');

  if (!isAdmin) return null;

  const handleSwitch = () => {
    toggleAdminMode();
    router.push(adminMode ? "/app" : "/app/admin");
  };

  if (variant === "sidebar") {
    return (
      <motion.button
        onClick={handleSwitch}
        whileTap={{ scale: 0.97 }}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13px] font-bold border transition-all duration-300 shadow-sm ${
          adminMode
            ? "bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20"
            : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
        }`}
      >
        <div className="flex items-center gap-2.5">
          {adminMode ? (
            <User className="w-4 h-4 text-amber-400 shrink-0" />
          ) : (
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{adminMode ? "Player View Mode" : "Admin Console"}</span>
        </div>
        <span
          className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-black ${
            adminMode ? "bg-amber-500/20 text-amber-300" : "bg-emerald-500/20 text-emerald-300"
          }`}
        >
          {user?.role === "dev" ? "DEV" : "ADMIN"}
        </span>
      </motion.button>
    );
  }

  return (
    <motion.button
      onClick={handleSwitch}
      whileTap={{ scale: 0.95 }}
      title={adminMode ? "Switch to Player View" : "Switch to Admin Console"}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border backdrop-blur-2xl transition-all duration-300 shadow-md ${
        adminMode
          ? "bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20"
          : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
      }`}
    >
      {adminMode ? (
        <>
          <User className="w-3.5 h-3.5 shrink-0 text-amber-400" />
          <span className="hidden sm:inline">Player View</span>
        </>
      ) : (
        <>
          <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
          <span className="hidden sm:inline">Admin Console</span>
        </>
      )}
    </motion.button>
  );
}
