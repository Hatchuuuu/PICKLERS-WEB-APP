"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { ChevronRight, AlertCircle, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";

import {
  applicationSchema,
  defaultValuesForUser,
  STEP_FIELDS,
  ALLOWED_DOC_TYPES,
  MAX_DOC_BYTES,
  type ApplicationForm,
} from "./_components/schema";
import { StepProgressPills } from "./_components/StepProgressPills";
import { Step1FacilityDetails } from "./_components/Step1FacilityDetails";
import { Step2ContactInfo } from "./_components/Step2ContactInfo";
import { Step3Verification } from "./_components/Step3Verification";
import { SubmitConfirmModal } from "./_components/SubmitConfirmModal";
import { SubmittedView } from "./_components/SubmittedView";

/**
 * OwnerApplication page (F-203: split from a 628-LOC monolith into
 * seven focused modules). The page itself is now a thin orchestrator:
 *
 *   1. Owns the form state (react-hook-form) and the step counter
 *   2. Owns the geolocation, file-validation, upload, and submit logic
 *   3. Delegates presentation to the extracted step / modal components
 *
 * Visual changes from the refactor:
 *   - The step progress pills are now a keyboard-navigable tablist
 *     (`role="tab"`, `aria-selected`, `aria-current="step"`, Enter/Space)
 *   - Every form field has a proper `<label htmlFor>` association
 *   - Every form error has `role="alert"` for screen-reader announcement
 *   - The submit modal is `role="dialog"` + `aria-modal` + labelled
 *   - Document dropzones are keyboard-activatable buttons
 */
