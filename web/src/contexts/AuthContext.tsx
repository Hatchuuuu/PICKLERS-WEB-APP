"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";

import { supabase } from "@/lib/supabase";
import { useToast } from "./ToastContext";

import { checkIsPrivilegedEmail } from "@/types/permissions";

export type UserRole = "player" | "owner" | "demo" | "admin" | "dev";

export type VerificationStatus = "unverified" | "pending" | "verified" | "rejected";

export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  role: UserRole;
  isAdmin?: boolean;
  adminRole?: string;
  admin_role?: string;
  devRole?: string;
  dev_role?: string;
  console_access?: string[];
  isDemo?: boolean;
  verificationStatus: VerificationStatus;
  facilitySetupComplete?: boolean;
  notifications?: {
    booking: boolean;
    matches: boolean;
    community: boolean;
    chat?: boolean;
  };
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
  submitVerification: () => void;
  verifyAccount: () => void; // Admin/Dev override
  updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();
  const isInitializingRef = useRef(false);

  const destroySession = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("picklers_oauth_intent");
      sessionStorage.removeItem("picklers_session");
    }
  };

  useEffect(() => {
    async function initSession() {
      if (isInitializingRef.current) return;
      isInitializingRef.current = true;
      const hasOAuthHash = typeof window !== "undefined" && window.location.hash.includes("access_token=");
      
      setIsLoading(true);
      try {
        const { data: { user: authUser }, error: authErr } = await supabase.auth.getUser();

        if (authUser && !authErr) {
          const email = authUser.email;
          const name = authUser.user_metadata?.full_name || email?.split('@')[0] || "Player";

          const intent = sessionStorage.getItem("picklers_oauth_intent");
          if (intent === "signup") {
            const createdAt = new Date(authUser.created_at).getTime();
            if (Date.now() - createdAt > 60000) {
              showToast("This account is already connected to an existing account");
            }
          }
          sessionStorage.removeItem("picklers_oauth_intent");

          let assignedRole: UserRole = "player";
          let dbVerificationStatus: VerificationStatus = "unverified";
          let profile: any = null;
          const { data: mainProfile, error: profileErr } = await supabase
            .from('player_profiles')
            .select('role, verification_status, avatar_url, is_demo, facility_setup_complete, is_admin, admin_role, dev_role, console_access')
            .eq('id', authUser.id)
            .maybeSingle();

          if (profileErr) {
            const { data: fallbackProfile } = await supabase
              .from('player_profiles')
              .select('role, verification_status, avatar_url, is_demo, facility_setup_complete')
              .eq('id', authUser.id)
              .maybeSingle();
            profile = fallbackProfile;
          } else {
            profile = mainProfile;
          }

          const consoleAccess: string[] = Array.isArray(profile?.console_access) && profile.console_access.length > 0
            ? profile.console_access
            : [];

          const isPrivilegedEmail = checkIsPrivilegedEmail(email);

          const isDemoUser = Boolean(profile?.is_demo) || profile?.role === 'demo';
          const isDevUser = isPrivilegedEmail || profile?.role === 'dev' || Boolean(profile?.dev_role) || consoleAccess.includes('dev');
          const isAdminUser = isPrivilegedEmail || Boolean(profile?.is_admin) || profile?.role === 'admin' || Boolean(profile?.admin_role) || isDevUser || consoleAccess.includes('admin');

          if (isDevUser)                      assignedRole = "dev";
          else if (isAdminUser)               assignedRole = "admin";
          else if (profile?.role === 'owner') assignedRole = "owner";
          else if (isDemoUser)                assignedRole = "demo";

          if (profile?.verification_status) {
            dbVerificationStatus = profile.verification_status as VerificationStatus;
          }

          const effectiveConsoleAccess = consoleAccess.length > 0
            ? consoleAccess
            : (isAdminUser || isDevUser ? ['player', 'admin', 'dev'] : ['player']);

          const userObj: User = {
            id: authUser.id,
            name: name,
            email: email,
            phone: authUser.phone,
            avatarUrl: profile?.avatar_url || authUser.user_metadata?.avatar_url || undefined,
            role: assignedRole,
            isAdmin: isAdminUser,
            adminRole: profile?.admin_role ?? undefined,
            admin_role: profile?.admin_role ?? undefined,
            devRole: profile?.dev_role ?? undefined,
            dev_role: profile?.dev_role ?? undefined,
            console_access: effectiveConsoleAccess,
            isDemo: isDemoUser,
            facilitySetupComplete: profile?.facility_setup_complete ?? false,
            verificationStatus: ((assignedRole === "owner" || assignedRole === "admin" || assignedRole === "dev" || assignedRole === "demo" || isDemoUser || isDevUser || isAdminUser || isPrivilegedEmail)
              ? "verified"
              : dbVerificationStatus) as VerificationStatus
          };

          setUser(userObj);
          setIsLoading(false);
          isInitializingRef.current = false;
          return;
        }

      } catch (err) {
        console.warn("Supabase auth session check offline fallback:", err);
      } finally {
        isInitializingRef.current = false;
      }

      if (hasOAuthHash) {
        return; 
      }

      setIsLoading(false);
    }
    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
        initSession();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        destroySession();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  
  const logout = async () => {
    setUser(null);
    destroySession();
    await supabase.auth.signOut();
  };

  // Keep these strictly as UI state overrides for the prototype
  const submitVerification = async () => {
    if (user) {
      const pendingUser = { ...user, verificationStatus: "pending" as VerificationStatus };
      setUser(pendingUser);
      await supabase.from('player_profiles').update({ verification_status: 'pending' }).eq('id', user.id);
    }
  };

  const verifyAccount = async () => {
    if (user && checkIsPrivilegedEmail(user.email)) {
      const verifiedUser = { ...user, verificationStatus: "verified" as VerificationStatus };
      setUser(verifiedUser);
    }
  };

  const updateUser = async (data: Partial<User>) => {
    if (user) {
      // NOTE: `role`, `id`, and `verificationStatus` are intentionally stripped from client-side updateUser 
      // to prevent role-escalation security vulnerabilities. Roles are server-managed.
      const { role, id, verificationStatus, ...safeData } = data;
      const updatedUser = { ...user, ...safeData };
      setUser(updatedUser);
      
      const dbUpdates: Record<string, unknown> = {};
      if (safeData.name !== undefined) dbUpdates.name = safeData.name;
      if (safeData.avatarUrl !== undefined) dbUpdates.avatar_url = safeData.avatarUrl;
      if (safeData.facilitySetupComplete !== undefined) dbUpdates.facility_setup_complete = safeData.facilitySetupComplete;
      
      if (Object.keys(dbUpdates).length > 0) {
        const { error } = await supabase.from('player_profiles').update(dbUpdates).eq('id', user.id);
        if (error) {
          console.error("Failed to update user profile in Supabase:", error);
          showToast(`Error updating profile: ${error.message}`, "error");
        }
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, logout, submitVerification, verifyAccount, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
