"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { Check, ShieldAlert, X, IdCard, Clock, Loader2, ScanFace, ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { checkIsPrivilegedEmail } from "@/types/permissions";

type Step = "primer" | "id-front" | "id-back" | "selfie" | "analyzing" | "submitted";

export function VerificationGate({ children, onVerifiedClick, disabled = false }: { children: React.ReactNode, onVerifiedClick: () => void, disabled?: boolean }) {
  const { user, submitVerification } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [step, setStep] = useState<Step>("primer");
  const [showIds, setShowIds] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // A-001 / A-021 FIX: Use the centralized allowlist — no substring matching.
  // The previous inline check used emailLower.includes("admin") and
  // emailLower.includes("dev") which is the exact F-558 bypass that was
  // documented as fixed in RoleGate but had been re-introduced here.
  const isBypassed =
    user?.isDemo ||
    user?.role === "demo" ||
    user?.role === "dev" ||
    user?.role === "admin" ||
    user?.role === "owner" ||
    user?.isAdmin ||
    Boolean(user?.devRole) ||
    Boolean(user?.adminRole) ||
    Boolean(user?.dev_role) ||
    Boolean(user?.admin_role) ||
    (Array.isArray(user?.console_access) &&
      (user.console_access.includes("dev") || user.console_access.includes("admin"))) ||
    checkIsPrivilegedEmail(user?.email); // ← SSOT: exact-match allowlist only

  const status = isBypassed ? "verified" : (user?.verificationStatus ?? "unverified");

  const handleClick = (e: React.MouseEvent) => {
    if (disabled) return;
    if (status === "unverified" || status === "rejected") {
      e.preventDefault();
      e.stopPropagation();
      setStep("primer");
      setShowModal(true);
      return;
    }
    if (status === "pending") {
      e.preventDefault();
      e.stopPropagation();
      setShowPendingModal(true);
      return;
    }
    // Proceed normally if verified
    onVerifiedClick();
  };

  const handleCapture = () => {
    if (navigator.vibrate) navigator.vibrate([30]);
    if (step === "id-front") setStep("id-back");
    else if (step === "id-back") setStep("selfie");
    else if (step === "selfie") {
      setStep("analyzing");
      setTimeout(() => {
        if (navigator.vibrate) navigator.vibrate([20, 10, 40]);
        setStep("submitted");
      }, 3000);
    }
  };

  const finishVerification = () => {
    submitVerification();
    setShowModal(false);
  };

  return (
    <>
      <div onClickCapture={handleClick} className="w-full">
        {children}
      </div>

      {/* PENDING MODAL */}
      {mounted && createPortal(
        <AnimatePresence>
          {showPendingModal && (
            <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setShowPendingModal(false)} className="absolute inset-0 bg-black/40 backdrop-blur-[2px] dark:bg-black/50" />
              <motion.div initial={{ y: "100%", opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: "100%", opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative w-full max-w-sm bg-surface-overlay dark:bg-[#13223F] border border-border dark:border-white/12 rounded-3xl p-6 shadow-[0_25px_60px_rgba(0,0,0,0.5)] overflow-hidden text-center z-[610]"
              >
                <button onClick={() => setShowPendingModal(false)} aria-label="Close modal" className="absolute top-4 right-4 w-8 h-8 rounded-full bg-surface-interactive hover:bg-surface-interactive/80 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                  <X size={18} />
                </button>
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-5 text-amber-500 dark:text-amber-400">
                  <Clock size={32} />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">Verification Under Review</h2>
                <p className="text-muted-foreground text-[14px] leading-relaxed mb-6">
                  Your ID and selfie have been submitted and are currently being reviewed by our team. This usually takes less than 24 hours.
                </p>
                <button onClick={() => setShowPendingModal(false)} className="w-full h-12 rounded-xl font-bold text-[14px] bg-surface-interactive hover:bg-surface-interactive/80 border border-border text-foreground transition-all cursor-pointer">
                  Got it
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* VERIFICATION FLOW MODAL */}
      {mounted && createPortal(
        <AnimatePresence>
          {showModal && (
            <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setShowModal(false)}
                className="absolute inset-0 bg-black/40 backdrop-blur-[2px] dark:bg-black/50" />
              <motion.div initial={{ y: "100%", opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: "100%", opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative w-full max-w-md flex flex-col items-center z-[610]"
              >
                <div className="w-full bg-surface-overlay dark:bg-[#13223F] border border-border dark:border-white/12 rounded-3xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.5)] relative flex flex-col" style={{ minHeight: "500px" }}>
                  <div className="relative bg-surface-overlay dark:bg-[#13223F] rounded-3xl flex flex-col flex-1 overflow-hidden">
                    
                    {/* Header */}
                    <div className="flex items-center justify-between p-5 border-b border-border bg-surface-interactive/30">
                      <span className="text-[13px] font-bold text-muted-foreground tracking-tight pl-2">
                        {step === "primer" ? "Identity" : step === "submitted" ? "Complete" : "Camera"}
                      </span>
                      <button onClick={() => setShowModal(false)} aria-label="Close modal" className="w-8 h-8 rounded-full bg-surface-interactive hover:bg-surface-interactive/80 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                        <X size={18} strokeWidth={2.5} />
                      </button>
                    </div>

                    {/* Dynamic Body */}
                    <div className="flex-1 flex flex-col p-6 sm:p-8 relative">
                      <AnimatePresence mode="wait">
                        
                        {step === "primer" && (
                          <motion.div key="primer" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col h-full relative z-10">
                            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 text-emerald-500 dark:text-emerald-400 relative z-10">
                              <ShieldAlert size={28} strokeWidth={2.5} />
                            </div>
                            <h2 className="text-[24px] font-extrabold text-foreground mb-3 tracking-tight">Verify Your Identity</h2>
                            <p className="text-muted-foreground text-[15px] leading-relaxed mb-8 font-medium">
                              To maintain a trusted community and prevent fake bookings, Picklers requires a quick ID verification.
                            </p>
                            <div className="space-y-3 mb-8 flex-1">
                              
                              <div onClick={() => setShowIds(!showIds)} className="flex flex-col bg-surface-interactive hover:bg-surface-interactive/80 p-4 rounded-2xl border border-border transition-colors relative overflow-hidden group cursor-pointer">
                                <div className="flex items-center gap-4 relative z-10">
                                  <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 shrink-0">
                                    <IdCard className="w-5 h-5 text-cyan-500 dark:text-cyan-400" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="font-bold text-foreground text-[15px]">Valid Government ID</div>
                                    <div className="text-[13px] text-muted-foreground font-medium mt-0.5">Driver's License, Passport, etc.</div>
                                  </div>
                                  <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${showIds ? "rotate-180" : ""}`} />
                                </div>
                                <AnimatePresence>
                                  {showIds && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                      <div className="pt-4 mt-4 border-t border-border flex flex-wrap gap-2">
                                        {['Driver\'s License', 'Passport', 'UMID', 'PhilID / National ID', 'PRC ID', 'Postal ID', 'Voter\'s ID'].map(id => (
                                          <span key={id} className="text-[12.5px] font-semibold px-2.5 py-1.5 rounded-lg bg-surface-base border border-border text-foreground transition-colors">{id}</span>
                                        ))}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>

                              <div className="flex items-center gap-4 bg-surface-interactive p-4 rounded-2xl border border-border transition-colors relative overflow-hidden">
                                <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/20 shrink-0">
                                  <ScanFace className="w-5 h-5 text-purple-500 dark:text-purple-400" />
                                </div>
                                <div>
                                  <div className="font-bold text-foreground text-[15px]">Quick Selfie</div>
                                  <div className="text-[13px] text-muted-foreground font-medium mt-0.5">To match your ID photo</div>
                                </div>
                              </div>
                            </div>
                            <button onClick={() => setStep("id-front")} className="w-full py-4 rounded-xl font-bold text-[15px] text-white bg-emerald-500 hover:bg-emerald-400 shadow-md active:scale-[0.98] transition-all cursor-pointer">
                              Start Verification
                            </button>
                          </motion.div>
                        )}

                    {(step === "id-front" || step === "id-back" || step === "selfie") && (
                      <motion.div key="camera" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="flex flex-col items-center justify-center h-full pt-4">
                        <h3 className="text-[20px] font-bold text-foreground mb-1">
                          {step === "id-front" ? "Front of ID" : step === "id-back" ? "Back of ID" : "Take a Selfie"}
                        </h3>
                        <p className="text-[14px] text-muted-foreground mb-8 font-medium">
                          {step === "selfie" ? "Position your face in the frame" : "Position your ID inside the frame"}
                        </p>

                        {/* Mock Camera Viewfinder */}
                        <div className="relative w-full aspect-[3/4] max-h-[300px] bg-black/90 rounded-3xl overflow-hidden flex items-center justify-center shadow-inner border border-border">
                          {/* Fake Camera Feed Background */}
                          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at center, #10B981 0%, transparent 70%)" }} />
                          
                          {/* Morphing Reticle */}
                          <motion.div
                            layout
                            animate={{ 
                              width: step === "selfie" ? 180 : 280, 
                              height: step === "selfie" ? 220 : 170,
                              borderRadius: step === "selfie" ? "100px" : "16px"
                            }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            className="border-2 border-emerald-500/50 relative z-10"
                          >
                            {/* Corner Brackets */}
                            <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-emerald-500" />
                            <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-emerald-500" />
                            <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-emerald-500" />
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-emerald-500" />

                            {/* Scanning Laser */}
                            <motion.div 
                              animate={{ top: ["0%", "100%", "0%"] }}
                              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                              className="absolute left-0 right-0 h-[2px] bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,1)] z-20"
                            />
                          </motion.div>
                        </div>

                        <button onClick={handleCapture} className="mt-8 w-16 h-16 rounded-full border-[3px] border-border flex items-center justify-center hover:border-emerald-500/50 active:scale-90 transition-all bg-surface-interactive cursor-pointer">
                          <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 shadow-inner" />
                        </button>
                      </motion.div>
                    )}

                    {step === "analyzing" && (
                      <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full">
                        <div className="relative mb-6">
                          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}>
                            <Loader2 className="w-16 h-16 text-emerald-500" />
                          </motion.div>
                          <ScanFace className="w-6 h-6 text-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                        </div>
                        <h3 className="text-[20px] font-bold text-foreground mb-2">Analyzing...</h3>
                        <p className="text-[14px] text-muted-foreground text-center px-4 font-medium">Securely uploading your documents for review.</p>
                      </motion.div>
                    )}

                    {step === "submitted" && (
                      <motion.div key="submitted" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center h-full text-center">
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5 }} className="w-20 h-20 rounded-2xl bg-emerald-500 shadow-md flex items-center justify-center mb-6 text-white">
                          <Check size={40} strokeWidth={3} />
                        </motion.div>
                        <h2 className="text-[24px] font-extrabold text-foreground mb-3">Submitted</h2>
                        <p className="text-muted-foreground text-[15px] font-medium leading-relaxed mb-8 px-4">
                          Your verification request has been successfully submitted. Our team will review your ID and notify you once approved.
                        </p>
                        <button onClick={finishVerification} className="w-full py-4 rounded-xl font-bold text-[15px] text-foreground bg-surface-interactive hover:bg-surface-interactive/80 border border-border active:scale-[0.98] transition-all cursor-pointer">
                          Return to App
                        </button>
                      </motion.div>
                    )}

                  </AnimatePresence>
                </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
