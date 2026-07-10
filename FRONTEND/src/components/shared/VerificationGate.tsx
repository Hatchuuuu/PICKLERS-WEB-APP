import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { Check, ShieldAlert, X, Camera, IdCard, UserFocus, Clock, Loader2, ScanFace } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

type Step = "primer" | "id-front" | "id-back" | "selfie" | "analyzing" | "submitted";

export function VerificationGate({ children, onVerifiedClick, disabled = false }: { children: React.ReactNode, onVerifiedClick: () => void, disabled?: boolean }) {
  const { user, submitVerification } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [step, setStep] = useState<Step>("primer");

  const status = user?.verificationStatus ?? "unverified";

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
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {showPendingModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setShowPendingModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
              <motion.div initial={{ y: "100%", opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: "100%", opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative w-full max-w-sm bg-[#111] border border-white/10 rounded-[32px] p-8 shadow-2xl overflow-hidden text-center"
              >
                <button onClick={() => setShowPendingModal(false)} className="absolute top-4 right-4 p-2 text-white/50 hover:text-white rounded-full transition-colors">
                  <X size={20} />
                </button>
                <div className="w-16 h-16 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto mb-5 text-orange-400">
                  <Clock size={32} />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Verification Under Review</h2>
                <p className="text-white/60 text-[14px] leading-relaxed mb-6">
                  Your ID and selfie have been submitted and are currently being reviewed by our team. This usually takes less than 24 hours.
                </p>
                <button onClick={() => setShowPendingModal(false)} className="w-full h-12 rounded-full font-bold text-[14px] bg-white/10 text-white hover:bg-white/20 transition-all">
                  Got it
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* VERIFICATION FLOW MODAL */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {showModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-md" />
              <motion.div initial={{ y: "100%", opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: "100%", opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative w-full max-w-md bg-[#111] border border-white/10 rounded-[32px] shadow-2xl overflow-hidden flex flex-col"
                style={{ minHeight: "500px" }}
              >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/5">
                  <span className="text-[13px] font-bold text-white/50 uppercase tracking-widest pl-2">
                    {step === "primer" ? "Identity" : step === "submitted" ? "Complete" : "Camera"}
                  </span>
                  <button onClick={() => setShowModal(false)} className="p-2 text-white/50 hover:text-white rounded-full transition-colors">
                    <X size={20} />
                  </button>
                </div>

                {/* Dynamic Body */}
                <div className="flex-1 flex flex-col p-6 relative">
                  <AnimatePresence mode="wait">
                    
                    {step === "primer" && (
                      <motion.div key="primer" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col h-full">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 text-emerald-500">
                          <ShieldAlert size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">Verify Your Identity</h2>
                        <p className="text-white/60 text-[15px] leading-relaxed mb-8">
                          To maintain a trusted community and prevent fake bookings, Picklers requires a quick ID verification.
                        </p>
                        <div className="space-y-4 mb-8 flex-1">
                          <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                            <IdCard className="w-6 h-6 text-cyan-400" />
                            <div>
                              <div className="font-bold text-white text-sm">Valid Government ID</div>
                              <div className="text-xs text-white/50">Driver's License, Passport, etc.</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                            <ScanFace className="w-6 h-6 text-purple-400" />
                            <div>
                              <div className="font-bold text-white text-sm">Quick Selfie</div>
                              <div className="text-xs text-white/50">To match your ID photo</div>
                            </div>
                          </div>
                        </div>
                        <button onClick={() => setStep("id-front")} className="w-full h-14 rounded-full font-bold text-[15px] bg-emerald-500 text-black hover:bg-emerald-400 active:scale-95 transition-all">
                          Start Verification
                        </button>
                      </motion.div>
                    )}

                    {(step === "id-front" || step === "id-back" || step === "selfie") && (
                      <motion.div key="camera" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="flex flex-col items-center justify-center h-full pt-4">
                        <h3 className="text-lg font-bold text-white mb-1">
                          {step === "id-front" ? "Front of ID" : step === "id-back" ? "Back of ID" : "Take a Selfie"}
                        </h3>
                        <p className="text-sm text-white/50 mb-8">
                          {step === "selfie" ? "Position your face in the frame" : "Position your ID inside the frame"}
                        </p>

                        {/* Mock Camera Viewfinder */}
                        <div className="relative w-full aspect-[3/4] max-h-[300px] bg-black rounded-3xl overflow-hidden flex items-center justify-center shadow-inner border border-white/10">
                          {/* Fake Camera Feed Background */}
                          <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at center, rgba(255,255,255,0.2) 0%, transparent 70%)" }} />
                          
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
                            <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
                            <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
                            <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-emerald-400" />

                            {/* Scanning Laser */}
                            <motion.div 
                              animate={{ top: ["0%", "100%", "0%"] }}
                              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                              className="absolute left-0 right-0 h-[2px] bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,1)] z-20"
                            />
                          </motion.div>
                        </div>

                        <button onClick={handleCapture} className="mt-8 w-16 h-16 rounded-full border-4 border-white/20 flex items-center justify-center hover:border-emerald-500/50 active:scale-90 transition-all bg-white/5">
                          <div className="w-12 h-12 rounded-full bg-white" />
                        </button>
                      </motion.div>
                    )}

                    {step === "analyzing" && (
                      <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full">
                        <div className="relative mb-6">
                          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}>
                            <Loader2 className="w-16 h-16 text-emerald-500" />
                          </motion.div>
                          <ScanFace className="w-6 h-6 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Analyzing...</h3>
                        <p className="text-sm text-white/50 text-center px-4">Securely uploading your documents for review.</p>
                      </motion.div>
                    )}

                    {step === "submitted" && (
                      <motion.div key="submitted" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center h-full text-center">
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5 }} className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center mb-6 text-black shadow-[0_0_32px_rgba(16,185,129,0.4)]">
                          <Check size={40} strokeWidth={3} />
                        </motion.div>
                        <h2 className="text-2xl font-bold text-white mb-3">Submitted</h2>
                        <p className="text-white/60 text-[15px] leading-relaxed mb-8 px-4">
                          Your verification request has been successfully submitted. Our team will review your ID and notify you once approved.
                        </p>
                        <button onClick={finishVerification} className="w-full h-14 rounded-full font-bold text-[15px] bg-white/10 text-white hover:bg-white/20 active:scale-95 transition-all">
                          Return to App
                        </button>
                      </motion.div>
                    )}

                  </AnimatePresence>
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
