import React, { createContext, useContext, useState, useEffect } from "react";
import { MockApi } from "@/lib/api";
import { supabase } from "@/lib/supabase";

export type UserRole = "player" | "owner";

export type VerificationStatus = "unverified" | "pending" | "verified" | "rejected";

export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: UserRole;
  verificationStatus: VerificationStatus;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userData: Omit<User, "id" | "verificationStatus">) => Promise<void>;
  logout: () => Promise<void>;
  submitVerification: () => void;
  verifyAccount: () => void; // Admin/Dev override
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  useEffect(() => {
    async function initSession() {
      // 1. Check for real Supabase Session (OAuth bridge)
      const { data: { session } } = await supabase.auth.getSession();

      if (session && session.user) {
        const email = session.user.email;
        const name = session.user.user_metadata?.full_name || email?.split('@')[0] || "Player";

        const intent = localStorage.getItem("picklers_oauth_intent");
        if (intent === "signup") {
          const createdAt = new Date(session.user.created_at).getTime();
          // If created more than 60 seconds ago, it's an existing account
          if (Date.now() - createdAt > 60000) {
            showToast("This account is already connected to an existing account");
          }
        }
        localStorage.removeItem("picklers_oauth_intent");

        let assignedRole: UserRole = "player";
        if (session.user.user_metadata?.role === "owner") {
          assignedRole = "owner";
          console.warn("🔐 SECURE AUDIT: Owner role granted via client-side metadata. Ensure RLS is active on backend.");
        }

        // Inject into MockApi so the MVP dashboard continues to work
        const response = await MockApi.login({
          name: name,
          email: email,
          role: assignedRole
        });

        setUser(response.user);
        localStorage.setItem("picklers_session_token", response.session.token);
        setIsLoading(false);
        return;
      }

      // 2. Fallback to existing MVP logic
      const token = localStorage.getItem("picklers_session_token");
      if (token) {
        const validUser = await MockApi.verifySession(token);
        if (validUser) {
          setUser(validUser);
        } else {
          localStorage.removeItem("picklers_session_token");
          localStorage.removeItem("picklers_session_data");
        }
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
        localStorage.removeItem("picklers_session_token");
        localStorage.removeItem("picklers_session_data");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (userData: Omit<User, "id" | "verificationStatus">) => {
    const response = await MockApi.login({
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      role: userData.role
    });

    setUser(response.user);
    localStorage.setItem("picklers_session_token", response.session.token);
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem("picklers_session_token");
    localStorage.removeItem("picklers_session_data");
    await supabase.auth.signOut();
  };

  // Keep these strictly as UI state overrides for the prototype
  const submitVerification = () => {
    if (user) {
      const pendingUser = { ...user, verificationStatus: "pending" as VerificationStatus };
      setUser(pendingUser);
    }
  };

  const verifyAccount = () => {
    if (user) {
      const verifiedUser = { ...user, verificationStatus: "verified" as VerificationStatus };
      setUser(verifiedUser);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, submitVerification, verifyAccount }}>
      {children}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] animate-in slide-in-from-top-6 fade-in duration-300">
          <div className={`flex items-center gap-2.5 px-5 py-3.5 rounded-xl border shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-2xl ${toast.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 dark:text-emerald-400'
              : 'bg-red-500/10 border-red-500/20 text-red-500 dark:text-red-400'
            }`}>
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            <span className="text-[14px] font-semibold tracking-tight">{toast.message}</span>
          </div>
        </div>
      )}
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
