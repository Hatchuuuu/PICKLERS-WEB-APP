"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
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
  const { user, isLoading: authLoading } = useAuth();
  const { role: storeRole, verificationStatus: storeStatus, isLoading: storeLoading } = useUserStore();
  const [showModal, setShowModal] = useState(false);

  // If still loading auth context, render normally to avoid layout pop
  if (authLoading && storeLoading) {
    return <div className={`relative ${className}`}>{children}</div>;
  }

  const emailLower = (user?.email || "").toLowerCase();
  const isPrivilegedEmail =
    emailLower === "dev@picklers.com" ||
    emailLower === "admin@picklers.com" ||
    emailLower === "picklersdev@gmail.com" ||
    emailLower === "ricdarrylzernacielo@gmail.com" ||
    emailLower.endsWith("@picklers.com") ||
    emailLower.startsWith("picklersdev") ||
    emailLower.includes("admin") ||
    emailLower.includes("dev");

  const isDevOrAdmin =
    isPrivilegedEmail ||
    user?.role === "dev" ||
    user?.role === "admin" ||
    user?.isAdmin ||
    Boolean(user?.devRole) ||
    Boolean(user?.adminRole) ||
    Boolean(user?.dev_role) ||
    Boolean(user?.admin_role) ||
    (Array.isArray(user?.console_access) && (user.console_access.includes("dev") || user.console_access.includes("admin"))) ||
    storeRole === "dev" ||
    storeRole === "admin";

  // Demo accounts, Owners, Developers, and Admins bypass the verification gate entirely
  const isDemoUser = user?.isDemo || user?.role === "demo" || emailLower.includes("demo") || storeRole === "demo";
  const isOwner = user?.role === "owner" || storeRole === "owner";
  const isBypassed = isDemoUser || isOwner || isDevOrAdmin;

  const isVerified = (user?.verificationStatus === "verified") || (storeStatus === "verified");
  
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
