"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Check, ChevronDown, AlertCircle } from "lucide-react";
import { slotIndex, TIME_SLOTS } from "@/lib/timeUtils";
import { cn } from "@/lib/utils";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

function PremiumSelect({ value, onChange, options, placeholder = "Select...", error }: { value: string, onChange: (val: string) => void, options: string[], placeholder?: string, error?: string }) {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="relative">
            <button 
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                  "w-full bg-white/[0.03] border rounded-2xl px-4 py-3.5 text-left text-[15px] focus:outline-none focus-visible:ring-2 transition-all flex items-center justify-between text-white",
                  error ? "border-red-500/50 focus:ring-red-500/50" : "border-white/[0.08] hover:border-white/[0.15] focus:ring-[#0BCE83]/50"
                )}
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

const walkInSchema = z.object({
  playerName: z.string().min(2, "Player name must be at least 2 characters").max(50, "Name too long"),
  court: z.string().min(1, "Please select a court"),
  startTime: z.string().min(1, "Required"),
  endTime: z.string().min(1, "Required"),
  payMethod: z.enum(["cash", "gcash"])
}).refine(data => {
  const startIdx = TIME_SLOTS.indexOf(data.startTime);
  const endIdx = TIME_SLOTS.indexOf(data.endTime);
  return endIdx > startIdx;
}, {
  message: "End time must be after start time",
  path: ["endTime"]
});

type WalkInForm = z.infer<typeof walkInSchema>;

export function WalkInModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: (name: string, court: string) => void }) {
  const courts = ["Court 1", "Court 2", "Court 3", "Center Court", "Court 5", "Court 6"];
  
  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<WalkInForm>({
    resolver: zodResolver(walkInSchema),
    defaultValues: {
      playerName: "",
      court: "Court 1",
      startTime: "8:00 AM",
      endTime: "10:00 AM",
      payMethod: "cash"
    }
  });

  const startTime = watch("startTime");
  const payMethod = watch("payMethod");
  const endSlots = TIME_SLOTS.slice(slotIndex(startTime) + 1);

  const onSubmit = (data: WalkInForm) => {
    onConfirm(data.playerName, data.court);
  };

  return (
    <>
      <motion.div key="walkin-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="fixed inset-0 z-40 bg-black/20 dark:bg-[#0B132B]/80 backdrop-blur-md" />
      <motion.div key="walkin-modal"
        initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-md rounded-2xl p-6 shadow-[0_0_80px_rgba(11,206,131,0.15)] border border-white/[0.08] bg-background dark:bg-[#0B132B]/95 backdrop-blur-2xl relative z-50">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-black text-white tracking-wide">LOG WALK-IN</h2>
              <p className="text-sm text-slate-400 mt-1">Register a front-desk booking instantly</p>
            </div>
            <button type="button" onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/[0.08] border border-white/[0.08] text-slate-400 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium tracking-tight mb-2">Player Name</label>
              <input {...register("playerName")} placeholder="e.g. Juan Dela Cruz"
                className={cn("w-full px-4 py-3.5 rounded-2xl text-[15px] outline-none border bg-white/[0.03] text-white transition-all placeholder:text-slate-600 font-medium", errors.playerName ? "border-red-500/50 focus:border-red-500" : "border-white/[0.08] focus:border-[#0BCE83]/50 focus:bg-white/[0.05]")} />
              <AnimatePresence>
                {errors.playerName && (
                  <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="text-[12px] text-red-400 font-medium mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.playerName.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
            <div>
              <label className="block text-sm font-medium tracking-tight mb-2">Court</label>
              <Controller
                control={control}
                name="court"
                render={({ field }) => (
                  <PremiumSelect value={field.value} onChange={field.onChange} options={courts} error={errors.court?.message} />
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium tracking-tight mb-2">Start</label>
                <Controller
                  control={control}
                  name="startTime"
                  render={({ field }) => (
                    <PremiumSelect 
                      value={field.value} 
                      onChange={val => { 
                        field.onChange(val); 
                        setValue("endTime", TIME_SLOTS[slotIndex(val) + 2] ?? TIME_SLOTS[slotIndex(val) + 1], { shouldValidate: true }); 
                      }} 
                      options={TIME_SLOTS.slice(0, -1)} 
                      error={errors.startTime?.message}
                    />
                  )}
                />
              </div>
              <div>
                <label className="block text-sm font-medium tracking-tight mb-2">End</label>
                <Controller
                  control={control}
                  name="endTime"
                  render={({ field }) => (
                    <PremiumSelect value={field.value} onChange={field.onChange} options={endSlots} error={errors.endTime?.message} />
                  )}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium tracking-tight mb-2">Payment</label>
              <div className="flex bg-white/[0.02] p-1.5 rounded-2xl border border-white/[0.05]">
                {(["cash", "gcash"] as const).map(m => (
                  <button key={m} type="button" onClick={() => setValue("payMethod", m)}
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
          <button type="submit"
            className="w-full mt-8 py-4 rounded-2xl font-black text-[15px] transition-all flex items-center justify-center gap-2 bg-[#0BCE83] text-black hover:bg-[#0ea86f] shadow-[0_0_20px_rgba(11,206,131,0.3)] hover:shadow-[0_0_30px_rgba(11,206,131,0.5)] active:scale-[0.98]"
          >
            <Check className="w-5 h-5" /> CONFIRM WALK-IN
          </button>
        </form>
      </motion.div>
    </>
  );
}
