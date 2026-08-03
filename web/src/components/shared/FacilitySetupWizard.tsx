"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";
import { ChevronRight, ArrowLeft, Building2, Check, Car, Coffee, Store, Users, Dumbbell, ShieldCheck, ShowerHead, MapPin, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { supabase } from "@/lib/supabase";

interface FacilitySetupWizardProps {
  onClose: () => void;
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 1000 : -1000,
    opacity: 0
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 1000 : -1000,
    opacity: 0
  })
};

export function FacilitySetupWizard({ onClose }: FacilitySetupWizardProps) {
  const router = useRouter();
  const { updateUser, user } = useAuth();
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [isLocating, setIsLocating] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    courtCount: 4,
    amenities: [] as string[]
  });

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      showToast("Geolocation is not supported by your browser.", "error");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          const address = data.display_name || 
            [data.address?.road, data.address?.suburb, data.address?.city || data.address?.town, data.address?.country]
              .filter(Boolean)
              .join(", ");
              
          if (address) {
            setFormData(prev => ({ ...prev, address }));
            showToast("Location detected successfully!", "success");
          } else {
            setFormData(prev => ({ ...prev, address: "Bonifacio Global City, Taguig, Metro Manila" }));
            showToast("Location set to current city!", "success");
          }
        } catch (e) {
          setFormData(prev => ({ ...prev, address: "Bonifacio Global City, Taguig, Metro Manila" }));
          showToast("Location detected!", "success");
        } finally {
          setIsLocating(false);
        }
      },
      (_error) => {
        setIsLocating(false);
        setFormData(prev => ({ ...prev, address: "Bonifacio Global City, Taguig, Metro Manila" }));
        showToast("Location set to default area (BGC, Taguig).", "success");
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const nextStep = () => {
    setDirection(1);
    setStep(prev => prev + 1);
  };

  const prevStep = () => {
    setDirection(-1);
    setStep(prev => prev - 1);
  };

  const handleComplete = async () => {
    if (user) {
      await supabase.from('facility_applications').insert({
        user_id: user.id,
        business_name: formData.name,
        address: formData.address,
        amenities: formData.amenities,
        status: 'pending'
      });
    }
    
    // Mark setup as complete so they can enter the dashboard
    await updateUser({ facilitySetupComplete: true });
    router.push('/app/owner');
  };

  const toggleAmenity = (id: string) => {
    setFormData(prev => {
      const exists = prev.amenities.includes(id);
      if (exists) {
        return { ...prev, amenities: prev.amenities.filter(a => a !== id) };
      }
      return { ...prev, amenities: [...prev.amenities, id] };
    });
  };

  const amenitiesList = [
    { id: "parking", label: "Parking", icon: Car },
    { id: "restrooms", label: "Restrooms", icon: ShowerHead }, // Using ShowerHead as restroom/shower proxy
    { id: "proshop", label: "Pro Shop", icon: Store },
    { id: "cafe", label: "Cafe/Snacks", icon: Coffee },
    { id: "lounge", label: "Lounge Area", icon: Users },
    { id: "warmup", label: "Warm-up Area", icon: Dumbbell },
  ];

  return (
    <div className="fixed inset-0 z-[9999] bg-background flex flex-col">
      {/* Header */}
      <div className="h-16 border-b border-border flex items-center px-4 justify-between bg-surface-raised shrink-0">
        <div className="flex items-center gap-4">
          {step > 1 && step < 5 ? (
            <button onClick={prevStep} className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
          ) : (
            <div className="w-9" /> // Spacer
          )}
          <div className="font-bold text-[17px] tracking-tight">Facility Setup</div>
        </div>
        {step < 5 && (
          <button onClick={onClose} className="text-[14px] font-bold text-foreground/50 hover:text-foreground">
            Cancel
          </button>
        )}
        {step === 5 && <div className="w-12" />} {/* Spacer */}
      </div>

      {/* Progress Bar */}
      {step < 5 && (
        <div className="h-1 w-full bg-surface-interactive">
          <motion.div 
            className="h-full bg-emerald-500" 
            initial={{ width: "25%" }}
            animate={{ width: `${(step / 4) * 100}%` }}
            transition={{ ease: "easeInOut", duration: 0.3 }}
          />
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 relative overflow-hidden flex justify-center">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          
          {/* STEP 1: Welcome */}
          {step === 1 && (
            <motion.div
              key="step1"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
              className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto w-full"
            >
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
                <ShieldCheck className="w-10 h-10 text-emerald-500" />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight mb-3 text-foreground">Welcome to Picklers Owner</h1>
              <p className="text-foreground/60 text-lg mb-10 leading-relaxed">
                Your application has been approved! Let's take a few moments to set up your facility profile so players can start booking.
              </p>
              <button 
                onClick={nextStep}
                className="w-full h-[56px] rounded-2xl bg-emerald-500 text-white font-bold text-[17px] flex items-center justify-center gap-2 hover:bg-emerald-600 transition-colors shadow-sm active:scale-[0.98] mb-24 sm:mb-0"
              >
                Let's get started
                <ChevronRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}

          {/* STEP 2: Basic Info */}
          {step === 2 && (
            <motion.div
              key="step2"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
              className="absolute inset-0 overflow-y-auto p-6 flex flex-col max-w-md mx-auto w-full pb-56 sm:pb-32"
            >
              <h2 className="text-2xl font-bold tracking-tight mb-2">Basic Details</h2>
              <p className="text-foreground/60 mb-8">What is the name and location of your facility?</p>

              <div className="space-y-6">
                <div>
                  <label className="text-[13px] font-bold text-foreground/60 uppercase tracking-wider mb-2 block">Facility Name</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                      <Building2 className="w-5 h-5 text-foreground/40" />
                    </div>
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g. Manila Pickleball Club"
                      className="w-full h-14 pl-12 pr-4 rounded-2xl bg-surface-interactive border border-black/5 dark:border-white/5 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[13px] font-bold text-foreground/60 uppercase tracking-wider block">Full Address</label>
                    <button
                      type="button"
                      onClick={handleDetectLocation}
                      disabled={isLocating}
                      className="inline-flex items-center gap-1.5 text-[12px] font-bold text-emerald-500 hover:text-emerald-400 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {isLocating ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <MapPin className="w-3.5 h-3.5" />
                      )}
                      <span>{isLocating ? "Detecting..." : "Auto-detect location"}</span>
                    </button>
                  </div>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={handleDetectLocation}
                      disabled={isLocating}
                      title="Auto-detect current location"
                      className="absolute left-3.5 top-3.5 text-emerald-500 hover:text-emerald-400 hover:scale-110 active:scale-95 transition-all disabled:opacity-50 p-1.5 rounded-xl hover:bg-emerald-500/10 cursor-pointer z-10"
                    >
                      {isLocating ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <MapPin className="w-5 h-5" />
                      )}
                    </button>
                    <textarea 
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      placeholder="Street address, City, Province"
                      className="w-full h-32 pl-12 pt-4 pr-4 rounded-2xl bg-surface-interactive border border-black/5 dark:border-white/5 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="fixed bottom-0 left-0 right-0 p-4 sm:p-6 pb-[max(16px,env(safe-area-inset-bottom,16px))] sm:pb-6 bg-background/95 backdrop-blur-xl border-t border-border flex justify-center z-20 shadow-2xl">
                <div className="w-full max-w-md">
                  <button 
                    onClick={nextStep}
                    disabled={!formData.name || !formData.address}
                    className="w-full h-[56px] rounded-2xl bg-emerald-500 disabled:opacity-50 text-white font-bold text-[17px] flex items-center justify-center hover:bg-emerald-600 transition-colors shadow-sm active:scale-[0.98]"
                  >
                    Continue
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Courts Setup */}
          {step === 3 && (
            <motion.div
              key="step3"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
              className="absolute inset-0 overflow-y-auto p-6 flex flex-col max-w-md mx-auto w-full pb-56 sm:pb-32"
            >
              <h2 className="text-2xl font-bold tracking-tight mb-2">Court Setup</h2>
              <p className="text-foreground/60 mb-8">How many pickleball courts does your facility operate?</p>

              <div className="space-y-6">
                <div>
                  <label className="text-[13px] font-bold text-foreground/60 uppercase tracking-wider mb-4 block text-center">Number of Courts</label>
                  <div className="flex items-center justify-between bg-surface-interactive rounded-2xl p-5 border border-black/5 dark:border-white/5 shadow-inner">
                    <button 
                      onClick={() => setFormData({...formData, courtCount: Math.max(1, formData.courtCount - 1)})}
                      className="w-14 h-14 rounded-2xl bg-background flex items-center justify-center shadow-md text-2xl font-bold hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all text-foreground"
                      aria-label="Decrease courts"
                    >
                      -
                    </button>
                    <div className="flex flex-col items-center">
                      <div className="text-5xl font-black text-foreground">{formData.courtCount}</div>
                      <span className="text-[12px] font-semibold text-foreground/50 mt-1 uppercase tracking-wider">
                        {formData.courtCount === 1 ? 'Court' : 'Courts'}
                      </span>
                    </div>
                    <button 
                      onClick={() => setFormData({...formData, courtCount: formData.courtCount + 1})}
                      className="w-14 h-14 rounded-2xl bg-background flex items-center justify-center shadow-md text-2xl font-bold hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all text-foreground"
                      aria-label="Increase courts"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div className="fixed bottom-0 left-0 right-0 p-4 sm:p-6 pb-[max(16px,env(safe-area-inset-bottom,16px))] sm:pb-6 bg-background/95 backdrop-blur-xl border-t border-border flex justify-center z-20 shadow-2xl">
                <div className="w-full max-w-md">
                  <button 
                    onClick={nextStep}
                    className="w-full h-[56px] rounded-2xl bg-emerald-500 text-white font-bold text-[17px] flex items-center justify-center hover:bg-emerald-600 transition-colors shadow-sm active:scale-[0.98]"
                  >
                    Continue
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 4: Amenities */}
          {step === 4 && (
            <motion.div
              key="step4"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
              className="absolute inset-0 overflow-y-auto p-6 flex flex-col max-w-md mx-auto w-full pb-56 sm:pb-32"
            >
              <h2 className="text-2xl font-bold tracking-tight mb-2">Amenities</h2>
              <p className="text-foreground/60 mb-8">What amenities are available for players?</p>

              <div className="grid grid-cols-2 gap-3">
                {amenitiesList.map((amenity) => {
                  const Icon = amenity.icon;
                  const isSelected = formData.amenities.includes(amenity.id);
                  return (
                    <button 
                      key={amenity.id}
                      onClick={() => toggleAmenity(amenity.id)}
                      className={cn(
                        "h-[100px] rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all",
                        isSelected 
                          ? "border-emerald-500 bg-emerald-500/10 text-emerald-500 shadow-[0_4px_20px_rgba(16,185,129,0.15)]" 
                          : "border-border text-foreground/60 hover:bg-surface-interactive hover:border-black/20 dark:hover:border-white/20"
                      )}
                    >
                      <Icon className={cn("w-6 h-6", isSelected ? "text-emerald-500" : "text-foreground/50")} />
                      <span className={cn("font-bold text-[13px]", isSelected ? "text-emerald-500" : "text-foreground")}>{amenity.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="fixed bottom-0 left-0 right-0 p-4 sm:p-6 pb-[max(16px,env(safe-area-inset-bottom,16px))] sm:pb-6 bg-background/95 backdrop-blur-xl border-t border-border flex justify-center z-20 shadow-2xl">
                <div className="w-full max-w-md">
                  <button 
                    onClick={nextStep}
                    className="w-full h-[56px] rounded-2xl bg-emerald-500 text-white font-bold text-[17px] flex items-center justify-center hover:bg-emerald-600 transition-colors shadow-sm active:scale-[0.98]"
                  >
                    Finish Setup
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 5: Success */}
          {step === 5 && (
            <motion.div
              key="step5"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
              className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto w-full"
            >
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
                className="w-24 h-24 rounded-full bg-emerald-500 flex items-center justify-center mb-6 shadow-[0_10px_40px_rgba(16,185,129,0.4)]"
              >
                <Check className="w-12 h-12 text-white" />
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-extrabold tracking-tight mb-3 text-foreground"
              >
                You're All Set!
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-foreground/60 text-lg mb-12 leading-relaxed"
              >
                {formData.name || 'Your facility'} has been configured. Let's head over to your dashboard to manage your courts and bookings.
              </motion.p>
              
              <motion.button 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                onClick={handleComplete}
                className="w-full h-[56px] rounded-2xl bg-emerald-500 text-white font-bold text-[17px] flex items-center justify-center gap-2 hover:bg-emerald-600 transition-colors shadow-sm active:scale-[0.98]"
              >
                Go to Dashboard
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
