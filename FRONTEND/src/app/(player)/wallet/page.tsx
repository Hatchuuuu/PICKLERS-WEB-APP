"use client";
import { useState } from "react";
import { motion } from "motion/react";
import { usePaymongo } from "@/hooks/usePaymongo";
import { Wallet, CreditCard, ChevronRight, CheckCircle2, AlertCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";

const TOP_UP_AMOUNTS = [500, 1000, 2500, 5000];

export default function WalletPage() {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(1000);
  const [customAmount, setCustomAmount] = useState<string>("");
  const { isLoading, error, isShaking, createCheckoutSession } = usePaymongo();
  const searchParams = useSearchParams();
  const paymentStatus = searchParams.get("payment");

  const handleCheckout = () => {
    const finalAmount = selectedAmount !== null ? selectedAmount : parseInt(customAmount);
    if (!finalAmount || isNaN(finalAmount)) return;
    createCheckoutSession(finalAmount, `Picklers Wallet Top-Up (₱${finalAmount})`);
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    setCustomAmount(val);
    setSelectedAmount(null);
  };

  return (
    <div className="min-h-screen bg-ink-primary flex items-center justify-center p-4 selection:bg-emerald-500/30">
      {/* Subtle Texture Overlay */}
      <div className="absolute inset-0 bg-grid-black/[0.02] bg-[size:32px_32px] pointer-events-none" />

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
            className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <p className="text-sm font-medium text-emerald-400">Payment successful! Your wallet has been credited.</p>
          </motion.div>
        )}

        {paymentStatus === "cancelled" && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl border border-red-500/20 bg-red-500/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
          >
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <p className="text-sm font-medium text-red-400">Payment was cancelled.</p>
          </motion.div>
        )}

        {/* Main Interface */}
        <div className="bg-ink-secondary/50 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="p-6 border-b border-white/5">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <Wallet className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-xl font-medium text-white tracking-tight">Top up Wallet</h1>
                <p className="text-sm text-gray-400">Add funds to book courts instantly</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Amount Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-300 uppercase tracking-widest">Select Amount</label>
              <div className="grid grid-cols-2 gap-3">
                {TOP_UP_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => { setSelectedAmount(amt); setCustomAmount(""); }}
                    className={`h-14 rounded-xl border transition-all duration-200 flex items-center justify-center text-lg font-medium ${
                      selectedAmount === amt
                        ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                        : "bg-white/5 border-white/5 text-gray-300 hover:bg-white/10 hover:border-white/10"
                    }`}
                  >
                    ₱{amt.toLocaleString()}
                  </button>
                ))}
              </div>
              
              <div className="relative mt-3">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₱</span>
                <input
                  type="text"
                  placeholder="Custom amount"
                  value={customAmount}
                  onChange={handleCustomAmountChange}
                  onFocus={() => setSelectedAmount(null)}
                  className={`w-full h-14 bg-white/5 border rounded-xl pl-8 pr-4 text-white font-medium placeholder:text-gray-500 focus:outline-none transition-colors ${
                    selectedAmount === null 
                      ? "border-emerald-500/50 bg-emerald-500/5 ring-4 ring-emerald-500/10" 
                      : "border-white/5 focus:border-white/20"
                  }`}
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div 
                animate={isShaking ? { x: [-5, 5, -5, 5, 0] } : {}}
                transition={{ duration: 0.4 }}
                className="flex items-center gap-2 px-4 py-3 rounded-xl border shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-2xl bg-red-500/10 border-red-500/20"
                role="alert"
                aria-live="assertive"
              >
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                <p className="text-sm font-medium text-red-400">{error}</p>
              </motion.div>
            )}

            {/* Supported Methods Info */}
            <div className="flex items-center gap-3 px-4 py-3 bg-white/[0.02] border border-white/5 rounded-xl">
              <CreditCard className="w-5 h-5 text-gray-400" />
              <p className="text-xs font-medium text-gray-400">
                Supports GCash, Maya, QR Ph, and all major Credit Cards securely via Paymongo.
              </p>
            </div>

            {/* Checkout Button */}
            <button
              onClick={handleCheckout}
              disabled={isLoading}
              className="w-full h-14 bg-white text-ink-primary font-medium rounded-xl flex items-center justify-center gap-2 hover:bg-gray-100 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 group relative overflow-hidden"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-ink-primary/30 border-t-ink-primary rounded-full animate-spin" />
              ) : (
                <>
                  <span className="text-base tracking-tight">
                    Continue to Payment
                  </span>
                  <ChevronRight className="w-5 h-5 text-ink-primary/50 group-hover:text-ink-primary group-hover:translate-x-1 transition-all" />
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
