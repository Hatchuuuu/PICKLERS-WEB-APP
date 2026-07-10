import React, { createContext, useContext, useState, useEffect } from "react";
import { MockApi } from "@/lib/api";

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
  logout: () => void;
  submitVerification: () => void;
  verifyAccount: () => void; // Admin/Dev override
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function initSession() {
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

  const logout = () => {
    setUser(null);
    localStorage.removeItem("picklers_session_token");
    localStorage.removeItem("picklers_session_data");
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
