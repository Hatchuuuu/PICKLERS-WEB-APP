"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Wallet, Plus } from "lucide-react";
import { useWalletStore } from "@/store/useWalletStore";

export function WalletPill({ className = "" }: { className?: string }) {
  const { balance, setTopUpModalOpen } = useWalletStore();
  const [displayBalance, setDisplayBalance] = useState(balance);
  const [isAnimating, setIsAnimating] = useState(false);

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
      className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-[16px] bg-gradient-to-r from-emerald-500/10 via-white/[0.04] to-white/[0.02] border border-white/10 backdrop-blur-xl shadow-[0_4px_16px_rgba(0,0,0,0.2)] dark:border-white/[0.08] ${className}`}
    >
      <div className="w-8 h-8 rounded-[10px] bg-gradient-to-b from-emerald-400 to-emerald-600 flex items-center justify-center shrink-0 shadow-[0_2px_10px_rgba(16,185,129,0.4),inset_0_1px_1px_rgba(255,255,255,0.4)] relative">
        <Wallet className="w-4 h-4 text-white drop-shadow-sm" strokeWidth={2.5} />
      </div>
      
      <div className="flex flex-col min-w-[65px] justify-center">
        <span className="text-[8.5px] font-bold text-emerald-100/60 uppercase tracking-wider leading-none mb-0.5 mt-0.5">
          Picklers Credits
        </span>
        <div className="relative overflow-hidden h-[18px] flex items-center">
          <span className="text-[14px] font-black text-white tracking-tight flex items-baseline leading-none drop-shadow-sm">
            <AnimatePresence mode="popLayout">
              <motion.span
                key={displayBalance}
                initial={{ y: isAnimating ? 16 : 0, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -16, opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="inline-block"
              >
                {displayBalance.toLocaleString()}
              </motion.span>
            </AnimatePresence>
            <span className="ml-1 text-[10px] font-bold text-emerald-100/60 tracking-normal">Php</span>
          </span>
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setTopUpModalOpen(true)}
        className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center shrink-0 ml-0.5 transition-all duration-300 border border-white/10 shadow-sm hover:bg-emerald-500/20 hover:border-emerald-500/30 text-white hover:text-emerald-300 group"
      >
        <Plus className="w-3.5 h-3.5 transition-transform group-hover:rotate-90" strokeWidth={3} />
      </motion.button>
    </motion.div>
  );
}
