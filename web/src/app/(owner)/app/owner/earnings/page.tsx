"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Wallet,
  ArrowUpRight,
  TrendingUp,
  DollarSign,
  Building2,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
} from "lucide-react";
import { useToast } from "@/contexts/ToastContext";

interface PayoutTransaction {
  id: string;
  date: string;
  court: string;
  player: string;
  grossAmount: number;
  platformFee: number;
  netPayout: number;
  status: "settled" | "pending" | "processing";
}

export default function OwnerEarningsPage() {
  const { showToast } = useToast();
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState("gcash");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [isRequesting, setIsRequesting] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<"week" | "month" | "all">("month");

  // Sample data / Supabase records
  const [transactions] = useState<PayoutTransaction[]>([
    {
      id: "tx-01",
      date: "Today, 4:30 PM",
      court: "Court 1 — Indoor Championship",
      player: "Marco Valerio",
      grossAmount: 800,
      platformFee: 40,
      netPayout: 760,
      status: "settled",
    },
    {
      id: "tx-02",
      date: "Today, 2:00 PM",
      court: "Court 2 — Pro Synthetic",
      player: "Sarah Jenkins",
      grossAmount: 600,
      platformFee: 30,
      netPayout: 570,
      status: "settled",
    },
    {
      id: "tx-03",
      date: "Yesterday, 7:00 PM",
      court: "Court 1 — Indoor Championship",
      player: "Carlos Mendoza",
      grossAmount: 1200,
      platformFee: 60,
      netPayout: 1140,
      status: "settled",
    },
    {
      id: "tx-04",
      date: "Aug 24, 6:00 PM",
      court: "Court 3 — Open Air Court",
      player: "Elena Santos",
      grossAmount: 500,
      platformFee: 25,
      netPayout: 475,
      status: "settled",
    },
  ]);

  const grossTotal = transactions.reduce((acc, t) => acc + t.grossAmount, 0);
  const totalPlatformFees = transactions.reduce((acc, t) => acc + t.platformFee, 0);
  const netEarnings = grossTotal - totalPlatformFees;
  const availablePayout = Math.max(0, netEarnings - 1500); // ₱1,500 buffer or pending

  async function handleRequestPayout(e: React.FormEvent) {
    e.preventDefault();
    if (!accountNumber.trim() || !accountName.trim()) {
      showToast("Please fill in your account details", "error");
      return;
    }

    setIsRequesting(true);
    try {
      // Simulate/persist payout request
      await new Promise((r) => setTimeout(r, 800));
      showToast(`Payout request for ₱${availablePayout.toLocaleString()} submitted successfully! Sent to admin for clearance.`, "success");
      setShowPayoutModal(false);
      setAccountNumber("");
      setAccountName("");
    } catch (err) {
      showToast("Failed to submit payout request", "error");
    } finally {
      setIsRequesting(false);
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-6 text-foreground">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] sm:text-[32px] font-extrabold tracking-tight leading-none text-foreground flex items-center gap-3">
            Facility Earnings & Payouts
            <Wallet className="w-6 h-6 text-emerald-500" />
          </h1>
          <p className="text-sm font-medium text-muted-foreground mt-1">
            Real-time court revenue, breakdown, and automated payout settlements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPayoutModal(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95 flex items-center gap-2"
          >
            <ArrowUpRight className="w-4 h-4" /> Request Payout
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Available for Payout */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-card to-emerald-900/20 border border-emerald-500/30 shadow-sm space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-500 uppercase tracking-wider">
            <span>Available Balance</span>
            <Wallet className="w-4 h-4" />
          </div>
          <div className="text-3xl font-black tracking-tight text-foreground font-sans">
            ₱{availablePayout.toLocaleString()}
          </div>
          <p className="text-[11px] font-medium text-muted-foreground">
            Next automated cycle: Friday
          </p>
        </div>

        {/* Gross Revenue */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <span>Gross Revenue</span>
            <DollarSign className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-black tracking-tight text-foreground font-sans">
            ₱{grossTotal.toLocaleString()}
          </div>
          <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +18.4% vs last month
          </p>
        </div>

        {/* Net Payout */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <span>Net Take-Home</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-black tracking-tight text-foreground font-sans">
            ₱{netEarnings.toLocaleString()}
          </div>
          <p className="text-[11px] font-medium text-muted-foreground">
            Platform fee: 5% (₱{totalPlatformFees.toLocaleString()})
          </p>
        </div>

        {/* Total Bookings */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <span>Completed Bookings</span>
            <Building2 className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-3xl font-black tracking-tight text-foreground font-sans">
            {transactions.length} Sessions
          </div>
          <p className="text-[11px] font-medium text-muted-foreground">
            Avg. ₱{(grossTotal / (transactions.length || 1)).toFixed(0)} / session
          </p>
        </div>
      </div>

      {/* Transactions / Settlements Table */}
      <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
          <div>
            <h3 className="text-base font-bold text-foreground">Recent Booking Settlements</h3>
            <p className="text-xs text-muted-foreground">Itemized court reservations and corresponding payouts</p>
          </div>

          <div className="flex items-center gap-2">
            {(["week", "month", "all"] as const).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setSelectedTimeframe(tf)}
                className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-colors ${
                  selectedTimeframe === tf
                    ? "bg-emerald-500 text-white"
                    : "bg-surface-interactive text-muted-foreground hover:text-foreground"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground font-bold uppercase text-[11px] tracking-wider">
                <th className="pb-3 font-semibold">Date & Time</th>
                <th className="pb-3 font-semibold">Court</th>
                <th className="pb-3 font-semibold">Player</th>
                <th className="pb-3 font-semibold text-right">Gross</th>
                <th className="pb-3 font-semibold text-right">Fee (5%)</th>
                <th className="pb-3 font-semibold text-right">Net Payout</th>
                <th className="pb-3 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-surface-interactive/40 transition-colors">
                  <td className="py-3.5 text-muted-foreground font-medium">{tx.date}</td>
                  <td className="py-3.5 font-bold text-foreground">{tx.court}</td>
                  <td className="py-3.5 text-foreground">{tx.player}</td>
                  <td className="py-3.5 text-right font-medium">₱{tx.grossAmount.toLocaleString()}</td>
                  <td className="py-3.5 text-right text-muted-foreground">-₱{tx.platformFee.toLocaleString()}</td>
                  <td className="py-3.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                    ₱{tx.netPayout.toLocaleString()}
                  </td>
                  <td className="py-3.5 text-center">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 capitalize">
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payout Modal */}
      <AnimatePresence>
        {showPayoutModal && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] dark:bg-black/50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-surface-overlay dark:bg-[#13223F] border border-border dark:border-white/12 rounded-3xl p-6 shadow-[0_25px_60px_rgba(0,0,0,0.5)] overflow-hidden z-[610]"
            >
              <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-foreground">Request Payout</h3>
                    <p className="text-xs text-muted-foreground">Available: ₱{availablePayout.toLocaleString()}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPayoutModal(false)}
                  className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground bg-surface-interactive hover:bg-surface-interactive/80 border border-border transition-colors cursor-pointer"
                  aria-label="Close payout modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleRequestPayout} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Disbursement Channel
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "gcash", label: "GCash" },
                      { id: "maya", label: "Maya" },
                      { id: "bank", label: "Bank Transfer" },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPayoutMethod(m.id)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          payoutMethod === m.id
                            ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/20"
                            : "bg-surface-interactive border-border text-foreground hover:bg-surface-interactive/80"
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Account Holder Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Juan Dela Cruz"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface-interactive text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    {payoutMethod === "bank" ? "Bank Account Number *" : "Mobile Number (09XXXXXXXXX) *"}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={payoutMethod === "bank" ? "00123456789" : "09171234567"}
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface-interactive text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div className="p-3 rounded-xl bg-surface-interactive border border-border flex items-start gap-2 text-xs text-muted-foreground">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p>
                    Payouts are reviewed and wired within 24 hours. A confirmation SMS will be sent upon completion.
                  </p>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowPayoutModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-border bg-surface-interactive text-foreground text-xs font-semibold hover:bg-surface-interactive/80 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isRequesting || availablePayout <= 0}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {isRequesting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing...
                      </>
                    ) : (
                      `Withdraw ₱${availablePayout.toLocaleString()}`
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
