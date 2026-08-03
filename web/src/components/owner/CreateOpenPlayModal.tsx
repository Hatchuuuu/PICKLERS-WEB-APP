"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Flame, Clock, Users, ChevronDown, MapPin, Calendar as CalendarIcon, Repeat, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useOwner } from "@/contexts/OwnerContext";
import { useToast } from "@/contexts/ToastContext";
import { supabase } from "@/lib/supabase";
import { MatchData } from "@/types";

interface CreateOpenPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newMatch: MatchData) => void;
  defaultCourtId?: number | string;
}

const MATCH_TYPES = [
  "Doubles Open Play",
  "Competitive Doubles",
  "Social Round Robin",
  "Weekend King of the Court",
  "Singles Open Play"
];

const HOURLY_TIMES = [
  "5:00 AM", "6:00 AM", "7:00 AM", "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM",
  "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM",
  "7:00 PM", "8:00 PM", "9:00 PM", "10:00 PM", "11:00 PM", "12:00 AM"
];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const WEEKDAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function CreateOpenPlayModal({ isOpen, onClose, onSuccess, defaultCourtId }: CreateOpenPlayModalProps) {
  const { user } = useAuth();
  const { ownerCourts } = useOwner();
  const { showToast } = useToast();

  const [title] = useState("Doubles Open Play");
  const [type] = useState(MATCH_TYPES[0]);
  const [courtId, setCourtId] = useState<number | string>(defaultCourtId || ownerCourts[0]?.id || "");

  // Custom dropdown open states
  const [isCourtDropdownOpen, setIsCourtDropdownOpen] = useState(false);
  const [isStartTimeOpen, setIsStartTimeOpen] = useState(false);
  const [isEndTimeOpen, setIsEndTimeOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Session Date state
  const [dateMode, setDateMode] = useState<"specific" | "everyday">("specific");
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  // Calendar Month/Year Navigation State
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());

  // Start Time & End Time states
  const [startTime, setStartTime] = useState("6:00 AM");
  const [endTime, setEndTime] = useState("11:00 PM");

  const [isUnlimited, setIsUnlimited] = useState(false);
  const [maxPlayersInput, setMaxPlayersInput] = useState<number | string>(20);
  const [price, setPrice] = useState<number>(250);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (defaultCourtId) {
      setCourtId(defaultCourtId);
    } else if (ownerCourts.length > 0) {
      setCourtId(ownerCourts[0].id);
    }
  }, [defaultCourtId, ownerCourts]);

  if (!isOpen) return null;

  const selectedCourt = ownerCourts.find(c => String(c.id) === String(courtId)) || ownerCourts[0];
  const courtName = selectedCourt?.name || "Championship Court 1";

  // Formatted display date for trigger button
  const dateObj = new Date(selectedDate + "T00:00:00");
  const formattedDisplayDate = dateObj.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  // Formatted date string for submission
  const finalFormattedDate = dateMode === "everyday"
    ? "Everyday (Daily Session)"
    : formattedDisplayDate;

  const timeRangeString = `${startTime} - ${endTime}`;

  // Helper calendar navigation functions
  function handlePrevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  }

  function handleNextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  }

  // Quick date chips
  function setQuickDate(daysFromToday: number) {
    const d = new Date();
    d.setDate(d.getDate() + daysFromToday);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    setSelectedDate(`${yyyy}-${mm}-${dd}`);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
    setIsCalendarOpen(false);
  }

  function setQuickDayOfWeek(targetDayIndex: number) {
    const d = new Date();
    const currentDay = d.getDay();
    let diff = targetDayIndex - currentDay;
    if (diff <= 0) diff += 7;
    d.setDate(d.getDate() + diff);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    setSelectedDate(`${yyyy}-${mm}-${dd}`);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
    setIsCalendarOpen(false);
  }

  // Calendar Grid Calculations
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const todayStr = new Date().toISOString().split("T")[0];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      showToast("Please enter a title for the Open Play session.", "error");
      return;
    }
    if (!price || price <= 0) {
      showToast("Please specify a valid price per player.", "error");
      return;
    }

    const finalMaxPlayers = isUnlimited ? 0 : Math.max(1, parseInt(String(maxPlayersInput), 10) || 20);

    setIsSubmitting(true);
    try {
      const isDemo = user?.isDemo || user?.role === "demo" || !user || user?.email?.includes("demo");
      const newMatch: MatchData = {
        id: Date.now(),
        facility_name: "BGC Pickleball Hub",
        location: "Bonifacio Global City, Taguig",
        date: finalFormattedDate,
        time: timeRangeString,
        level: "Open",
        current_players: 0,
        max_players: finalMaxPlayers,
        price: price,
        type: type,
        host: user?.name || "Court Owner"
      };

      if (!isDemo && user?.id) {
        const { data, error } = await supabase.from('matches').insert([{
          title: title,
          type: type,
          status: 'open',
          date: finalFormattedDate,
          time: timeRangeString,
          location: "Bonifacio Global City, Taguig",
          price: price,
          level: "Open",
          participants: 0,
          max_participants: finalMaxPlayers,
          facility: "BGC Pickleball Hub",
          court: courtName,
          players: [],
          created_by: user.id
        }]).select().single();

        if (error) {
          console.warn("Supabase insert error fallback to local:", error);
        } else if (data) {
          newMatch.id = data.id;
        }
      }

      showToast(`Open Play session '${title}' hosted on ${courtName} successfully!`, "success");
      if (onSuccess) onSuccess(newMatch);
      onClose();
    } catch (err) {
      console.error("Failed to create Open Play:", err);
      showToast("Failed to create Open Play session.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-2xl overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: "spring", stiffness: 400, damping: 35 }}
          className="relative w-full max-h-[85vh] sm:h-auto sm:max-w-md sm:max-h-[90vh] bg-[#0C172E] border-t sm:border border-white/15 rounded-t-[32px] sm:rounded-[28px] p-4 sm:p-6 shadow-[0_32px_80px_rgba(0,0,0,0.9)] flex flex-col text-white mb-0 sm:my-auto overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_16px_rgba(245,158,11,0.25)]">
                <Flame className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight leading-none mb-1">Host Open Play</h3>
                <p className="text-[11px] sm:text-xs text-slate-400 font-medium leading-none">Schedule a joinable match at your court</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-3 space-y-3.5 sm:space-y-4 pr-1 text-slate-200 scrollbar-none">
            {/* Target Court Banner / Custom Select */}
            {defaultCourtId ? (
              <div className="p-3 sm:p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <div className="text-xs font-extrabold text-amber-300">{courtName}</div>
                    <div className="text-[10px] text-slate-400 font-medium">{selectedCourt?.surface || "Indoor · Premium Hard"}</div>
                  </div>
                </div>
                <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Target Court
                </span>
              </div>
            ) : (
              <div className="relative">
                <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider mb-1.5 text-slate-400">
                  Target Court
                </label>
                <button
                  type="button"
                  onClick={() => setIsCourtDropdownOpen(!isCourtDropdownOpen)}
                  className="w-full px-3.5 py-2.5 sm:py-3 rounded-2xl border border-white/15 bg-white/[0.05] hover:bg-white/[0.08] text-xs sm:text-sm text-white font-semibold flex items-center justify-between transition-all"
                >
                  <span>{courtName}</span>
                  <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", isCourtDropdownOpen && "rotate-180")} />
                </button>

                <AnimatePresence>
                  {isCourtDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="absolute left-0 right-0 top-full mt-2 z-50 p-2 bg-[#0E1B38] border border-white/15 rounded-2xl shadow-2xl space-y-1"
                    >
                      {ownerCourts.map((c) => {
                        const isOccupied = Boolean(c.currentBooking);
                        return (
                          <button
                            key={c.id}
                            type="button"
                            disabled={isOccupied}
                            onClick={() => {
                              if (isOccupied) return;
                              setCourtId(c.id);
                              setIsCourtDropdownOpen(false);
                            }}
                            className={cn(
                              "w-full px-3.5 py-2.5 rounded-xl text-xs font-bold text-left transition-all flex items-center justify-between",
                              isOccupied
                                ? "opacity-40 cursor-not-allowed text-slate-500"
                                : String(c.id) === String(courtId)
                                ? "bg-amber-500/20 text-amber-300"
                                : "text-slate-300 hover:bg-white/5"
                            )}
                          >
                            <span>{c.name} ({c.surface}){isOccupied ? " — Occupied" : ""}</span>
                            {String(c.id) === String(courtId) && <Check className="w-4 h-4 text-amber-400" />}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}



            {/* Session Date with Custom Calendar Popover */}
            <div className="space-y-1.5">
              <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Session Date
              </label>

              {/* Mode Switcher Pill */}
              <div className="flex gap-2 p-1 rounded-2xl bg-white/[0.05] border border-white/10">
                <button
                  type="button"
                  onClick={() => setDateMode("specific")}
                  className={cn(
                    "flex-1 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
                    dateMode === "specific" ? "bg-amber-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
                  )}
                >
                  <CalendarIcon className="w-3.5 h-3.5" />
                  <span>Specific Date</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDateMode("everyday");
                    setIsCalendarOpen(false);
                  }}
                  className={cn(
                    "flex-1 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
                    dateMode === "everyday" ? "bg-amber-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
                  )}
                >
                  <Repeat className="w-3.5 h-3.5" />
                  <span>Everyday 🔄</span>
                </button>
              </div>

              {dateMode === "specific" && (
                <div className="relative pt-0.5">
                  {/* Custom Calendar Trigger Button (Zero Native Browser Pickers) */}
                  <button
                    type="button"
                    onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                    className="w-full px-3.5 py-2.5 sm:py-3 rounded-2xl border border-white/15 bg-white/[0.05] hover:bg-white/[0.08] text-xs text-amber-300 font-extrabold flex items-center justify-between transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-amber-400" />
                      <span>{formattedDisplayDate}</span>
                    </div>
                    <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", isCalendarOpen && "rotate-180")} />
                  </button>

                  {/* 100% Custom Framer Motion Calendar Popover */}
                  <AnimatePresence>
                    {isCalendarOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -6 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -6 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 right-0 top-full mt-2 z-50 p-4 bg-[#0A1428] border border-amber-500/30 rounded-3xl shadow-[0_24px_64px_rgba(0,0,0,0.95)] backdrop-blur-2xl space-y-3"
                      >
                        {/* Calendar Month Header */}
                        <div className="flex items-center justify-between pb-1 border-b border-white/10">
                          <button
                            type="button"
                            onClick={handlePrevMonth}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-300 hover:text-amber-400 hover:bg-white/10 transition-colors"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>

                          <div className="text-xs font-black text-white tracking-wide">
                            {MONTH_NAMES[viewMonth]} {viewYear}
                          </div>

                          <button
                            type="button"
                            onClick={handleNextMonth}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-300 hover:text-amber-400 hover:bg-white/10 transition-colors"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Quick Selection Chips */}
                        <div className="flex gap-1.5 overflow-x-auto py-1 scrollbar-none">
                          <button
                            type="button"
                            onClick={() => setQuickDate(0)}
                            className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/10 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 transition-colors shrink-0"
                          >
                            Today
                          </button>
                          <button
                            type="button"
                            onClick={() => setQuickDate(1)}
                            className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/10 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 transition-colors shrink-0"
                          >
                            Tomorrow
                          </button>
                          <button
                            type="button"
                            onClick={() => setQuickDayOfWeek(6)}
                            className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/10 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 transition-colors shrink-0"
                          >
                            Saturday
                          </button>
                          <button
                            type="button"
                            onClick={() => setQuickDayOfWeek(0)}
                            className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/10 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 transition-colors shrink-0"
                          >
                            Sunday
                          </button>
                        </div>

                        {/* Weekday Names Header */}
                        <div className="grid grid-cols-7 text-center text-[10px] font-extrabold uppercase text-amber-400/70 pb-1">
                          {WEEKDAY_NAMES.map((w) => (
                            <div key={w}>{w}</div>
                          ))}
                        </div>

                        {/* Days Grid */}
                        <div className="grid grid-cols-7 gap-1 text-center text-xs">
                          {/* Previous Month Empty Overflow Days */}
                          {Array.from({ length: firstDayOfMonth }).map((_, idx) => {
                            const prevDayNum = daysInPrevMonth - firstDayOfMonth + idx + 1;
                            return (
                              <div key={`prev-${idx}`} className="h-8 flex items-center justify-center text-slate-600 text-[10px] font-medium">
                                {prevDayNum}
                              </div>
                            );
                          })}

                          {/* Current Month Days */}
                          {Array.from({ length: daysInMonth }).map((_, idx) => {
                            const dayNum = idx + 1;
                            const mmStr = String(viewMonth + 1).padStart(2, "0");
                            const ddStr = String(dayNum).padStart(2, "0");
                            const dateKey = `${viewYear}-${mmStr}-${ddStr}`;

                            const isSelected = dateKey === selectedDate;
                            const isToday = dateKey === todayStr;
                            const isPast = dateKey < todayStr;

                            return (
                              <button
                                key={`day-${dayNum}`}
                                type="button"
                                disabled={isPast}
                                onClick={() => {
                                  setSelectedDate(dateKey);
                                  setIsCalendarOpen(false);
                                }}
                                className={cn(
                                  "h-8 w-8 mx-auto rounded-full text-xs font-bold transition-all flex items-center justify-center",
                                  isPast && "text-slate-600 opacity-40 cursor-not-allowed",
                                  !isPast && !isSelected && !isToday && "text-slate-200 hover:bg-white/10 hover:text-amber-300",
                                  isToday && !isSelected && "border border-amber-400/50 text-amber-300 font-extrabold",
                                  isSelected && "bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black shadow-[0_0_16px_rgba(245,158,11,0.5)] scale-105"
                                )}
                              >
                                {dayNum}
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Custom Start Time & End Time Range Selectors */}
            <div>
              <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider mb-1.5 text-slate-400">
                Time Slot Range
              </label>

              <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                {/* Start Time Dropdown */}
                <div className="relative">
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Start Time</label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsStartTimeOpen(!isStartTimeOpen);
                      setIsEndTimeOpen(false);
                    }}
                    className="w-full px-3 py-2.5 sm:py-3 rounded-2xl border border-white/15 bg-white/[0.05] hover:bg-white/[0.08] text-xs text-white font-bold flex items-center justify-between transition-all"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">{startTime}</span>
                    </div>
                    <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform", isStartTimeOpen && "rotate-180")} />
                  </button>

                  <AnimatePresence>
                    {isStartTimeOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="absolute left-0 right-0 top-full mt-2 z-50 p-2 bg-[#0E1B38] border border-white/15 rounded-2xl shadow-2xl max-h-48 overflow-y-auto space-y-1 scrollbar-thin"
                      >
                        {HOURLY_TIMES.map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => {
                              setStartTime(t);
                              setIsStartTimeOpen(false);
                            }}
                            className={cn(
                              "w-full px-3 py-2 rounded-xl text-xs font-bold text-left transition-all flex items-center justify-between",
                              startTime === t ? "bg-amber-500/20 text-amber-300" : "text-slate-300 hover:bg-white/5"
                            )}
                          >
                            <span>{t}</span>
                            {startTime === t && <Check className="w-3.5 h-3.5 text-amber-400" />}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* End Time Dropdown */}
                <div className="relative">
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">End Time</label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEndTimeOpen(!isEndTimeOpen);
                      setIsStartTimeOpen(false);
                    }}
                    className="w-full px-3 py-2.5 sm:py-3 rounded-2xl border border-white/15 bg-white/[0.05] hover:bg-white/[0.08] text-xs text-white font-bold flex items-center justify-between transition-all"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">{endTime}</span>
                    </div>
                    <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform", isEndTimeOpen && "rotate-180")} />
                  </button>

                  <AnimatePresence>
                    {isEndTimeOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="absolute left-0 right-0 top-full mt-2 z-50 p-2 bg-[#0E1B38] border border-white/15 rounded-2xl shadow-2xl max-h-48 overflow-y-auto space-y-1 scrollbar-thin"
                      >
                        {HOURLY_TIMES.map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => {
                              setEndTime(t);
                              setIsEndTimeOpen(false);
                            }}
                            className={cn(
                              "w-full px-3 py-2 rounded-xl text-xs font-bold text-left transition-all flex items-center justify-between",
                              endTime === t ? "bg-amber-500/20 text-amber-300" : "text-slate-300 hover:bg-white/5"
                            )}
                          >
                            <span>{t}</span>
                            {endTime === t && <Check className="w-3.5 h-3.5 text-amber-400" />}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Player Capacity & Price */}
            <div className="space-y-2 pt-0.5">
              <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Player Capacity & Limit
              </label>

              <div className="flex gap-2 p-1 rounded-2xl bg-white/[0.05] border border-white/10">
                <button
                  type="button"
                  onClick={() => setIsUnlimited(false)}
                  className={cn(
                    "flex-1 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
                    !isUnlimited ? "bg-amber-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
                  )}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Max Player Cap</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsUnlimited(true)}
                  className={cn(
                    "flex-1 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
                    isUnlimited ? "bg-amber-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
                  )}
                >
                  <span>Unlimited Players</span>
                  <span className="text-base font-black leading-none">∞</span>
                </button>
              </div>

              {!isUnlimited && (
                <div className="pt-0.5">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={200}
                      value={maxPlayersInput}
                      onChange={(e) => setMaxPlayersInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 sm:py-3 rounded-2xl border border-white/15 bg-white/[0.05] text-xs sm:text-sm text-white font-bold focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="Enter max players (e.g. 20)"
                    />
                    <span className="text-xs font-bold text-slate-400 shrink-0 pr-2">Max Players</span>
                  </div>
                </div>
              )}
            </div>

            {/* Price per Player */}
            <div>
              <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider mb-1.5 text-slate-400">
                Price (₱ / player)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-extrabold text-amber-400">₱</span>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full pl-8 pr-4 py-2.5 sm:py-3 rounded-2xl border border-white/15 bg-white/[0.05] text-xs sm:text-sm text-white font-semibold focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="250"
                  min={0}
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3 shrink-0 bg-[#0C172E]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-full text-xs font-bold text-slate-400 hover:text-white hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 sm:py-3 rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-extrabold text-xs shadow-[0_4px_24px_rgba(245,158,11,0.4)] transition-all active:scale-95 disabled:opacity-50"
              >
                <Flame className="w-4 h-4 fill-slate-950" />
                <span>{isSubmitting ? "Creating..." : "Host Open Play"}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
