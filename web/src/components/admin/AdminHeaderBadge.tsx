"use client";

import { motion } from "motion/react";
import { ShieldCheck, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/useUserStore";

export function AdminHeaderBadge() {
  const { isAdmin, adminMode, toggleAdminMode } = useUserStore();
  const router = useRouter();

  if (!isAdmin) return null;

  const handleSwitch = () => {
    toggleAdminMode();
    router.push(adminMode ? "/app" : "/app/admin");
  };

  return (
    <motion.button
      onClick={handleSwitch}
      whileTap={{ scale: 0.95 }}
      title={adminMode ? "Switch to Player View" : "Switch to Admin Console"}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border backdrop-blur-2xl transition-all duration-300 shadow-md ${
        adminMode
          ? "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
          : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
      }`}
    >
      {adminMode ? (
        <>
          <User className="w-3.5 h-3.5 shrink-0 text-amber-400" />
          <span>Player View</span>
        </>
      ) : (
        <>
          <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
          <span>Admin Console</span>
        </>
      )}
    </motion.button>
  );
}
