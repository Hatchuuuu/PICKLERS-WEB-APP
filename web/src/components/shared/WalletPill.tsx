"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Wallet, Plus } from "lucide-react";
import { useWalletStore } from "@/store/useWalletStore";
import { useAuth } from "@/contexts/AuthContext";

export function WalletPill({ className = "" }: { className?: string }) {
  const { balance, setTopUpModalOpen, fetchBalance } = useWalletStore();
  const { user } = useAuth();
  const [displayBalance, setDisplayBalance] = useState(balance);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchBalance(user.id);
    }
  }, [user?.id, fetchBalance]);

  useEffect(() => {
    if (balance !== displayBalance) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setDisplayBalance(balance);
        setIsAnimating(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [balance, displayBalance]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`w-full flex items-center justify-between p-4 rounded-[16px] bg-gradient-to-r from-emerald-500/10 via-white/[0.04] to-white/[0.02] border border-white/10 backdrop-blur-xl shadow-[0_4px_16px_rgba(0,0,0,0.2)] dark:border-white/[0.08] relative overflow-hidden group ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent pointer-events-none opacity-50" />
      <div className="flex items-center gap-4 relative z-10">
        <div className="w-12 h-12 rounded-[12px] bg-gradient-to-b from-emerald-400 to-emerald-600 flex items-center justify-center shrink-0 shadow-[0_4px_12px_rgba(16,185,129,0.4),inset_0_1px_1px_rgba(255,255,255,0.4)]">
          <Wallet className="w-6 h-6 text-white drop-shadow-sm" strokeWidth={2.5} />
        </div>
        
        <div className="flex flex-col justify-center">
          <span className="text-[12px] font-bold text-emerald-500/80 uppercase tracking-wider leading-none mb-1">
            Picklers Credits
          </span>
          <div className="relative overflow-hidden h-[28px] flex items-center">
            <span className="text-[22px] font-extrabold text-foreground tracking-tight flex items-baseline leading-none drop-shadow-sm">
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={displayBalance}
                  initial={{ y: isAnimating ? 20 : 0, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="inline-block text-emerald-500 dark:text-emerald-400"
                >
                  {displayBalance.toLocaleString()}
                </motion.span>
              </AnimatePresence>
              <span className="ml-1.5 text-[14px] font-bold text-foreground/50 tracking-normal">Php</span>
            </span>
          </div>
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setTopUpModalOpen(true)}
        className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0 relative z-10 transition-all duration-300 border border-white/10 shadow-sm hover:bg-emerald-500/20 hover:border-emerald-500/30 text-emerald-500 hover:text-emerald-400"
      >
        <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" strokeWidth={2.5} />
      </motion.button>
    </motion.div>
  );
}
