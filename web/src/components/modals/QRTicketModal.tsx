"use client";

import { motion, AnimatePresence } from "motion/react";
import { X, CalendarDays, MapPin, Clock, CheckCircle2, ShieldCheck, Share2, Ticket } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { formatFullDate } from "@/lib/timeUtils";
import { QRCodeSVG } from "qrcode.react";

interface QRTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: {
    id: string;
    facility: string;
    court: string;
    date: string;
    time: string;
    duration?: string;
    price?: number;
    total?: number;
    payment?: string;
  } | null;
}

export function QRTicketModal({ isOpen, onClose, booking }: QRTicketModalProps) {
  const { showToast } = useToast();

  if (!isOpen || !booking) return null;

  const ticketRef = booking.id.replace(/[^A-Za-z0-9]/g, '').slice(-8).toUpperCase();
  const fullRef = `PKL-TKT-${ticketRef}`;

  const handleShare = () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({
        title: `Picklers Court Pass — ${booking.facility}`,
        text: `My pickleball reservation at ${booking.facility} (${booking.court}) on ${booking.date} at ${booking.time}. Pass Ref: ${fullRef}`,
      }).catch(() => { });
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(`Picklers Court Pass: ${fullRef}`);
      showToast("Pass reference copied to clipboard!", "success");
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center px-3.5 pt-[50px] pb-[66px] md:py-4 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-md z-0"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        />

        {/* Modal Ticket Card Container */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="relative w-full max-w-[390px] max-h-[92vh] z-10 my-auto flex flex-col"
        >
          <div className="bg-background/95 dark:bg-[#0d1527]/95 backdrop-blur-2xl border border-white/20 dark:border-white/[0.15] rounded-[26px] overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.7)] flex flex-col max-h-full">

            {/* Header */}
            <div className="px-4.5 py-3 border-b border-border dark:border-white/[0.1] flex items-center justify-between bg-surface-interactive/30 dark:bg-white/[0.04] backdrop-blur-md shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-sm">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <span className="text-xs sm:text-sm font-black text-foreground tracking-wide" style={{ fontFamily: "var(--font-montserrat), sans-serif" }}>Digital Court Pass</span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onClose();
                }}
                className="relative z-50 w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-black/20 dark:bg-white/15 hover:bg-black/40 dark:hover:bg-white/30 active:scale-[0.98] transition-[transform,background-color] duration-150 ease-out text-foreground cursor-pointer shrink-0 pointer-events-auto"
                aria-label="Close modal"
              >
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Body Container */}
            <div className="p-3.5 sm:p-5 flex flex-col items-center text-center overflow-y-auto hide-scrollbar">

              {/* QR Code Card */}
              {(() => {
                // Short, low-density payload string for fast & reliable scanning
                const qrPayload = `PICKLERS:PASS:${fullRef}`;

                return (
                  <div className="relative p-3.5 rounded-2xl bg-white shadow-xl border border-black/10 flex flex-col items-center justify-center">
                    <QRCodeSVG
                      value={qrPayload}
                      size={160}
                      level="H"
                      marginSize={0}
                      includeMargin={false}
                      imageSettings={{
                        src: "/PICKLERS_OFFICIAL_LOGO.svg",
                        x: undefined,
                        y: undefined,
                        height: 34,
                        width: 34,
                        excavate: true,
                      }}
                    />
                    <div className="mt-2 flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                      <Ticket className="w-3 h-3 text-emerald-600" /> {fullRef}
                    </div>
                  </div>
                );
              })()}

              <h3 className="text-sm sm:text-base font-black text-foreground mt-3 mb-0.5 tracking-tight">
                {booking.court}
              </h3>
              <div className="text-xs font-bold text-emerald-400 mb-2 flex items-center justify-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> {booking.facility}
              </div>

              {/* 2-Column Info Grid */}
              <div className="w-full grid grid-cols-2 gap-2 sm:gap-2.5 p-2.5 sm:p-3 rounded-2xl bg-surface-interactive/30 dark:bg-white/[0.04] backdrop-blur-md border border-border dark:border-white/[0.1] text-left">
                <div>
                  <div className="text-[10px] sm:text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider flex items-center gap-1 mb-0.5">
                    <CalendarDays className="w-3 h-3 text-cyan-400" /> Date
                  </div>
                  <div className="text-xs sm:text-sm font-black text-foreground truncate">{formatFullDate(booking.date)}</div>
                </div>
                <div>
                  <div className="text-[10px] sm:text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider flex items-center gap-1 mb-0.5">
                    <Clock className="w-3 h-3 text-amber-400" /> Time
                  </div>
                  <div className="text-xs sm:text-sm font-black text-foreground truncate">{booking.time}</div>
                </div>
              </div>

              {/* Action Buttons — Seamessly below Info Grid */}
              <div className="flex gap-2.5 w-full mt-3">
                <button
                  type="button"
                  onClick={handleShare}
                  className="flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-secondary dark:bg-white/10 border border-border dark:border-white/10 text-foreground hover:bg-secondary/80 dark:hover:bg-white/15 transition-[transform,background-color] duration-150 ease-out flex items-center justify-center gap-1.5 active:scale-[0.98] shadow-sm"
                >
                  <Share2 className="w-3.5 h-3.5 text-muted-foreground" /> Share
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-[transform,background-color] duration-150 ease-out flex items-center justify-center gap-1.5 active:scale-[0.98] shadow-sm"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Done
                </button>
              </div>

            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
