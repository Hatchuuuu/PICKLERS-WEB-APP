"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Calendar, MapPin, DollarSign, Clock, Trash2, CheckCircle2, ShieldAlert, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/contexts/ToastContext";

export interface BookingDetail {
  id: number | string;
  title?: string;
  date: string;
  time: string;
  location: string;
  price: number;
  status: string;
  refund_amount?: number;
  refund_reason?: string;
  created_at?: string;
  player?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    avatar_url?: string;
  };
  facility?: {
    id: number | string;
    name: string;
    location?: string;
  };
}

interface BookingDetailDrawerProps {
  booking: BookingDetail | null;
  onClose: () => void;
  onCancelBooking: (bookingId: string | number) => void;
  onRefresh?: () => void;
}

export function BookingDetailDrawer({ booking, onClose, onCancelBooking, onRefresh }: BookingDetailDrawerProps) {
  const { showToast } = useToast();
  const [isRefunding, setIsRefunding] = useState(false);
  const [showRefundConfirm, setShowRefundConfirm] = useState(false);
  const [refundReason, setRefundReason] = useState("");

  if (!booking) return null;

  const handleRefund = async () => {
    setIsRefunding(true);
    try {
      const res = await fetch(`/api/admin/bookings/${booking.id}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: refundReason.trim() || "Administrative refund" }),
      });

      if (res.ok) {
        showToast(`Refund of ₱${booking.price} issued successfully.`, "success");
        setShowRefundConfirm(false);
        if (onRefresh) onRefresh();
        onClose();
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to process refund", "error");
      }
    } catch {
      showToast("Refund transaction failed", "error");
    } finally {
      setIsRefunding(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[600] flex justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-[2px] dark:bg-black/50"
        />

        {/* Drawer Panel */}
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 250 }}
          className="relative w-full max-w-lg bg-surface-overlay dark:bg-[#13223F] border-l border-border dark:border-white/12 h-full flex flex-col shadow-2xl overflow-hidden z-[610]"
        >
          {/* Header */}
          <div className="p-6 border-b border-border flex items-center justify-between bg-surface-interactive/30">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">
                  Reservation #{String(booking.id).slice(0, 8)}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {booking.title || booking.facility?.name || "Court Reservation"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close drawer"
              className="w-8 h-8 rounded-full bg-surface-interactive hover:bg-surface-interactive/80 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Status Pill */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase">Booking Status</span>
              <span
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold border uppercase flex items-center gap-1.5",
                  booking.status === "confirmed"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : booking.status === "refunded"
                    ? "bg-violet-500/10 border-violet-500/30 text-violet-400"
                    : booking.status === "cancelled"
                    ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                    : "bg-blue-500/10 border-blue-500/30 text-blue-400"
                )}
              >
                {booking.status === "confirmed" ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <ShieldAlert className="w-3.5 h-3.5" />
                )}
                {booking.status || "Confirmed"}
              </span>
            </div>

            {/* Main Reservation Card */}
            <div className="space-y-4 rounded-2xl border border-border p-4 bg-surface-base/50">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Court & Time Specs
              </h3>

              <div className="grid grid-cols-1 gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-muted-foreground font-medium">Location / Facility</span>
                    <span className="font-bold text-foreground">{booking.location || booking.facility?.name}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-muted-foreground font-medium">Scheduled Time</span>
                    <span className="font-mono text-foreground font-bold">{booking.date} • {booking.time}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <DollarSign className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-muted-foreground font-medium">Total Booking Amount</span>
                    <span className="font-mono text-emerald-400 font-extrabold text-sm">₱{booking.price || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Player Information Card */}
            <div className="space-y-4 rounded-2xl border border-border p-4 bg-surface-base/50">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Player Details
              </h3>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-xs">
                  {booking.player?.avatar_url ? (
                    <img src={booking.player.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    booking.player?.name?.[0]?.toUpperCase() || "P"
                  )}
                </div>
                <div className="flex flex-col text-xs">
                  <span className="font-bold text-foreground">{booking.player?.name || "Player Account"}</span>
                  <span className="text-muted-foreground font-mono">{booking.player?.id || "N/A"}</span>
                  {booking.player?.email && (
                    <span className="text-muted-foreground">{booking.player.email}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Admin Override Actions */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Administrative Override
              </h3>
              
              {booking.status !== "refunded" && booking.status !== "cancelled" && (
                <button
                  onClick={() => onCancelBooking(booking.id)}
                  className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 flex items-center justify-center gap-2 transition-colors"
                >
                  <Trash2 className="w-4 h-4" /> Cancel Reservation (Admin Override)
                </button>
              )}

              {booking.status !== "refunded" && (
                <div className="space-y-2">
                  {!showRefundConfirm ? (
                    <button
                      onClick={() => setShowRefundConfirm(true)}
                      className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-violet-500/10 border border-violet-500/30 text-violet-400 hover:bg-violet-500/20 flex items-center justify-center gap-2 transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" /> Issue Full Refund (₱{booking.price})
                    </button>
                  ) : (
                    <div className="p-4 rounded-xl border border-violet-500/30 bg-violet-500/5 space-y-3">
                      <div className="text-xs font-bold text-violet-300">
                        Confirm Refund of ₱{booking.price}
                      </div>
                      <input
                        type="text"
                        value={refundReason}
                        onChange={(e) => setRefundReason(e.target.value)}
                        placeholder="Reason (e.g., Weather closure, Admin cancellation)"
                        className="w-full p-2.5 rounded-lg border border-border bg-surface-base text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleRefund}
                          disabled={isRefunding}
                          className="flex-1 py-2 px-3 rounded-lg text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white transition-colors disabled:opacity-50"
                        >
                          {isRefunding ? "Processing..." : "Confirm Refund"}
                        </button>
                        <button
                          onClick={() => setShowRefundConfirm(false)}
                          className="py-2 px-3 rounded-lg text-xs border border-border hover:bg-surface-interactive transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
