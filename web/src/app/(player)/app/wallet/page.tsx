"use client";
import { useState, Suspense } from "react";
import { motion } from "motion/react";
import { usePaymongo } from "@/hooks/usePaymongo";
import { useWallet } from "@/hooks/useWallet";
import { Wallet, CreditCard, ChevronRight, CheckCircle2, AlertCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const TOP_UP_AMOUNTS = [500, 1000, 2500, 5000];

function WalletContent() {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(1000);
  const [customAmount, setCustomAmount] = useState<string>("");
  const { isLoading, error, isShaking, createCheckoutSession } = usePaymongo();
  const { user } = useAuth();
  const { data: walletData } = useWallet();
  const walletBalance = walletData?.balance ?? 0;
  const searchParams = useSearchParams();
  const paymentStatus = searchParams.get("payment");

  const handleCheckout = () => {
    const finalAmount = selectedAmount !== null ? selectedAmount : parseInt(customAmount);
    if (!finalAmount || isNaN(finalAmount) || !user?.id) return;
    createCheckoutSession(finalAmount, user.id, `Picklers Wallet Top-Up (₱${finalAmount})`);
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    setCustomAmount(val);
    setSelectedAmount(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 selection:bg-emerald-500/30">
      {/* Subtle Texture Overlay */}
      <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02] bg-[size:32px_32px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Status Messages */}
        {paymentStatus === "success" && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-2xl text-emerald-500 dark:text-emerald-400"
          >
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">Payment successful! Your wallet has been credited.</p>
          </motion.div>
        )}

        {paymentStatus === "cancelled" && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl border border-red-500/20 bg-red-500/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-2xl text-red-500 dark:text-red-400"
          >
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">Payment was cancelled.</p>
          </motion.div>
        )}

        {/* Main Interface */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="p-6 border-b border-border bg-surface-raised/40">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <Wallet className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground tracking-tight">Top up Wallet</h1>
                <p className="text-sm text-muted-foreground">Add funds to book courts instantly</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Current Balance Display */}
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                  Current Balance
                </span>
                <span className="text-2xl font-black text-foreground">
                  ₱{walletBalance.toLocaleString()}
                </span>
              </div>
              <div className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                Active
              </div>
            </div>

            {/* Amount Selection */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Select Amount</label>
              <div className="grid grid-cols-2 gap-3">
                {TOP_UP_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => { setSelectedAmount(amt); setCustomAmount(""); }}
                    className={`h-14 rounded-xl border transition-all duration-200 flex items-center justify-center text-lg font-semibold ${
                      selectedAmount === amt
                        ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-600 dark:text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)] ring-2 ring-emerald-500/20"
                        : "bg-surface-raised border-border text-foreground hover:bg-surface-interactive hover:border-border"
                    }`}
                  >
                    ₱{amt.toLocaleString()}
                  </button>
                ))}
              </div>
              
              <div className="relative mt-3">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₱</span>
                <input
                  type="text"
                  placeholder="Custom amount"
                  value={customAmount}
                  onChange={handleCustomAmountChange}
                  onFocus={() => setSelectedAmount(null)}
                  className={`w-full h-14 bg-surface-raised border rounded-xl pl-8 pr-4 text-foreground font-semibold placeholder:text-muted-foreground focus:outline-none transition-colors ${
                    selectedAmount === null 
                      ? "border-emerald-500/50 bg-emerald-500/5 ring-4 ring-emerald-500/10" 
                      : "border-border focus:border-border"
                  }`}
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div 
                animate={isShaking ? { x: [-5, 5, -5, 5, 0] } : {}}
                transition={{ duration: 0.4 }}
                className="flex items-center gap-2 px-4 py-3 rounded-xl border shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-2xl bg-red-500/10 border-red-500/20 text-red-500 dark:text-red-400"
                role="alert"
                aria-live="assertive"
              >
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </motion.div>
            )}

            {/* Supported Methods Info */}
            <div className="flex items-center gap-3 px-4 py-3 bg-surface-interactive border border-border rounded-xl">
              <CreditCard className="w-5 h-5 text-muted-foreground shrink-0" />
              <p className="text-xs font-medium text-muted-foreground">
                Supports GCash, Maya, QR Ph, and all major Credit Cards securely via PayMongo.
              </p>
            </div>

            {/* Checkout Button */}
            <button
              type="button"
              onClick={handleCheckout}
              disabled={isLoading}
              className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 shadow-md hover:shadow-lg group relative overflow-hidden"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span className="text-base tracking-tight">
                    Continue to Payment
                  </span>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function WalletPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>}>
      <WalletContent />
    </Suspense>
  );
}
