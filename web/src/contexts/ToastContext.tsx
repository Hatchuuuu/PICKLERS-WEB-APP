"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

type ToastType = "success" | "error";

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
      // Deduplicate identical messages currently being displayed
      if (prev.some((t) => t.message === message)) return prev;
      const id = Math.random().toString(36).substring(2, 9);

      // Auto dismiss after 3.5s
      setTimeout(() => {
        setToasts((current) => current.filter((t) => t.id !== id));
      }, 3500);

      // Keep maximum 2 toasts at a time
      const trimmed = prev.length >= 2 ? prev.slice(1) : prev;
      return [...trimmed, { id, message, type }];
    });
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Floating Container - Bottom Center for Clean Non-Blocking Visibility */}
      <div className="fixed bottom-24 sm:bottom-10 inset-x-0 mx-auto w-fit max-w-[90vw] px-4 z-[9999] flex flex-col items-center gap-2 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.95, transition: { duration: 0.15 } }}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-2xl max-w-full text-center sm:text-left pointer-events-auto ${
                toast.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500 dark:text-emerald-400"
                  : "bg-red-500/10 border-red-500/20 text-red-500 dark:text-red-400"
              }`}
            >
              {toast.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span className="text-[13px] font-semibold tracking-wide leading-tight">
                {toast.message}
              </span>
            </motion.div>
          ))}
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