export default function OwnerApplication() {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitted, setSubmitted] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Document upload refs + state
  const permitInputRef = useRef<HTMLInputElement>(null);
  const idInputRef = useRef<HTMLInputElement>(null);
  const [permitFileName, setPermitFileName] = useState<string | null>(null);
  const [idFileName, setIdFileName] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<ApplicationForm>({
    resolver: zodResolver(applicationSchema),
    defaultValues: defaultValuesForUser(user),
  });

  // ----- Handlers ----------------------------------------------------

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
                address =
                  data.display_name ||
                  [
                    data.address?.road,
                    data.address?.suburb,
                    data.address?.city || data.address?.town,
                    data.address?.country,
                  ]
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
    const fields = step < 3 ? STEP_FIELDS[step as 1 | 2] : null;
    const isValid = fields ? await trigger(fields as never) : true;

    if (!isValid) return;

    if (step < 3) {
      setStep((s) => (s + 1) as 1 | 2 | 3);
    } else {
      setShowSubmitConfirm(true);
    }
  };

  const validateFile = (file: File): boolean => {
    if (!ALLOWED_DOC_TYPES.includes(file.type as (typeof ALLOWED_DOC_TYPES)[number])) {
      showToast("Only PDF, JPG, PNG, or WEBP files are allowed.", "error");
      return false;
    }
    if (file.size > MAX_DOC_BYTES) {
      showToast("File size must be less than 10MB.", "error");
      return false;
    }
    return true;
  };

  const handlePermitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!validateFile(file)) {
      e.target.value = "";
      setPermitFileName(null);
      return;
    }
    setPermitFileName(file.name);
    showToast(`Attached Business Permit: ${file.name}`, "success");
  };

  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!validateFile(file)) {
      e.target.value = "";
      setIdFileName(null);
      return;
    }
    setIdFileName(file.name);
    showToast(`Attached Proof of ID: ${file.name}`, "success");
  };

  const uploadFileToStorage = async (
    file: File | undefined,
    folder: string
  ): Promise<string | null> => {
    if (!file) return null;
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${folder}/${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 7)}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from("facility-documents")
        .upload(fileName, file, { cacheControl: "3600", upsert: true });

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
        .from("facility-documents")
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
      const permitFile = permitInputRef.current?.files?.[0];
      const idFile = idInputRef.current?.files?.[0];

      const permitUrl = await uploadFileToStorage(permitFile, "permits");
      const idUrl = await uploadFileToStorage(idFile, "identities");

      const { error } = await supabase.from("owner_applications").insert({
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
        status: "pending",
      });

      if (error && !user?.isDemo) {
        console.error("Supabase insert error:", error);
        showToast(error.message || "Failed to save application.", "error");
        return;
      }

      // Notify the user that their application was received.
      try {
        await fetch("/api/email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: data.email,
            subject: "Picklers Partner Application Received",
            body: `Hi ${data.firstName},\n\nThank you for applying to list ${data.facilityName} on Picklers! Our team has received your application and verification documents.\n\nWe will review your application within 24-48 hours and notify you once your Owner Dashboard is ready.\n\nBest regards,\nThe Picklers Team`,
          }),
        });
      } catch (emailErr) {
        console.warn("Email notification error:", emailErr);
      }

      setShowSubmitConfirm(false);
      setSubmitted(true);
      showToast("Application submitted successfully!", "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not submit application";
      console.error(err);
      showToast(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ----- Views -------------------------------------------------------

  if (submitted) {
    return (
      <SubmittedView
        email={getValues("email")}
        onReturn={() => router.push("/app")}
      />
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto pb-24">
      {/* Hidden file inputs (driven by the dropzones in Step 3) */}
      <input
        ref={permitInputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.webp"
        className="hidden"
        onChange={handlePermitChange}
        aria-hidden="true"
      />
      <input
        ref={idInputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.webp"
        className="hidden"
        onChange={handleIdChange}
        aria-hidden="true"
      />

      <button
        onClick={() => router.back()}
        className="group flex items-center justify-center w-11 h-11 rounded-full mb-8 transition-all active:scale-95 shadow-md bg-surface-interactive border-border text-muted-foreground hover:bg-black/5 hover:text-foreground dark:bg-white/[0.05] dark:border-white/10 dark:text-white/60 dark:hover:bg-white/[0.1] dark:hover:text-white"
        aria-label="Go Back"
      >
        <ChevronRight className="w-6 h-6 rotate-180 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold mb-2 text-foreground tracking-tight">
          Partner with Picklers
        </h1>
        <p className="text-ink-secondary font-medium text-sm sm:text-base">
          Apply for an Owner Dashboard to list your courts, manage bookings, and grow your facility.
        </p>
      </div>

      <StepProgressPills current={step} onJumpTo={setStep} />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col"
      >
        {step === 1 && (
          <Step1FacilityDetails
            register={register}
            errors={errors}
            onDetectLocation={handleDetectLocation}
            isLocating={isLocating}
          />
        )}
        {step === 2 && <Step2ContactInfo register={register} errors={errors} />}
        {step === 3 && (
          <Step3Verification
            permitInputRef={permitInputRef}
            idInputRef={idInputRef}
            permitFileName={permitFileName}
            idFileName={idFileName}
          />
        )}

        {/*
          Top-level form errors from the zod resolver that aren't bound to
          a specific field (e.g. a transform failure) would be silently
          swallowed otherwise. Surface them.
        */}
        {errors.root && (
          <div
            className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2"
            role="alert"
          >
            <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{errors.root.message}</span>
          </div>
        )}

        <div className="flex items-center justify-between mt-10 pt-6 border-t border-border">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
              className="flex items-center gap-1.5 px-5 py-3 rounded-xl border border-border text-ink-secondary hover:text-foreground bg-surface-interactive hover:bg-surface-raised font-bold text-sm transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              <ChevronRight className="w-4 h-4 rotate-180" aria-hidden="true" />
              <span>Previous Step</span>
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={nextStep}
            className="flex items-center gap-2 px-7 py-3.5 rounded-xl font-extrabold text-sm active:scale-[0.98] transition-all bg-emerald-500 hover:bg-emerald-400 text-white shadow-[0_4px_20px_rgba(16,185,129,0.4)] border border-emerald-400/30 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span>Submitting...</span>
              </>
            ) : step < 3 ? (
              "Next Step"
            ) : (
              "Submit Application"
            )}
          </button>
        </div>
      </motion.div>

      <SubmitConfirmModal
        open={showSubmitConfirm}
        isSubmitting={isSubmitting}
        onConfirm={handleSubmit(onSubmit)}
        onClose={() => setShowSubmitConfirm(false)}
      />
    </div>
  );
}
