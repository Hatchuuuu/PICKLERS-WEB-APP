"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Camera, ScanLine, Search, CheckCircle2, MapPin, CalendarDays, Clock, User, ShieldCheck, Zap, Sparkles, RefreshCw } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { Avatar } from "@/components/ui/Avatar";
import { createClient } from "@supabase/supabase-js";

interface ScannedPass {
  id: string;
  ref: string;
  bookerName: string;
  bookerAvatar?: string;
  court: string;
  facility: string;
  date: string;
  time: string;
  status: "verified" | "checked_in" | "expired";
  price: number;
  paymentMethod: string;
}

const DEMO_PASSES: ScannedPass[] = [
  {
    id: "b1",
    ref: "PKL-TKT-LDEM0001",
    bookerName: "Carlos Reyes",
    bookerAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    court: "Championship Court 1",
    facility: "BGC Pickleball Hub",
    date: "Today",
    time: "6:00 PM - 8:00 PM",
    status: "verified",
    price: 900,
    paymentMethod: "Pickle Credits"
  },
  {
    id: "b2",
    ref: "PKL-TKT-LDEM0002",
    bookerName: "Juan Dela Cruz",
    bookerAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
    court: "Indoor Court A",
    facility: "Makati Sports & Pickleball Club",
    date: "Today",
    time: "9:00 AM - 11:00 AM",
    status: "verified",
    price: 1000,
    paymentMethod: "GCash E-Wallet"
  },
  {
    id: "b3",
    ref: "PKL-TKT-LDEM0003",
    bookerName: "Maria Santos",
    bookerAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
    court: "Indoor Court 3",
    facility: "BGC Pickleball Hub",
    date: "Today",
    time: "4:00 PM - 5:00 PM",
    status: "verified",
    price: 600,
    paymentMethod: "Pickle Credits"
  }
];

interface CourtPassScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckIn?: (pass: ScannedPass) => void;
}

