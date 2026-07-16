"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";
import { ChevronRight, ArrowLeft, MapPin, Building2, Check, Car, Coffee, Store, Users, Dumbbell, ShieldCheck, ShowerHead } from "lucide-react";
import { cn } from "@/lib/utils";

import { useAuth } from "@/contexts/AuthContext";
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
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    courtCount: 4,
    type: "indoor",
    amenities: [] as string[]
  });

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
    
    // Save to context/mock DB
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
                className="w-full h-[56px] rounded-2xl bg-emerald-500 text-white font-bold text-[17px] flex items-center justify-center gap-2 hover:bg-emerald-600 transition-colors shadow-sm active:scale-[0.98]"
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
              className="absolute inset-0 overflow-y-auto p-6 flex flex-col max-w-md mx-auto w-full pb-32"
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
                  <label className="text-[13px] font-bold text-foreground/60 uppercase tracking-wider mb-2 block">Full Address</label>
                  <div className="relative">
                    <div className="absolute left-4 top-4">
                      <MapPin className="w-5 h-5 text-foreground/40" />
                    </div>
                    <textarea 
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      placeholder="Street address, City, Province"
                      className="w-full h-32 pl-12 pt-4 pr-4 rounded-2xl bg-surface-interactive border border-black/5 dark:border-white/5 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="fixed bottom-0 left-0 right-0 p-6 bg-background/80 backdrop-blur-md border-t border-border flex justify-center z-10">
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

          {/* STEP 3: Courts & Type */}
          {step === 3 && (
            <motion.div
              key="step3"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
              className="absolute inset-0 overflow-y-auto p-6 flex flex-col max-w-md mx-auto w-full pb-32"
            >
              <h2 className="text-2xl font-bold tracking-tight mb-2">Court Setup</h2>
              <p className="text-foreground/60 mb-8">Tell us about your pickleball courts.</p>

              <div className="space-y-8">
                <div>
                  <label className="text-[13px] font-bold text-foreground/60 uppercase tracking-wider mb-4 block">Facility Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => setFormData({...formData, type: 'indoor'})}
                      className={cn(
                        "h-[60px] rounded-2xl border-2 font-bold text-[15px] transition-all",
                        formData.type === 'indoor' ? "border-emerald-500 bg-emerald-500/10 text-emerald-500" : "border-border text-foreground hover:bg-surface-interactive"
                      )}
                    >
                      Indoor
                    </button>
                    <button 
                      onClick={() => setFormData({...formData, type: 'outdoor'})}
                      className={cn(
                        "h-[60px] rounded-2xl border-2 font-bold text-[15px] transition-all",
                        formData.type === 'outdoor' ? "border-emerald-500 bg-emerald-500/10 text-emerald-500" : "border-border text-foreground hover:bg-surface-interactive"
                      )}
                    >
                      Outdoor
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[13px] font-bold text-foreground/60 uppercase tracking-wider mb-4 block">Number of Courts</label>
                  <div className="flex items-center justify-between bg-surface-interactive rounded-2xl p-4 border border-black/5 dark:border-white/5">
                    <button 
                      onClick={() => setFormData({...formData, courtCount: Math.max(1, formData.courtCount - 1)})}
                      className="w-12 h-12 rounded-full bg-background flex items-center justify-center shadow-sm text-2xl hover:bg-black/5 dark:hover:bg-white/10"
                    >
                      -
                    </button>
                    <div className="text-4xl font-black">{formData.courtCount}</div>
                    <button 
                      onClick={() => setFormData({...formData, courtCount: formData.courtCount + 1})}
                      className="w-12 h-12 rounded-full bg-background flex items-center justify-center shadow-sm text-2xl hover:bg-black/5 dark:hover:bg-white/10"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div className="fixed bottom-0 left-0 right-0 p-6 bg-background/80 backdrop-blur-md border-t border-border flex justify-center z-10">
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
              className="absolute inset-0 overflow-y-auto p-6 flex flex-col max-w-md mx-auto w-full pb-32"
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

              <div className="fixed bottom-0 left-0 right-0 p-6 bg-background/80 backdrop-blur-md border-t border-border flex justify-center z-10">
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
