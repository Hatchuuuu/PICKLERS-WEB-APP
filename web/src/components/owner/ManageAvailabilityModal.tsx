"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Calendar as CalendarIcon, ShieldAlert, Trash2, Check, Clock } from "lucide-react";
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
    
    // Simple deep check
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
    
    // Check if exactly this slot already exists (same date and times)
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 dark:bg-[#080D1C]/60 backdrop-blur-3xl"
        onClick={onClose} 
      />
      
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }} 
        exit={{ scale: 0.95, opacity: 0, y: 20 }} 
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="relative w-full max-w-md bg-surface-base dark:bg-[#080D1C]/95 backdrop-blur-xl rounded-2xl overflow-hidden shadow-xl border border-border dark:border-white/10 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-border dark:border-white/[0.05]">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground dark:text-white">Schedule & Availability</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{court.name}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-interactive text-muted-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-8 max-h-[70vh] overflow-y-auto hide-scrollbar">
          
          {/* Section 1: Overall Status */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[15px] font-semibold text-foreground dark:text-slate-200">Disable Entirely</h3>
                <p className="text-[13px] text-muted-foreground mt-0.5 max-w-[220px]">
                  Turn this on to completely remove this court from all bookings indefinitely.
                </p>
              </div>
              <button 
                onClick={() => setIsAvailable(!isAvailable)}
                className={cn(
                  "relative w-12 h-7 rounded-lg transition-colors duration-300 ease-in-out shrink-0 border",
                  !isAvailable ? "bg-red-500/20 border-red-500/50" : "bg-surface-interactive border-border dark:bg-white/[0.04] dark:border-white/10"
                )}
              >
                <motion.div 
                  layout
                  className={cn(
                    "absolute top-[2px] bottom-[2px] w-[22px] rounded-md shadow-sm",
                    !isAvailable ? "left-[24px] bg-red-500" : "left-[2px] bg-muted-foreground dark:bg-white/70"
                  )}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </button>
            </div>
            
            <AnimatePresence>
              {!isAvailable && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, marginTop: 0 }} 
                  animate={{ opacity: 1, height: "auto", marginTop: 12 }} 
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500">
                    <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                    <p className="text-[13px] font-medium leading-relaxed">
                      This court is currently disabled. No one can book it until you turn this off.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="h-px bg-border dark:bg-white/[0.05] w-full" />

          {/* Section 2: Blocked Dates */}
          <div className={cn("space-y-5 transition-opacity", !isAvailable && "opacity-50 pointer-events-none")}>
            <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[15px] font-semibold text-foreground dark:text-slate-200">Blocked Dates</h3>
                  <p className="text-[13px] text-muted-foreground mt-0.5">
                    Block days or specific hours for maintenance.
                  </p>
                </div>
            </div>

            {/* Specific Time Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-interactive/30 border border-border dark:bg-white/[0.03] dark:border-white/10">
                <span className="text-[14px] font-medium text-foreground">Specific Date & Time Range</span>
                <button 
                  onClick={() => setIsSpecificTime(!isSpecificTime)}
                  className={cn(
                    "relative w-12 h-7 rounded-lg transition-colors duration-300 ease-in-out shrink-0 border",
                    isSpecificTime ? "bg-emerald-500/20 border-emerald-500/50" : "bg-muted border-border dark:bg-white/[0.04] dark:border-white/10"
                  )}
                >
                  <motion.div 
                    layout
                    className={cn(
                      "absolute top-[2px] bottom-[2px] w-[22px] rounded-md shadow-sm",
                      isSpecificTime ? "left-[24px] bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "left-[2px] bg-muted-foreground dark:bg-white/70"
                    )}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
            </div>

            {/* Inputs Container */}
            <div className="space-y-3">
                {/* Date Picker */}
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
                   <p className="text-red-500 text-[13px] font-medium text-center">Start and end time cannot be the same.</p>
                )}

                <button 
                  onClick={addDate}
                  disabled={!dateInput || !isValidTimeRange}
                  className="w-full py-3 rounded-lg font-bold text-sm bg-white/5 hover:bg-white/10 border border-white/10 text-foreground active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100"
                >
                  Block {isSpecificTime ? "Time Range" : "Full Day"}
                </button>
            </div>

            {/* Blocked Dates List */}
            <div className="space-y-2 min-h-[100px]">
              <AnimatePresence mode="popLayout">
                {blockedDates.length === 0 ? (
                  <motion.div 
                    key="empty"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-8 text-center"
                  >
                    <div className="w-12 h-12 rounded-full bg-surface-interactive flex items-center justify-center mb-3">
                      <CalendarIcon className="w-5 h-5 text-muted-foreground opacity-50" />
                    </div>
                    <p className="text-[13px] font-medium text-muted-foreground">No dates blocked</p>
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
                        className="flex items-center justify-between p-3.5 rounded-xl bg-surface-base border border-border dark:bg-[#0A1124]/50 backdrop-blur-md shadow-sm dark:border-white/[0.04]"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                            <ShieldAlert className="w-4 h-4 text-red-500" />
                          </div>
                          <div className="flex flex-col">
                              <span className="text-[14px] font-semibold text-foreground">{formatted}</span>
                              {!slot.isFullDay && slot.startTime && slot.endTime && (
                                  <span className="text-[12px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                      <Clock className="w-3 h-3" />
                                      {formatTimeStr(slot.startTime)} - {formatTimeStr(slot.endTime)}
                                  </span>
                              )}
                          </div>
                        </div>
                        <button 
                          onClick={() => removeDate(slot.id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-500/0 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 active:scale-90 transition-all shrink-0"
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

        {/* Footer */}
        <div className="p-6 border-t border-border dark:border-white/10 bg-surface-base dark:bg-[#080D1C]/95 backdrop-blur-xl">
          <button 
            onClick={handleSave}
            disabled={!hasChanges}
            className="w-full py-3.5 rounded-xl font-bold text-[15px] bg-emerald-500 hover:bg-emerald-400 text-[#080D1C] shadow-[0_4px_16px_rgba(16,185,129,0.3)] border border-emerald-400/50 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none disabled:border-transparent disabled:active:scale-100 disabled:pointer-events-none"
          >
            <Check className="w-5 h-5 stroke-2" />
            Save Schedule
          </button>
        </div>
      </motion.div>
    </div>
  );
}
