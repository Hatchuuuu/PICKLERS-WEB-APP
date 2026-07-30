"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { useUserStore } from "@/store/useUserStore";
import { VerificationGateModal } from "./VerificationGateModal";

interface LockedFeatureWrapperProps {
  children: React.ReactNode;
  showLockIcon?: boolean;
  className?: string;
  featureLabel?: string;
}

export function LockedFeatureWrapper({ 
  children, 
  showLockIcon = true,
  className = "",
  featureLabel
}: LockedFeatureWrapperProps) {
  const { role, verificationStatus, isLoading } = useUserStore();
  const [showModal, setShowModal] = useState(false);

  // Still loading state: render normally or lightly faded? We will render normally to prevent layout shift
  if (isLoading) {
    return <div className={`relative ${className}`}>{children}</div>;
  }

  // Demo accounts bypass the verification gate entirely
  const isBypassed = role === "demo";
  const isVerified = verificationStatus === "verified";
  
  const isLocked = !isBypassed && !isVerified;

  if (!isLocked) {
    return <div className={`relative ${className}`}>{children}</div>;
  }

  return (
    <>
      <div 
        className={`relative group cursor-pointer ${className}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowModal(true);
        }}
        onClickCapture={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowModal(true);
        }}
      >
        {/* The restricted content */}
        <div className="opacity-50 grayscale transition-all duration-300 group-hover:opacity-40 pointer-events-none select-none">
          {children}
        </div>

        {/* Lock Overlay */}
        {showLockIcon && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="w-10 h-10 rounded-full bg-background/80 backdrop-blur-md flex items-center justify-center shadow-lg border border-border-subtle group-hover:scale-110 transition-transform duration-300">
              <Lock className="w-5 h-5 text-ink-muted" />
            </div>
          </div>
        )}
      </div>

      <VerificationGateModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        featureLabel={featureLabel}
      />
    </>
  );
}
