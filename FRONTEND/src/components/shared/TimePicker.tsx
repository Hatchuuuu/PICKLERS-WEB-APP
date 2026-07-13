import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";
import { Check } from "lucide-react";

export function TimePicker({ 
  value, 
  onChange,
  label
}: { 
  value: string; 
  onChange: (val: string) => void;
  label: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const MULTIPLIER = 15;
  const CENTER_OFFSET = Math.floor(MULTIPLIER / 2) * 24; // 7 * 24 = 168

  // Generate times array (e.g. ["12:00 AM", "01:00 AM", ..., "11:00 PM"])
  const baseTimes = React.useMemo(() => {
    const arr = [];
    for (let h = 0; h < 24; h++) {
      let hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
      let period = h >= 12 ? "PM" : "AM";
      arr.push(`${hour.toString().padStart(2, "0")}:00 ${period}`);
    }
    return arr;
  }, []);

  const displayTimes = React.useMemo(() => {
    const arr = [];
    for (let i = 0; i < MULTIPLIER; i++) {
      arr.push(...baseTimes);
    }
    return arr;
  }, [baseTimes]);

  // Convert "HH:MM" (24h) to "HH:MM AM/PM"
  const parseToDisplay = (val24: string) => {
    if (!val24) return "08:00 AM";
    const [hStr, mStr] = val24.split(":");
    let h = parseInt(hStr, 10);
    const m = mStr;
    const period = h >= 12 ? "PM" : "AM";
    if (h === 0) h = 12;
    if (h > 12) h -= 12;
    return `${h.toString().padStart(2, "0")}:${m} ${period}`;
  };

  // Convert "H:MM AM/PM" to "HH:MM" (24h)
  const parseTo24h = (displayStr: string) => {
    const [time, period] = displayStr.split(" ");
    let [hStr, mStr] = time.split(":");
    let h = parseInt(hStr, 10);
    if (period === "AM" && h === 12) h = 0;
    if (period === "PM" && h < 12) h += 12;
    return `${h.toString().padStart(2, "0")}:${mStr}`;
  };

  const [activeIndex, setActiveIndex] = useState(CENTER_OFFSET + 8);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      const initialDisplay = parseToDisplay(value || "08:00");
      let idx = baseTimes.indexOf(initialDisplay);
      if (idx === -1) idx = 8;
      
      const targetIndex = CENTER_OFFSET + idx;
      setActiveIndex(targetIndex);
      
      // Auto-scroll to selected value when modal opens
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTo({ top: targetIndex * 40, behavior: "instant" as unknown as ScrollBehavior });
        }
      }, 0);
    }
  }, [isOpen, value, baseTimes]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const y = e.currentTarget.scrollTop;
    const index = Math.round(y / 40);
    if (index >= 0 && index < displayTimes.length && index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  const handleItemClick = (index: number) => {
    setActiveIndex(index);
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: index * 40, behavior: "smooth" });
    }
  };

  const handleSave = () => {
    onChange(parseTo24h(displayTimes[activeIndex]));
    setIsOpen(false);
  };

  const displayTime = parseToDisplay(value || "08:00");

  const modal = typeof document !== "undefined" ? createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-[#080D1C]/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="relative w-full max-w-[320px] rounded-2xl overflow-hidden shadow-2xl flex flex-col bg-[#0A1124] border border-white/10"
          >
            <div className="flex-1 py-8 flex justify-center items-center relative">
              <div 
                ref={scrollRef}
                onScroll={handleScroll}
                className="h-[200px] w-full overflow-y-scroll snap-y snap-mandatory no-scrollbar relative flex flex-col items-center"
              >
                <div className="h-[80px] w-full shrink-0" />
                {displayTimes.map((timeStr, i) => {
                  const isActive = activeIndex === i;
                  return (
                    <div 
                      key={`${timeStr}-${i}`} 
                      onClick={() => handleItemClick(i)}
                      className={cn(
                        "h-[40px] w-full flex items-center justify-center shrink-0 snap-center cursor-pointer transition-all duration-200 select-none relative z-10",
                      )}
                    >
                      <span className={cn(
                        "text-[18px] font-bold transition-all duration-200 z-10",
                        isActive ? "text-white" : "text-white/30"
                      )}>
                        {timeStr}
                      </span>
                      {isActive && (
                        <motion.div
                          layoutId="activePill"
                          className="absolute w-[180px] h-[40px] bg-emerald-500 rounded-[14px] -z-10 shadow-[0_4px_16px_rgba(16,185,129,0.3)]"
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      )}
                    </div>
                  );
                })}
                <div className="h-[80px] w-full shrink-0" />
              </div>
            </div>

            {/* Footer Save Button */}
            <div className="p-4 border-t border-white/5">
              <button 
                onClick={handleSave}
                className="w-full py-3.5 rounded-xl font-bold text-[15px] bg-emerald-500 hover:bg-emerald-400 text-[#080D1C] shadow-[0_4px_16px_rgba(16,185,129,0.3)] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5 stroke-2" />
                Save Time
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  ) : null;

  return (
    <>
      <button 
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(true);
        }}
        className="flex-1 w-full bg-surface-interactive/30 dark:bg-white/[0.02] border border-border dark:border-white/5 rounded-xl p-3 flex flex-col items-center justify-center gap-2 hover:bg-surface-interactive/50 dark:hover:bg-white/[0.04] transition-colors cursor-pointer active:scale-95"
      >
        <span className="text-[11px] font-bold tracking-[0.1em] text-muted-foreground uppercase pointer-events-none">
          {label}
        </span>
        <div 
          className="bg-surface-base dark:bg-white/[0.06] px-5 py-2 rounded-lg text-foreground font-semibold text-[14px] whitespace-nowrap shadow-sm pointer-events-none"
        >
          {displayTime}
        </div>
      </button>

      {modal}

      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </>
  );
}