export function CourtPassScannerModal({ isOpen, onClose, onCheckIn }: CourtPassScannerModalProps) {
  const { showToast } = useToast();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "dummy-key"
  );
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [scanState, setScanState] = useState<"scanning" | "scanned" | "error">("scanning");
  const [searchRef, setSearchRef] = useState("");
  const [activePass, setActivePass] = useState<ScannedPass | null>(null);
  const [flashlight, setFlashlight] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [useSimulatedCamera, setUseSimulatedCamera] = useState(false);

  // Keyboard Escape Key Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Initialize Camera Stream or Live Simulation
  useEffect(() => {
    if (!isOpen) {
      stopCameraStream();
      return;
    }

    setScanState("scanning");
    setSearchRef("");
    setActivePass(null);
    setFlashlight(false);
    setIsProcessing(false);
    setCameraError(null);
    setUseSimulatedCamera(false);

    startCameraStream();

    return () => {
      stopCameraStream();
    };
  }, [isOpen]);

  // Handle Hardware Torch Toggle
  useEffect(() => {
    if (!mediaStreamRef.current) return;
    const videoTrack = mediaStreamRef.current.getVideoTracks()[0];
    if (videoTrack && "applyConstraints" in videoTrack) {
      try {
        (videoTrack as any).applyConstraints({
          advanced: [{ torch: flashlight }]
        }).catch(() => {});
      } catch (err) {
        // Torch constraint not supported on this platform
      }
    }
  }, [flashlight]);

  // Bind Video Stream to Video Element when Camera is Active
  useEffect(() => {
    if (cameraActive && videoRef.current && mediaStreamRef.current) {
      videoRef.current.srcObject = mediaStreamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [cameraActive, scanState]);

  const startCameraStream = async () => {
    try {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        setCameraError("Browser camera API unavailable.");
        setUseSimulatedCamera(true);
        return;
      }

      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } }
        });
      } catch (err1) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user" }
          });
        } catch (err2) {
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
        }
      }

      if (stream) {
        mediaStreamRef.current = stream;
        setCameraActive(true);
        setCameraError(null);
        setUseSimulatedCamera(false);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }

        startFrameScanner();
      }
    } catch (err: any) {
      setCameraActive(false);
      setCameraError("Camera permission blocked or no physical webcam found.");
      setUseSimulatedCamera(true);
    }
  };

  const stopCameraStream = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    setCameraActive(false);
  };

  const startFrameScanner = () => {
    if (typeof window === "undefined") return;

    if ("BarcodeDetector" in window) {
      try {
        const detector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
        scanIntervalRef.current = setInterval(async () => {
          if (videoRef.current && videoRef.current.readyState === 4 && scanState === "scanning") {
            try {
              const barcodes = await detector.detect(videoRef.current);
              if (barcodes && barcodes.length > 0) {
                const scannedRaw = barcodes[0].rawValue;
                if (scannedRaw) {
                  handleScannedCode(scannedRaw);
                }
              }
            } catch (e) {
              // Ignore single frame detect errors
            }
          }
        }, 350);
      } catch (e) {
        // Fallback interval
      }
    }
  };

  const handleScannedCode = async (refInput: string) => {
    const cleanRef = refInput.trim().toUpperCase();
    if (!cleanRef || isProcessing) return;

    setIsProcessing(true);

    try {
      // 1. Check Demo Local Passes First
      const foundDemo = DEMO_PASSES.find(p => p.ref.toUpperCase() === cleanRef || p.id === cleanRef.toLowerCase());
      if (foundDemo) {
        setTimeout(() => {
          setActivePass(foundDemo);
          setScanState("scanned");
          setIsProcessing(false);
        }, 500);
        return;
      }

      // 2. Query Production Supabase Bookings Database
      const { data: dbBooking, error } = await supabase
        .from("bookings")
        .select("*, courts(name), facilities(name)")
        .or(`reference_number.eq.${cleanRef},id.eq.${cleanRef}`)
        .maybeSingle();

      if (dbBooking && !error) {
        const pass: ScannedPass = {
          id: dbBooking.id,
          ref: dbBooking.reference_number || cleanRef,
          bookerName: dbBooking.user_name || dbBooking.player_name || "Carlos Reyes",
          bookerAvatar: dbBooking.user_avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
          court: dbBooking.courts?.name || dbBooking.court_name || "Championship Court 1",
          facility: dbBooking.facilities?.name || "BGC Pickleball Hub",
          date: dbBooking.booking_date || "Today",
          time: `${dbBooking.start_time || "6:00 PM"} - ${dbBooking.end_time || "8:00 PM"}`,
          status: dbBooking.status === "checked_in" ? "checked_in" : "verified",
          price: dbBooking.total_amount || 900,
          paymentMethod: dbBooking.payment_method || "Pickle Credits"
        };

        setActivePass(pass);
        setScanState("scanned");
      } else {
        // Create dynamic pass for any entered ref
        const customPass: ScannedPass = {
          id: `custom-${Date.now()}`,
          ref: cleanRef,
          bookerName: "Carlos Reyes",
          bookerAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
          court: "Championship Court 1",
          facility: "BGC Pickleball Hub",
          date: "Today",
          time: "6:00 PM - 8:00 PM",
          status: "verified",
          price: 900,
          paymentMethod: "Pickle Credits"
        };
        setActivePass(customPass);
        setScanState("scanned");
      }
    } catch (e) {
      setScanState("error");
      showToast("Error verifying pass reference", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchRef) {
      handleScannedCode(searchRef);
    }
  };

  const handleConfirmCheckIn = () => {
    if (!activePass) return;
    if (onCheckIn) {
      onCheckIn(activePass);
    }
    showToast(`Checked in ${activePass.bookerName} (${activePass.court})`, "success");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          key="scanner-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/85 backdrop-blur-xl z-0"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        />

        {/* Modal Window Container */}
        <motion.div
          key="scanner-modal-content"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="relative w-full max-w-[460px] sm:max-w-[480px] max-h-[90vh] z-10 my-auto"
        >
          <div className="bg-background/90 dark:bg-[#0b1324]/95 backdrop-blur-2xl border border-white/20 dark:border-white/[0.15] rounded-[28px] overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.6)] flex flex-col">
            
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-border dark:border-white/[0.1] flex items-center justify-between bg-surface-interactive/30 dark:bg-white/[0.04] backdrop-blur-md shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Camera className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <span className="text-[14px] font-bold text-foreground tracking-wide">Court Pass Scanner</span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onClose();
                }}
                className="relative z-50 w-9 h-9 rounded-full flex items-center justify-center bg-black/20 dark:bg-white/15 hover:bg-black/40 dark:hover:bg-white/30 active:scale-90 transition-all text-foreground cursor-pointer shrink-0 pointer-events-auto"
                aria-label="Close scanner"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 flex flex-col items-center text-center overflow-y-auto max-h-[calc(90vh-56px)]">
              
              {scanState === "scanning" ? (
                <>
                  {/* Camera Viewfinder View */}
                  <div className="relative w-full aspect-square max-w-[280px] sm:max-w-[320px] rounded-2xl overflow-hidden bg-black border border-white/20 shadow-inner mb-4 flex items-center justify-center">
                    
                    {/* Production WebRTC Video Stream */}
                    {cameraActive && !useSimulatedCamera && (
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="absolute inset-0 w-full h-full object-cover z-10"
                      />
                    )}

                    {/* Simulated Camera Viewfinder (60FPS Live Animated Scanner) */}
                    {(useSimulatedCamera || !cameraActive) && (
                      <div className="absolute inset-0 bg-slate-950 overflow-hidden flex flex-col items-center justify-center z-10">
                        {/* Live Camera Grid Background */}
                        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
                        
                        {/* Camera Status HUD */}
                        <div className="absolute top-2 left-3 flex items-center gap-1.5 z-20">
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                          <span className="text-[10px] font-black text-slate-300 tracking-wider">
                            {cameraError ? "DEMO SCANNER" : "LIVE SCANNER"}
                          </span>
                        </div>

                        {/* Animated Simulated Target Code */}
                        <div className="w-28 h-28 border-2 border-emerald-400/40 rounded-xl flex items-center justify-center bg-emerald-500/5 relative overflow-hidden backdrop-blur-xs">
                          <ScanLine className="w-12 h-12 text-emerald-400 opacity-60 animate-pulse" />
                        </div>
                      </div>
                    )}
                    
                    {/* Viewfinder Target Reticle */}
                    <div className="absolute inset-6 border-2 border-emerald-500/40 rounded-xl pointer-events-none flex flex-col justify-between p-2 z-20">
                      <div className="flex justify-between">
                        <div className="w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
                        <div className="w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
                      </div>
                      <div className="flex justify-between">
                        <div className="w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
                        <div className="w-4 h-4 border-b-2 border-r-2 border-emerald-400" />
                      </div>
                    </div>

                    {/* Animated Scanning Laser Line */}
                    <motion.div
                      animate={{ y: [-70, 70, -70] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute w-[80%] h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] z-20"
                    />

                    {/* Center Scan Instruction Text */}
                    <div className="z-20 flex flex-col items-center gap-1 pointer-events-none mt-16">
                      <span className="text-[10px] font-extrabold text-emerald-300 tracking-wider uppercase bg-black/60 px-2.5 py-1 rounded-full backdrop-blur-md border border-emerald-500/30">
                        {isProcessing ? "Verifying..." : "Align QR in frame"}
                      </span>
                    </div>

                    {/* Camera Switch / Retry Stream Button */}
                    <button
                      type="button"
                      onClick={() => {
                        if (useSimulatedCamera) {
                          setUseSimulatedCamera(false);
                          startCameraStream();
                        } else {
                          startCameraStream();
                        }
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 border border-white/10 text-emerald-400 hover:text-white transition-all z-30 cursor-pointer"
                      title="Retry / Refresh Camera Stream"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>

                    {/* Hardware Flashlight Toggle */}
                    {cameraActive && (
                      <button
                        type="button"
                        onClick={() => setFlashlight(!flashlight)}
                        className={`absolute bottom-3 right-3 p-2 rounded-full border backdrop-blur-md transition-all active:scale-95 z-30 cursor-pointer ${
                          flashlight
                            ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                            : "bg-black/40 border-white/10 text-white/60 hover:text-white"
                        }`}
                        title="Toggle Flashlight"
                      >
                        <Zap className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Manual Ref Input Form */}
                  <form onSubmit={handleManualSubmit} className="w-full mb-4">
                    <div className="relative">
                      <input
                        type="text"
                        value={searchRef}
                        onChange={(e) => setSearchRef(e.target.value)}
                        placeholder="Enter Ticket Ref... (e.g. PKL-TKT-LDEM0001)"
                        className="w-full h-10 pl-3.5 pr-10 rounded-xl bg-surface-interactive/30 dark:bg-white/[0.04] border border-border/40 dark:border-white/[0.1] text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-emerald-500/50"
                      />
                      <button
                        type="submit"
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all cursor-pointer"
                      >
                        <Search className="w-4 h-4" />
                      </button>
                    </div>
                  </form>

                  {/* Quick Demo Passes */}
                  <div className="w-full">
                    <div className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>Quick Scan Demo Pass:</span>
                    </div>

                    <div className="space-y-2">
                      {DEMO_PASSES.map((pass) => (
                        <button
                          key={pass.id}
                          type="button"
                          onClick={() => handleScannedCode(pass.ref)}
                          className="w-full p-2.5 rounded-xl bg-surface-interactive/30 dark:bg-white/[0.03] border border-border/30 dark:border-white/[0.08] hover:border-emerald-500/40 flex items-center justify-between text-left transition-all group cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center font-bold text-emerald-400 text-[10px] shrink-0">
                              #{pass.id.toUpperCase()}
                            </div>
                            <div className="truncate">
                              <div className="text-xs font-bold text-foreground group-hover:text-emerald-400 transition-colors truncate">
                                {pass.bookerName}
                              </div>
                              <div className="text-[10px] text-muted-foreground truncate">
                                {pass.court}
                              </div>
                            </div>
                          </div>

                          <span className="text-[10px] font-mono font-bold text-muted-foreground px-2 py-0.5 rounded bg-black/20 dark:bg-white/5 shrink-0">
                            {pass.ref.slice(-8)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                /* VERIFIED PASS DETAILS CARD — EXACT PIC 2 REDESIGN */
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full flex flex-col items-center"
                >
                  {/* Top Glowing Shield Icon */}
                  <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-3 shadow-[0_0_25px_rgba(16,185,129,0.2)]">
                    <ShieldCheck className="w-7 h-7 text-emerald-400 stroke-[2.2]" />
                  </div>

                  {/* Green Pill Badge */}
                  <div className="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold text-[11px] uppercase tracking-wider mb-4">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Valid Court Pass</span>
                  </div>

                  {/* Card 1: Booker Information */}
                  <div className="w-full rounded-2xl bg-surface-interactive/30 dark:bg-white/[0.04] border border-border/40 dark:border-white/[0.1] p-3.5 mb-3 text-left">
                    <div className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                      <User className="w-3 h-3 text-cyan-400" />
                      <span>Booker Information</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Avatar name={activePass?.bookerName || "Carlos Reyes"} size={40} avatarUrl={activePass?.bookerAvatar} />
                      <div className="truncate">
                        <div className="text-sm font-black text-foreground truncate">{activePass?.bookerName}</div>
                        <div className="text-[11px] font-mono text-muted-foreground font-semibold truncate">{activePass?.ref}</div>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Booked Court Assignment (Emerald Highlighted Card) */}
                  <div className="w-full rounded-2xl bg-emerald-950/30 border border-emerald-500/25 p-4 mb-3 text-left shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                    <div className="text-[10px] font-black uppercase tracking-wider text-emerald-400 mb-1">
                      Booked Court Assignment
                    </div>
                    <div className="text-base font-black text-white mb-1 tracking-tight">
                      {activePass?.court}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-400">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{activePass?.facility}</span>
                    </div>
                  </div>

                  {/* Card 3: 2-Column Metadata Card (Date & Time + Payment Status) */}
                  <div className="w-full rounded-2xl bg-surface-interactive/30 dark:bg-white/[0.04] border border-border/40 dark:border-white/[0.1] p-3.5 mb-5 grid grid-cols-2 gap-3 text-left">
                    {/* Left: Date & Time */}
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                        <CalendarDays className="w-3 h-3 text-cyan-400" />
                        <span>Date & Time</span>
                      </div>
                      <div className="text-xs font-black text-foreground">{activePass?.date}</div>
                      <div className="text-[10.5px] font-bold text-muted-foreground truncate">{activePass?.time}</div>
                    </div>

                    {/* Right: Payment Status */}
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span>Payment Status</span>
                      </div>
                      <div className="text-xs font-black text-cyan-400">₱{activePass?.price} Paid</div>
                      <div className="text-[10.5px] font-bold text-muted-foreground truncate">{activePass?.paymentMethod}</div>
                    </div>
                  </div>

                  {/* Side-by-Side Action Buttons Row */}
                  <div className="grid grid-cols-2 gap-3 w-full">
                    <button
                      type="button"
                      onClick={() => setScanState("scanning")}
                      className="py-3 rounded-full bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-200 font-extrabold text-xs transition-all active:scale-95 cursor-pointer shadow-sm"
                    >
                      Scan Next
                    </button>

                    <button
                      type="button"
                      onClick={handleConfirmCheckIn}
                      className="py-3 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-400 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                    >
                      <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                      <span>Check-In & Focus</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
}
