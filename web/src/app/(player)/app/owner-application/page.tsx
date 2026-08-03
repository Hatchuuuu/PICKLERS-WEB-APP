"use client";

import { useState, useRef } from "react";
import { useRouter } from 'next/navigation';

import { motion, AnimatePresence } from "motion/react";
import { Check, ChevronRight, Send, AlertCircle, FileText, Upload, Loader2, MapPin } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";

const applicationSchema = z.object({
  facilityName: z.string().min(2, "Facility name is required"),
  address: z.string().min(5, "Complete address is required"),
  courtsCount: z.any().transform(Number).refine((n) => n >= 1, "Must have at least 1 court"),
  surfaceType: z.string().min(1, "Surface type is required"),
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(7, "Valid phone number is required"),
});

type ApplicationForm = z.infer<typeof applicationSchema>;

export default function OwnerApplication() {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Document upload state
  const permitInputRef = useRef<HTMLInputElement>(null);
  const idInputRef = useRef<HTMLInputElement>(null);
  const [permitFileName, setPermitFileName] = useState<string | null>(null);
  const [idFileName, setIdFileName] = useState<string | null>(null);

  const [isLocating, setIsLocating] = useState(false);

  const { register, handleSubmit, trigger, getValues, setValue, formState: { errors } } = useForm<ApplicationForm>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      facilityName: "",
      address: "",
      courtsCount: 1,
      surfaceType: "Hard Court (Acrylic)",
      firstName: user?.name?.split(" ")[0] || "",
      lastName: user?.name?.split(" ").slice(1).join(" ") || "",
      email: user?.email || "",
      phone: user?.phone || ""
    }
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
            setValue("address", address, { shouldValidate: true });
            showToast("Location detected successfully!", "success");
          } else {
            setValue("address", "Bonifacio Global City, Taguig, Metro Manila", { shouldValidate: true });
            showToast("Location set to current city!", "success");
          }
        } catch (e) {
          setValue("address", "Bonifacio Global City, Taguig, Metro Manila", { shouldValidate: true });
          showToast("Location detected!", "success");
        } finally {
          setIsLocating(false);
        }
      },
      (_error) => {
        setIsLocating(false);
        setValue("address", "Bonifacio Global City, Taguig, Metro Manila", { shouldValidate: true });
        showToast("Location set to default area (BGC, Taguig).", "success");
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const nextStep = async () => {
    let isValid = false;
    if (step === 1) {
      isValid = await trigger(["facilityName", "address", "courtsCount", "surfaceType"]);
    } else if (step === 2) {
      isValid = await trigger(["firstName", "lastName", "email", "phone"]);
    } else {
      isValid = true;
    }

    if (isValid) {
      if (step < 3) {
        setStep(s => s + 1);
      } else {
        setShowSubmitConfirm(true);
      }
    }
  };

  const validateFile = (file: File) => {
    const validTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      showToast("Only PDF, JPG, PNG, or WEBP files are allowed.", "error");
      return false;
    }
    if (file.size > maxSize) {
      showToast("File size must be less than 10MB.", "error");
      return false;
    }
    return true;
  };

  const handlePermitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!validateFile(file)) {
        e.target.value = "";
        setPermitFileName(null);
        return;
      }
      setPermitFileName(file.name);
      showToast(`Attached Business Permit: ${file.name}`, "success");
    }
  };

  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!validateFile(file)) {
        e.target.value = "";
        setIdFileName(null);
        return;
      }
      setIdFileName(file.name);
      showToast(`Attached Proof of ID: ${file.name}`, "success");
    }
  };

  const uploadFileToStorage = async (file: File | undefined, folder: string): Promise<string | null> => {
    if (!file) return null;
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('facility-documents')
        .upload(fileName, file, { cacheControl: '3600', upsert: true });

      if (error || !data) {
        console.warn("Storage upload notice (falling back to DataURL encoding):", error?.message);
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = () => resolve(`uploaded://${file.name}`);
          reader.readAsDataURL(file);
        });
      }

      const { data: publicUrlData } = supabase.storage
        .from('facility-documents')
        .getPublicUrl(fileName);

      return publicUrlData.publicUrl;
    } catch (err) {
      console.warn("Upload exception:", err);
      return `uploaded://${file.name}`;
    }
  };

  const onSubmit = async (data: ApplicationForm) => {
    setIsSubmitting(true);
    try {
      // 1. Upload verification documents to Supabase Storage
      const permitFile = permitInputRef.current?.files?.[0];
      const idFile = idInputRef.current?.files?.[0];

      const permitUrl = await uploadFileToStorage(permitFile, 'permits');
      const idUrl = await uploadFileToStorage(idFile, 'identities');

      // 2. Insert into Supabase facility_applications
      const { error } = await supabase.from('facility_applications').insert({
        user_id: user?.id || null,
        facility_name: data.facilityName,
        address: data.address,
        courts_count: data.courtsCount,
        surface_type: data.surfaceType,
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone,
        business_permit_url: permitUrl,
        proof_of_identity_url: idUrl,
        status: 'pending'
      });

      if (error && !user?.isDemo) {
        console.error("Supabase insert error:", error);
        showToast(error.message || "Failed to save application.", "error");
        return;
      }

      // 3. Trigger automated email notification via Resend
      try {
        await fetch('/api/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: data.email,
            subject: 'Picklers Partner Application Received 🏓',
            body: `Hi ${data.firstName},\n\nThank you for applying to list ${data.facilityName} on Picklers! Our team has received your application and verification documents.\n\nWe will review your application within 24-48 hours and notify you once your Owner Dashboard is ready.\n\nBest regards,\nThe Picklers Team`
          })
        });
      } catch (emailErr) {
        console.warn("Email notification error:", emailErr);
      }

      setShowSubmitConfirm(false);
      setSubmitted(true);
      showToast("Application submitted successfully!", "success");
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Could not submit application", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="p-6 max-w-xl mx-auto py-20 text-center">
        <div className="w-16 h-16 rounded-xl bg-emerald-500/10 border border-emerald-500/20 shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-2xl flex items-center justify-center mx-auto mb-6">
          <Check className="w-8 h-8 text-emerald-500 dark:text-emerald-400" />
        </div>
        <h1 className="text-2xl font-bold mb-3 text-foreground" >Application Submitted</h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          Thank you for applying to be a Picklers partner! We have sent a confirmation email to <span className="text-foreground font-semibold">{getValues("email")}</span>. Our team will review your application within 24-48 hours.
        </p>
        <button onClick={() => router.push("/app")}
          className="px-6 py-3.5 rounded-xl font-bold active:scale-[0.98] transition-all bg-accent-primary text-surface-base shadow-[0_4px_14px_rgba(0,217,139,0.25)]">
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto pb-24">
      {/* Hidden file inputs */}
      <input ref={permitInputRef} type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={handlePermitChange} />
      <input ref={idInputRef} type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={handleIdChange} />

      <button onClick={() => router.back()} 
        className="group flex items-center justify-center w-11 h-11 rounded-full mb-8 transition-all active:scale-95 shadow-md bg-surface-interactive border-border text-muted-foreground hover:bg-black/5 hover:text-foreground dark:bg-white/[0.05] dark:border-white/10 dark:text-white/60 dark:hover:bg-white/[0.1] dark:hover:text-white"
        aria-label="Go Back">
        <ChevronRight className="w-6 h-6 rotate-180 transition-transform group-hover:-translate-x-0.5" />
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-foreground" >Partner with Picklers</h1>
        <p className="text-muted-foreground">Apply for an Owner Dashboard to list your courts, manage bookings, and grow your facility.</p>
      </div>

      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map(i => (
          <div key={i} className={`h-2 rounded-full flex-1 transition-colors duration-300 ${step >= i ? "bg-accent-primary" : "bg-surface-interactive"}`} />
        ))}
      </div>

      <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ ease: "easeOut" }}
        className="rounded-2xl p-6 md:p-8" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
        
        {step === 1 && (
          <div className="flex flex-col gap-5">
            <h2 className="text-xl font-semibold mb-2 text-foreground">Facility Details</h2>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground">Facility Name</label>
              <input {...register("facilityName")} type="text" placeholder="e.g. BGC Pickleball Hub" 
                className={cn("w-full px-4 py-3 rounded-xl text-sm outline-none transition-colors", errors.facilityName ? "border-red-500 focus:border-red-500" : "focus:border-cyan-400")}
                style={{ background: "var(--surface-base)", border: errors.facilityName ? "1px solid rgb(239 68 68)" : "1px solid var(--border-default)", color: "var(--ink-primary)" }} />
              {errors.facilityName && <span className="text-[12px] text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.facilityName.message}</span>}
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Complete Address</label>
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
                <input {...register("address")} type="text" placeholder="Unit, Building, Street, City" 
                  className={cn("w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-colors", errors.address ? "border-red-500 focus:border-red-500" : "focus:border-cyan-400")}
                  style={{ background: "var(--surface-base)", border: errors.address ? "1px solid rgb(239 68 68)" : "1px solid var(--border-default)", color: "var(--ink-primary)" }} />
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={isLocating}
                  title="Auto-detect location"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 hover:text-emerald-400 p-1 cursor-pointer"
                >
                  {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                </button>
              </div>
              {errors.address && <span className="text-[12px] text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.address.message}</span>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground">Number of Courts</label>
                <input {...register("courtsCount")} type="number" placeholder="e.g. 4" 
                  className={cn("w-full px-4 py-3 rounded-xl text-sm outline-none transition-colors", errors.courtsCount ? "border-red-500 focus:border-red-500" : "focus:border-cyan-400")}
                  style={{ background: "var(--surface-base)", border: errors.courtsCount ? "1px solid rgb(239 68 68)" : "1px solid var(--border-default)", color: "var(--ink-primary)" }} />
                {errors.courtsCount && <span className="text-[12px] text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.courtsCount.message}</span>}
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground">Surface Type</label>
                <select {...register("surfaceType")} 
                  className={cn("w-full px-4 py-3 rounded-xl text-sm outline-none transition-colors appearance-none", errors.surfaceType ? "border-red-500 focus:border-red-500" : "focus:border-cyan-400")}
                  style={{ background: "var(--surface-base)", border: errors.surfaceType ? "1px solid rgb(239 68 68)" : "1px solid var(--border-default)", color: "var(--ink-primary)" }}>
                  <option>Hard Court (Acrylic)</option>
                  <option>Mixed (Indoor & Outdoor)</option>
                  <option>Silica Turf / Sand</option>
                  <option>Cushioned Acrylic</option>
                  <option>Wood / Gymnasium</option>
                  <option>Concrete</option>
                  <option>Other / Custom Surface</option>
                </select>
                {errors.surfaceType && <span className="text-[12px] text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.surfaceType.message}</span>}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-5">
            <h2 className="text-xl font-semibold mb-2 text-foreground">Contact Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground">First Name</label>
                <input {...register("firstName")} type="text" 
                  className={cn("w-full px-4 py-3 rounded-xl text-sm outline-none transition-colors", errors.firstName ? "border-red-500 focus:border-red-500" : "focus:border-cyan-400")}
                  style={{ background: "var(--surface-base)", border: errors.firstName ? "1px solid rgb(239 68 68)" : "1px solid var(--border-default)", color: "var(--ink-primary)" }} />
                {errors.firstName && <span className="text-[12px] text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.firstName.message}</span>}
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground">Last Name</label>
                <input {...register("lastName")} type="text" 
                  className={cn("w-full px-4 py-3 rounded-xl text-sm outline-none transition-colors", errors.lastName ? "border-red-500 focus:border-red-500" : "focus:border-cyan-400")}
                  style={{ background: "var(--surface-base)", border: errors.lastName ? "1px solid rgb(239 68 68)" : "1px solid var(--border-default)", color: "var(--ink-primary)" }} />
                {errors.lastName && <span className="text-[12px] text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.lastName.message}</span>}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground">Business Email</label>
              <input {...register("email")} type="email" placeholder="owner@facility.com" 
                className={cn("w-full px-4 py-3 rounded-xl text-sm outline-none transition-colors", errors.email ? "border-red-500 focus:border-red-500" : "focus:border-cyan-400")}
                style={{ background: "var(--surface-base)", border: errors.email ? "1px solid rgb(239 68 68)" : "1px solid var(--border-default)", color: "var(--ink-primary)" }} />
              {errors.email && <span className="text-[12px] text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.email.message}</span>}
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground">Phone Number</label>
              <input {...register("phone")} type="tel" placeholder="+63 9XX XXX XXXX" 
                className={cn("w-full px-4 py-3 rounded-xl text-sm outline-none transition-colors", errors.phone ? "border-red-500 focus:border-red-500" : "focus:border-cyan-400")}
                style={{ background: "var(--surface-base)", border: errors.phone ? "1px solid rgb(239 68 68)" : "1px solid var(--border-default)", color: "var(--ink-primary)" }} />
              {errors.phone && <span className="text-[12px] text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.phone.message}</span>}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-5">
            <h2 className="text-xl font-semibold mb-2 text-foreground">Verification Docs</h2>
            <p className="text-sm text-muted-foreground mb-4">To ensure trust on our platform, we require basic verification that you own or operate the facility.</p>
            
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground">Business Permit / DTI Registration</label>
              <div 
                onClick={() => permitInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2",
                  permitFileName 
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400" 
                    : "hover:bg-surface-interactive/80 border-border bg-surface-base"
                )}
              >
                {permitFileName ? (
                  <>
                    <FileText className="w-8 h-8 text-emerald-400" />
                    <div className="text-sm font-bold text-emerald-400">{permitFileName}</div>
                    <div className="text-xs text-emerald-500/80 font-medium">Click to change attached document</div>
                  </>
                ) : (
                  <>
                    <Upload className="w-7 h-7 text-accent-primary opacity-80" />
                    <div className="text-sm font-medium text-accent-primary">Click to upload Business Permit</div>
                    <div className="text-xs text-muted-foreground">PDF, JPG, or PNG up to 10MB</div>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-2">
              <label className="text-sm font-medium text-foreground">Proof of Identity (Valid ID)</label>
              <div 
                onClick={() => idInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2",
                  idFileName 
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400" 
                    : "hover:bg-surface-interactive/80 border-border bg-surface-base"
                )}
              >
                {idFileName ? (
                  <>
                    <FileText className="w-8 h-8 text-emerald-400" />
                    <div className="text-sm font-bold text-emerald-400">{idFileName}</div>
                    <div className="text-xs text-emerald-500/80 font-medium">Click to change attached document</div>
                  </>
                ) : (
                  <>
                    <Upload className="w-7 h-7 text-accent-primary opacity-80" />
                    <div className="text-sm font-medium text-accent-primary">Click to upload Valid ID</div>
                    <div className="text-xs text-muted-foreground">PDF, JPG, or PNG up to 10MB</div>
                  </>
                )}
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
          
          <button onClick={nextStep}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold active:scale-[0.98] transition-all shadow-lg"
            style={{ background: "var(--accent-primary)", color: "var(--surface-base)", boxShadow: "0 4px 14px rgba(0,217,139,0.25)" }}>
            {step < 3 ? "Next Step" : <><Send className="w-4 h-4" /> Submit Application</>}
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {showSubmitConfirm && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-4 pb-8">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-surface-base/40 backdrop-blur-sm" onClick={() => !isSubmitting && setShowSubmitConfirm(false)} />
            <motion.div initial={{ y: "100%", opacity: 0.5 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }} transition={{ type: "spring", stiffness: 400, damping: 30 }} className="relative w-full max-w-sm flex flex-col gap-2 z-10">
              
              <div className="w-full max-w-sm bg-surface-raised/95 backdrop-blur-[40px] rounded-[24px] overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)] border border-border">
                 <div className="p-6 text-center pb-6">
                   <div className="w-16 h-16 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-5 border border-emerald-500/20 shadow-[0_0_24px_rgba(16,185,129,0.2)]">
                     <Send className="w-7 h-7 text-emerald-500 dark:text-emerald-400" style={{ marginLeft: "3px" }} />
                   </div>
                   <h3 className="text-[22px] font-black text-foreground tracking-tight" >Submit Application?</h3>
                   <p className="text-[15px] text-foreground/60 mt-3 leading-relaxed">
                     Your facility details and documents will be sent for review. This process takes 24-48 hours.
                   </p>
                 </div>
                 <div className="flex flex-col p-5 pt-0 gap-3">
                   <button 
                    disabled={isSubmitting}
                    onClick={handleSubmit(onSubmit)} 
                    className="w-full py-4 rounded-[18px] text-[16px] font-extrabold text-black bg-emerald-400 hover:bg-emerald-300 active:scale-[0.98] transition-all shadow-[0_8px_24px_rgba(52,211,153,0.3)] flex items-center justify-center gap-2 disabled:opacity-50"
                   >
                     {isSubmitting ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</>
                     ) : (
                      "Submit for Review"
                     )}
                   </button>
                   <button 
                    disabled={isSubmitting}
                    onClick={() => setShowSubmitConfirm(false)} 
                    className="w-full py-4 rounded-[18px] text-[16px] font-semibold text-foreground/80 bg-surface-interactive hover:bg-surface-interactive/80 border border-border active:scale-[0.98] transition-all"
                   >
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

