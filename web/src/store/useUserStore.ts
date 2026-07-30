import { create } from "zustand";
import { supabase } from "@/lib/supabase";

export type UserRole = "player" | "owner" | "demo";
export type VerificationStatus = "unverified" | "pending" | "verified" | "rejected";

interface UserState {
  role: UserRole | null;
  verificationStatus: VerificationStatus | null;
  isLoading: boolean;
  fetchUserStatus: () => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
  role: null,
  verificationStatus: null,
  isLoading: true,

  fetchUserStatus: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        set({ role: null, verificationStatus: null, isLoading: false });
        return;
      }

      const { data: profile, error } = await supabase
        .from("player_profiles")
        .select("role, verification_status")
        .eq("id", session.user.id)
        .single();

      if (error) {
        // If the profile is not found (e.g. database was wiped but local JWT is still valid)
        if (error.code === 'PGRST116') {
          set({ role: null, verificationStatus: null, isLoading: false });
          // Optionally sign out if the profile is fundamentally missing
          await supabase.auth.signOut();
          return;
        }
        
        console.error("Error fetching user status:", error);
        set({ isLoading: false });
        return;
      }

      set({
        role: profile.role as UserRole,
        verificationStatus: profile.verification_status as VerificationStatus,
        isLoading: false,
      });
    } catch (err) {
      console.error("Unexpected error in fetchUserStatus:", err);
      set({ isLoading: false });
    }
  },
}));
