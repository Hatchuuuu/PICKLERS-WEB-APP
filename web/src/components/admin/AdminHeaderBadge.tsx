"use client";

import { motion } from "motion/react";
import { ShieldCheck, Code2, LayoutDashboard, ChevronDown } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useUserStore } from "@/store/useUserStore";
import { useState, useRef, useEffect } from "react";

interface AdminHeaderBadgeProps {
  variant?: "compact" | "sidebar";
}

export function AdminHeaderBadge({ variant = "compact" }: AdminHeaderBadgeProps) {
  const { user } = useAuth();
  const { isAdmin: storeIsAdmin, isDev: storeIsDev, consoleAccess } = useUserStore();
  const router = useRouter();
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const emailLower = (user?.email || "").toLowerCase();
  const isPrivilegedEmail =
    emailLower === "dev@picklers.com" ||
    emailLower === "admin@picklers.com" ||
    emailLower === "picklersdev@gmail.com" ||
    emailLower === "ricdarrylzernacielo@gmail.com" ||
    emailLower.endsWith("@picklers.com") ||
    emailLower.startsWith("picklersdev") ||
    emailLower.includes("admin") ||
    emailLower.includes("dev");

  const hasAdmin = Boolean(
    isPrivilegedEmail ||
    storeIsAdmin ||
    user?.isAdmin ||
    user?.role === "admin" ||
    user?.role === "dev" ||
    Boolean(user?.admin_role) ||
    Boolean(user?.adminRole) ||
    (Array.isArray(consoleAccess) && consoleAccess.includes("admin")) ||
    (Array.isArray(user?.console_access) && user.console_access.includes("admin"))
  );

  const hasDev = Boolean(
    isPrivilegedEmail ||
    storeIsDev ||
    user?.role === "dev" ||
    user?.role === "admin" ||
    user?.isAdmin ||
    Boolean(user?.dev_role) ||
    Boolean(user?.devRole) ||
    (Array.isArray(consoleAccess) && consoleAccess.includes("dev")) ||
    (Array.isArray(user?.console_access) && user.console_access.includes("dev"))
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  if (!hasAdmin && !hasDev) return null;

  const inAdminRoute = pathname.startsWith("/app/admin");
  const inDevRoute = pathname.startsWith("/app/dev");

  const handleNavigate = (targetRoute: "/app" | "/app/admin" | "/app/dev", e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDropdownOpen(false);
    router.push(targetRoute);
  };

  // Single Admin Access Button
  if (hasAdmin && !hasDev) {
    return (
      <motion.button
        type="button"
        onClick={(e) => handleNavigate(inAdminRoute ? "/app" : "/app/admin", e)}
        whileTap={{ scale: 0.96 }}
        className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[13px] font-bold border backdrop-blur-2xl transition-all duration-300 shadow-[0_10px_40px_rgba(0,0,0,0.3)] ${inAdminRoute
            ? "bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20"
            : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
          } ${variant === "sidebar" ? "w-full justify-between" : ""}`}
      >
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{inAdminRoute ? "Player Experience" : "Access Admin Console"}</span>
        </div>
        <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-black bg-emerald-500/20 text-emerald-300">
          ADMIN
        </span>
      </motion.button>
    );
  }

  // Dual Access Console Switcher (Admin + Dev)
  return (
    <div className={`relative ${variant === "sidebar" ? "w-full" : ""}`} ref={dropdownRef}>
      <motion.button
        type="button"
        onClick={() => setDropdownOpen((prev) => !prev)}
        whileTap={{ scale: 0.96 }}
        className={`flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-[13px] font-bold border backdrop-blur-2xl transition-all duration-300 shadow-[0_10px_40px_rgba(0,0,0,0.3)] bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 cursor-pointer ${variant === "sidebar" ? "w-full" : ""
          }`}
      >
        <div className="flex items-center gap-2">
          {inDevRoute ? (
            <Code2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : inAdminRoute ? (
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <LayoutDashboard className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>
            {inDevRoute ? "Dev Console" : inAdminRoute ? "Admin Console" : "Console Switcher"}
          </span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-emerald-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
      </motion.button>

      {dropdownOpen && (
        <div className={`absolute w-56 p-1.5 rounded-xl border bg-neutral-900/95 backdrop-blur-2xl border-emerald-500/20 shadow-2xl z-50 flex flex-col gap-1 ${
          variant === "sidebar" ? "bottom-full mb-2 left-0" : "top-full mt-2 right-0"
        }`}>
          <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-400/70 border-b border-emerald-500/10">
            Available Consoles
          </div>
          <button
            type="button"
            onClick={(e) => handleNavigate("/app", e)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-gray-300 hover:bg-emerald-500/10 hover:text-emerald-400 text-left transition-colors cursor-pointer w-full"
          >
            <LayoutDashboard className="w-3.5 h-3.5" /> Player Experience
          </button>
          <button
            type="button"
            onClick={(e) => handleNavigate("/app/admin", e)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-gray-300 hover:bg-emerald-500/10 hover:text-emerald-400 text-left transition-colors cursor-pointer w-full"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Admin Console
          </button>
          <button
            type="button"
            onClick={(e) => handleNavigate("/app/dev", e)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-gray-300 hover:bg-emerald-500/10 hover:text-emerald-400 text-left transition-colors cursor-pointer w-full"
          >
            <Code2 className="w-3.5 h-3.5 text-emerald-400" /> Developer Console
          </button>
        </div>
      )}
    </div>
  );
}
