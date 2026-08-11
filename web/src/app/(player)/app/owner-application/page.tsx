"use client";

import { useState, useRef } from "react";
import { useRouter } from 'next/navigation';

import { motion, AnimatePresence } from "motion/react";
import { Check, ChevronRight, ChevronLeft, Send, AlertCircle, FileText, Upload, Loader2, MapPin, User, Mail, Phone, Building2 } from "lucide-react";
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
      surfaceType: "Hard Court (Acrylic) - Indoor",
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
          const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
          let address = "";

          if (mapboxToken && mapboxToken.trim().startsWith("pk.")) {
            try {
              const res = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${mapboxToken}&types=address,neighborhood,locality,place`
              );
              if (res.ok) {
                const data = await res.json();
                if (data.features && data.features.length > 0) {
                  address = data.features[0].place_name || data.features[0].text;
                }
              }
            } catch (err) {
              console.warn("Mapbox geocoding fetch error:", err);
            }
          }

          if (!address) {
            try {
              const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
              );
              if (res.ok) {
                const data = await res.json();
                address = data.display_name ||
                  [data.address?.road, data.address?.suburb, data.address?.city || data.address?.town, data.address?.country]
                    .filter(Boolean)
                    .join(", ");
              }
            } catch (err) {
              console.warn("OSM geocoding fetch error:", err);
            }
          }

          if (address) {
            setValue("address", address, { shouldValidate: true });
            showToast("Location detected successfully!", "success");
          } else {
            setValue("address", "Bunao, Dumaguete City", { shouldValidate: true });
            showToast("Location set to Dumaguete City", "success");
          }
        } catch (e) {
          console.error("Geocoding error:", e);
          setValue("address", "Bunao, Dumaguete City", { shouldValidate: true });
          showToast("Location set to Dumaguete City", "success");
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        setIsLocating(false);
        setValue("address", "Bunao, Dumaguete City", { shouldValidate: true });
        if (error.code === error.PERMISSION_DENIED) {
          showToast("Location access denied. Set to Dumaguete City.", "error");
        } else {
          showToast("Location set to Dumaguete City.", "success");
        }
      },
      { timeout: 5000, enableHighAccuracy: false, maximumAge: 300000 }
    );
  };

  const nextStep = async () => {
    let isValid = false;
    if (step === 1) {
      isValid = await trigger(["facilityName", "address", "courtsCount"]);
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

      // 2. Insert into Supabase owner_applications
      const { error } = await supabase.from('owner_applications').insert({
        user_id: user?.id || null,
        facility_name: data.facilityName,
        facility_address: data.address,
        court_count: data.courtsCount,
        surface_type: data.surfaceType,
        business_name: `${data.firstName} ${data.lastName}`.trim() || data.facilityName,
        contact_email: data.email,
        contact_phone: data.phone,
        government_id_url: idUrl,
        business_license_url: permitUrl,
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
        <h1 className="text-3xl font-extrabold mb-2 text-foreground tracking-tight">Partner with Picklers</h1>
        <p className="text-slate-600 dark:text-slate-300 font-medium text-sm sm:text-base">Apply for an Owner Dashboard to list your courts, manage bookings, and grow your facility.</p>
      </div>

      {/* Enhanced Step Progress Pill Bar */}
      <div className="grid grid-cols-3 gap-2 mb-8">
        {[
          { num: 1, label: "Facility Details", icon: "🎾" },
          { num: 2, label: "Contact Info", icon: "👤" },
          { num: 3, label: "Verification", icon: "📄" },
        ].map((s) => {
          const isActive = step === s.num;
          const isPassed = step > s.num;
          return (
            <div
              key={s.num}
              onClick={() => isPassed && setStep(s.num)}
              className={cn(
                "flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-extrabold transition-all cursor-pointer select-none",
                isActive
                  ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-600 dark:text-emerald-400 shadow-[0_4px_16px_rgba(16,185,129,0.25)]"
                  : isPassed
                    ? "bg-slate-200/60 dark:bg-white/[0.08] border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:border-emerald-500/30"
                    : "bg-slate-100/40 dark:bg-white/[0.03] border-slate-200 dark:border-white/5 text-slate-400 dark:text-slate-500"
              )}
            >
              <span className="text-sm">{s.icon}</span>
              <span className="hidden sm:inline">{s.label}</span>
              <span className="sm:hidden">Step {s.num}</span>
              {isPassed && <Check className="w-3.5 h-3.5 ml-auto text-emerald-500 shrink-0" />}
            </div>
          );
        })}
      </div>

      <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ ease: "easeOut" }}
        className="rounded-3xl p-6 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl bg-slate-900/90 dark:bg-[#0e172a]/90 border border-slate-700/60 dark:border-white/15">

        {step === 1 && (
          <div className="flex flex-col gap-6">
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-500" />
              <span>Facility & Court Details</span>
            </h2>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Facility Name</label>
              <div className="relative">
                <input {...register("facilityName")} type="text" placeholder="e.g. BGC Pickleball Hub"
                  className={cn(
                    "w-full pl-10 pr-4 py-3.5 rounded-xl text-sm outline-none transition-all font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-white/[0.08] border border-slate-300 dark:border-white/15 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20",
                    errors.facilityName && "border-red-500 focus:border-red-500"
                  )} />
                <Building2 className="w-4 h-4 text-emerald-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
              {errors.facilityName && <span className="text-[12px] text-red-400 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> {errors.facilityName.message}</span>}
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Complete Address</label>
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
                  className={cn(
                    "w-full pl-10 pr-4 py-3.5 rounded-xl text-sm outline-none transition-all font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-white/[0.08] border border-slate-300 dark:border-white/15 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20",
                    errors.address && "border-red-500 focus:border-red-500"
                  )} />
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
              {errors.address && <span className="text-[12px] text-red-400 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> {errors.address.message}</span>}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Total Number of Courts</label>
              <input {...register("courtsCount")} type="number" min="1" placeholder="e.g. 4"
                className={cn(
                  "w-full px-4 py-3.5 rounded-xl text-sm outline-none transition-all font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-white/[0.08] border border-slate-300 dark:border-white/15 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20",
                  errors.courtsCount && "border-red-500 focus:border-red-500"
                )} />
              {errors.courtsCount && <span className="text-[12px] text-red-400 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> {errors.courtsCount.message}</span>}
            </div>

          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-6">
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-500" />
              <span>Contact Information</span>
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">First Name</label>
                <div className="relative">
                  <input {...register("firstName")} type="text" placeholder="First Name"
                    className={cn(
                      "w-full pl-10 pr-4 py-3.5 rounded-xl text-sm outline-none transition-all font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-white/[0.08] border border-slate-300 dark:border-white/15 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20",
                      errors.firstName && "border-red-500 focus:border-red-500"
                    )} />
                  <User className="w-4 h-4 text-emerald-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
                {errors.firstName && <span className="text-[12px] text-red-400 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> {errors.firstName.message}</span>}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Last Name</label>
                <div className="relative">
                  <input {...register("lastName")} type="text" placeholder="Last Name"
                    className={cn(
                      "w-full pl-10 pr-4 py-3.5 rounded-xl text-sm outline-none transition-all font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-white/[0.08] border border-slate-300 dark:border-white/15 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20",
                      errors.lastName && "border-red-500 focus:border-red-500"
                    )} />
                  <User className="w-4 h-4 text-emerald-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
                {errors.lastName && <span className="text-[12px] text-red-400 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> {errors.lastName.message}</span>}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Business Email</label>
              <div className="relative">
                <input {...register("email")} type="email" placeholder="owner@facility.com"
                  className={cn(
                    "w-full pl-10 pr-4 py-3.5 rounded-xl text-sm outline-none transition-all font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-white/[0.08] border border-slate-300 dark:border-white/15 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20",
                    errors.email && "border-red-500 focus:border-red-500"
                  )} />
                <Mail className="w-4 h-4 text-emerald-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
              {errors.email && <span className="text-[12px] text-red-400 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> {errors.email.message}</span>}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Phone Number</label>
              <div className="relative">
                <input {...register("phone")} type="tel" placeholder="+63 9XX XXX XXXX"
                  className={cn(
                    "w-full pl-10 pr-4 py-3.5 rounded-xl text-sm outline-none transition-all font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-white/[0.08] border border-slate-300 dark:border-white/15 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20",
                    errors.phone && "border-red-500 focus:border-red-500"
                  )} />
                <Phone className="w-4 h-4 text-emerald-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
              {errors.phone && <span className="text-[12px] text-red-400 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> {errors.phone.message}</span>}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2 mb-1">
                <FileText className="w-5 h-5 text-emerald-500" />
                <span>Verification Documents</span>
              </h2>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300">To ensure trust on Picklers, please provide basic verification of facility ownership or operation.</p>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Business Permit / DTI Registration</label>
              <div
                onClick={() => permitInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2.5",
                  permitFileName
                    ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                    : "bg-slate-100/60 dark:bg-white/[0.04] border-slate-300 dark:border-white/15 hover:border-emerald-500/40 hover:bg-slate-200/50 dark:hover:bg-white/[0.08]"
                )}
              >
                {permitFileName ? (
                  <>
                    <FileText className="w-9 h-9 text-emerald-400" />
                    <div className="text-sm font-extrabold text-emerald-400">{permitFileName}</div>
                    <div className="text-xs text-emerald-500/90 font-bold bg-emerald-500/10 px-3 py-1 rounded-full">Click to change attached file</div>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-emerald-500" />
                    <div className="text-sm font-bold text-slate-900 dark:text-white">Click to upload Business Permit</div>
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Supports PDF, JPG, PNG, WEBP up to 10MB</div>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Proof of Identity (Valid Government ID)</label>
              <div
                onClick={() => idInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2.5",
                  idFileName
                    ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                    : "bg-slate-100/60 dark:bg-white/[0.04] border-slate-300 dark:border-white/15 hover:border-emerald-500/40 hover:bg-slate-200/50 dark:hover:bg-white/[0.08]"
                )}
              >
                {idFileName ? (
                  <>
                    <FileText className="w-9 h-9 text-emerald-400" />
                    <div className="text-sm font-extrabold text-emerald-400">{idFileName}</div>
                    <div className="text-xs text-emerald-500/90 font-bold bg-emerald-500/10 px-3 py-1 rounded-full">Click to change attached file</div>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-emerald-500" />
                    <div className="text-sm font-bold text-slate-900 dark:text-white">Click to upload Valid ID</div>
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Supports PDF, JPG, PNG, WEBP up to 10MB</div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-10 pt-6 border-t border-slate-300/60 dark:border-white/10">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(s => s - 1)}
              className="flex items-center gap-1.5 px-5 py-3 rounded-xl border border-slate-300 dark:border-white/15 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white bg-slate-200/60 dark:bg-white/5 hover:bg-slate-300/80 dark:hover:bg-white/10 font-bold text-sm transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous Step</span>
            </button>
          ) : <div />}

          <button
            type="button"
            onClick={nextStep}
            className="flex items-center gap-2 px-7 py-3.5 rounded-xl font-extrabold text-sm active:scale-[0.98] transition-all bg-emerald-500 hover:bg-emerald-400 text-white shadow-[0_4px_20px_rgba(16,185,129,0.4)] border border-emerald-400/30 cursor-pointer"
          >
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

