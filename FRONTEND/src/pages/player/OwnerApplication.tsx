import { useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Check, ChevronRight, Send } from "lucide-react";

export function OwnerApplication() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  if (submitted) {
    return (
      <div className="p-6 max-w-xl mx-auto py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
          <Check className="w-8 h-8 text-emerald-400" />
        </div>
        <h1 className="text-2xl font-bold mb-3" >Application Submitted</h1>
        <p className="text-muted-foreground mb-8">
          Thank you for applying to be a Picklers partner! Our team will review your application and get back to you within 24-48 hours.
        </p>
        <button onClick={() => navigate("/app")}
          className="px-6 py-3 rounded-xl font-semibold active:scale-[0.98] transition-all"
          style={{ background: "var(--surface-interactive)", border: "1px solid var(--border-emphasis)", color: "var(--ink-primary)" }}>
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto pb-24">
      <button onClick={() => navigate(-1)} 
        className="group flex items-center justify-center w-11 h-11 rounded-full mb-8 transition-all active:scale-95 shadow-md bg-surface-interactive border-border text-muted-foreground hover:bg-black/5 hover:text-foreground dark:bg-white/[0.05] dark:border-white/10 dark:text-white/60 dark:hover:bg-white/[0.1] dark:hover:text-white"
        aria-label="Go Back">
        <ChevronRight className="w-6 h-6 rotate-180 transition-transform group-hover:-translate-x-0.5" />
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" >Partner with Picklers</h1>
        <p className="text-muted-foreground">Apply for an Owner Dashboard to list your courts, manage bookings, and grow your facility.</p>
      </div>

      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map(i => (
          <div key={i} className={`h-2 rounded-full flex-1 transition-colors duration-300 ${step >= i ? "bg-cyan-400" : "bg-surface-interactive"}`} />
        ))}
      </div>

      <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ ease: "easeOut" }}
        className="rounded-2xl p-6 md:p-8" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
        
        {step === 1 && (
          <div className="flex flex-col gap-5">
            <h2 className="text-xl font-semibold mb-2">Facility Details</h2>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground">Facility Name</label>
              <input type="text" placeholder="e.g. BGC Pickleball Hub" className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:border-cyan-400 transition-colors"
                style={{ background: "var(--surface-base)", border: "1px solid var(--border-default)", color: "var(--ink-primary)" }} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground">Complete Address</label>
              <input type="text" placeholder="Unit, Building, Street, City" className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:border-cyan-400 transition-colors"
                style={{ background: "var(--surface-base)", border: "1px solid var(--border-default)", color: "var(--ink-primary)" }} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground">Number of Courts</label>
                <input type="number" placeholder="e.g. 4" className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:border-cyan-400 transition-colors"
                  style={{ background: "var(--surface-base)", border: "1px solid var(--border-default)", color: "var(--ink-primary)" }} />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground">Surface Type</label>
                <select className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:border-cyan-400 transition-colors appearance-none"
                  style={{ background: "var(--surface-base)", border: "1px solid var(--border-default)", color: "var(--ink-primary)" }}>
                  <option>Hard Court</option>
                  <option>Cushioned</option>
                  <option>Concrete</option>
                  <option>Wood</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-5">
            <h2 className="text-xl font-semibold mb-2">Contact Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground">First Name</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:border-cyan-400 transition-colors"
                  style={{ background: "var(--surface-base)", border: "1px solid var(--border-default)", color: "var(--ink-primary)" }} />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground">Last Name</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:border-cyan-400 transition-colors"
                  style={{ background: "var(--surface-base)", border: "1px solid var(--border-default)", color: "var(--ink-primary)" }} />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground">Business Email</label>
              <input type="email" placeholder="owner@facility.com" className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:border-cyan-400 transition-colors"
                style={{ background: "var(--surface-base)", border: "1px solid var(--border-default)", color: "var(--ink-primary)" }} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground">Phone Number</label>
              <input type="tel" placeholder="+63 9XX XXX XXXX" className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:border-cyan-400 transition-colors"
                style={{ background: "var(--surface-base)", border: "1px solid var(--border-default)", color: "var(--ink-primary)" }} />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-5">
            <h2 className="text-xl font-semibold mb-2">Verification Docs</h2>
            <p className="text-sm text-muted-foreground mb-4">To ensure trust on our platform, we require basic verification that you own or operate the facility.</p>
            
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground">Business Permit / DTI Registration</label>
              <div className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:bg-surface-interactive/80 transition-colors"
                style={{ borderColor: "var(--border-subtle)", background: "var(--surface-base)" }}>
                <div className="text-sm font-medium text-cyan-400 mb-1">Click to upload</div>
                <div className="text-xs text-muted-foreground">PDF, JPG, or PNG up to 10MB</div>
              </div>
            </div>
            <div className="flex flex-col gap-2 mt-2">
              <label className="text-sm font-medium text-foreground">Proof of Identity (Valid ID)</label>
              <div className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:bg-surface-interactive/80 transition-colors"
                style={{ borderColor: "var(--border-subtle)", background: "var(--surface-base)" }}>
                <div className="text-sm font-medium text-cyan-400 mb-1">Click to upload</div>
                <div className="text-xs text-muted-foreground">PDF, JPG, or PNG up to 10MB</div>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-10 pt-6 border-t" style={{ borderColor: "var(--border-subtle)" }}>
          {step > 1 ? (
            <button onClick={() => setStep(s => s - 1)} className="text-sm font-semibold text-muted-foreground hover:text-foreground">
              Previous Step
            </button>
          ) : <div />}
          
          <button onClick={() => step < 3 ? setStep(s => s + 1) : setShowSubmitConfirm(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold active:scale-[0.98] transition-all shadow-lg"
            style={{ background: "var(--accent-primary)", color: "var(--surface-base)", boxShadow: "0 4px 14px rgba(0,217,139,0.25)" }}>
            {step < 3 ? "Next Step" : <><Send className="w-4 h-4" /> Submit Application</>}
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {showSubmitConfirm && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-4 pb-8">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-surface-base/40 backdrop-blur-sm" onClick={() => setShowSubmitConfirm(false)} />
            <motion.div initial={{ y: "100%", opacity: 0.5 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }} transition={{ type: "spring", stiffness: 400, damping: 30 }} className="relative w-full max-w-sm flex flex-col gap-2 z-10">
              
              <div className="w-full max-w-sm bg-surface-raised/95 backdrop-blur-[40px] rounded-[32px] overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)] border border-border">
                 <div className="p-8 text-center pb-6">
                   <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-5 border border-emerald-500/20 shadow-[0_0_24px_rgba(16,185,129,0.2)]">
                     <Send className="w-7 h-7 text-emerald-400" style={{ marginLeft: "3px" }} />
                   </div>
                   <h3 className="text-[22px] font-black text-foreground tracking-tight" >Submit Application?</h3>
                   <p className="text-[15px] text-foreground/60 mt-3 leading-relaxed">
                     Your facility details and documents will be sent for review. This process takes 24-48 hours.
                   </p>
                 </div>
                 <div className="flex flex-col p-5 pt-0 gap-3">
                   <button onClick={() => { setShowSubmitConfirm(false); setSubmitted(true); }} className="w-full py-4 rounded-[18px] text-[16px] font-extrabold text-black bg-emerald-400 hover:bg-emerald-300 active:scale-[0.98] transition-all shadow-[0_8px_24px_rgba(52,211,153,0.3)]">
                     Submit for Review
                   </button>
                   <button onClick={() => setShowSubmitConfirm(false)} className="w-full py-4 rounded-[18px] text-[16px] font-semibold text-foreground/80 bg-surface-interactive hover:bg-surface-interactive/80 border border-border active:scale-[0.98] transition-all">
                     Review Details
                   </button>
                 </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
