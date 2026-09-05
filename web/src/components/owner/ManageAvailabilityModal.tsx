"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Calendar as CalendarIcon, ShieldAlert, Trash2, Check, Clock, MapPin, CalendarDays } from "lucide-react";
import { useOwner, BlockedSlot } from "@/contexts/OwnerContext";
import { cn } from "@/lib/utils";
import { TimePicker } from "@/components/shared/TimePicker";
import { CustomDatePicker } from "@/components/shared/CustomDatePicker";

export function ManageAvailabilityModal({ courtId, onClose }: { courtId: number, onClose: () => void }) {
  const { ownerCourts, updateCourt } = useOwner();
  const court = ownerCourts.find(c => c.id === courtId);

  if (!court) return null;

  const [dateInput, setDateInput] = useState("");
  const [blockedDates, setBlockedDates] = useState<BlockedSlot[]>(court.blockedDates || []);
  const [isAvailable, setIsAvailable] = useState(court.available);

  const [isSpecificTime, setIsSpecificTime] = useState(false);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("17:00");

  const isValidTimeRange = !isSpecificTime || (startTime !== endTime);

  const hasChanges = useMemo(() => {
    if (isAvailable !== court.available) return true;
    const initialBlocked = court.blockedDates || [];
    if (blockedDates.length !== initialBlocked.length) return true;

    const sortedCurrent = [...blockedDates].sort((a, b) => a.id.localeCompare(b.id));
    const sortedInitial = [...initialBlocked].sort((a, b) => a.id.localeCompare(b.id));

    for (let i = 0; i < sortedCurrent.length; i++) {
      if (sortedCurrent[i].id !== sortedInitial[i].id) return true;
    }
    return false;
  }, [isAvailable, blockedDates, court]);

  function handleSave() {
    if (!court) return;
    updateCourt(court.id, { available: isAvailable, blockedDates });
    onClose();
  }

  function addDate() {
    if (!dateInput) return;

    const newSlot: BlockedSlot = {
      id: `${dateInput}-${isSpecificTime ? `${startTime}-${endTime}` : 'fullday'}-${Date.now()}`,
      date: dateInput,
      isFullDay: !isSpecificTime,
      startTime: isSpecificTime ? startTime : undefined,
      endTime: isSpecificTime ? endTime : undefined
    };

    const exists = blockedDates.some(slot =>
      slot.date === newSlot.date &&
      slot.isFullDay === newSlot.isFullDay &&
      slot.startTime === newSlot.startTime &&
      slot.endTime === newSlot.endTime
    );

    if (!exists) {
      setBlockedDates(prev => [...prev, newSlot].sort((a, b) => a.date.localeCompare(b.date)));
    }

    setDateInput("");
  }

  function removeDate(idToRemove: string) {
    setBlockedDates(prev => prev.filter(d => d.id !== idToRemove));
  }

  return (
    <div className="fixed inset-0 z-[600] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-[2px] dark:bg-black/50 overflow-hidden" onClick={onClose}>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 35 }}
        className="relative w-full max-h-[85vh] sm:h-auto sm:max-w-md sm:max-h-[90vh] bg-surface-overlay dark:bg-[#13223F] border-t sm:border border-border dark:border-white/12 rounded-t-[32px] sm:rounded-[28px] overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.5)] flex flex-col text-foreground mb-0 sm:my-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 pb-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500 dark:text-emerald-400 shadow-[0_0_16px_rgba(16,185,129,0.25)] shrink-0">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-foreground tracking-tight leading-none mb-1">Schedule & Availability</h2>
              <p className="text-[11px] sm:text-xs text-muted-foreground font-medium leading-none">Configure maintenance & blocked slots</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-interactive border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto hide-scrollbar">
          
          {/* Target Court Banner */}
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
              <div>
                <div className="text-xs font-extrabold text-emerald-600 dark:text-emerald-300">{court.name}</div>
                <div className="text-[10px] text-muted-foreground font-medium">{court.surface || "Indoor · Premium Hard"}</div>
              </div>
            </div>
            <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              Target Court
            </span>
          </div>

          {/* Section 1: Overall Status */}
          <div className="space-y-3">
            <div className="p-3.5 sm:p-4 rounded-2xl bg-surface-interactive border border-border flex items-center justify-between">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-foreground">Disable Entirely</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5 max-w-[220px]">
                  Completely remove this court from all bookings indefinitely.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAvailable(!isAvailable)}
                className={cn(
                  "relative w-12 h-7 rounded-full transition-colors duration-300 ease-in-out shrink-0 border cursor-pointer",
                  !isAvailable ? "bg-red-500/20 border-red-500/40" : "bg-surface-base border-border"
                )}
              >
                <motion.div
                  layout
                  className={cn(
                    "absolute top-[2px] bottom-[2px] w-[22px] rounded-full shadow-sm",
                    !isAvailable ? "left-[24px] bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]" : "left-[2px] bg-muted-foreground/60"
                  )}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </button>
            </div>

            <AnimatePresence>
              {!isAvailable && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: "auto", marginTop: 8 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400">
                    <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                    <p className="text-xs font-medium leading-relaxed">
                      This court is currently disabled. Players cannot book this court until re-enabled.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="h-px bg-border w-full" />

          {/* Section 2: Blocked Dates */}
          <div className={cn("space-y-4 transition-opacity", !isAvailable && "opacity-40 pointer-events-none")}>
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground mb-1">Blocked Dates</h3>
              <p className="text-[11px] text-muted-foreground">
                Block full days or specific time ranges for maintenance or events.
              </p>
            </div>

            {/* Segmented Control Pill Switcher */}
            <div className="p-1 rounded-2xl bg-surface-interactive border border-border grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => setIsSpecificTime(false)}
                className={cn(
                  "py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                  !isSpecificTime
                    ? "bg-gradient-to-r from-emerald-500 to-emerald-400 text-white font-bold shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>Full Day Block</span>
              </button>

              <button
                type="button"
                onClick={() => setIsSpecificTime(true)}
                className={cn(
                  "py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                  isSpecificTime
                    ? "bg-gradient-to-r from-emerald-500 to-emerald-400 text-white font-bold shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Specific Time</span>
              </button>
            </div>

            {/* Inputs Container */}
            <div className="space-y-3">
              {/* Custom Date Picker */}
              <div className="relative">
                <CustomDatePicker
                  value={dateInput}
                  onChange={setDateInput}
                />
              </div>

              {/* Sliding Time Inputs */}
              <AnimatePresence>
                {isSpecificTime && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center gap-3 pt-1 pb-1">
                      <TimePicker
                        value={startTime}
                        onChange={setStartTime}
                        label="START TIME"
                      />
                      <TimePicker
                        value={endTime}
                        onChange={setEndTime}
                        label="END TIME"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {!isValidTimeRange && dateInput && (
                <p className="text-red-500 text-xs font-medium text-center">Start and end time cannot be the same.</p>
              )}

              <button
                type="button"
                onClick={addDate}
                disabled={!dateInput || !isValidTimeRange}
                className="w-full py-3 rounded-2xl font-bold text-xs sm:text-sm bg-emerald-500 hover:bg-emerald-400 text-white shadow-md active:scale-[0.98] transition-all disabled:opacity-40 disabled:shadow-none disabled:active:scale-100 cursor-pointer"
              >
                Block {isSpecificTime ? "Time Range" : "Full Day"}
              </button>
            </div>

            {/* Blocked Dates List */}
            <div className="space-y-2 min-h-[80px]">
              <AnimatePresence mode="popLayout">
                {blockedDates.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-6 text-center"
                  >
                    <div className="w-10 h-10 rounded-full bg-surface-interactive border border-border flex items-center justify-center mb-2">
                      <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <p className="text-xs font-medium text-muted-foreground">No dates blocked yet</p>
                  </motion.div>
                ) : (
                  blockedDates.map(slot => {
                    const dateObj = new Date(slot.date);
                    const formatted = dateObj.toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

                    const formatTimeStr = (timeStr?: string) => {
                      if (!timeStr) return "";
                      const [h, m] = timeStr.split(":");
                      let hour = parseInt(h, 10);
                      const ampm = hour >= 12 ? 'PM' : 'AM';
                      hour = hour % 12;
                      if (hour === 0) hour = 12;
                      return `${hour.toString().padStart(2, "0")}:${m} ${ampm}`;
                    };

                    return (
                      <motion.div
                        key={slot.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, height: 0, marginBottom: 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 40 }}
                        className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-interactive/60 border border-border shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0 text-red-500 dark:text-red-400">
                            <ShieldAlert className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs sm:text-sm font-bold text-foreground">{formatted}</span>
                            {!slot.isFullDay && slot.startTime && slot.endTime && (
                              <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                                {formatTimeStr(slot.startTime)} - {formatTimeStr(slot.endTime)}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeDate(slot.id)}
                          className="w-8 h-8 rounded-xl flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-500 dark:text-red-400 active:scale-90 transition-all shrink-0 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </motion.div>
                    )
                  })
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="p-4 sm:p-6 border-t border-border bg-surface-overlay shrink-0">
          <button
            type="button"
            onClick={handleSave}
            disabled={!hasChanges}
            className="w-full py-3.5 rounded-2xl font-bold text-xs sm:text-sm bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:shadow-none disabled:active:scale-100 disabled:pointer-events-none cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Save Schedule</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
