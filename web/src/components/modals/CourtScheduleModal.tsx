"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X, Check, AlertCircle, Sparkles, Clock, Lock, ChevronDown, ChevronUp, User
} from "lucide-react";
import { CourtData, Facility } from "@/types";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { FocusTrap } from "@/components/a11y/FocusTrap";
import { useToast } from "@/contexts/ToastContext";

const EXTENDED_TIME_SLOTS = [
  "5:00 AM", "6:00 AM", "7:00 AM", "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM",
  "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM",
  "7:00 PM", "8:00 PM", "9:00 PM", "10:00 PM"
];

function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const clean = timeStr.trim().toUpperCase();
  const match = clean.match(/(\d+):?(\d+)?\s*(AM|PM)?/);
  if (!match) return 0;
  let hour = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const period = match[3];

  if (period === "PM" && hour < 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;
  return hour * 60 + minutes;
}

export interface TimelineBlock {
  id: string;
  type: "available" | "booked";
  startTime: string;
  endTime: string;
  startMin: number;
  endMin: number;
  durationHours: number;
  bookerName?: string;
  hourlySlots: { startTime: string; endTime: string }[];
}

interface CourtScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  court: CourtData | null;
  facility: Facility | null;
  onSelectSlot: (court: CourtData, date: string, startTime: string, endTime: string) => void;
}

