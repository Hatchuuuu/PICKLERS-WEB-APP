"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    setToasts((prev) => {
      // A-018 FIX: Deduplicate on (message + type) not just message.
      // Previously: showToast("X", "error") then showToast("X", "success")
      // would suppress the success toast because the message matched.
      if (prev.some((t) => t.message === message && t.type === type)) return prev;
      const id = Math.random().toString(36).substring(2, 9);

      // Auto dismiss after 3.5s
      setTimeout(() => {
        setToasts((current) => current.filter((t) => t.id !== id));
      }, 3500);

      // Keep maximum 3 toasts at a time
      const trimmed = prev.length >= 3 ? prev.slice(1) : prev;
      return [...trimmed, { id, message, type }];
    });
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Floating Container - Universally positioned at bottom center */}
      <div 
        className="fixed bottom-6 sm:bottom-8 inset-x-0 mx-auto w-fit max-w-[calc(100vw-2rem)] sm:max-w-md px-3 z-[700] flex flex-col-reverse items-center gap-2.5 pointer-events-none pb-[env(safe-area-inset-bottom,0px)]"
        style={{ transform: "translateZ(0)" }}
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => {
            let colorClasses = "bg-emerald-500/10 border-emerald-500/20 text-emerald-500 dark:text-emerald-400";
            let IconComponent = CheckCircle2;

            if (toast.type === "error") {
              colorClasses = "bg-red-500/10 border-red-500/20 text-red-500 dark:text-red-400";
              IconComponent = AlertCircle;
            } else if (toast.type === "warning") {
              colorClasses = "bg-amber-500/10 border-amber-500/20 text-amber-500 dark:text-amber-400";
              IconComponent = AlertTriangle;
            } else if (toast.type === "info") {
              colorClasses = "bg-cyan-500/10 border-cyan-500/20 text-cyan-500 dark:text-cyan-400";
              IconComponent = Info;
            }

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95, transition: { duration: 0.15 } }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.4}
                onDragEnd={(_, info) => {
                  if (Math.abs(info.offset.x) > 60) {
                    dismissToast(toast.id);
                  }
                }}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-2xl max-w-full pointer-events-auto cursor-grab active:cursor-grabbing ${colorClasses}`}
              >
                <IconComponent className="w-4 h-4 shrink-0" />
                <span className="text-[13px] font-bold tracking-tight leading-tight select-none">
                  {toast.message}
                </span>
                <button
                  type="button"
                  onClick={() => dismissToast(toast.id)}
                  className="p-0.5 ml-1 rounded-md opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
                  aria-label="Dismiss toast"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
