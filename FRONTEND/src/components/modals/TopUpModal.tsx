import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, CheckCircle2, ChevronRight, Wallet } from "lucide-react";
import { useWalletStore } from "@/store/useWalletStore";
import { cn } from "@/lib/utils";

const AMOUNTS = [500, 1000, 2000, 5000];

export function TopUpModal() {
  const { isTopUpModalOpen, setTopUpModalOpen, addBalance } = useWalletStore();
  const [selectedAmount, setSelectedAmount] = useState<number | "custom">(1000);
  const [customAmount, setCustomAmount] = useState("");
  const [method, setMethod] = useState<"gcash" | "maya">("gcash");
  const [status, setStatus] = useState<"idle" | "processing" | "success">("idle");

  if (!isTopUpModalOpen) return null;

  const handleTopUp = () => {
    const amount = selectedAmount === "custom" ? parseInt(customAmount) || 0 : selectedAmount;
    if (amount <= 0) return;

    setStatus("processing");
    setTimeout(() => {
      setStatus("success");
      setTimeout(() => {
        addBalance(amount);
        setTopUpModalOpen(false);
        setTimeout(() => setStatus("idle"), 500);
      }, 1500);
    }, 2000);
  };

  const amount = selectedAmount === "custom" ? parseInt(customAmount) || 0 : selectedAmount;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={() => status === "idle" && setTopUpModalOpen(false)}
        />

        {/* Modal */}
        <motion.div
          initial={{ y: "100%", md: { y: 20, scale: 0.95 }, opacity: 0 }}
          animate={{ y: 0, scale: 1, opacity: 1 }}
          exit={{ y: "100%", md: { y: 20, scale: 0.95 }, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="relative w-full max-w-md bg-background md:rounded-[24px] rounded-t-[24px] rounded-b-none overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.3)] border border-border flex flex-col"
        >
          {status === "success" ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 flex flex-col items-center justify-center text-center py-16"
            >
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
              <h2 className="text-[24px] font-bold text-foreground mb-2">Top Up Successful!</h2>
              <p className="text-[15px] text-muted-foreground">
                ₱{amount.toLocaleString()} has been added to your Pickle Credits.
              </p>
            </motion.div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border bg-gradient-to-b from-white/[0.02] to-transparent">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-[14px] bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-inner">
                    <Wallet className="w-6 h-6 text-emerald-500" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h2 className="text-[20px] font-extrabold text-foreground leading-tight tracking-tight">Top Up Credits</h2>
                    <p className="text-[14px] text-muted-foreground mt-0.5">Add funds to your wallet</p>
                  </div>
                </div>
                <button
                  onClick={() => setTopUpModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-surface-interactive flex items-center justify-center text-foreground/50 hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 flex flex-col gap-6">
                {/* Amount Selection */}
                <div>
                  <h3 className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest mb-3 px-1">
                    Select Amount
                  </h3>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {AMOUNTS.map((amt) => {
                      const isActive = selectedAmount === amt;
                      return (
                        <button
                          key={amt}
                          onClick={() => setSelectedAmount(amt)}
                          className={cn(
                            "relative py-3.5 rounded-[16px] text-[16px] font-bold transition-all z-0 overflow-hidden border shadow-sm",
                            isActive ? "text-emerald-400 border-transparent" : "text-foreground/70 bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10"
                          )}
                        >
                          {isActive && (
                            <motion.div
                              layoutId="amount-active"
                              className="absolute inset-0 bg-emerald-500/10 z-[-1] border-2 border-emerald-500/50 rounded-[16px]"
                              transition={{ type: "spring", stiffness: 500, damping: 35 }}
                            />
                          )}
                          ₱{amt.toLocaleString()}
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Custom Amount */}
                  <button
                    onClick={() => {
                      setSelectedAmount("custom");
                      setCustomAmount("");
                    }}
                    className={cn(
                      "w-full relative py-3.5 px-5 rounded-[16px] text-[16px] font-bold transition-all z-0 overflow-hidden border flex items-center justify-between shadow-sm",
                      selectedAmount === "custom" ? "text-emerald-400 border-transparent" : "text-foreground/70 bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10"
                    )}
                  >
                    {selectedAmount === "custom" && (
                      <motion.div
                        layoutId="amount-active"
                        className="absolute inset-0 bg-emerald-500/10 z-[-1] border-2 border-emerald-500/50 rounded-[16px]"
                        transition={{ type: "spring", stiffness: 500, damping: 35 }}
                      />
                    )}
                    <span>Custom Amount</span>
                    {selectedAmount === "custom" ? (
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground font-normal">₱</span>
                        <input
                          autoFocus
                          type="number"
                          value={customAmount}
                          onChange={(e) => setCustomAmount(e.target.value)}
                          placeholder="0"
                          className="w-20 bg-transparent outline-none text-right font-bold text-foreground placeholder:text-muted-foreground/50"
                        />
                      </div>
                    ) : (
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    )}
                  </button>
                </div>

                {/* Payment Method */}
                <div>
                  <h3 className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest mb-3 px-1">
                    Payment Method
                  </h3>
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => setMethod("gcash")}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-[16px] border transition-all active:scale-[0.98] shadow-sm",
                        method === "gcash" ? "border-[#0055FE]/50 bg-[#0055FE]/10" : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04]"
                      )}
                    >
                      <div className={cn("w-10 h-10 rounded-[10px] flex items-center justify-center font-bold text-lg", method === "gcash" ? "bg-[#0055FE] text-white shadow-[0_4px_12px_rgba(0,85,254,0.4)]" : "bg-white/5 text-foreground/50 border border-white/5")}>
                        G
                      </div>
                      <div className="flex flex-col items-start flex-1">
                        <span className="text-[15px] font-bold text-foreground">GCash</span>
                        <span className="text-[13px] text-muted-foreground">E-Wallet</span>
                      </div>
                      <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors", method === "gcash" ? "border-[#0055FE]" : "border-muted-foreground/30")}>
                        {method === "gcash" && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-2.5 h-2.5 rounded-full bg-[#0055FE]" />}
                      </div>
                    </button>
                    
                    <button
                      onClick={() => setMethod("maya")}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-[16px] border transition-all active:scale-[0.98] shadow-sm",
                        method === "maya" ? "border-[#42d6a4]/50 bg-[#42d6a4]/10" : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04]"
                      )}
                    >
                      <div className={cn("w-10 h-10 rounded-[10px] flex items-center justify-center font-black text-lg", method === "maya" ? "bg-white text-zinc-900 shadow-[0_4px_12px_rgba(255,255,255,0.2)]" : "bg-white/5 text-foreground/50 border border-white/5")}>
                        M
                      </div>
                      <div className="flex flex-col items-start flex-1">
                        <span className="text-[15px] font-bold text-foreground">Maya</span>
                        <span className="text-[13px] text-muted-foreground">E-Wallet</span>
                      </div>
                      <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors", method === "maya" ? "border-[#42d6a4]" : "border-muted-foreground/30")}>
                        {method === "maya" && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-2.5 h-2.5 rounded-full bg-[#42d6a4]" />}
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="p-6 pt-2">
                <button
                  onClick={handleTopUp}
                  disabled={amount <= 0 || status === "processing"}
                  className="relative w-full py-4 rounded-[16px] text-[16px] font-extrabold text-white shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 overflow-hidden"
                  style={{
                    background: method === "gcash" ? "linear-gradient(135deg, #0055FE 0%, #0030B5 100%)" : "linear-gradient(135deg, #2ED573 0%, #17A05D 100%)",
                    boxShadow: method === "gcash" ? "0 8px 30px rgba(0,85,254,0.4), inset 0 1px 1px rgba(255,255,255,0.2)" : "0 8px 30px rgba(46,213,115,0.4), inset 0 1px 1px rgba(255,255,255,0.4)"
                  }}
                >
                  <AnimatePresence mode="wait">
                    {status === "processing" ? (
                      <motion.div
                        key="processing"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center justify-center gap-2"
                      >
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                        Processing...
                      </motion.div>
                    ) : (
                      <motion.div
                        key="pay"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        Pay ₱{amount.toLocaleString()}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
