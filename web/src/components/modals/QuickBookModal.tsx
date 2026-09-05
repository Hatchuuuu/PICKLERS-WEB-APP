"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Clock, Search, X, CreditCard, CalendarDays, ChevronRight } from "lucide-react";
import { slotIndex, slotHours, TIME_SLOTS } from "@/lib/timeUtils";
import { CourtData, Facility } from "@/types";
import { VerificationGate } from "@/components/shared/VerificationGate";
import { FocusTrap } from "@/components/a11y/FocusTrap";

const ITEM_HEIGHT = 44;

export function TimeScroller({
  layoutId,
  label,
  icon: Icon,
  colorClass,
  highlightClass,
  shadowClass,
  options,
  value,
  onChange,
}: {
  layoutId: string;
  label: string;
  icon: React.ElementType;
  colorClass: string;
  highlightClass: string;
  shadowClass: string;
  options: string[];
  value: string;
  onChange: (val: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    const index = options.indexOf(localValue);
    if (containerRef.current && index !== -1) {
      containerRef.current.scrollTo({ top: index * ITEM_HEIGHT, behavior: "smooth" });
    }
  }, [localValue, options]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const y = e.currentTarget.scrollTop;
    const index = Math.round(y / ITEM_HEIGHT);
    const newValue = options[index];
    if (newValue && newValue !== localValue) {
      setLocalValue(newValue);
      if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([2]);

      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        onChange(newValue);
      }, 150);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center min-w-0">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className={`w-3.5 h-3.5 ${colorClass}`} />
        <label className="text-[11.5px] font-bold text-foreground/70 uppercase tracking-wider">{label}</label>
      </div>
      <div
        className="relative h-[132px] w-full"
        style={{
          maskImage: "linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)",
        }}
      >
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="absolute inset-0 overflow-y-auto snap-y snap-mandatory scrollbar-none py-[44px] px-1 flex flex-col items-center"
        >
          {options.map((t: string) => {
            const isSelected = localValue === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => onChange(t)}
                style={{ height: `${ITEM_HEIGHT}px` }}
                className={`w-full shrink-0 snap-center flex justify-center items-center rounded-xl text-[14.5px] font-bold transition-all relative overflow-hidden ${isSelected
                    ? "text-white scale-100"
                    : "text-foreground/40 dark:text-white/40 scale-90 hover:text-foreground/70"
                  }`}
              >
                {isSelected && (
                  <motion.div
                    layoutId={layoutId}
                    className={`absolute inset-0 ${highlightClass} ${shadowClass}`}
                    style={{ zIndex: 0, borderRadius: 13 }}
                  />
                )}
                <span className="relative z-10 font-bold leading-none">{t}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function QuickBookModal({
  facility,
  courts,
  onClose,
  onBook,
}: {
  facility: Facility;
  courts: CourtData[];
  onClose: () => void;
  onBook: (court: CourtData, date: string, start: string, end: string) => void;
}) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState("6:00 AM");
  const [endTime, setEndTime] = useState("7:00 AM");
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
      const available = courts.filter((c) => c.status === "available");
      setResults(available);
      setStage("results");
    }, 1200);
  }

  const hours = slotHours(startTime, endTime);
  const selectedDateStr = selectedDate.toISOString().split("T")[0];

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[600] bg-black/40 backdrop-blur-[2px] dark:bg-black/50"
      />

      {/* Sheet positioned to top line with safe bottom margin */}
      <motion.div
        key="sheet"
        initial={{ y: "100%", opacity: 0.8 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 32 }}
        className="fixed bottom-0 left-0 right-0 sm:inset-0 sm:m-auto sm:max-w-[440px] sm:h-fit sm:rounded-[32px] sm:border-b z-[610] rounded-t-[32px] overflow-hidden flex flex-col bg-surface-overlay dark:bg-[#13223F] border border-b-0 border-border dark:border-white/12 shadow-[0_25px_60px_rgba(0,0,0,0.5)] max-h-[88vh] h-auto"
      >
        <FocusTrap onEscape={onClose} ariaLabel="Quick book a court">
        {/* Handle + header */}
        <div className="flex flex-col items-center pt-3 pb-2 px-6 sticky top-0 z-20 bg-surface-overlay/95 backdrop-blur-[20px]">
          <div className="w-12 h-1.5 rounded-full mb-3 bg-muted-foreground/20" />
          <div className="flex items-center justify-between w-full pb-2.5 border-b border-border">
            <div className="min-w-0 pr-2">
              <h2 className="text-[19px] font-extrabold tracking-wide text-foreground leading-tight">QUICK BOOK</h2>
              <p className="text-[13px] font-semibold text-muted-foreground truncate max-w-[260px]">{facility.name}</p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="w-8.5 h-8.5 shrink-0 flex items-center justify-center rounded-full hover:scale-105 active:scale-95 transition-all border border-border bg-surface-interactive text-foreground hover:bg-surface-interactive/80 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content container - Zero Scroll with ample bottom space above browser bar */}
        <div className="px-6 pt-2.5 pb-[max(env(safe-area-inset-bottom),28px)] flex flex-col justify-between flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {stage === "form" && (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="space-y-3.5"
              >
                {/* Date Scroller */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <CalendarDays className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
                    <label className="text-[11.5px] font-bold text-foreground/80 uppercase tracking-wider">
                      Select Date
                    </label>
                  </div>
                  <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none -mx-6 px-6">
                    {dates.map((d, i) => {
                      const isSelected = d.toDateString() === selectedDate.toDateString();
                      const dayName = new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(d);
                      const dateNum = d.getDate();
                      const monthName = new Intl.DateTimeFormat("en-US", { month: "short" }).format(d);

                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setSelectedDate(d)}
                          className={`shrink-0 flex flex-col items-center justify-center w-[56px] h-[68px] rounded-[15px] transition-all relative overflow-hidden group cursor-pointer border ${
                            isSelected
                              ? "border-blue-500 shadow-md ring-1 ring-blue-500/50"
                              : "bg-surface-interactive border-border text-foreground hover:bg-surface-interactive/80"
                          }`}
                        >
                          {isSelected && (
                            <motion.div
                              layoutId="dateHighlight"
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
                    layoutId="startHighlight"
                    label="Start Time"
                    icon={Clock}
                    colorClass="text-emerald-500 dark:text-emerald-400"
                    highlightClass="bg-emerald-500"
                    shadowClass="shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                    options={TIME_SLOTS.slice(0, -2)}
                    value={startTime}
                    onChange={setStartTime}
                  />

                  <TimeScroller
                    layoutId="endHighlight"
                    label="End Time"
                    icon={Clock}
                    colorClass="text-red-500 dark:text-red-400"
                    highlightClass="bg-red-500"
                    shadowClass="shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                    options={endSlots}
                    value={endTime}
                    onChange={setEndTime}
                  />
                </div>

                {/* Duration badge */}
                {hours > 0 && (
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
                          {hours} hour{hours !== 1 ? "s" : ""}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11.5px] font-bold text-emerald-600 dark:text-emerald-400 leading-none mb-0.5">
                        {selectedDate.toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                      <div className="text-[13px] font-bold text-foreground leading-tight">
                        {startTime} – {endTime}
                      </div>
                    </div>
                  </div>
                )}

                {/* Search Button */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleSearch}
                    disabled={hours <= 0}
                    className="w-full h-[52px] rounded-2xl font-extrabold text-[15.5px] active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-2 group relative overflow-hidden shadow-xl transition-all cursor-pointer"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    <Search className="w-4 h-4 text-white relative z-10" />
                    <span className="text-white relative z-10 tracking-wide">Find Available Courts</span>
                    <ChevronRight className="w-4 h-4 text-white/70 relative z-10 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </motion.div>
            )}

            {stage === "scanning" && (
              <motion.div
                key="scanning"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-12 flex flex-col items-center gap-5"
              >
                {/* Premium Animated radar scan */}
                <div className="relative w-22 h-22">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                    className="absolute inset-0 rounded-full border-[3px] border-t-cyan-400 border-r-cyan-400/20 border-b-transparent border-l-transparent"
                  />
                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className="absolute inset-2.5 rounded-full border-[2px] border-t-transparent border-r-transparent border-b-indigo-400/60 border-l-indigo-400/20"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-11 h-11 rounded-full bg-cyan-500/20 flex items-center justify-center backdrop-blur-md">
                      <Search className="w-5 h-5 text-cyan-500 dark:text-cyan-300" />
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-[17px] font-bold text-foreground mb-1">Scanning availability…</p>
                  <p className="text-[13.5px] font-medium text-muted-foreground">
                    {startTime} – {endTime} · {hours}h
                  </p>
                </div>
              </motion.div>
            )}

            {stage === "results" && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ ease: "easeOut", duration: 0.25 }}
                className="space-y-3.5"
              >
                {/* Results header */}
                <div className="flex items-center justify-between bg-surface-interactive p-3.5 rounded-2xl border border-border">
                  <div>
                    <h3 className="text-[14.5px] font-bold text-foreground">
                      {results.length} Court{results.length !== 1 ? "s" : ""} Available
                    </h3>
                    <p className="text-[12.5px] font-medium text-muted-foreground mt-0.5">
                      {startTime} – {endTime} · {selectedDate.toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStage("form")}
                    className="text-[12.5px] font-bold px-3 py-1.5 rounded-xl transition-colors bg-surface-base border border-border text-foreground hover:bg-surface-base/80 cursor-pointer"
                  >
                    Change Time
                  </button>
                </div>

                {results.length === 0 ? (
                  <div className="text-center py-9">
                    <div className="w-13 h-13 rounded-full flex items-center justify-center mx-auto mb-3 bg-red-500/10 border border-red-500/20">
                      <X className="w-6 h-6 text-red-500 dark:text-red-400" />
                    </div>
                    <p className="text-[15.5px] font-bold text-foreground mb-1">No courts available</p>
                    <p className="text-[13px] text-muted-foreground">Try a different time slot or date.</p>
                    <button
                      type="button"
                      onClick={() => setStage("form")}
                      className="mt-4 text-[13.5px] font-bold text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
                    >
                      ← Try another time
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5 max-h-[320px] overflow-y-auto pr-1 scrollbar-none">
                    {results.map((court, i) => {
                      const courtTotal = hours * court.price;
                      const courtFee = Math.round(courtTotal * 0.08);
                      return (
                        <motion.div
                          key={court.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.06, ease: [0.23, 1, 0.32, 1], duration: 0.4 }}
                          className="rounded-[18px] p-3.5 relative overflow-hidden group shrink-0 bg-surface-interactive border border-emerald-500/30 shadow-md"
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />

                          <div className="flex items-start justify-between mb-2.5 relative z-10">
                            <div>
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-[15.5px] font-bold text-foreground">{court.name}</span>
                                <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-surface-base border border-border text-foreground">
                                  {court.type}
                                </span>
                              </div>
                              <p className="text-[12.5px] font-medium text-muted-foreground">{court.surface}</p>
                            </div>
                            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                              <div className="relative w-1.5 h-1.5">
                                <div className="absolute inset-0 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                                <motion.div
                                  className="absolute inset-0 rounded-full border border-emerald-400"
                                  animate={{ scale: [1, 2.5], opacity: [0.8, 0] }}
                                  transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
                                />
                              </div>
                              <span className="text-[10px] text-emerald-500 dark:text-emerald-400 font-bold uppercase tracking-wider">
                                Available
                              </span>
                            </div>
                          </div>

                          {/* Price breakdown */}
                          <div className="flex items-center justify-between mb-3 px-3 py-2 rounded-xl border border-border bg-surface-base relative z-10">
                            <div className="flex flex-col">
                              <span className="text-[10.5px] font-medium text-muted-foreground tracking-tight">Rate</span>
                              <span className="text-[12.5px] font-bold text-foreground">
                                ₱{court.price}/hr × {hours}h
                              </span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10.5px] font-medium text-muted-foreground tracking-tight">Fee</span>
                              <span className="text-[12.5px] font-bold text-foreground">+₱{courtFee}</span>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="text-[10.5px] font-medium text-muted-foreground tracking-tight">Total</span>
                              <span className="text-[15.5px] font-bold font-mono text-cyan-600 dark:text-cyan-400 drop-shadow-md">
                                ₱{(courtTotal + courtFee).toLocaleString()}
                              </span>
                            </div>
                          </div>

                          <VerificationGate onVerifiedClick={() => onBook(court, selectedDateStr, startTime, endTime)}>
                            <button
                              type="button"
                              className="w-full py-2.5 rounded-xl font-bold text-[13.5px] active:scale-[0.97] flex items-center justify-center gap-2 relative overflow-hidden transition-all shadow-lg text-white cursor-pointer bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400"
                            >
                              <CreditCard className="w-4 h-4 relative z-10" />
                              <span className="relative z-10">Secure Booking</span>
                            </button>
                          </VerificationGate>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        </FocusTrap>
      </motion.div>
    </AnimatePresence>
  );
}
