import { create } from "zustand";
import { supabase } from "@/lib/supabase";

export type UserRole = "player" | "owner" | "demo" | "admin";
export type VerificationStatus = "unverified" | "pending" | "verified" | "rejected";

interface UserState {
  role: UserRole | null;
  verificationStatus: VerificationStatus | null;
  isAdmin: boolean;
  adminRole: string | null;
  adminPermissions: string[];
  adminMode: boolean;
  isLoading: boolean;
  fetchUserStatus: () => Promise<void>;
  toggleAdminMode: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  role: null,
  verificationStatus: null,
  isAdmin: false,
  adminRole: null,
  adminPermissions: [],
  adminMode: false,
  isLoading: true,

  toggleAdminMode: () => set((state) => ({ adminMode: !state.adminMode })),

  fetchUserStatus: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        set({
          role: null,
          verificationStatus: null,
          isAdmin: false,
          adminRole: null,
          adminPermissions: [],
          isLoading: false
        });
        return;
      }

      let profile: any = null;
      const { data, error } = await supabase
        .from("player_profiles")
        .select("role, verification_status, is_demo, is_admin, admin_role, admin_permissions")
        .eq("id", session.user.id)
        .maybeSingle();

      if (error) {
        // Fallback: If new admin columns don't exist in DB yet, query standard profile columns
        const { data: fallbackData } = await supabase
          .from("player_profiles")
          .select("role, verification_status, is_demo")
          .eq("id", session.user.id)
          .maybeSingle();
        
        profile = fallbackData;
      } else {
        profile = data;
      }

      if (!profile) {
        set({
          role: null,
          verificationStatus: null,
          isAdmin: false,
          adminRole: null,
          adminPermissions: [],
          isLoading: false
        });
        return;
      }

      const email = session.user.email ?? "";
      const isDemoUser = Boolean(profile.is_demo) || profile.role === "demo" || email.includes("demo");
      const isAdminUser = Boolean(profile.is_admin);
      const isOwner = profile.role === "owner";

      const assignedRole: UserRole = isAdminUser ? "admin" : isOwner ? "owner" : isDemoUser ? "demo" : (profile.role as UserRole || "player");
      const assignedStatus: VerificationStatus = (isAdminUser || isOwner || isDemoUser) ? "verified" : (profile.verification_status as VerificationStatus || "unverified");

      set({
        role: assignedRole,
        verificationStatus: assignedStatus,
        isAdmin: isAdminUser,
        adminRole: profile.admin_role ?? null,
        adminPermissions: profile.admin_permissions ?? [],
        isLoading: false,
      });
    } catch (err) {
      console.error("Unexpected error in fetchUserStatus:", err);
      set({ isLoading: false });
    }
  },
}));
