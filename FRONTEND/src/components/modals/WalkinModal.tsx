import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Check, ChevronDown } from "lucide-react";
import { slotIndex, TIME_SLOTS } from "@/lib/timeUtils";
import { cn } from "@/lib/utils";

function PremiumSelect({ value, onChange, options, placeholder = "Select..." }: { value: string, onChange: (val: string) => void, options: string[], placeholder?: string }) {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="relative">
            <button 
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.15] rounded-2xl px-4 py-3.5 text-left text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0BCE83]/50 transition-all flex items-center justify-between text-white"
            >
                <span className={value ? "text-white" : "text-slate-500"}>{value || placeholder}</span>
                <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", isOpen && "rotate-180")} />
            </button>
            <AnimatePresence>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                        <motion.div 
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            className="absolute top-[calc(100%+8px)] left-0 right-0 bg-[#0F172A]/95 backdrop-blur-xl border border-white/[0.1] rounded-2xl shadow-2xl z-50 py-2 max-h-[240px] overflow-y-auto"
                        >
                            {options.map(opt => (
                                <button
                                    key={opt}
                                    type="button"
                                    onClick={() => { onChange(opt); setIsOpen(false); }}
                                    className={cn(
                                        "w-full text-left px-4 py-2.5 text-[14px] hover:bg-white/[0.06] transition-colors",
                                        value === opt ? "text-[#0BCE83] font-bold bg-[#0BCE83]/10" : "text-slate-300 font-medium"
                                    )}
                                >
                                    {opt}
                                </button>
                            ))}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

export function WalkInModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: (name: string, court: string) => void }) {
  const [playerName, setPlayerName] = useState("");
  const [court, setCourt] = useState("Court 1");
  const [startTime, setStartTime] = useState("8:00 AM");
  const [endTime, setEndTime] = useState("10:00 AM");
  const [payMethod, setPayMethod] = useState<"cash" | "gcash">("cash");
  const courts = ["Court 1", "Court 2", "Court 3", "Center Court", "Court 5", "Court 6"];
  const endSlots = TIME_SLOTS.slice(slotIndex(startTime) + 1);

  function handleConfirm() {
    if (!playerName.trim()) return;
    onConfirm(playerName, court);
  }

  return (
    <>
      <motion.div key="walkin-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="fixed inset-0 z-40 bg-black/20 dark:bg-[#0B132B]/80 backdrop-blur-md" />
      <motion.div key="walkin-modal"
        initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-[28px] p-6 shadow-[0_0_80px_rgba(11,206,131,0.15)] border border-white/[0.08] bg-background dark:bg-[#0B132B]/95 backdrop-blur-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-black text-white tracking-wide" >LOG WALK-IN</h2>
              <p className="text-sm text-slate-400 mt-1">Register a front-desk booking instantly</p>
            </div>
            <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/[0.08] border border-white/[0.08] text-slate-400 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-5">
            <div>
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Player Name</label>
              <input value={playerName} onChange={e => setPlayerName(e.target.value)} placeholder="e.g. Juan Dela Cruz (or leave blank)"
                className="w-full px-4 py-3.5 rounded-2xl text-[15px] outline-none border border-white/[0.08] bg-white/[0.03] text-white focus:border-[#0BCE83]/50 focus:bg-white/[0.05] transition-all placeholder:text-slate-600 font-medium" />
            </div>
            <div>
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Court</label>
              <PremiumSelect value={court} onChange={setCourt} options={courts} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Start</label>
                <PremiumSelect 
                  value={startTime} 
                  onChange={val => { setStartTime(val); setEndTime(TIME_SLOTS[slotIndex(val) + 2] ?? TIME_SLOTS[slotIndex(val) + 1]); }} 
                  options={TIME_SLOTS.slice(0, -1)} 
                />
              </div>
              <div>
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">End</label>
                <PremiumSelect value={endTime} onChange={setEndTime} options={endSlots} />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Payment</label>
              <div className="flex bg-white/[0.02] p-1.5 rounded-2xl border border-white/[0.05]">
                {(["cash", "gcash"] as const).map(m => (
                  <button key={m} onClick={() => setPayMethod(m)}
                    className="relative flex-1 py-3 rounded-xl text-[14px] font-bold transition-all"
                  >
                    {payMethod === m && (
                      <motion.div layoutId="walkin-pay-pill" className="absolute inset-0 bg-[#0BCE83]/10 border border-[#0BCE83]/30 rounded-xl" />
                    )}
                    <span className={cn("relative z-10", payMethod === m ? "text-[#0BCE83]" : "text-slate-500 hover:text-slate-300")}>
                      {m === "cash" ? "Cash on Site" : "GCash (Counter)"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button onClick={handleConfirm}
            className="w-full mt-8 py-4 rounded-2xl font-black text-[15px] transition-all flex items-center justify-center gap-2 bg-[#0BCE83] text-black hover:bg-[#0ea86f] shadow-[0_0_20px_rgba(11,206,131,0.3)] hover:shadow-[0_0_30px_rgba(11,206,131,0.5)] active:scale-[0.98]"
          >
            <Check className="w-5 h-5" /> CONFIRM WALK-IN
          </button>
        </div>
      </motion.div>
    </>
  );
}
