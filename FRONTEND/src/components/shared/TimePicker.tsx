import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";

export function TimePicker({ 
  value, 
  onChange 
}: { 
  value: string; 
  onChange: (val: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  // Parse "HH:MM" (24h) to 12h format
  const parseTime = (val: string) => {
    const [hStr, mStr] = val.split(":");
    let h = parseInt(hStr, 10);
    const m = mStr;
    const period = h >= 12 ? "PM" : "AM";
    if (h === 0) h = 12;
    if (h > 12) h -= 12;
    const hh = h.toString().padStart(2, "0");
    return { hh, mm: m, period };
  };

  const to24h = (hh: string, mm: string, period: string) => {
    let h = parseInt(hh, 10);
    if (period === "AM" && h === 12) h = 0;
    if (period === "PM" && h < 12) h += 12;
    return `${h.toString().padStart(2, "0")}:${mm}`;
  };

  const initialParsed = parseTime(value || "06:00");
  const [tempHour, setTempHour] = useState(initialParsed.hh);
  const [tempMinute, setTempMinute] = useState(initialParsed.mm);
  const [tempPeriod, setTempPeriod] = useState(initialParsed.period);

  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, "0"));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"));
  const periods = ["AM", "PM"];

  const hourRef = useRef<HTMLDivElement>(null);
  const minRef = useRef<HTMLDivElement>(null);
  const periodRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      const parsed = parseTime(value || "06:00");
      setTempHour(parsed.hh);
      setTempMinute(parsed.mm);
      setTempPeriod(parsed.period);
      
      // Auto-scroll to selected values when modal opens
      setTimeout(() => {
        if (hourRef.current) hourRef.current.scrollTo({ top: hours.indexOf(parsed.hh) * 30, behavior: "instant" as unknown as ScrollBehavior });
        if (minRef.current) minRef.current.scrollTo({ top: minutes.indexOf(parsed.mm) * 30, behavior: "instant" as unknown as ScrollBehavior });
        if (periodRef.current) periodRef.current.scrollTo({ top: periods.indexOf(parsed.period) * 30, behavior: "instant" as unknown as ScrollBehavior });
      }, 0);
    }
  }, [isOpen, value]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>, setter: (val: string) => void, options: string[]) => {
    const y = e.currentTarget.scrollTop;
    const index = Math.round(y / 30);
    const newValue = options[index];
    if (newValue) {
      setter(newValue);
    }
  };

  const handleItemClick = (val: string, setter: (val: string) => void, options: string[], ref: React.RefObject<HTMLDivElement>) => {
    setter(val);
    const idx = options.indexOf(val);
    if (ref.current && idx !== -1) {
      ref.current.scrollTo({ top: idx * 30, behavior: "smooth" });
    }
  };

  const handleSave = () => {
    onChange(to24h(tempHour, tempMinute, tempPeriod));
    setIsOpen(false);
  };

  const displayTime = parseTime(value || "06:00");

  const modal = isOpen ? createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={() => setIsOpen(false)}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="relative w-[300px] rounded-[24px] overflow-hidden shadow-2xl z-10 flex flex-col"
        style={{ 
          background: "rgba(28, 28, 30, 0.8)", 
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.1)"
        }}
      >
        <div className="px-5 py-4 border-b border-white/10 flex justify-between items-center">
          <span className="text-sm font-semibold text-white">Time</span>
          <button onClick={handleSave} className="text-sm font-bold text-[#0a84ff] active:opacity-70">Done</button>
        </div>

        <div className="flex justify-between items-center px-4 py-6">
          {/* Hour Column */}
          <div 
            ref={hourRef}
            onScroll={(e) => handleScroll(e, setTempHour, hours)}
            className="h-[150px] w-1/3 overflow-y-scroll snap-y snap-mandatory no-scrollbar relative flex flex-col items-center"
          >
            <div className="h-[60px] shrink-0" />
            {hours.map(h => (
              <div 
                key={h} 
                onClick={() => handleItemClick(h, setTempHour, hours, hourRef)}
                className={cn(
                  "h-[30px] w-full flex items-center justify-center shrink-0 snap-center text-xl cursor-pointer transition-colors",
                  tempHour === h ? "text-white font-bold" : "text-white/40 font-medium"
                )}
              >
                {h}
              </div>
            ))}
            <div className="h-[60px] shrink-0" />
          </div>

          <span className="text-2xl font-bold text-white mb-1">:</span>

          {/* Minute Column */}
          <div 
            ref={minRef}
            onScroll={(e) => handleScroll(e, setTempMinute, minutes)}
            className="h-[150px] w-1/3 overflow-y-scroll snap-y snap-mandatory no-scrollbar relative flex flex-col items-center"
          >
            <div className="h-[60px] shrink-0" />
            {minutes.map(m => (
              <div 
                key={m} 
                onClick={() => handleItemClick(m, setTempMinute, minutes, minRef)}
                className={cn(
                  "h-[30px] w-full flex items-center justify-center shrink-0 snap-center text-xl cursor-pointer transition-colors",
                  tempMinute === m ? "text-white font-bold" : "text-white/40 font-medium"
                )}
              >
                {m}
              </div>
            ))}
            <div className="h-[60px] shrink-0" />
          </div>

          {/* Period Column */}
          <div 
            ref={periodRef}
            onScroll={(e) => handleScroll(e, setTempPeriod, periods)}
            className="h-[150px] w-1/3 overflow-y-scroll snap-y snap-mandatory no-scrollbar relative flex flex-col items-center"
          >
            <div className="h-[60px] shrink-0" />
            {periods.map(p => (
              <div 
                key={p} 
                onClick={() => handleItemClick(p, setTempPeriod, periods, periodRef)}
                className={cn(
                  "h-[30px] w-full flex items-center justify-center shrink-0 snap-center text-xl cursor-pointer transition-colors",
                  tempPeriod === p ? "text-white font-bold" : "text-white/40 font-medium"
                )}
              >
                {p}
              </div>
            ))}
            <div className="h-[60px] shrink-0" />
          </div>

          {/* Selection Highlight (Visual Only) */}
          <div className="absolute top-1/2 left-4 right-4 h-[34px] -translate-y-[1px] bg-white/10 rounded-lg pointer-events-none -z-10" />
        </div>
      </motion.div>
    </div>,
    document.body
  ) : null;

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="px-3 py-1.5 rounded-lg text-[15px] font-medium transition-colors active:scale-95"
        style={{ 
          background: "rgba(255, 255, 255, 0.1)", 
          color: "#fff"
        }}
      >
        {displayTime.hh}:{displayTime.mm} {displayTime.period}
      </button>

      <AnimatePresence>
        {modal}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </>
  );
}
