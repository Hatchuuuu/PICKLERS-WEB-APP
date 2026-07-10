import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Clock, Search, X, CreditCard, CalendarDays, ChevronRight } from "lucide-react";
import { slotIndex, slotHours, TIME_SLOTS } from "@/lib/timeUtils";
import { FACILITIES, type CourtData } from "@/data/mockData";
import { VerificationGate } from "@/components/shared/VerificationGate";

function TimeScroller({ layoutId, label, icon: Icon, colorClass, highlightClass, shadowClass, options, value, onChange }: any) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [localValue, setLocalValue] = useState(value);
  
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    const index = options.indexOf(localValue);
    if (containerRef.current && index !== -1) {
      containerRef.current.scrollTo({ top: index * 58, behavior: "smooth" });
    }
  }, [localValue, options]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const y = e.currentTarget.scrollTop;
    const index = Math.round(y / 58);
    const newValue = options[index];
    if (newValue && newValue !== localValue) {
      setLocalValue(newValue);
      if (navigator.vibrate) navigator.vibrate([2]);
      
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        onChange(newValue);
      }, 150);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center">
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className={`w-4 h-4 ${colorClass}`} />
        <label className="text-[12px] font-bold text-white/70 uppercase tracking-wider">{label}</label>
      </div>
      <div className="relative h-[180px] w-full" style={{ maskImage: "linear-gradient(to bottom, transparent, black 25%, black 75%, transparent)", WebkitMaskImage: "linear-gradient(to bottom, transparent, black 25%, black 75%, transparent)" }}>
        <div ref={containerRef} onScroll={handleScroll} className="absolute inset-0 overflow-y-auto snap-y snap-mandatory scrollbar-none py-[65px] px-2 flex flex-col items-center">
          {options.map((t: string) => {
            const isSelected = localValue === t;
            return (
              <button key={t} onClick={() => onChange(t)}
                className="w-full shrink-0 h-[50px] snap-center flex justify-center items-center rounded-xl text-[15px] font-bold transition-all relative overflow-hidden mb-2 last:mb-0"
                style={{
                  color: isSelected ? "white" : "rgba(255,255,255,0.4)",
                  transform: isSelected ? "scale(1.05)" : "scale(0.9)" }}>
                {isSelected && (
                  <motion.div layoutId={layoutId} className={`absolute inset-0 ${highlightClass} ${shadowClass}`} style={{ zIndex: 0, borderRadius: 12 }} />
                )}
                <span className="relative z-10">{t}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function QuickBookModal({
  facility, courts, onClose, onBook,
}: {
  facility: typeof FACILITIES[0];
  courts: CourtData[];
  onClose: () => void;
  onBook: (court: CourtData, date: string, start: string, end: string) => void;
}) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState("8:00 AM");
  const [endTime, setEndTime] = useState("10:00 AM");
  const [stage, setStage] = useState<"form" | "scanning" | "results">("form");
  const [results, setResults] = useState<CourtData[]>([]);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  // Generate 14 days
  const dates = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  const endSlots = TIME_SLOTS.slice(1);

  // Auto-adjust end time if start time moves past it
  useEffect(() => {
    if (slotIndex(startTime) >= slotIndex(endTime)) {
      const newEnd = TIME_SLOTS[slotIndex(startTime) + 2] ?? TIME_SLOTS[slotIndex(startTime) + 1];
      if (newEnd) setEndTime(newEnd);
    }
  }, [startTime, endTime]);

  function handleSearch() {
    setStage("scanning");
    searchTimeoutRef.current = setTimeout(() => {
      const available = courts.filter(c => c.status === "available");
      setResults(available);
      setStage("results");
    }, 1600);
  }

  const hours = slotHours(startTime, endTime);
  const selectedDateStr = selectedDate.toISOString().split("T")[0];

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(12px)" }} />

      {/* Sheet */}
      <motion.div key="sheet"
        initial={{ y: "100%", opacity: 0.8 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[32px] overflow-hidden flex flex-col"
        style={{ 
          background: "linear-gradient(180deg, rgba(20,30,45,0.95) 0%, #0A1118 100%)", 
          border: "1px solid rgba(255,255,255,0.1)", 
          borderBottom: "none", 
          maxHeight: "92vh", 
          boxShadow: "0 -20px 80px rgba(0,0,0,0.7), inset 0 1px 1px rgba(255,255,255,0.1)",
          backdropFilter: "blur(40px)"
        }}>

        {/* Handle + header */}
        <div className="flex flex-col items-center pt-4 pb-2 px-6 sticky top-0 z-20" style={{ background: "linear-gradient(180deg, rgba(20,30,45,1) 0%, rgba(20,30,45,0.8) 100%)", backdropFilter: "blur(20px)" }}>
          <div className="w-12 h-1.5 rounded-full mb-6" style={{ background: "rgba(255,255,255,0.2)" }} />
          <div className="flex items-center justify-between w-full pb-4 border-b border-white/5">
            <div>
              <h2 className="text-[20px] font-extrabold text-white" style={{ letterSpacing: "0.02em" }}>QUICK BOOK</h2>
              <p className="text-[13px] font-semibold text-white/50">{facility.name}</p>
            </div>
            <button onClick={onClose} aria-label="Close" className="w-10 h-10 flex items-center justify-center rounded-full hover:scale-105 active:scale-95 transition-all"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="px-6 pt-5 pb-8 overflow-y-auto scrollbar-none">
          {stage === "form" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              
              {/* Custom Apple-Style Date Scroller */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CalendarDays className="w-4 h-4 text-cyan-400" />
                  <label className="text-[13px] font-bold text-white/70 uppercase tracking-wider">Select Date</label>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none -mx-6 px-6">
                  {dates.map((d, i) => {
                    const isSelected = d.toDateString() === selectedDate.toDateString();
                    const dayName = new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(d);
                    const dateNum = d.getDate();
                    const monthName = new Intl.DateTimeFormat("en-US", { month: "short" }).format(d);
                    
                    return (
                      <button key={i} onClick={() => setSelectedDate(d)}
                        className="shrink-0 flex flex-col items-center justify-center w-16 h-20 rounded-[18px] transition-all relative overflow-hidden group"
                        style={{
                          background: isSelected ? "rgba(0,0,0,0)" : "rgba(255,255,255,0.03)",
                          border: isSelected ? "none" : "1px solid rgba(255,255,255,0.08)",
                          boxShadow: isSelected ? "0 8px 20px rgba(5,117,230,0.3)" : "none"
                        }}>
                        {isSelected && (
                          <motion.div layoutId="dateHighlight" className="absolute inset-0 bg-gradient-to-b from-blue-500 to-cyan-500" />
                        )}
                        <span className="relative z-10 text-[11px] font-bold uppercase tracking-wide mb-1" style={{ color: isSelected ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.4)" }}>
                          {dayName}
                        </span>
                        <span className="relative z-10 text-[20px] font-extrabold leading-none" style={{ color: isSelected ? "white" : "white" }}>
                          {dateNum}
                        </span>
                        <span className="relative z-10 text-[10px] font-bold mt-1" style={{ color: isSelected ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.3)" }}>
                          {monthName}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Vertical Apple-Style Time Scrollers */}
              <div className="flex gap-4">
                <TimeScroller 
                  layoutId="startHighlight"
                  label="Start Time"
                  icon={Clock}
                  colorClass="text-emerald-400"
                  highlightClass="bg-emerald-500"
                  shadowClass="shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                  options={TIME_SLOTS.slice(0, -2)} // Prevent selecting the final slots as start time
                  value={startTime}
                  onChange={setStartTime}
                />
                
                <TimeScroller 
                  layoutId="endHighlight"
                  label="End Time"
                  icon={Clock}
                  colorClass="text-red-400"
                  highlightClass="bg-red-500"
                  shadowClass="shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                  options={endSlots}
                  value={endTime}
                  onChange={setEndTime}
                />
              </div>

              {/* Duration badge */}
              {hours > 0 && (
                <div className="flex items-center justify-between px-5 py-4 rounded-2xl border"
                  style={{ background: "rgba(0,242,96,0.05)", borderColor: "rgba(0,242,96,0.2)", backdropFilter: "blur(10px)" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-[13px] font-bold text-white/60">Total Duration</div>
                      <div className="text-[15px] font-extrabold text-white">
                        {hours} hour{hours !== 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[12px] font-bold text-emerald-400">{selectedDate.toDateString()}</div>
                    <div className="text-[14px] font-bold text-white">{startTime} – {endTime}</div>
                  </div>
                </div>
              )}

              {/* Neon Search Button */}
              <button onClick={handleSearch} disabled={hours <= 0}
                className="w-full py-5 rounded-[20px] font-extrabold text-[16px] active:scale-[0.97] disabled:opacity-40 flex items-center justify-center gap-2 group relative overflow-hidden shadow-2xl transition-all mt-4"
                style={{ minHeight: "64px" }}>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <Search className="w-5 h-5 text-white relative z-10" />
                <span className="text-white relative z-10" style={{ letterSpacing: "0.02em" }}>Find Available Courts</span>
                <ChevronRight className="w-5 h-5 text-white/70 relative z-10 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          )}

          {stage === "scanning" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-16 flex flex-col items-center gap-6">
              {/* Premium Animated radar scan */}
              <div className="relative w-24 h-24">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                  className="absolute inset-0 rounded-full border-[3px] border-t-cyan-400 border-r-cyan-400/20 border-b-transparent border-l-transparent" />
                <motion.div animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  className="absolute inset-3 rounded-full border-[2px] border-t-transparent border-r-transparent border-b-indigo-400/60 border-l-indigo-400/20" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center backdrop-blur-md">
                    <Search className="w-6 h-6 text-cyan-300" />
                  </div>
                </div>
              </div>
              <div className="text-center">
                <p className="text-[18px] font-bold text-white mb-1" >Scanning availability…</p>
                <p className="text-[14px] font-medium text-white/50">{startTime} – {endTime} · {hours}h</p>
              </div>
            </motion.div>
          )}

          {stage === "results" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ ease: "easeOut", duration: 0.3 }}>
              {/* Results header */}
              <div className="flex items-center justify-between mb-6 bg-white/5 p-4 rounded-2xl border border-white/10">
                <div>
                  <h3 className="text-[16px] font-bold text-white">
                    {results.length} Court{results.length !== 1 ? "s" : ""} Available
                  </h3>
                  <p className="text-[13px] font-medium text-white/50 mt-0.5">{startTime} – {endTime} · {selectedDate.toLocaleDateString()}</p>
                </div>
                <button onClick={() => setStage("form")}
                  className="text-[13px] font-bold px-4 py-2 rounded-xl transition-colors hover:bg-white/10"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}>
                  Change Time
                </button>
              </div>

              {results.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
                    <X className="w-8 h-8 text-red-400" />
                  </div>
                  <p className="text-[16px] font-bold text-white mb-1">No courts available</p>
                  <p className="text-[14px] text-white/50">Try a different time slot or date.</p>
                  <button onClick={() => setStage("form")} className="mt-6 text-[14px] font-bold text-cyan-400 hover:text-cyan-300 transition-colors">← Try another time</button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {results.map((court, i) => {
                    const courtTotal = hours * court.price;
                    const courtFee = Math.round(courtTotal * 0.08);
                    return (
                      <motion.div key={court.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08, ease: [0.23, 1, 0.32, 1], duration: 0.5 }}
                        className="rounded-[20px] p-5 relative overflow-hidden group"
                        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(16,185,129,0.3)", boxShadow: "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.05)" }}>
                        
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />

                        <div className="flex items-start justify-between mb-4 relative z-10">
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <span className="text-[18px] font-bold text-white" >{court.name}</span>
                              <span className="text-[11px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider"
                                style={{ background: "rgba(255,255,255,0.1)", color: "white" }}>
                                {court.type}
                              </span>
                            </div>
                            <p className="text-[13px] font-medium text-white/50">{court.surface}</p>
                          </div>
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                            <div className="relative w-2 h-2">
                              <div className="absolute inset-0 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                              <motion.div 
                                className="absolute inset-0 rounded-full border border-emerald-400"
                                animate={{ scale: [1, 2.5], opacity: [0.8, 0] }}
                                transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
                              />
                            </div>
                            <span className="text-[11px] text-emerald-400 font-bold uppercase tracking-wider">Available</span>
                          </div>
                        </div>

                        {/* Premium Price breakdown */}
                        <div className="flex items-center justify-between mb-5 px-4 py-3 rounded-xl border relative z-10"
                          style={{ background: "rgba(0,0,0,0.3)", borderColor: "rgba(255,255,255,0.05)" }}>
                          <div className="flex flex-col">
                            <span className="text-[12px] font-bold text-white/40 uppercase tracking-widest mb-1">Rate</span>
                            <span className="text-[13px] font-bold text-white/80">₱{court.price}/hr × {hours}h</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[12px] font-bold text-white/40 uppercase tracking-widest mb-1">Fee</span>
                            <span className="text-[13px] font-bold text-white/80">+₱{courtFee}</span>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-[12px] font-bold text-cyan-400/70 uppercase tracking-widest mb-1">Total</span>
                            <span className="text-[18px] font-bold font-mono text-cyan-400 drop-shadow-md">₱{(courtTotal + courtFee).toLocaleString()}</span>
                          </div>
                        </div>

                        <VerificationGate onVerifiedClick={() => onBook(court, selectedDateStr, startTime, endTime)}>
                          <button
                            className="w-full py-4 rounded-xl font-bold text-[15px] active:scale-[0.97] flex items-center justify-center gap-2 relative overflow-hidden transition-all shadow-xl"
                            style={{ background: "linear-gradient(135deg, #10B981 0%, #059669 100%)", color: "white" }}>
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                            <CreditCard className="w-5 h-5 relative z-10" />
                            <span className="relative z-10" >Secure Booking</span>
                          </button>
                        </VerificationGate>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
