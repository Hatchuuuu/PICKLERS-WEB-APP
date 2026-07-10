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
  const [imgLoaded, setImgLoaded] = useState(false);

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

  if (paymentData) {
    return (
      <PaymentView
        data={paymentData}
        onBack={() => setPaymentData(null)}
        onDone={() => { 
          setBookSuccess(paymentData.court.id);
          setPaymentData(null);
          // Auto clear success message after 5 seconds
          setTimeout(() => setBookSuccess(null), 5000);
        }}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ ease: [0.23, 1, 0.32, 1], duration: 0.4 }}
      className="min-h-full bg-background"
    >
      {/* Hero image with cinematic gradient */}
      <div className="relative h-72 sm:h-96 overflow-hidden bg-surface-raised">
        {/* Base Skeleton */}
        {!imgLoaded && (
          <motion.div 
            className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" 
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          />
        )}
        
        <motion.img 
          src={facility.image} 
          alt={facility.name} 
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: imgLoaded ? 1 : 0, scale: imgLoaded ? 1 : 1.05 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          onLoad={() => setImgLoaded(true)}
          className="w-full h-full object-cover" 
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, #0A1118 0%, rgba(10,17,24,0.4) 40%, transparent 100%)" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(10,17,24,0.5) 0%, transparent 40%)" }} />

        {/* Premium Frosted Back Button */}
        <button onClick={onBack} aria-label="Back to courts"
          className="absolute top-6 left-6 flex items-center gap-1.5 pr-5 pl-3 min-h-[44px] rounded-full text-[14px] font-bold text-foreground transition-all active:scale-95 shadow-[0_8px_32px_rgba(0,0,0,0.4)] group"
          style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.18)" }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,0,0,0.6)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(0,0,0,0.4)")}>
          <ChevronRight className="w-5 h-5 rotate-180 transition-transform group-hover:-translate-x-1 opacity-80 group-hover:opacity-100" />
          Discover
        </button>

        {/* Facility name overlay */}
        <div className="absolute bottom-6 left-0 right-0 px-6 sm:px-8">
          <div className="flex items-end justify-between gap-4 max-w-6xl mx-auto w-full">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[11px] px-3 py-1 rounded-full font-bold uppercase tracking-wider text-foreground shadow-lg"
                  style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.2)" }}>
                  {facility.type}
                </span>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full shadow-lg" style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span className="text-[13px] font-bold text-foreground leading-none">{facility.rating}</span>
                </div>
              </div>
              <h1 className="text-[22px] sm:text-4xl font-bold leading-none text-foreground drop-shadow-xl tracking-tight truncate" title={facility.name}>
                {facility.name}
              </h1>
              <div className="flex items-center gap-1.5 mt-2 text-[14px] font-medium text-foreground/80 drop-shadow-md">
                <MapPin className="w-4 h-4 shrink-0" />{facility.location}
              </div>
            </div>
            <div className="text-right shrink-0 pb-1 flex flex-col items-end">
              {courts.length > 0 ? (
                <>
                  <div className="text-[13px] mb-1 font-bold text-foreground/60 uppercase tracking-widest">from</div>
                  <div className="text-4xl sm:text-5xl font-bold font-mono leading-none drop-shadow-2xl" style={{ 
                    background: "linear-gradient(135deg, #00F260 0%, #0575E6 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    filter: "drop-shadow(0px 4px 12px rgba(0,242,96,0.3))"
                  }}>
                    ₱{Math.min(...courts.map(c => c.price))}
                  </div>
                  <div className="text-[13px] mt-1 font-bold text-foreground/60">/hr</div>
                </>
              ) : (
                <div className="px-4 py-2 rounded-full mt-4 shadow-xl" style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.2)" }}>
                  <motion.span className="text-[13px] font-bold tracking-widest uppercase inline-block" 
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                    style={{ 
                      background: "linear-gradient(135deg, #FFFFFF 0%, #A0AABF 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent"
                    }}>Coming Soon</motion.span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Info Pill */}
      <div className="relative z-10 px-4 -mt-4 sm:-mt-6 max-w-6xl mx-auto w-full">
        <div className="flex items-center justify-center gap-4 sm:gap-6 px-6 py-3.5 rounded-full overflow-x-auto scrollbar-none w-max max-w-full mx-auto shadow-2xl border border-border" 
             style={{ background: "rgba(20,30,45,0.8)", backdropFilter: "blur(24px)" }}>
          <div className="flex items-center gap-2 text-[13px] font-bold text-foreground/80 shrink-0">
            <Clock className="w-4 h-4 shrink-0 text-cyan-400" />{facility.hours}
          </div>
          <div className="w-px h-4 shrink-0 bg-surface-interactive" />
          <div className="text-[13px] font-bold text-foreground/80 shrink-0" >🏍 {facility.moto} · 🚗 {facility.car}</div>
          <div className="w-px h-4 shrink-0 bg-surface-interactive" />
          <div className="flex items-center gap-4 shrink-0">
            <span className="flex items-center gap-1.5 text-[13px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,139,0.8)]" />
              <span className="font-bold text-foreground">{available} free</span>
            </span>
            <span className="flex items-center gap-1.5 text-[13px]">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span className="font-bold text-foreground/60">{occupied} occupied</span>
            </span>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-8 max-w-6xl mx-auto w-full mt-4">
        <div className="mb-8">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-2xl font-bold text-foreground flex items-baseline gap-2" >
                COURTS <span className="font-bold text-[16px] text-foreground/40">({courts.length})</span>
              </h2>
              <p className="text-[14px] font-medium mt-1 text-foreground/60">Select a court to book</p>
            </div>
            
            {/* Compact Quick Book Neon Pill */}
            <button
              onClick={() => setQuickBookOpen(true)}
              className="shrink-0 flex items-center justify-center gap-2 px-5 py-2.5 rounded-full active:scale-[0.97] transition-all group relative overflow-hidden shadow-[0_4px_16px_rgba(79,70,229,0.4)]"
            >
              {/* Neon Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <CalendarDays className="w-4 h-4 text-foreground drop-shadow-md relative z-10" />
              <span className="text-[13px] font-bold text-foreground relative z-10" style={{ letterSpacing: "0.02em" }}>
                Quick Book
              </span>
            </button>
          </div>

          {/* iOS-Style Segmented Control */}
          {(hasIndoor && hasOutdoor) && (
            <div className="flex rounded-full overflow-hidden mt-6 w-fit border border-border p-1 gap-1 relative bg-surface-interactive shadow-inner dark:bg-white/[0.05] dark:shadow-[inset_0_2px_10px_rgba(0,0,0,0.2)]">
              {(["All", "Indoor", "Outdoor"] as const).map(opt => (
                <button key={opt} onClick={() => setFilter(opt)}
                  className={`relative px-5 py-2 text-[13px] font-bold rounded-full transition-colors z-10 ${filter === opt ? "text-foreground" : "text-foreground/50 hover:text-foreground/80"}`}
                >
                  {filter === opt && (
                    <motion.div layoutId="segment-pill" className="absolute inset-0 rounded-full shadow-md border border-border bg-surface-base dark:bg-white/[0.15] backdrop-blur-md"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.5 }} />
                  )}
                  <span className="relative z-20">{opt}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <AnimatePresence>
          {bookSuccess !== null && (
            <motion.div initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="flex items-center gap-3 px-6 py-4 rounded-2xl mb-8 border shadow-xl"
              style={{ background: "rgba(16,185,129,0.15)", borderColor: "rgba(16,185,129,0.3)", backdropFilter: "blur(12px)" }}>
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                <Check className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-[14px] font-bold text-emerald-400">
                Booking confirmed! Check your Bookings tab for details.
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {filtered.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="w-full py-16 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-surface-interactive border border-border dark:bg-white/[0.05] dark:border-white/[0.1]">
                <MapPin className="w-6 h-6 text-foreground/30" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1">No {filter} Courts</h3>
              <p className="text-sm text-foreground/50">This facility doesn't have any {filter.toLowerCase()} courts available right now.</p>
              <button onClick={() => setFilter("All")} className="mt-6 text-sm font-bold text-cyan-400 hover:text-cyan-300 transition-colors">
                View all courts
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filtered.map((court, i) => {
              const isBooked = booked === court.id;
              
              const isAvailable = court.status === "available";
              const isOccupied = court.status === "occupied";
              const isMaintenance = court.status === "maintenance";
              
              const statusColor = isAvailable ? "#10B981" : isOccupied ? "#EF4444" : "#F59E0B";
              const glowColor = isAvailable ? "rgba(16,185,129,0.2)" : isOccupied ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)";
                                
              return (
                <motion.div key={court.id} layout
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ delay: i * 0.05, ease: [0.23, 1, 0.32, 1], duration: 0.5 }}
                  className={`rounded-[24px] overflow-hidden border flex flex-col transition-all duration-500 hover:-translate-y-1.5 group relative bg-surface-base shadow-sm backdrop-blur-xl dark:bg-white/[0.03] dark:shadow-[0_16px_40px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.1)] ${isAvailable ? "border-emerald-500/30" : "border-border dark:border-white/10"}`}
                  style={{
                    boxShadow: `0 0 20px ${glowColor}`
                  }}>
                  
                  {isAvailable && (
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  )}
                  
                  <div className="px-6 pt-6 pb-5 flex-1 relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-[18px] font-extrabold text-foreground" >
                          {court.name}
                        </span>
                        <span className="text-[10px] px-2.5 py-1 rounded-md font-bold uppercase tracking-wider text-foreground/70 bg-surface-interactive border border-border dark:bg-white/10 dark:border-white/[0.05]">
                          {court.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/5 border border-border dark:bg-black/30 dark:border-white/[0.05]">
                        <div className="relative w-2 h-2">
                          <div className="absolute inset-0 rounded-full" style={{ background: statusColor, boxShadow: `0 0 8px ${statusColor}` }} />
                          {isAvailable && (
                            <motion.div 
                              className="absolute inset-0 rounded-full border border-emerald-400"
                              animate={{ scale: [1, 2.5], opacity: [0.8, 0] }}
                              transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
                            />
                          )}
                        </div>
                        <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: statusColor }}>
                          {isAvailable ? "Available" : isOccupied ? "Occupied" : "Maint."}
                        </span>
                      </div>
                    </div>

                    <div className="text-[14px] font-medium mb-5 text-foreground/50">{court.surface}</div>

                    {isOccupied && court.occupiedUntil && (
                      <div className="flex items-center gap-2 px-4 py-3 rounded-xl mb-2 text-[13px] font-bold border"
                        style={{ background: "rgba(239,68,68,0.1)", borderColor: "rgba(239,68,68,0.2)" }}>
                        <Clock className="w-4 h-4 shrink-0 text-red-400" />
                        <span className="text-red-400">Free at {court.occupiedUntil}</span>
                        {court.occupiedBy && <span className="ml-auto opacity-70 font-medium text-red-300">{court.occupiedBy}</span>}
                      </div>
                    )}

                    {isMaintenance && (
                      <div className="flex items-center gap-2 px-4 py-3 rounded-xl mb-2 text-[13px] font-bold border"
                        style={{ background: "rgba(245,158,11,0.1)", borderColor: "rgba(245,158,11,0.2)" }}>
                        <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                        <span className="text-amber-400">Temporarily unavailable</span>
                      </div>
                    )}
                  </div>

                  <div className="px-6 py-5 flex items-center justify-between border-t relative z-10 bg-black/5 border-border dark:bg-black/20 dark:border-white/[0.05]">
                    <div>
                      <span className="text-2xl font-bold font-mono text-cyan-500 dark:text-cyan-400 drop-shadow-md">₱{court.price}</span>
                      <span className="text-[13px] font-bold text-foreground/40 ml-1">/hr</span>
                    </div>

                    <button
                      disabled={!isAvailable || isBooked}
                      onClick={() => handleBook(court.id)}
                      className={`flex items-center justify-center gap-2 px-6 py-3 rounded-[14px] text-[14px] font-bold active:scale-[0.96] disabled:opacity-40 disabled:cursor-not-allowed transition-all relative overflow-hidden shadow-lg ${!isAvailable ? 'bg-black/5 dark:bg-white/10 text-muted-foreground border border-border dark:border-white/5 shadow-none' : 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-none shadow-[0_8px_20px_rgba(16,185,129,0.3)]'}`}
                      style={{ minWidth: "120px" }}
                    >
                      {isAvailable && (
                        <div className="absolute inset-0 bg-surface-interactive hover:bg-surface-interactive/80 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                      )}
                      <span className="relative z-10 flex items-center gap-2">
                        {isBooked ? (
                          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.7, ease: "linear" }}
                            className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                        ) : isAvailable ? (
                          "Book Now"
                        ) : isOccupied ? (
                          "Occupied"
                        ) : (
                          "Unavailable"
                        )}
                      </span>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

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
