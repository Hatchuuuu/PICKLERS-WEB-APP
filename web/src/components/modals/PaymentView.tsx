"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from 'next/navigation';
import { cn } from "@/lib/utils";

import { motion, AnimatePresence } from "motion/react";
import {
  Check, Banknote, Coins,
  Clock, ShieldCheck,
  Calendar, CalendarDays, User, RefreshCw, AlertCircle, X, Copy, ChevronLeft, ChevronRight
} from "lucide-react";
import { slotHours, TIME_SLOTS, slotIndex } from "@/lib/timeUtils";
import { PaymentData, CourtData } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import { LockedFeatureWrapper } from "@/components/ui/LockedFeatureWrapper";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { TimeScroller } from "./QuickBookModal";
import { FocusTrap } from "@/components/a11y/FocusTrap";
import Image from "next/image";

import confetti from "canvas-confetti";

export function PaymentView({
  data,
  onBack,
  onDone
}: {
  data: PaymentData;
  onBack: () => void;
  onDone: () => void;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setBookings } = useApp();
  const { user } = useAuth();
  const { showToast } = useToast();

  // Payment method and stage
  const [method, setMethod] = useState<"gcash" | "maya" | "cash" | "credits">("gcash");
  const [stage, setStage] = useState<"idle" | "processing" | "success" | "failed">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [imgError, setImgError] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);

  // 1-Minute (60-second) Court Hold Timer
  const [timeLeft, setTimeLeft] = useState(60);
  const [isExpired, setIsExpired] = useState(false);

  // Editable Date & Time Slot
  const initialDateStr = typeof data.date === "string" ? data.date : data.date.toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState<string>(initialDateStr);
  const [selectedStartTime, setSelectedStartTime] = useState<string>(data.startTime);
  const [selectedEndTime, setSelectedEndTime] = useState<string>(data.endTime);
  const [showEditSlotModal, setShowEditSlotModal] = useState(false);

  // Draft state for Slot Edit Modal
  const [draftDate, setDraftDate] = useState<Date>(new Date(initialDateStr + "T00:00:00"));
  const [draftStartTime, setDraftStartTime] = useState<string>(data.startTime);
  const [draftEndTime, setDraftEndTime] = useState<string>(data.endTime);

  // "Booked For" Player Contact Details
  const [playerName, setPlayerName] = useState(user?.name || "Juan Dela Cruz");
  const [playerPhone, setPlayerPhone] = useState(user?.phone || "+63 917 123 4567");
  const [playerEmail, setPlayerEmail] = useState(user?.email || "player@picklers.ph");
  const [isEditingContact, setIsEditingContact] = useState(false);

  // Generated Booking Reference
  const bookingReference = useMemo(() => {
    return `PKL-${Math.floor(100000 + Math.random() * 900000)}`;
  }, []);

  // Timer countdown hook (1 min = 60s)
  useEffect(() => {
    if (stage !== "idle" || isExpired) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [stage, isExpired]);

  // Restart Hold Timer
  const handleRehold = () => {
    setTimeLeft(60);
    setIsExpired(false);
    showToast("Court hold renewed for 1 minute!", "success");
  };

  // Pricing calculations
  const hours = Math.max(1, slotHours(selectedStartTime, selectedEndTime));
  const subtotal = hours * data.court.price;
  const fee = Math.round(subtotal * 0.08);
  const total = subtotal + fee;

  const dateLabel = new Date(selectedDate + "T00:00:00").toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });

  // Generate 14 days for date picker
  const upcomingDates = useMemo(() => {
    return Array.from({ length: 14 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      return d;
    });
  }, []);

  // Auto-adjust draft end time if start time moves past it
  useEffect(() => {
    if (slotIndex(draftStartTime) >= slotIndex(draftEndTime)) {
      const nextSlot = TIME_SLOTS[slotIndex(draftStartTime) + 1] || TIME_SLOTS[TIME_SLOTS.length - 1];
      if (nextSlot) setDraftEndTime(nextSlot);
    }
  }, [draftStartTime, draftEndTime]);

  // Open edit modal
  const openEditModal = () => {
    setDraftDate(new Date(selectedDate + "T00:00:00"));
    setDraftStartTime(selectedStartTime);
    setDraftEndTime(selectedEndTime);
    setShowEditSlotModal(true);
  };

  // Apply edited slot
  const applySlotChanges = () => {
    setSelectedDate(draftDate.toISOString().split("T")[0]);
    setSelectedStartTime(draftStartTime);
    setSelectedEndTime(draftEndTime);
    setShowEditSlotModal(false);
    showToast("Booking schedule updated!", "success");
  };

  async function handleConfirmPayment() {
    if (user?.isDemo || user?.role === "demo") {
      showToast("This is a demo — sign up to book for real!", "error");
      return;
    }
    setStage("processing");
    try {
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([20, 10, 40]);
      }

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          facility_id: data.facility.id,
          court_id: data.court.id,
          court_name: data.court.name,
          date: selectedDate,
          startTime: selectedStartTime,
          endTime: selectedEndTime,
          duration: `${hours}h`,
          price: total,
          paymentMethod: method,
          player_name: playerName,
          player_phone: playerPhone,
          player_email: playerEmail,
          booking_ref: bookingReference,
        }),
      });

      const responseData = await res.json();
      if (!res.ok || responseData.error) {
        setStage("failed");
        setErrorMsg(responseData.error || "Booking transaction failed. Please try again.");
        return;
      }

      const insertedBooking = responseData.booking;
      if (insertedBooking) {
        setBookings((prev) => [
          {
            id: String(insertedBooking.id || bookingReference),
            facility_id: Number(insertedBooking.facility_id || data.facility.id),
            facility: String((insertedBooking.facilities as { name?: string })?.name || data.facility.name),
            court: String(insertedBooking.court_name || data.court.name),
            court_name: String(insertedBooking.court_name || data.court.name),
            date: String(insertedBooking.date || selectedDate),
            time: String(insertedBooking.time || `${selectedStartTime} – ${selectedEndTime}`),
            duration: String(insertedBooking.duration || `${hours}h`),
            price: Number(insertedBooking.price || total),
            status: "upcoming",
            players: [],
          },
          ...prev,
        ]);
      }

      // Update react-query cache for owner view
      const newRequest = {
        id: bookingReference,
        player_name: playerName,
        account_name: user?.name || user?.email?.split('@')[0] || "Verified Player",
        player_phone: playerPhone,
        player_email: playerEmail,
        court_name: data.court.name,
        time: `${selectedDate} · ${selectedStartTime} – ${selectedEndTime}`,
        total: total,
      };
      queryClient.setQueryData(['bookingRequests'], (old: unknown) => [newRequest, ...((old as Record<string, unknown>[]) || [])]);

      // Optimistically update facility courts for instant UI reflection
      queryClient.setQueryData(['courts', data.facility.id], (old: CourtData[] | undefined) => {
        if (!old) return old;
        return old.map((c) => {
          if (c.id === data.court.id || c.name === data.court.name) {
            return {
              ...c,
              status: "occupied" as const,
              occupiedBy: playerName,
              occupiedFrom: selectedStartTime,
              occupiedUntil: selectedEndTime,
            };
          }
          return c;
        });
      });
      queryClient.invalidateQueries({ queryKey: ['courts', data.facility.id] });
      queryClient.invalidateQueries({ queryKey: ['liveCourts'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });

      setStage("success");

      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#00D98B', '#00D4FF', '#FFD700', '#FF453A'],
        });
      } catch (cErr) {
        console.warn("Confetti trigger warning:", cErr);
      }
    } catch (err: unknown) {
      console.error(err);
      setStage("failed");
      setErrorMsg("Failed to connect to the database. Please try again.");
    }
  }

  const copyRefToClipboard = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(bookingReference);
      setCopiedRef(true);
      showToast("Booking reference copied!", "success");
      setTimeout(() => setCopiedRef(false), 2500);
    }
  };

  const ctaLabel = method === "cash"
    ? `Reserve Court (Pay ₱${total.toLocaleString()} on Site)`
    : `Pay ₱${total.toLocaleString()} with ${method === "gcash" ? "GCash" : method === "maya" ? "Maya" : "Pickle Credits"}`;

  return (
    <FocusTrap
      ariaLabel="Court booking payment"
      className="fixed inset-0 z-[250] bg-background overflow-y-auto"
    >
      <AnimatePresence mode="wait">
      {stage === "success" ? (
        <motion.div
          key="success"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex flex-col items-center justify-center min-h-[85vh] px-6 py-10 text-center"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 30, delay: 0.1 }}
            className="w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(16,185,129,0.3)]"
            style={{ background: "rgba(52,211,153,0.15)", border: "2px solid rgba(34,197,94,0.4)" }}
          >
            <motion.svg
              className="w-12 h-12 text-emerald-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <motion.path
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
                d="M20 6L9 17l-5-5"
              />
            </motion.svg>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, ease: "easeOut" }}
            className="max-w-md w-full"
          >
            <h2 className="text-3xl font-extrabold tracking-tight mb-2 text-foreground">BOOKING CONFIRMED!</h2>
            <p className="text-muted-foreground text-sm mb-1">
              <span className="text-foreground font-semibold">{data.court.name}</span> at {data.facility.name}
            </p>
            <p className="text-muted-foreground text-sm mb-6">
              {dateLabel} · {selectedStartTime} – {selectedEndTime}
            </p>

            {/* Official Booking Reference Card */}
            <div className="rounded-2xl p-4 mb-6 border bg-surface-interactive/60 border-border dark:bg-white/[0.04] dark:border-white/10 shadow-lg text-left">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Booking Reference</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase">Paid & Verified</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xl sm:text-2xl font-mono font-extrabold tracking-wider text-cyan-400">
                  {bookingReference}
                </span>
                <button
                  type="button"
                  onClick={copyRefToClipboard}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-border bg-background hover:bg-surface-interactive text-foreground transition-all active:scale-95 cursor-pointer"
                >
                  {copiedRef ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2 border-t border-border/50 pt-2">
                Present this reference code or your QR pass upon arrival at {data.facility.name}.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  router.push("/app/bookings");
                  onDone();
                }}
                className="flex-1 py-3.5 rounded-xl font-bold text-sm text-white active:scale-[0.97] shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                style={{ background: "var(--accent-success)" }}
              >
                View in Bookings
              </button>
              <button
                onClick={onDone}
                className="py-3.5 px-6 rounded-xl font-bold text-sm border border-border bg-surface-interactive text-foreground hover:bg-surface-interactive/80 active:scale-[0.97] transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : stage === "failed" ? (
        <motion.div
          key="failed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 30, delay: 0.1 }}
            className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
            style={{ background: "rgba(239,68,68,0.15)", border: "2px solid rgba(239,68,68,0.4)" }}
          >
            <AlertCircle className="w-12 h-12 text-red-500" strokeWidth={2} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, ease: "easeOut" }}
          >
            <h2 className="text-2xl font-bold mb-2 text-foreground">PAYMENT FAILED</h2>
            <p className="text-muted-foreground text-sm mb-8 max-w-[280px] mx-auto">
              {errorMsg || "Your payment could not be processed at this time."}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setStage("idle")}
                className="px-6 py-3 rounded-xl font-semibold text-sm text-white active:scale-[0.97] cursor-pointer"
                style={{ background: "var(--accent-primary)" }}
              >
                Try Again
              </button>
              <button
                onClick={onBack}
                className="px-6 py-3 rounded-xl font-semibold text-sm border border-border bg-surface-raised text-foreground active:scale-[0.97] cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : (
        <motion.div
          key="idle"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ ease: "easeOut", duration: 0.22 }}
          className="min-h-full pb-12"
        >
          {/* Header */}
          <div className="sticky top-0 z-20 bg-surface-base/95 dark:bg-[#080f2e]/95 backdrop-blur-md border-b border-border">
            <div className="flex items-center justify-between px-4 sm:px-8 py-4 max-w-6xl mx-auto w-full">
              <div className="flex items-center gap-3">
                <button
                  onClick={onBack}
                  aria-label="Go Back to Courts"
                  className="group flex items-center justify-center shrink-0 w-10 h-10 rounded-full transition-all active:scale-95 shadow-sm bg-surface-interactive border border-border text-muted-foreground hover:bg-black/5 hover:text-foreground dark:bg-white/[0.03] dark:border-white/[0.08] dark:hover:bg-white/[0.08] cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" />
                </button>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold leading-none tracking-tight">CHECKOUT</h1>
                  <p className="text-xs text-muted-foreground mt-0.5">Review and complete your booking</p>
                </div>
              </div>

              {/* 1-Minute Hold Badge in Header */}
              <div
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-colors shadow-sm",
                  timeLeft <= 20
                    ? "bg-red-500/15 border-red-500/30 text-red-500 animate-pulse"
                    : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                )}
              >
                <Clock className="w-3.5 h-3.5" />
                <span className="font-mono font-extrabold tracking-wider">
                  00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
                </span>
              </div>
            </div>

            {/* 1-Minute Top Court Hold Notification Banner */}
            <div
              className={cn(
                "px-4 py-2 text-center text-xs font-semibold border-t flex items-center justify-center gap-2 transition-all",
                timeLeft <= 20
                  ? "bg-red-500/10 border-red-500/20 text-red-400"
                  : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              )}
            >
              <span className="w-2 h-2 rounded-full bg-current animate-ping" />
              <span>
                {timeLeft <= 20
                  ? `Hurry! Slot held for ${timeLeft}s before releasing to other players`
                  : `Court held for 1 min (00:${timeLeft < 10 ? `0${timeLeft}` : timeLeft}) — Reserved exclusively for you`}
              </span>
            </div>
          </div>

          {/* Main 2-Column Responsive Layout */}
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="lg:grid lg:grid-cols-12 lg:gap-8 lg:items-start">
              
              {/* LEFT COLUMN: Booking Details, Schedule, Contact, Cancellation Policy (7 Cols) */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Court & Venue Hero Summary */}
                <div className="relative rounded-2xl overflow-hidden mb-8 shadow-sm">
                  <div className="h-40 sm:h-48 relative overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-black">
                    {!imgError && data.facility.image ? (
                      <Image
                        src={data.facility.image}
                        alt={data.facility.name}
                        layout="fill"
                        className="object-cover"
                        onError={() => setImgError(true)}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-between px-6 bg-gradient-to-br from-blue-900/60 via-indigo-950/80 to-slate-950">
                        <div className="relative z-10">
                          <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-400">Picklers Venue</span>
                          <h4 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{data.facility.name}</h4>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-lg">
                          {data.facility.name.slice(0, 2).toUpperCase()}
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                    <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between">
                      <div>
                        <div className="text-sm text-white/80 font-medium mb-1">{data.facility.name}</div>
                        <div className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
                          {data.court.name}
                          <span
                            className="text-xs px-2.5 py-1 rounded-md font-bold tracking-wide"
                            style={{
                              background: data.court.type === "Indoor" ? "rgba(59,130,246,0.2)" : "rgba(251,191,36,0.2)",
                              color: data.court.type === "Indoor" ? "#60a5fa" : "#fbbf24",
                              border: data.court.type === "Indoor" ? "1px solid rgba(59,130,246,0.3)" : "1px solid rgba(251,191,36,0.3)"
                            }}
                          >
                            {data.court.type}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-white/90 bg-black/40 px-3 py-1.5 rounded-lg backdrop-blur-md border border-white/10 hidden sm:block">
                        {data.court.surface} Surface
                      </span>
                    </div>
                  </div>
                </div>

                {/* Unified Booking Details Section */}
                <div className="flex flex-col gap-6 pt-2">
                  {/* Schedule */}
                  <div className="flex items-start justify-between gap-4 pb-6 border-b border-border/60">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-surface-interactive border border-border flex items-center justify-center shrink-0">
                        <Calendar className="w-5 h-5 text-foreground" />
                      </div>
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Date & Time</div>
                        <div className="text-base font-bold text-foreground mb-0.5">{dateLabel}</div>
                        <div className="text-[15px] font-medium text-foreground/80 flex items-center gap-2">
                          {selectedStartTime} – {selectedEndTime}
                          <span className="w-1 h-1 rounded-full bg-border" />
                          <span className="text-muted-foreground">{hours} Hour{hours > 1 ? "s" : ""}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={openEditModal}
                      className="px-4 py-2 rounded-xl text-[13px] font-bold border border-border bg-surface-base hover:bg-surface-interactive text-foreground transition-all active:scale-[0.97] cursor-pointer shadow-sm"
                    >
                      Edit
                    </button>
                  </div>

                  {/* "Booked For" Player Contact Details */}
                  <div className="flex items-start justify-between gap-4 pb-6 border-b border-border/60">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 rounded-2xl bg-surface-interactive border border-border flex items-center justify-center shrink-0">
                        <User className="w-5 h-5 text-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Pass Issued To</div>
                        
                        {isEditingContact ? (
                          <div className="space-y-4 pt-2">
                            <div>
                              <label className="text-[11px] font-bold text-muted-foreground mb-1.5 block">Display Name / Nickname</label>
                              <input
                                type="text"
                                value={playerName}
                                onChange={(e) => setPlayerName(e.target.value)}
                                placeholder="e.g. PICKLERS Dev, Juan D., etc."
                                className="w-full px-4 py-3 text-sm rounded-xl bg-surface-interactive border border-border text-foreground focus:outline-none focus:border-foreground/30 transition-colors"
                              />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="text-[11px] font-bold text-muted-foreground block mb-1.5">Mobile Number</label>
                                <input
                                  type="text"
                                  value={playerPhone}
                                  onChange={(e) => setPlayerPhone(e.target.value)}
                                  placeholder="+63 917 123 4567"
                                  className="w-full px-4 py-3 text-sm rounded-xl bg-surface-interactive border border-border text-foreground focus:outline-none focus:border-foreground/30 transition-colors"
                                />
                              </div>
                              <div>
                                <label className="text-[11px] font-bold text-muted-foreground block mb-1.5">Email Address</label>
                                <input
                                  type="email"
                                  value={playerEmail}
                                  onChange={(e) => setPlayerEmail(e.target.value)}
                                  placeholder="player@example.com"
                                  className="w-full px-4 py-3 text-sm rounded-xl bg-surface-interactive border border-border text-foreground focus:outline-none focus:border-foreground/30 transition-colors"
                                />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="text-base font-bold text-foreground mb-0.5 truncate">{playerName}</div>
                            <div className="text-[13px] text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1">
                              <span>{playerPhone}</span>
                              <span className="w-1 h-1 rounded-full bg-border" />
                              <span className="truncate">{playerEmail}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsEditingContact(!isEditingContact)}
                      className="px-4 py-2 rounded-xl text-[13px] font-bold border border-border bg-surface-base hover:bg-surface-interactive text-foreground transition-all active:scale-[0.97] cursor-pointer shadow-sm shrink-0"
                    >
                      {isEditingContact ? "Save" : "Edit"}
                    </button>
                  </div>

                  {/* 🛡️ 10-Minute Free Cancellation Guarantee */}
                  <div className="flex items-start gap-4 pb-2">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="text-[14px] font-bold text-foreground">Free Cancellation Guarantee</div>
                        <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                          100% Refund
                        </span>
                      </div>
                      <p className="text-[13px] text-muted-foreground leading-relaxed max-w-md">
                        Cancel up to 10 minutes before your schedule for a full 100% instant refund directly to your wallet or original payment method.
                      </p>
                    </div>
                  </div>
                </div>

              </div>

              {/* RIGHT COLUMN: Payment Method, Order Summary, Pay CTA (5 Cols Sticky) */}
              <div className="lg:col-span-5 space-y-8 mt-10 lg:mt-0 sticky lg:top-24 lg:pl-4">
                
                {/* Payment Method Selector */}
                <div>
                  <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-4">
                    Payment Method
                  </h3>
                  <div className="flex flex-col gap-2">
                    {(
                      [
                        {
                          id: "gcash",
                          label: "GCash",
                          sub: "Instant online e-wallet payment",
                          icon: <img src="/gcash.svg" alt="GCash" className="w-[115%] h-[115%] object-contain" />,
                          iconBg: "#fff",
                          recommended: true,
                        },
                        {
                          id: "maya",
                          label: "Maya",
                          sub: "Pay via Maya wallet / QR Ph",
                          icon: <span className="font-black text-[14px] tracking-tighter" style={{ color: "#000", fontFamily: "system-ui, sans-serif" }}>maya</span>,
                          iconBg: "#42d6a4",
                          recommended: false,
                        },
                        {
                          id: "credits",
                          label: "Pickle Credits",
                          sub: `Balance: ₱1,200 available`,
                          icon: <Coins className="w-5 h-5 text-emerald-500" strokeWidth={2} />,
                          iconBg: "rgba(16,185,129,0.1)",
                          recommended: false,
                        },
                        {
                          id: "cash",
                          label: "Cash on Site",
                          sub: "Pay at venue reception counter",
                          icon: <Banknote className="w-5 h-5 text-foreground" strokeWidth={2} />,
                          iconBg: "rgba(150,150,150,0.1)",
                          recommended: false,
                        },
                      ] as const
                    ).map((opt) => {
                      const isSelected = method === opt.id;
                      const optionNode = (
                        <button
                          type="button"
                          onClick={() => setMethod(opt.id)}
                          className={cn(
                            "flex items-center gap-4 p-3.5 rounded-2xl w-full text-left transition-all active:scale-[0.98] cursor-pointer",
                            isSelected
                              ? "bg-surface-interactive ring-1 ring-border shadow-sm"
                              : "hover:bg-surface-interactive/50"
                          )}
                        >
                          <div
                            className={cn(
                              "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 overflow-hidden shadow-sm border border-black/5 transition-transform",
                              isSelected ? "scale-105" : ""
                            )}
                            style={{ background: opt.iconBg }}
                          >
                            {opt.icon}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-[15px] font-bold text-foreground">
                                {opt.label}
                              </span>
                              {opt.recommended && (
                                <span className="text-[9px] px-2 py-0.5 rounded-md font-bold tracking-wider uppercase bg-emerald-500/10 text-emerald-500 dark:text-emerald-400">
                                  Recommended
                                </span>
                              )}
                            </div>
                            <div className="text-[12px] text-muted-foreground font-medium truncate">
                              {opt.sub}
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center justify-center pl-2">
                            {isSelected ? (
                              <div className="w-5 h-5 rounded-full bg-foreground text-background flex items-center justify-center shadow-sm">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-full border-2 border-border" />
                            )}
                          </div>
                        </button>
                      );

                      return (
                        <div key={opt.id}>
                          {opt.id === "cash" ? (
                            <LockedFeatureWrapper featureLabel="use Cash on Site payment" showLockIcon={false}>
                              {optionNode}
                            </LockedFeatureWrapper>
                          ) : (
                            optionNode
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Order Summary & CTA */}
                <div className="pt-6 border-t border-border/60">
                  <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-4">
                    Order Summary
                  </h3>
                  
                  <div className="space-y-3 text-[14px] mb-6">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground font-medium">Court rental ({hours}h × ₱{data.court.price})</span>
                      <span className="font-mono font-semibold text-foreground">₱{subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground font-medium">Platform service fee (8%)</span>
                      <span className="font-mono text-muted-foreground">₱{fee.toLocaleString()}</span>
                    </div>
                    <div className="flex items-end justify-between pt-4 mt-4 border-t border-border">
                      <div>
                        <span className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Total Due</span>
                        <span className="block text-[10px] text-muted-foreground/80">Includes all taxes & fees</span>
                      </div>
                      <span className="text-3xl font-extrabold font-mono tracking-tight text-foreground">₱{total.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Pay CTA Button (in-flow for both mobile and desktop) */}
                  <button
                    type="button"
                    onClick={handleConfirmPayment}
                    disabled={stage === "processing" || isExpired}
                    className="w-full py-4.5 rounded-xl font-bold text-[16px] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2.5 transition-all shadow-sm cursor-pointer"
                    style={{
                      background: isExpired ? "var(--surface-interactive)" : "var(--foreground)",
                      color: isExpired ? "var(--background)" : "var(--background)",
                      border: isExpired ? "1px solid var(--border)" : "none"
                    }}
                  >
                    {stage === "processing" ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                          className="w-5 h-5 border-2 border-background/20 border-t-background rounded-full"
                        />
                        <span>Processing…</span>
                      </>
                    ) : isExpired ? (
                      <>
                        <RefreshCw className="w-5 h-5" />
                        <span>Hold Expired — Re-hold</span>
                      </>
                    ) : (
                      <>
                        <span>{ctaLabel}</span>
                      </>
                    )}
                  </button>
                  <p className="text-center text-[10px] text-muted-foreground font-medium mt-3">
                    By confirming, you agree to Picklers' Terms of Service and Cancellation Policy.
                  </p>
                </div>

              </div>

            </div>
          </div>

          {/* ⏱️ 1-Minute Hold Expired Action Sheet */}
          <AnimatePresence>
            {isExpired && stage === "idle" && (
              <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] dark:bg-black/50">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="w-full max-w-sm rounded-[24px] overflow-hidden bg-surface-base dark:bg-[#13223F] border border-border dark:border-white/12 shadow-[0_25px_60px_rgba(0,0,0,0.5)] p-6 text-center"
                >
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-amber-400 animate-pulse" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-1">1-Minute Hold Expired</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-6">
                    Your 1-minute court reservation window has ended. Would you like to re-hold <span className="text-foreground font-semibold">{data.court.name}</span> for another minute?
                  </p>
                  <div className="flex flex-col gap-2.5">
                    <button
                      onClick={handleRehold}
                      className="w-full py-3.5 rounded-xl text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-400 active:scale-95 transition-all shadow-lg cursor-pointer"
                    >
                      Re-hold Court (1 Minute)
                    </button>
                    <button
                      onClick={onBack}
                      className="w-full py-3 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground bg-surface-interactive border border-border active:scale-95 transition-all cursor-pointer"
                    >
                      Back to Court Selection
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* ✏️ High-Fidelity Change Schedule Sheet (Matching QuickBookModal) */}
          <AnimatePresence>
            {showEditSlotModal && (
              <>
                {/* Backdrop */}
                <motion.div
                  key="editSlotBackdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowEditSlotModal(false)}
                  className="fixed inset-0 z-[600] bg-black/40 backdrop-blur-[2px] dark:bg-black/50"
                />

                {/* Sheet positioned as bottom sheet on mobile, centered modal on desktop */}
                <motion.div
                  key="editSlotSheet"
                  initial={{ y: "100%", opacity: 0.8 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: "100%", opacity: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  className="fixed bottom-0 left-0 right-0 sm:inset-0 sm:m-auto sm:max-w-[440px] sm:h-fit sm:rounded-[32px] sm:border-b z-[610] rounded-t-[32px] overflow-hidden flex flex-col bg-surface-overlay dark:bg-[#13223F] border border-b-0 border-border dark:border-white/12 shadow-[0_25px_60px_rgba(0,0,0,0.5)] max-h-[88vh] h-auto"
                >
                  {/* Handle + Header */}
                  <div className="flex flex-col items-center pt-3 pb-2 px-6 sticky top-0 z-20 bg-surface-overlay/95 backdrop-blur-[20px]">
                    <div className="w-12 h-1.5 rounded-full mb-3 bg-muted-foreground/20" />
                    <div className="flex items-center justify-between w-full pb-2.5 border-b border-border">
                      <div className="min-w-0 pr-2">
                        <h2 className="text-[19px] font-extrabold tracking-wide text-foreground leading-tight">CHANGE SCHEDULE</h2>
                        <p className="text-[13px] font-semibold text-muted-foreground truncate max-w-[260px]">{data.court.name} · {data.facility.name}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowEditSlotModal(false)}
                        aria-label="Close"
                        className="w-8.5 h-8.5 shrink-0 flex items-center justify-center rounded-full hover:scale-105 active:scale-95 transition-all border border-border bg-surface-interactive text-foreground hover:bg-surface-interactive/80 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Body Container */}
                  <div className="px-6 pt-2.5 pb-[max(env(safe-area-inset-bottom),28px)] flex flex-col justify-between flex-1 overflow-hidden">
                    <div className="space-y-3.5">
                      {/* Date Scroller */}
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <CalendarDays className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
                          <label className="text-[11.5px] font-bold text-foreground/80 uppercase tracking-wider">
                            Select Date
                          </label>
                        </div>
                        <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none -mx-6 px-6">
                          {upcomingDates.map((d, i) => {
                            const isSelected = d.toDateString() === draftDate.toDateString();
                            const dayName = new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(d);
                            const dateNum = d.getDate();
                            const monthName = new Intl.DateTimeFormat("en-US", { month: "short" }).format(d);

                            return (
                              <button
                                key={i}
                                type="button"
                                onClick={() => setDraftDate(d)}
                                className={`shrink-0 flex flex-col items-center justify-center w-[56px] h-[68px] rounded-[15px] transition-all relative overflow-hidden group cursor-pointer border ${
                                  isSelected
                                    ? "border-blue-500 shadow-md ring-1 ring-blue-500/50"
                                    : "bg-surface-interactive border-border text-foreground hover:bg-surface-interactive/80"
                                }`}
                              >
                                {isSelected && (
                                  <motion.div
                                    layoutId="draftDateHighlight"
                                    className="absolute inset-0 bg-gradient-to-b from-blue-600 to-cyan-600"
                                  />
                                )}
                                <span
                                  className={`relative z-10 text-[10.5px] font-bold uppercase tracking-wide mb-0.5 ${
                                    isSelected ? "text-white/95" : "text-muted-foreground"
                                  }`}
                                >
                                  {dayName}
                                </span>
                                <span
                                  className={`relative z-10 text-[18px] font-extrabold leading-none ${
                                    isSelected ? "text-white" : "text-foreground"
                                  }`}
                                >
                                  {dateNum}
                                </span>
                                <span
                                  className={`relative z-10 text-[9.5px] font-bold mt-0.5 ${
                                    isSelected ? "text-white/90" : "text-muted-foreground"
                                  }`}
                                >
                                  {monthName}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Vertical Apple-Style Time Scrollers */}
                      <div className="flex gap-3.5">
                        <TimeScroller
                          layoutId="draftStartHighlight"
                          label="Start Time"
                          icon={Clock}
                          colorClass="text-emerald-500 dark:text-emerald-400"
                          highlightClass="bg-emerald-500"
                          shadowClass="shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                          options={TIME_SLOTS.slice(0, -2)}
                          value={draftStartTime}
                          onChange={setDraftStartTime}
                        />

                        <TimeScroller
                          layoutId="draftEndHighlight"
                          label="End Time"
                          icon={Clock}
                          colorClass="text-red-500 dark:text-red-400"
                          highlightClass="bg-red-500"
                          shadowClass="shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                          options={TIME_SLOTS.slice(1)}
                          value={draftEndTime}
                          onChange={setDraftEndTime}
                        />
                      </div>

                      {/* Duration & Date/Time Range Card */}
                      {slotHours(draftStartTime, draftEndTime) > 0 && (
                        <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl border bg-emerald-500/10 border-emerald-500/20 backdrop-blur-md">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7.5 h-7.5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                              <Clock className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                            </div>
                            <div>
                              <div className="text-[11px] font-bold text-muted-foreground leading-none mb-0.5">
                                Total Duration
                              </div>
                              <div className="text-[14px] font-extrabold text-foreground leading-tight">
                                {slotHours(draftStartTime, draftEndTime)} hour{slotHours(draftStartTime, draftEndTime) !== 1 ? "s" : ""}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[11.5px] font-bold text-emerald-600 dark:text-emerald-400 leading-none mb-0.5">
                              {draftDate.toLocaleDateString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </div>
                            <div className="text-[13px] font-bold text-foreground leading-tight">
                              {draftStartTime} – {draftEndTime}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Apply Changes Button */}
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={applySlotChanges}
                          disabled={slotHours(draftStartTime, draftEndTime) <= 0}
                          className="w-full h-[52px] rounded-2xl font-extrabold text-[15.5px] active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-2 group relative overflow-hidden shadow-xl transition-all cursor-pointer"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                          <Check className="w-4 h-4 text-white relative z-10" />
                          <span className="text-white relative z-10 tracking-wide">Apply Changes</span>
                          <ChevronRight className="w-4 h-4 text-white/70 relative z-10 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

        </motion.div>
      )}
    </AnimatePresence>
    </FocusTrap>
  );
}
