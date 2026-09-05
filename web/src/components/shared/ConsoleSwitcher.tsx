"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  ChevronDown,
  ShieldCheck,
  Cpu,
  User,
  Check,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserStore } from "@/store/useUserStore";
import { useToast } from "@/contexts/ToastContext";

export function ConsoleSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { isAdmin: storeIsAdmin, isDev: storeIsDev, consoleAccess } = useUserStore();
  const { showToast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
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
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const isDevConsole = pathname.startsWith("/app/dev");
  const isAdminConsole = pathname.startsWith("/app/admin");

  const currentConsoleLabel = isDevConsole
    ? "Developer Control Center"
    : isAdminConsole
      ? "Business Admin Console"
      : "Player Portal";

  const currentConsoleIcon = isDevConsole ? Cpu : isAdminConsole ? ShieldCheck : User;
  const CurrentIcon = currentConsoleIcon;

  const handleNavigate = (targetRoute: "/app" | "/app/admin" | "/app/dev", e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);

    if (targetRoute === "/app/admin" && !hasAdmin) {
      showToast("Business Admin console access required. Your account does not have administrative privileges.", "error");
      return;
    }

    if (targetRoute === "/app/dev" && !hasDev) {
      showToast("Developer Control access required. Your account does not have developer privileges.", "error");
      return;
    }

    router.push(targetRoute);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-mono transition-all cursor-pointer"
      >
        <CurrentIcon className={`w-3.5 h-3.5 ${isDevConsole ? "text-cyan-400" : isAdminConsole ? "text-emerald-400" : "text-amber-400"}`} />
        <span className="font-semibold hidden sm:inline">{currentConsoleLabel}</span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-1.5 z-[400] space-y-1 font-mono text-xs">
          <div className="px-3 py-1.5 text-[10px] text-slate-500 uppercase tracking-wider border-b border-slate-800">
            Console Switcher
          </div>

          <button
            onClick={(e) => handleNavigate("/app/dev", e)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all cursor-pointer ${
              isDevConsole
                ? "bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-bold"
                : hasDev
                  ? "text-slate-300 hover:bg-slate-800/60"
                  : "text-slate-500 hover:bg-slate-800/30 opacity-60"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>Developer Control</span>
            </div>
            {isDevConsole ? (
              <Check className="w-3.5 h-3.5 text-cyan-400" />
            ) : !hasDev ? (
              <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-500 border border-slate-700">Restricted</span>
            ) : null}
          </button>

          <button
            onClick={(e) => handleNavigate("/app/admin", e)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all cursor-pointer ${
              isAdminConsole
                ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-bold"
                : hasAdmin
                  ? "text-slate-300 hover:bg-slate-800/60"
                  : "text-slate-500 hover:bg-slate-800/30 opacity-60"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Business Admin</span>
            </div>
            {isAdminConsole ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : !hasAdmin ? (
              <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-500 border border-slate-700">Restricted</span>
            ) : null}
          </button>

          <button
            onClick={(e) => handleNavigate("/app", e)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-slate-300 hover:bg-slate-800/60 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <User className="w-4 h-4 text-amber-400" />
              <span>Player Portal</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
