import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MapPin, Star, Clock, ChevronRight, CalendarDays, Check, AlertTriangle
} from "lucide-react";
import { FACILITIES, FACILITY_COURTS, type CourtData, type PaymentData } from "@/data/mockData";
import { PaymentView } from "@/components/modals/PaymentView";
import { QuickBookModal } from "@/components/modals/QuickBookModal";


export function FacilityDetailView({ facility, onBack }: { facility: typeof FACILITIES[0]; onBack: () => void }) {
  const courts = FACILITY_COURTS[facility.id] ?? [];
  const [filter, setFilter] = useState<"All" | "Indoor" | "Outdoor">("All");
  const [booked, setBooked] = useState<number | null>(null);
  const [bookSuccess, setBookSuccess] = useState<number | null>(null);
  const [quickBookOpen, setQuickBookOpen] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);

  const filtered = filter === "All" ? courts : courts.filter(c => c.type === filter);
  const hasIndoor = courts.some(c => c.type === "Indoor");
  const hasOutdoor = courts.some(c => c.type === "Outdoor");

  function handleBook(courtId: number) {
    const court = courts.find(c => c.id === courtId);
    if (!court) return;
    setBooked(courtId);
    const today = new Date().toISOString().split("T")[0];
    setTimeout(() => {
      setBooked(null);
      setPaymentData({ court, facility, date: today, startTime: "8:00 AM", endTime: "10:00 AM" });
    }, 700);
  }

  function handleQuickBook(court: CourtData, date: string, startTime: string, endTime: string) {
    setQuickBookOpen(false);
    setPaymentData({ court, facility, date, startTime, endTime });
  }

  const available = courts.filter(c => c.status === "available").length;
  const occupied = courts.filter(c => c.status === "occupied").length;

  // Show payment view
  if (paymentData) {
    return (
      <PaymentView
        data={paymentData}
        onBack={() => setPaymentData(null)}
        onDone={() => { setPaymentData(null); }}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ ease: "easeOut", duration: 0.22 }}
      className="min-h-full"
    >
      {/* Hero image */}
      <div className="relative h-52 sm:h-64 overflow-hidden bg-secondary">
        <img src={facility.image} alt={facility.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(8,15,46,0.9) 0%, rgba(8,15,46,0.2) 60%, transparent 100%)" }} />

        {/* Back button */}
        <button onClick={onBack} aria-label="Back to courts"
          className="absolute top-4 left-4 flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium"
          style={{ background: "rgba(8,15,46,0.7)", backdropFilter: "blur(12px)", border: "1px solid rgba(0,212,255,0.2)", color: "#e8eeff", transition: "background-color 150ms ease-out" }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(8,15,46,0.9)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(8,15,46,0.7)")}>
          <ChevronRight className="w-4 h-4 rotate-180" />
          Discover Courts
        </button>

        {/* Facility name overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-black/50 backdrop-blur-sm text-white border border-white/20">
                  {facility.type}
                </span>
                <div className="flex items-center gap-1 text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span className="text-xs font-mono text-white">{facility.rating}</span>
                </div>
              </div>
              <h1 className="text-xl font-bold text-white leading-tight" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                {facility.name}
              </h1>
              <div className="flex items-center gap-1 mt-0.5 text-blue-200 text-xs">
                <MapPin className="w-3 h-3 shrink-0" />{facility.location}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-xs text-blue-200 mb-0.5">from</div>
              <div className="text-xl font-bold text-cyan-400 font-mono leading-none">
                ₱{Math.min(...courts.map(c => c.price))}
              </div>
              <div className="text-xs text-blue-200">/hr</div>
            </div>
          </div>
        </div>
      </div>

      {/* Info strip + Quick Book CTA */}
      <div className="border-b border-border" style={{ background: "rgba(15,29,71,0.5)" }}>
        <div className="flex items-center gap-4 px-6 py-3 overflow-x-auto">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
            <Clock className="w-3.5 h-3.5 shrink-0" />{facility.hours}
          </div>
          <div className="w-px h-4 bg-border shrink-0" />
          <div className="text-xs text-muted-foreground font-mono shrink-0">🏍 {facility.moto} · 🚗 {facility.car}</div>
          <div className="w-px h-4 bg-border shrink-0" />
          <div className="flex items-center gap-3 shrink-0">
            <span className="flex items-center gap-1 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              <span className="text-emerald-400 font-medium">{available} free</span>
            </span>
            <span className="flex items-center gap-1 text-xs">
              <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
              <span className="text-muted-foreground">{occupied} occupied</span>
            </span>
          </div>
        </div>

      </div>

      <div className="p-6">
        {/* Section header — COURTS left, Quick Book right */}
        <div className="flex items-start justify-between gap-4 mb-5">
          {/* Left: heading + optional type filter */}
          <div className="min-w-0">
            <h2 className="text-lg font-bold" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              COURTS <span className="text-muted-foreground font-normal text-sm">({courts.length})</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">Select a court to book</p>
            {(hasIndoor && hasOutdoor) && (
              <div className="flex rounded-xl overflow-hidden mt-3 w-fit" style={{ border: "1px solid rgba(0,212,255,0.15)" }}>
                {(["All", "Indoor", "Outdoor"] as const).map(opt => (
                  <button key={opt} onClick={() => setFilter(opt)}
                    className="px-3 py-1.5 text-xs font-medium"
                    style={{
                      background: filter === opt ? "rgba(0,212,255,0.15)" : "transparent",
                      color: filter === opt ? "#00d4ff" : "#6b82b8",
                      transition: "background-color 150ms ease-out, color 150ms ease-out",
                    }}>
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Quick Book compact card */}
          <button
            onClick={() => setQuickBookOpen(true)}
            className="shrink-0 flex items-center justify-between gap-4 px-4 py-3 rounded-2xl active:scale-[0.97]"
            style={{
              background: "linear-gradient(135deg, rgba(0,212,255,0.12) 0%, rgba(0,212,255,0.04) 100%)",
              border: "1px solid rgba(0,212,255,0.28)",
              transition: "border-color 150ms ease-out, box-shadow 150ms ease-out",
              boxShadow: "0 0 0 0 rgba(0,212,255,0)",
              minWidth: "220px",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = "rgba(0,212,255,0.55)";
              e.currentTarget.style.boxShadow = "0 0 20px rgba(0,212,255,0.12)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = "rgba(0,212,255,0.28)";
              e.currentTarget.style.boxShadow = "0 0 0 0 rgba(0,212,255,0)";
            }}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "rgba(0,212,255,0.15)", border: "1px solid rgba(0,212,255,0.2)" }}>
                <CalendarDays className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-cyan-400 leading-tight" style={{ fontFamily: "'Montserrat', sans-serif", letterSpacing: "0.05em" }}>
                  QUICK BOOK
                </div>
                <div className="text-[11px] text-muted-foreground leading-tight mt-0.5">Pick date & time</div>
              </div>
            </div>
            <div className="flex items-center gap-0.5 text-xs font-semibold text-cyan-400 shrink-0">
              Book now <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </button>
        </div>

        {/* Success toast */}
        <AnimatePresence>
          {bookSuccess !== null && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl mb-5"
              style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)" }}>
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-sm text-emerald-400 font-medium">
                Booking confirmed! Check your Bookings tab for details.
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Court cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((court, i) => {
              const isBooked = booked === court.id;
              const isSuccess = bookSuccess === court.id;
              return (
                <motion.div key={court.id} layout
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ delay: i * 0.04, ease: "easeOut" }}
                  className="rounded-xl overflow-hidden"
                  style={{
                    background: "#0f1d47",
                    border: court.status === "available"
                      ? "1px solid rgba(34,197,94,0.2)"
                      : court.status === "occupied"
                      ? "1px solid rgba(0,212,255,0.12)"
                      : "1px solid rgba(107,130,184,0.15)",
                    boxShadow: court.status === "available"
                      ? "0 4px 20px rgba(0,0,0,0.25), 0 0 0 0 rgba(34,197,94,0)"
                      : "0 4px 20px rgba(0,0,0,0.25)",
                  }}>
                  {/* Court header */}
                  <div className="px-4 pt-4 pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-foreground" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                          {court.name}
                        </span>
                        <span className="text-xs px-1.5 py-0.5 rounded-md font-medium"
                          style={{
                            background: court.type === "Indoor" ? "rgba(0,212,255,0.1)" : "rgba(251,191,36,0.1)",
                            color: court.type === "Indoor" ? "#00d4ff" : "#fbbf24",
                          }}>
                          {court.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${
                          court.status === "available" ? "bg-emerald-400 animate-pulse" :
                          court.status === "occupied" ? "bg-red-400" : "bg-amber-400"
                        }`} />
                        <span className="text-xs font-medium"
                          style={{ color: court.status === "available" ? "#22c55e" : court.status === "occupied" ? "#ef4444" : "#f59e0b" }}>
                          {court.status === "available" ? "Available" : court.status === "occupied" ? "Occupied" : "Maintenance"}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground mb-3">{court.surface}</div>

                    {court.status === "occupied" && court.occupiedUntil && (
                      <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg mb-3 text-xs"
                        style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}>
                        <Clock className="w-3 h-3 text-red-400 shrink-0" />
                        <span className="text-red-400">Free at {court.occupiedUntil}</span>
                        {court.occupiedBy && <span className="text-muted-foreground ml-1">· {court.occupiedBy}</span>}
                      </div>
                    )}

                    {court.status === "maintenance" && (
                      <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg mb-3 text-xs"
                        style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)" }}>
                        <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                        <span className="text-amber-400">Temporarily unavailable</span>
                      </div>
                    )}
                  </div>

                  {/* Price + CTA */}
                  <div className="px-4 pb-4 flex items-center justify-between border-t border-border pt-3">
                    <div>
                      <span className="text-xl font-bold font-mono text-cyan-400">₱{court.price}</span>
                      <span className="text-xs text-muted-foreground">/hr</span>
                    </div>

                    <button
                      disabled={court.status !== "available" || isBooked}
                      onClick={() => handleBook(court.id)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        background: court.status !== "available" ? "rgba(255,255,255,0.06)"
                          : isSuccess ? "#22c55e"
                          : "#22c55e",
                        color: court.status !== "available" ? "#6b82b8" : "#fff",
                        transition: "opacity 150ms ease-out, transform 100ms ease-out",
                        minWidth: "100px",
                        justifyContent: "center",
                      }}
                      onMouseEnter={e => { if (court.status === "available" && !isBooked) e.currentTarget.style.opacity = "0.88"; }}
                      onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                    >
                      {isBooked ? (
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.7, ease: "linear" }}
                          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                      ) : court.status === "available" ? (
                        "Book Now"
                      ) : court.status === "occupied" ? (
                        "Occupied"
                      ) : (
                        "Unavailable"
                      )}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Quick Book Modal */}
      {quickBookOpen && (
        <QuickBookModal
          facility={facility}
          courts={courts}
          onClose={() => setQuickBookOpen(false)}
          onBook={handleQuickBook}
        />
      )}
    </motion.div>
  );
}
