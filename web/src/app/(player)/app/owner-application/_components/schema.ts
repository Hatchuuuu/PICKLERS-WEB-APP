import { z } from "zod";

/**
 * Minimal user shape needed to seed the form's default values. The
 * auth context's User type is broader and lives in @/contexts/AuthContext;
 * using a local alias here avoids pulling the auth context into the
 * form-schema module just for type access.
 */
type UserSeed = {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
};

/**
 * Owner application form schema.
 *
 * F-203a: extracted from the page so the form contract can be imported
 * and tested without dragging in the 600+ LOC page bundle. The
 * `defaultValuesForUser` helper builds the form's default state from
 * the currently signed-in player, falling back to blank values when no
 * user is available (demo mode, anon visit, etc.).
 */
export const applicationSchema = z.object({
  facilityName: z.string().min(2, "Facility name is required"),
  address: z.string().min(5, "Complete address is required"),
  courtsCount: z.any().transform(Number).refine((n) => n >= 1, "Must have at least 1 court"),
  surfaceType: z.string().min(1, "Surface type is required"),
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(7, "Valid phone number is required"),
});

export type ApplicationForm = z.infer<typeof applicationSchema>;

/** Fields validated at each step boundary. The submit step skips per-field
 *  validation and relies on the full schema resolver at confirm time. */
export const STEP_FIELDS: Record<1 | 2, ReadonlyArray<keyof ApplicationForm>> = {
  1: ["facilityName", "address", "courtsCount"],
  2: ["firstName", "lastName", "email", "phone"],
};

/** Allowed file types + size cap for uploaded verification documents. */
export const ALLOWED_DOC_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
export const MAX_DOC_BYTES = 10 * 1024 * 1024; // 10 MB

export function defaultValuesForUser(user?: UserSeed | null): ApplicationForm {
  const splitName = user?.name?.trim().split(/\s+/) ?? [];
  return {
    facilityName: "",
    address: "",
    courtsCount: 1,
    surfaceType: "Hard Court (Acrylic) - Indoor",
    firstName: splitName[0] ?? "",
    lastName: splitName.slice(1).join(" "),
    email: user?.email ?? "",
    phone: user?.phone ?? "",
  };
}
