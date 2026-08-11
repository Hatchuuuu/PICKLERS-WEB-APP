"use client";

import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Camera, ArrowRightLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { FacilitySetupWizard } from "@/components/shared/FacilitySetupWizard";
import { useAuth } from "@/contexts/AuthContext";

export function AvatarUpload() {
  const { user, updateUser } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showSetup, setShowSetup] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Simulate upload delay for animation
    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setTimeout(() => {
          updateUser({ avatarUrl: base64 });
          setIsUploading(false);
        }, 600); // 600ms delay to feel like a real upload
      }
    };
    reader.readAsDataURL(file);
  };

  const initialLetter = user?.name?.[0]?.toUpperCase() || "P";

  return (
    <div className="flex flex-col items-center justify-center relative pb-2">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />
      
      <motion.div
        className="relative w-24 h-24 rounded-full cursor-pointer overflow-hidden p-[3px] shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
        onClick={() => fileInputRef.current?.click()}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Animated Gradient Border */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ 
            background: "conic-gradient(from 0deg at 50% 50%, var(--accent-primary) 0deg, var(--accent-secondary) 180deg, var(--accent-primary) 360deg)" 
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />

        {/* Inner Content */}
        <div className="absolute inset-[3px] rounded-full overflow-hidden bg-background flex items-center justify-center">
          <AnimatePresence mode="wait">
            {user?.avatarUrl ? (
              <motion.img 
                key="avatar-image"
                src={user.avatarUrl} 
                alt="Profile" 
                className="w-full h-full object-cover"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", bounce: 0.5 }}
              />
            ) : (
              <motion.div 
                key="avatar-initial"
                className="w-full h-full flex items-center justify-center text-3xl font-bold text-accent-primary bg-surface-raised"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                {initialLetter}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hover Overlay */}
          <AnimatePresence>
            {isHovered && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                className="absolute inset-[3px] rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center z-10"
              >
                <Camera className="w-8 h-8 text-white drop-shadow-md" />
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Uploading Overlay */}
          <AnimatePresence>
            {isUploading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-20"
              >
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
      <div className="mt-4 flex flex-col items-center text-center">
        <div className="font-bold text-[19px] tracking-tight text-foreground">{user?.name}</div>
        <div className="mt-1.5 inline-flex items-center justify-center text-[11px] font-black uppercase tracking-[0.1em] text-foreground/50 bg-black/5 dark:bg-white/5 px-3 py-1 rounded-full border border-black/5 dark:border-white/5 shadow-sm">
          <span className="text-emerald-500 drop-shadow-sm">Player</span>
          {(user?.role === "owner" || user?.isDemo || user?.verificationStatus === "verified") && (
            <>
              <span className="mx-2 opacity-30">/</span>
              <span className="text-amber-400 drop-shadow-sm">Court Owner</span>
            </>
          )}
        </div>

        {/* Switch to Owner Button centered below profile details */}
        {/* Switch to Owner Button with white glassmorphic background */}
        {(user?.role === "owner" || user?.isDemo || user?.verificationStatus === "verified") && (
          <button
            onClick={() => {
              user?.facilitySetupComplete ? router.push('/app/owner') : setShowSetup(true);
            }}
            className="mt-3.5 inline-flex items-center gap-2 px-4.5 py-2 bg-white/10 hover:bg-white/20 dark:bg-white/10 dark:hover:bg-white/20 border border-white/25 backdrop-blur-xl rounded-full transition-all active:scale-95 shadow-[0_4px_20px_rgba(0,0,0,0.25)] group"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-400 transition-transform group-hover:rotate-180" />
            <span className="text-[12.5px] font-extrabold text-foreground dark:text-white">Switch to Owner</span>
          </button>
        )}
      </div>
    
      {showSetup && <FacilitySetupWizard onClose={() => setShowSetup(false)} />}
    </div>
  );
}
