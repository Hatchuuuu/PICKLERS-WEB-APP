"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ArrowUp, 
  Search, 
  Volume2, 
  VolumeX, 
  Navigation2, 
  Compass, 
  GitFork,
  ExternalLink
} from "lucide-react";
import { useToast } from "@/contexts/ToastContext";

interface NavigationOverlayProps {
  destination?: string;
  onClose: () => void;
}

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || process.env.NEXT_PUBLIC_MAPS_API_KEY;

export function NavigationOverlay({ destination = "BGC Pickleball Hub", onClose }: NavigationOverlayProps) {
  const { showToast } = useToast();
  const [isMuted, setIsMuted] = useState(false);

  const googleMapsUrl = GOOGLE_API_KEY
    ? `https://www.google.com/maps/embed/v1/directions?key=${GOOGLE_API_KEY}&origin=Current+Location&destination=${encodeURIComponent(destination)}&mode=driving`
    : `https://maps.google.com/maps?saddr=Current+Location&daddr=${encodeURIComponent(destination)}&output=embed`;

  const externalGoogleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;

  const toggleMute = () => {
    setIsMuted(!isMuted);
    showToast(isMuted ? "Voice guidance on" : "Voice guidance muted", "success");
  };

  const openExternalMaps = () => {
    window.open(externalGoogleMapsUrl, "_blank");
    showToast("Opening in Google Maps app...", "success");
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 240 }}
        className="fixed inset-0 z-[200] flex flex-col overflow-hidden bg-[#1D2C3E] select-none"
        style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
      >
        {/* ===== REAL DEFAULT GOOGLE MAPS TILES LAYER ===== */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <iframe
            src={googleMapsUrl}
            className="w-full h-full border-0 scale-[1.02] transform"
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Default Google Maps Navigation"
          />
        </div>

        {/* ===== TOP: GREEN TURN-BY-TURN CARD (Google Maps Green) ===== */}
        <div className="relative z-20 pt-10 sm:pt-12 px-3 pointer-events-none">
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.08, type: "spring", stiffness: 280, damping: 26 }}
            className="pointer-events-auto rounded-2xl overflow-hidden shadow-[0_10px_35px_rgba(0,0,0,0.6)]"
            style={{ background: "linear-gradient(135deg, #1B7340 0%, #1A6B3D 100%)" }}
          >
            <div className="flex items-center gap-3 px-4 py-3.5">
              {/* Left: White turn arrow */}
              <div className="shrink-0">
                <ArrowUp className="w-8 h-8 text-white stroke-[3]" />
              </div>

              {/* Center: Route shield + road name */}
              <div className="flex-1 min-w-0 flex items-start gap-2.5">
                {/* Route number shield badge */}
                <div className="w-7 h-7 rounded bg-blue-800 border border-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-white font-black text-xs">7</span>
                </div>

                <div className="flex flex-col min-w-0">
                  <span className="text-white font-bold text-[15px] leading-snug truncate">
                    Navigating to: {destination}
                  </span>
                  <span className="text-white/90 font-medium text-[13px] leading-snug truncate">
                    National Highway / Western Nautical Hwy
                  </span>
                </div>
              </div>

              {/* Right: Open in Google Maps External App Button */}
              <button
                onClick={openExternalMaps}
                className="w-11 h-11 rounded-full bg-[#1A56DB] flex items-center justify-center shrink-0 shadow-md cursor-pointer hover:bg-[#1E63F0] transition-colors"
                title="Open in Google Maps App"
              >
                <ExternalLink className="w-5 h-5 text-white" />
              </button>
            </div>
          </motion.div>
        </div>

        {/* ===== BOTTOM-LEFT: "Re-center" BUTTON ===== */}
        <div className="absolute left-3 z-20 pointer-events-auto" style={{ bottom: "140px" }}>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => showToast("Centered on your current location", "success")}
            className="flex items-center gap-2 bg-[#2A2A2D] border border-white/10 text-white pl-3 pr-4 py-2.5 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.6)] cursor-pointer hover:bg-[#353538] transition-colors"
          >
            <Navigation2 className="w-4 h-4 text-white fill-white" />
            <span className="text-white text-[13px] font-semibold">Re-center</span>
          </motion.button>
        </div>

        {/* ===== BOTTOM-RIGHT: 3 CIRCULAR CONTROL BUTTONS ===== */}
        <div className="absolute right-3 flex flex-col gap-2.5 z-20 pointer-events-auto" style={{ bottom: "140px" }}>
          {/* Compass / App link */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={openExternalMaps}
            className="w-12 h-12 rounded-full bg-[#2A2A2D] border border-white/10 flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.6)] cursor-pointer"
            title="Open Google Maps App"
          >
            <Compass className="w-5 h-5 text-red-400" />
          </motion.button>

          {/* Search */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => showToast("Searching along route in Google Maps", "success")}
            className="w-12 h-12 rounded-full bg-[#2A2A2D] border border-white/10 flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.6)] cursor-pointer"
            title="Search"
          >
            <Search className="w-5 h-5 text-white" />
          </motion.button>

          {/* Sound Mute Toggle */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggleMute}
            className="w-12 h-12 rounded-full bg-[#2A2A2D] border border-white/10 flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.6)] cursor-pointer"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted
              ? <VolumeX className="w-5 h-5 text-red-400" />
              : <Volume2 className="w-5 h-5 text-white" />
            }
          </motion.button>
        </div>

        {/* ===== BOTTOM SHEET: ETA BAR ===== */}
        <div className="mt-auto relative z-30 w-full pointer-events-auto">
          <motion.div
            initial={{ y: 80 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.12, type: "spring", stiffness: 300, damping: 28 }}
            className="bg-[#1C1C1E] border-t border-white/10 rounded-t-3xl px-5 pt-3 pb-6 shadow-[0_-10px_40px_rgba(0,0,0,0.8)]"
          >
            {/* Drag handle */}
            <div className="w-10 h-1 bg-[#48484A] rounded-full mx-auto mb-3" />

            <div className="flex items-center justify-between">
              {/* Left: ETA info */}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-black text-[32px] leading-none tracking-tight">37 min</span>
                  <span className="text-lg">🍃</span>
                </div>
                <div className="text-[#8E8E93] text-[14px] font-semibold mt-1">
                  24 km · 11:42 PM
                </div>
              </div>

              {/* Right: Route + Exit buttons */}
              <div className="flex items-center gap-3">
                {/* Route alternatives */}
                <button
                  onClick={openExternalMaps}
                  className="w-12 h-12 rounded-full bg-[#2C2C2E] flex items-center justify-center cursor-pointer hover:bg-[#3A3A3C] transition-colors"
                  title="Open Directions in Google Maps"
                >
                  <GitFork className="w-5 h-5 text-[#E5E5EA]" />
                </button>

                {/* Exit button */}
                <button
                  onClick={onClose}
                  className="px-6 py-3 rounded-full bg-[#FF3B30] hover:bg-[#FF453A] text-white font-bold text-[15px] shadow-lg cursor-pointer active:scale-95 transition-all"
                >
                  Exit
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
