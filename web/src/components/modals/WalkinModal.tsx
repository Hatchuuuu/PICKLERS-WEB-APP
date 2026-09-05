"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Check, ChevronDown, AlertCircle } from "lucide-react";
import { slotIndex, TIME_SLOTS } from "@/lib/timeUtils";
import { cn } from "@/lib/utils";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FocusTrap } from "@/components/a11y/FocusTrap";

function PremiumSelect({ value, onChange, options, placeholder = "Select...", error }: { value: string, onChange: (val: string) => void, options: string[], placeholder?: string, error?: string }) {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="relative">
            <button 
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                  "w-full bg-surface-interactive border rounded-2xl px-4 py-3.5 text-left text-[15px] focus:outline-none focus-visible:ring-2 transition-all flex items-center justify-between text-foreground",
                  error ? "border-red-500/50 focus:ring-red-500/50" : "border-border hover:border-border/80 focus:ring-emerald-500/50"
                )}
            >
                <span className={value ? "text-foreground font-medium" : "text-muted-foreground"}>{value || placeholder}</span>
                <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
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
                            className="absolute top-[calc(100%+8px)] left-0 right-0 bg-surface-overlay backdrop-blur-xl border border-border rounded-2xl shadow-2xl z-50 py-2 max-h-[240px] overflow-y-auto"
                        >
                            {options.map(opt => (
                                <button
                                    key={opt}
                                    type="button"
                                    onClick={() => { onChange(opt); setIsOpen(false); }}
                                    className={cn(
                                        "w-full text-left px-4 py-2.5 text-[14px] hover:bg-surface-interactive transition-colors",
                                        value === opt ? "text-emerald-500 font-bold bg-emerald-500/10" : "text-foreground font-medium"
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
  court: z.string().min(1, "Select a court"),
  startTime: z.string().min(1, "Select start time"),
  endTime: z.string().min(1, "Select end time"),
  payMethod: z.enum(["cash", "gcash"])
});

type WalkInForm = z.infer<typeof walkInSchema>;

interface WalkinModalProps {
  courts?: string[];
  onClose: () => void;
  onConfirm: (playerName: string, court: string) => void;
}

export function WalkinModal({ courts = ["Court 1", "Court 2", "Court 3"], onClose, onConfirm }: WalkinModalProps) {
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
    <motion.div key="walkin-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose} className="fixed inset-0 z-[600] flex items-center justify-center px-4 bg-black/40 backdrop-blur-[2px] dark:bg-black/50">
      <motion.div key="walkin-modal"
        initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl p-6 shadow-[0_25px_60px_rgba(0,0,0,0.5)] border border-border dark:border-white/12 bg-surface-overlay dark:bg-[#13223F] relative z-50">
        <FocusTrap onEscape={onClose} ariaLabel="Log walk-in booking">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-black text-foreground tracking-wide">LOG WALK-IN</h2>
              <p className="text-sm text-muted-foreground mt-1">Register a front-desk booking instantly</p>
            </div>
            <button type="button" onClick={onClose} aria-label="Close modal" className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-interactive border border-border text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground tracking-tight mb-2">Player Name</label>
              <input {...register("playerName")} placeholder="e.g. Juan Dela Cruz"
                className={cn("w-full px-4 py-3.5 rounded-2xl text-[15px] outline-none border bg-surface-interactive text-foreground transition-all placeholder:text-muted-foreground font-medium", errors.playerName ? "border-red-500/50 focus:border-red-500" : "border-border focus:border-emerald-500/50")} />
              <AnimatePresence>
                {errors.playerName && (
                  <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="text-[12px] text-red-500 font-medium mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.playerName.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground tracking-tight mb-2">Court</label>
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
                <label className="block text-sm font-medium text-foreground tracking-tight mb-2">Start</label>
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
                <label className="block text-sm font-medium text-foreground tracking-tight mb-2">End</label>
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
              <label className="block text-sm font-medium text-foreground tracking-tight mb-2">Payment</label>
              <div className="flex bg-surface-interactive p-1.5 rounded-2xl border border-border">
                {(["cash", "gcash"] as const).map(m => (
                  <button key={m} type="button" onClick={() => setValue("payMethod", m)}
                    className="relative flex-1 py-3 rounded-xl text-[14px] font-bold transition-all"
                  >
                    {payMethod === m && (
                      <motion.div layoutId="walkin-pay-pill" className="absolute inset-0 bg-emerald-500/10 border border-emerald-500/30 rounded-xl" />
                    )}
                    <span className={cn("relative z-10", payMethod === m ? "text-emerald-500 font-semibold" : "text-muted-foreground hover:text-foreground")}>
                      {m === "cash" ? "Cash on Site" : "GCash (Counter)"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button type="submit"
            className="w-full mt-8 py-4 rounded-2xl font-bold text-[15px] transition-all flex items-center justify-center gap-2 bg-emerald-500 text-white hover:bg-emerald-600 shadow-[0_4px_20px_rgba(0,217,139,0.3)] active:scale-[0.98]"
          >
            <Check className="w-5 h-5" /> CONFIRM WALK-IN
          </button>
        </form>
        </FocusTrap>
      </motion.div>
    </motion.div>
  );
}

export const WalkInModal = WalkinModal;
export default WalkinModal;
