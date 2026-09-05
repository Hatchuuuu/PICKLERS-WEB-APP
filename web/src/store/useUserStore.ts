import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { checkIsPrivilegedEmail } from "@/types/permissions";

export type UserRole = "player" | "owner" | "demo" | "admin" | "dev";
export type VerificationStatus = "unverified" | "pending" | "verified" | "rejected";

interface UserState {
  role: UserRole | null;
  verificationStatus: VerificationStatus | null;
  isAdmin: boolean;
  isDev: boolean;
  consoleAccess: string[];
  accountStatus: string;
  adminRole: string | null;
  devRole: string | null;
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
  isDev: false,
  consoleAccess: ['player'],
  accountStatus: 'active',
  adminRole: null,
  devRole: null,
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
          isDev: false,
          consoleAccess: ['player'],
          accountStatus: 'active',
          adminRole: null,
          devRole: null,
          adminPermissions: [],
          isLoading: false
        });
        return;
      }

      let profile: any = null;
      const { data, error } = await supabase
        .from("player_profiles")
        .select("role, verification_status, is_demo, is_admin, admin_role, dev_role, admin_permissions, console_access, account_status")
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
          isDev: false,
          consoleAccess: ['player'],
          accountStatus: 'active',
          adminRole: null,
          devRole: null,
          adminPermissions: [],
          isLoading: false
        });
        return;
      }

      const email = (session.user.email ?? "").toLowerCase();
      const isPrivilegedEmail = checkIsPrivilegedEmail(email);

      const isDemoUser = Boolean(profile.is_demo) || profile.role === "demo";
      const isDevUser = isPrivilegedEmail || (Array.isArray(profile.console_access) && profile.console_access.includes("dev")) || profile.role === "dev" || Boolean(profile.dev_role);
      const isAdminUser = isPrivilegedEmail || (Array.isArray(profile.console_access) && profile.console_access.includes("admin")) || Boolean(profile.is_admin) || profile.role === "admin" || isDevUser || Boolean(profile.admin_role);
      const isOwner = profile.role === "owner";

      const consoleAccess: string[] = (Array.isArray(profile.console_access) && profile.console_access.length > 0)
        ? profile.console_access
        : (isAdminUser || isDevUser ? ['player', 'admin', 'dev'] : ['player']);

      const assignedRole: UserRole = isDevUser ? "dev" : isAdminUser ? "admin" : isOwner ? "owner" : isDemoUser ? "demo" : (profile.role as UserRole || "player");
      const assignedStatus: VerificationStatus = (isAdminUser || isOwner || isDemoUser || isDevUser) ? "verified" : (profile.verification_status as VerificationStatus || "unverified");

      set({
        role: assignedRole,
        verificationStatus: assignedStatus,
        isAdmin: isAdminUser,
        isDev: isDevUser,
        consoleAccess,
        accountStatus: profile.account_status ?? 'active',
        adminRole: profile.admin_role ?? null,
        devRole: profile.dev_role ?? null,
        adminPermissions: profile.admin_permissions ?? [],
        isLoading: false,
      });
    } catch (err) {
      console.error("Unexpected error in fetchUserStatus:", err);
      set({ isLoading: false });
    }
  },
}));
