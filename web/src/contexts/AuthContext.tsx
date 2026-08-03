"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

import { supabase } from "@/lib/supabase";
import { useToast } from "./ToastContext";

export type UserRole = "player" | "owner" | "demo";

export type VerificationStatus = "unverified" | "pending" | "verified" | "rejected";

export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  role: UserRole;
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
  login: (userData: Omit<User, "id" | "verificationStatus">) => Promise<void>;
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



  const destroySession = () => {
    // We removed local storage token
    // We removed local storage data
  };

  useEffect(() => {
    async function initSession() {
      // Capture hash synchronously before any awaits, in case the URL changes (e.g. AuthCallbackPage redirects)
      const hasOAuthHash = typeof window !== "undefined" && window.location.hash.includes("access_token=");
      
      setIsLoading(true); // FIX: Ensure loading state is active while processing session changes
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session && session.user) {
          const email = session.user.email;
          const name = session.user.user_metadata?.full_name || email?.split('@')[0] || "Player";

          const intent = sessionStorage.getItem("picklers_oauth_intent");
          if (intent === "signup") {
            const createdAt = new Date(session.user.created_at).getTime();
            if (Date.now() - createdAt > 60000) {
              showToast("This account is already connected to an existing account");
            }
          }
          sessionStorage.removeItem("picklers_oauth_intent");

          let assignedRole: UserRole = "player";
          let dbVerificationStatus: VerificationStatus = "unverified";
          const { data: profile } = await supabase
            .from('player_profiles')
            .select('role, verification_status, avatar_url, is_demo, facility_setup_complete')
            .eq('id', session.user.id)
            .single();

          if (profile?.role === 'owner')      assignedRole = "owner";
          else if (profile?.role === 'demo')  assignedRole = "demo";

          if (profile?.verification_status) {
            dbVerificationStatus = profile.verification_status as VerificationStatus;
          }

          const userObj: User = {
            id: session.user.id,
            name: name,
            email: email,
            phone: session.user.phone,
            avatarUrl: profile?.avatar_url || session.user.user_metadata?.avatar_url || undefined,
            role: assignedRole,
            isDemo: profile?.is_demo ?? false,
            facilitySetupComplete: profile?.facility_setup_complete ?? false,
            verificationStatus: ((assignedRole === "owner" || assignedRole === "demo")
              ? "verified"
              : dbVerificationStatus) as VerificationStatus
          };

          setUser(userObj);
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.warn("Supabase auth session check offline fallback:", err);
      }

      // 3. Do not stop loading if we started processing with an OAuth redirect hash
      if (hasOAuthHash) {
        // OAuth hash detected on mount, keeping AuthContext in loading state until session is processed...
        return; 
      }

      setIsLoading(false);
    }
    initSession();

    // Listen for future OAuth redirects dynamically
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

  const login = async (userData: Omit<User, "id" | "verificationStatus">) => {
    // In the real flow, the login function in AuthContext is bypassed because useAuthForm
    // talks directly to supabase.auth.signInWithPassword. But for compatibility:
    const userObj: User = {
      id: "pending-auth",
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      role: userData.role,
      verificationStatus: "unverified"
    };
    setUser(userObj);
  };

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
    if (user) {
      const verifiedUser = { ...user, verificationStatus: "verified" as VerificationStatus };
      setUser(verifiedUser);
      await supabase.from('player_profiles').update({ verification_status: 'verified' }).eq('id', user.id);
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
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, submitVerification, verifyAccount, updateUser }}>
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
