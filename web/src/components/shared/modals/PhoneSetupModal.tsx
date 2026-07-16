"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Smartphone, X } from "lucide-react";

interface PhoneSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (phone: string) => Promise<void>;
  isProcessing?: boolean;
}

export function PhoneSetupModal({ isOpen, onClose, onConnect, isProcessing }: PhoneSetupModalProps) {
  const [phoneInput, setPhoneInput] = useState("");

  useEffect(() => {
    if (isOpen) {
      setPhoneInput("");
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="relative z-10 w-full max-w-[340px] flex flex-col items-center">
            
            <div className="w-full flex flex-col items-center gap-4 px-6 py-6 rounded-[var(--radius-xl)] border shadow-lg backdrop-blur-2xl bg-background/95 border-border/50 relative">
              <button onClick={onClose} className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full bg-secondary hover:bg-secondary/80 transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>

              <div className="w-12 h-12 rounded-[var(--radius-lg)] bg-primary/10 border border-primary/20 flex items-center justify-center mb-1 shadow-[0_10px_40px_rgba(16,185,129,0.15)]">
                <Smartphone className="w-6 h-6 text-primary" />
              </div>
              
              <div className="flex flex-col items-center text-center">
                <h3 className="text-[18px] font-bold text-foreground leading-tight mb-2">Connect Phone</h3>
                <p className="text-[13px] text-muted-foreground font-medium leading-relaxed mb-4">
                  Secure your account by linking a mobile number for faster sign-ins.
                </p>
                <div className="w-full text-left mb-1 text-[11px] font-bold text-muted-foreground uppercase tracking-wider pl-1">Mobile Number</div>
                <div className="relative w-full">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">+63</div>
                  <input
                    autoFocus
                    type="tel"
                    placeholder="917 123 4567"
                    value={phoneInput}
                    onChange={e => setPhoneInput(e.target.value.replace(/[^0-9\s]/g, ''))}
                    disabled={isProcessing}
                    className="w-full pl-12 pr-4 py-3 rounded-[var(--radius-md)] text-[14px] font-medium outline-none bg-secondary border border-border text-foreground focus:border-primary/50 focus:bg-primary/5 transition-all disabled:opacity-50"
                  />
                </div>
              </div>
              
              <div className="flex gap-2 w-full mt-2">
                <button onClick={onClose} disabled={isProcessing} className="flex-1 py-2.5 rounded-[var(--radius-md)] text-[14px] font-semibold text-secondary-foreground bg-secondary border border-border hover:bg-secondary/80 transition-all active:scale-[0.98] disabled:opacity-50">
                  Cancel
                </button>
                <button onClick={() => onConnect(`+63 ${phoneInput.trim()}`)} disabled={isProcessing} className="flex-1 py-2.5 rounded-[var(--radius-md)] text-[14px] font-semibold text-primary bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2">
                  {isProcessing ? "Connecting..." : "Connect"}
                </button>
              </div>
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