export function CourtScheduleModal({
  isOpen,
  onClose,
  court,
  facility,
  onSelectSlot,
}: CourtScheduleModalProps) {
  const { showToast } = useToast();

  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => today.toISOString().split("T")[0], [today]);

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedStartTime, setSelectedStartTime] = useState<string | null>(null);
  const [selectedEndTime, setSelectedEndTime] = useState<string | null>(null);
  const [preferredDuration, setPreferredDuration] = useState<number>(1);
  const [expandedBlockId, setExpandedBlockId] = useState<string | null>(null);

  // Generate 7 upcoming days for the date selector
  const upcomingDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const iso = d.toISOString().split("T")[0];
      const dayName = i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toLocaleDateString("en-US", { weekday: "short" });
      const monthDay = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      return { iso, dayName, monthDay };
    });
  }, [today]);

  // Fetch confirmed bookings for this court on selected date
  const { data: dayBookings = [] } = useQuery({
    queryKey: ['courtBookings', facility?.id, court?.name, selectedDate],
    queryFn: async () => {
      if (!facility || !court) return [];
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('id, user_id, court_name, date, time, status, player_name, account_name')
          .eq('facility_id', facility.id)
          .eq('court_name', court.name)
          .eq('date', selectedDate)
          .eq('status', 'confirmed');

        if (error) {
          console.warn("Failed to fetch bookings for date:", error);
          return [];
        }
        return data || [];
      } catch {
        return [];
      }
    },
    enabled: isOpen && !!facility && !!court,
    staleTime: 10000,
  });

  // Calculate contiguous chronological timeline blocks (Available vs Booked flow)
  const timelineBlocks = useMemo(() => {
    if (!court) return [];

    const isToday = selectedDate === todayStr;

    // Check if court has a live occupancy for today
    let activeOccupiedFrom = 0;
    let activeOccupiedUntil = 0;
    let activeBooker = court.occupiedBy || (court.name === "Court 3" ? "Marco V." : "Player");

    if (court.status === "occupied" && isToday) {
      activeOccupiedFrom = court.occupiedFrom ? parseTimeToMinutes(court.occupiedFrom) : parseTimeToMinutes("5:00 AM");
      activeOccupiedUntil = court.occupiedUntil ? parseTimeToMinutes(court.occupiedUntil) : parseTimeToMinutes("9:00 AM");
    }

    // 1. Evaluate every 1-hour interval
    const rawHourly = EXTENDED_TIME_SLOTS.slice(0, -1).map((startTime, idx) => {
      const endTime = EXTENDED_TIME_SLOTS[idx + 1];
      const startMin = parseTimeToMinutes(startTime);
      const endMin = parseTimeToMinutes(endTime);

      let isBooked = false;
      let bookerName: string | null = null;

      if (isToday && activeOccupiedUntil > activeOccupiedFrom) {
        if (startMin < activeOccupiedUntil && endMin > activeOccupiedFrom) {
          isBooked = true;
          bookerName = activeBooker;
        }
      }

      for (const b of dayBookings) {
        if (b.time) {
          const parts = b.time.split(/[-–—]/).map((s: string) => s.trim());
          if (parts.length === 2) {
            const bStart = parseTimeToMinutes(parts[0]);
            const bEnd = parseTimeToMinutes(parts[1]);
            if (startMin < bEnd && endMin > bStart) {
              isBooked = true;
              bookerName = b.player_name || b.account_name || "Booked Player";
              break;
            }
          }
        }
      }

      return {
        startTime,
        endTime,
        startMin,
        endMin,
        isBooked,
        bookerName,
      };
    });

    // 2. Group contiguous hourly slots into Continuous Timeline Blocks
    const blocks: TimelineBlock[] = [];
    let currentBlock: TimelineBlock | null = null;

    for (const slot of rawHourly) {
      const type: "available" | "booked" = slot.isBooked ? "booked" : "available";
      const bName = slot.isBooked ? (slot.bookerName || "Player") : undefined;

      if (
        currentBlock &&
        currentBlock.type === type &&
        (type === "available" || currentBlock.bookerName === bName)
      ) {
        // Extend existing block
        currentBlock.endTime = slot.endTime;
        currentBlock.endMin = slot.endMin;
        currentBlock.durationHours += 1;
        currentBlock.hourlySlots.push({ startTime: slot.startTime, endTime: slot.endTime });
      } else {
        // Push previous block if exists
        if (currentBlock) blocks.push(currentBlock);

        // Start new block
        currentBlock = {
          id: `${type}-${slot.startTime}-${slot.endTime}`,
          type,
          startTime: slot.startTime,
          endTime: slot.endTime,
          startMin: slot.startMin,
          endMin: slot.endMin,
          durationHours: 1,
          bookerName: bName,
          hourlySlots: [{ startTime: slot.startTime, endTime: slot.endTime }],
        };
      }
    }
    if (currentBlock) blocks.push(currentBlock);

    return blocks;
  }, [court, selectedDate, todayStr, dayBookings]);

  // Auto-expand the first available block or the block containing selected time
  useMemo(() => {
    if (timelineBlocks.length > 0 && !expandedBlockId) {
      const firstAvailable = timelineBlocks.find(b => b.type === "available");
      if (firstAvailable) {
        setExpandedBlockId(firstAvailable.id);
      }
    }
  }, [timelineBlocks, expandedBlockId]);

  // Handle slot tap inside an available block
  function handleSlotClick(startTime: string, endTime: string) {
    const startIdx = EXTENDED_TIME_SLOTS.indexOf(startTime);
    if (startIdx === -1) return;

    // Apply preferred duration if it fits within available block
    const targetEndIdx = startIdx + preferredDuration;
    if (targetEndIdx <= EXTENDED_TIME_SLOTS.length - 1) {
      const targetEndTime = EXTENDED_TIME_SLOTS[targetEndIdx];
      const targetEndMin = parseTimeToMinutes(targetEndTime);
      const startMin = parseTimeToMinutes(startTime);

      // Verify the whole range falls within an available block
      const enclosingBlock = timelineBlocks.find(
        b => b.type === "available" && startMin >= b.startMin && targetEndMin <= b.endMin
      );

      if (enclosingBlock) {
        setSelectedStartTime(startTime);
        setSelectedEndTime(targetEndTime);
        setExpandedBlockId(enclosingBlock.id);
        return;
      }
    }

    // Default fallback: 1 hour selection
    setSelectedStartTime(startTime);
    setSelectedEndTime(endTime);
  }

  // Handle duration change
  function handleDurationChange(hours: number) {
    setPreferredDuration(hours);
    if (selectedStartTime) {
      const startIdx = EXTENDED_TIME_SLOTS.indexOf(selectedStartTime);
      const targetEndIdx = startIdx + hours;
      if (targetEndIdx <= EXTENDED_TIME_SLOTS.length - 1) {
        const targetEndTime = EXTENDED_TIME_SLOTS[targetEndIdx];
        const targetEndMin = parseTimeToMinutes(targetEndTime);
        const startMin = parseTimeToMinutes(selectedStartTime);

        const enclosingBlock = timelineBlocks.find(
          b => b.type === "available" && startMin >= b.startMin && targetEndMin <= b.endMin
        );

        if (enclosingBlock) {
          setSelectedEndTime(targetEndTime);
          return;
        }
      }
      showToast(`Cannot select ${hours} hours here due to an adjacent reservation.`, "error");
    }
  }

  // Selected duration & total
  const selectedHours = useMemo(() => {
    if (!selectedStartTime || !selectedEndTime) return 0;
    const sIdx = EXTENDED_TIME_SLOTS.indexOf(selectedStartTime);
    const eIdx = EXTENDED_TIME_SLOTS.indexOf(selectedEndTime);
    return Math.max(0, eIdx - sIdx);
  }, [selectedStartTime, selectedEndTime]);

  const totalPrice = (court?.price || 0) * selectedHours;

  function handleConfirmBooking() {
    if (!court || !selectedStartTime || !selectedEndTime) {
      showToast("Please select an available time slot.", "error");
      return;
    }
    onClose();
    onSelectSlot(court, selectedDate, selectedStartTime, selectedEndTime);
  }

  if (!isOpen || !court || !facility) return null;

  return (
    <div className="fixed inset-0 z-[600] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] dark:bg-black/50 transition-all"
      />

      {/* Modal Content - Luxury Deep Glassmorphism */}
      <motion.div
        initial={{ y: "100%", opacity: 0.5 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 32 }}
        className="relative w-full max-w-2xl bg-surface-overlay dark:bg-[#13223F] border border-border dark:border-white/12 rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.5)] z-10 max-h-[90vh] flex flex-col"
      >
        <FocusTrap onEscape={onClose} ariaLabel="Court schedule">
        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 inset-x-0 h-48 bg-gradient-to-b from-emerald-500/[0.08] via-cyan-500/[0.03] to-transparent pointer-events-none" />

        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-border flex items-start justify-between gap-4 bg-surface-interactive/30 relative z-10 shrink-0">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <h2 className="text-xl font-black text-foreground tracking-tight">{court.name} Availability</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-cyan-500/15 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400">
                {court.type} · {court.surface}
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-medium">
              {facility.name} • <span className="font-bold text-foreground font-mono">₱{court.price}/hr</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-surface-interactive border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface-interactive/80 active:scale-95 transition-all shrink-0 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Date Selector Bar */}
        <div className="px-5 py-3.5 border-b border-border bg-surface-base/80 shrink-0 overflow-x-auto scrollbar-none flex items-center gap-2.5 relative z-10">
          {upcomingDays.map((d) => {
            const isSelected = selectedDate === d.iso;
            return (
              <button
                key={d.iso}
                type="button"
                onClick={() => {
                  setSelectedDate(d.iso);
                  setSelectedStartTime(null);
                  setSelectedEndTime(null);
                  setExpandedBlockId(null);
                }}
                className={`px-4 py-2.5 rounded-2xl flex flex-col items-center justify-center shrink-0 min-w-[85px] border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-600 dark:text-emerald-300 shadow-[0_0_18px_rgba(16,185,129,0.25)] ring-1 ring-emerald-500/40"
                    : "bg-surface-interactive border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className={`text-[12px] font-extrabold ${isSelected ? "text-emerald-600 dark:text-emerald-300" : "text-foreground"}`}>
                  {d.dayName}
                </span>
                <span className="text-[10px] text-muted-foreground font-medium mt-0.5">
                  {d.monthDay}
                </span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Chronological Timeline */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 relative z-10">
          {/* Header Controls: Duration & Status Summary */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-1 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Daily Timeline
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-surface-interactive border border-border text-foreground font-mono">
                5:00 AM – 10:00 PM
              </span>
            </div>

            {/* Quick Duration Pills */}
            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <span className="text-[11px] font-bold text-muted-foreground mr-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-muted-foreground" />
                Book:
              </span>
              {[1, 2, 3].map((hrs) => (
                <button
                  key={hrs}
                  type="button"
                  onClick={() => handleDurationChange(hrs)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    preferredDuration === hrs
                      ? "bg-emerald-500/20 border border-emerald-500/50 text-emerald-600 dark:text-emerald-300 shadow-sm"
                      : "bg-surface-interactive border border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {hrs} {hrs === 1 ? "Hour" : "Hours"}
                </button>
              ))}
            </div>
          </div>

          {/* Sequential Timeline Blocks Rail */}
          <div className="relative pl-6 space-y-3.5 before:absolute before:left-[11px] before:top-3 before:bottom-3 before:w-[2px] before:bg-gradient-to-b before:from-emerald-500/40 before:via-border before:to-emerald-500/40">
            {timelineBlocks.map((block) => {
              const isAvailable = block.type === "available";
              const isExpanded = expandedBlockId === block.id || (isAvailable && timelineBlocks.length === 1);

              // Check if any slot in this block is currently selected
              const isBlockActive = isAvailable && selectedStartTime && block.hourlySlots.some(
                s => s.startTime === selectedStartTime
              );

              if (!isAvailable) {
                // 🔴 NOT AVAILABLE / BOOKED BLOCK
                return (
                  <div key={block.id} className="relative group">
                    {/* Timeline Node */}
                    <div className="absolute -left-[23px] top-4 w-3.5 h-3.5 rounded-full bg-surface-overlay border-2 border-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.4)] flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    </div>

                    {/* Booked Card */}
                    <div className="p-4 rounded-2xl bg-red-500/[0.07] border border-red-500/20 flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-red-500/15 border border-red-500/25 flex items-center justify-center shrink-0">
                          <Lock className="w-4 h-4 text-red-400" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[14px] font-black text-foreground font-mono tracking-tight">
                              {block.startTime} – {block.endTime}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-red-500/20 border border-red-500/30 text-red-600 dark:text-red-300 font-bold uppercase tracking-wider">
                              Not Available
                            </span>
                          </div>
                          <span className="text-xs text-red-600/80 dark:text-red-300/80 font-medium truncate block mt-0.5 flex items-center gap-1.5">
                            <User className="w-3 h-3 shrink-0" />
                            Booked by: <strong className="text-foreground font-bold">{block.bookerName}</strong> ({block.durationHours} hr{block.durationHours > 1 ? "s" : ""})
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              // 🟢 AVAILABLE BLOCK
              return (
                <div key={block.id} className="relative group">
                  {/* Timeline Node */}
                  <div className="absolute -left-[23px] top-4 w-3.5 h-3.5 rounded-full bg-surface-overlay border-2 border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.7)] flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </div>

                  {/* Available Card */}
                  <div
                    className={`rounded-2xl border transition-all overflow-hidden ${
                      isBlockActive
                        ? "bg-emerald-500/[0.09] border-emerald-500/40 shadow-[0_0_25px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/30"
                        : "bg-surface-interactive border-border hover:border-emerald-500/30"
                    }`}
                  >
                    {/* Block Summary Header */}
                    <div
                      onClick={() => setExpandedBlockId(isExpanded ? null : block.id)}
                      className="p-4 flex items-center justify-between cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                          <Sparkles className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[14px] font-black text-foreground font-mono tracking-tight">
                              {block.startTime} – {block.endTime}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 font-bold uppercase tracking-wider">
                              Available
                            </span>
                          </div>
                          <span className="text-xs text-emerald-600 dark:text-emerald-400/90 font-medium block mt-0.5">
                            {block.durationHours} hours open • <span className="font-bold text-foreground font-mono">₱{court.price}/hr</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground font-bold hidden sm:inline">
                          {isExpanded ? "Collapse" : "Select Slot"}
                        </span>
                        <div className="w-7 h-7 rounded-lg bg-surface-interactive flex items-center justify-center text-muted-foreground group-hover:text-foreground transition-colors">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>
                    </div>

                    {/* Hourly Interactive Slot Chips inside this Available Window */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="px-4 pb-4 pt-1 border-t border-border"
                        >
                          <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center justify-between">
                            <span>Select Starting Time:</span>
                            <span className="text-emerald-500 font-medium lowercase">
                              Tap to reserve {preferredDuration} hour{preferredDuration > 1 ? "s" : ""}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {block.hourlySlots.map((slot) => {
                              const startIdx = EXTENDED_TIME_SLOTS.indexOf(slot.startTime);
                              const endIdx = EXTENDED_TIME_SLOTS.indexOf(slot.endTime);
                              const selStartIdx = selectedStartTime ? EXTENDED_TIME_SLOTS.indexOf(selectedStartTime) : -1;
                              const selEndIdx = selectedEndTime ? EXTENDED_TIME_SLOTS.indexOf(selectedEndTime) : -1;

                              const isSelected =
                                selStartIdx !== -1 &&
                                selEndIdx !== -1 &&
                                startIdx >= selStartIdx &&
                                endIdx <= selEndIdx;

                              return (
                                <button
                                  key={slot.startTime}
                                  type="button"
                                  onClick={() => handleSlotClick(slot.startTime, slot.endTime)}
                                  className={`py-2.5 px-2 rounded-xl border flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                                    isSelected
                                      ? "bg-emerald-500/25 border-emerald-400 text-foreground shadow-[0_0_15px_rgba(16,185,129,0.4)] ring-1 ring-emerald-400 scale-[1.02]"
                                      : "bg-surface-interactive border-border text-foreground hover:border-emerald-500/50 active:scale-95"
                                  }`}
                                >
                                  <div className="flex items-center gap-1">
                                    {isSelected && <Check className="w-3 h-3 text-emerald-400" />}
                                    <span className={`text-xs font-bold font-mono ${isSelected ? "text-emerald-600 dark:text-emerald-300" : "text-foreground"}`}>
                                      {slot.startTime}
                                    </span>
                                  </div>
                                  <span className={`text-[10px] font-mono mt-0.5 ${isSelected ? "text-foreground font-bold" : "text-cyan-600 dark:text-cyan-400 font-semibold"}`}>
                                    ₱{court.price}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Floating/Sticky Action Bar */}
        <div className="p-4 sm:p-5 border-t border-border bg-surface-base/90 backdrop-blur-xl shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 relative z-10">
          <div className="w-full sm:w-auto">
            {selectedStartTime && selectedEndTime ? (
              <div>
                <div className="text-xs text-muted-foreground font-medium">
                  Selected: <strong className="text-foreground">{selectedDate}</strong> • <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{selectedStartTime} – {selectedEndTime}</span>
                </div>
                <div className="text-lg font-black font-mono text-cyan-600 dark:text-cyan-400 mt-0.5">
                  ₱{totalPrice.toLocaleString()} <span className="text-xs text-muted-foreground font-normal">({selectedHours} hour{selectedHours > 1 ? "s" : ""})</span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                Tap any available green window above to pick your booking time.
              </div>
            )}
          </div>

          <button
            type="button"
            disabled={!selectedStartTime || !selectedEndTime || selectedHours === 0}
            onClick={handleConfirmBooking}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl text-sm font-black bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-[0_10px_25px_rgba(16,185,129,0.35)] hover:opacity-95 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Proceed to Book {totalPrice > 0 ? `(₱${totalPrice})` : ""}</span>
          </button>
        </div>
        </FocusTrap>
      </motion.div>
    </div>
  );
}
