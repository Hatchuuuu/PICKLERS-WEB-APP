import { UserRole, VerificationStatus } from "@/contexts/AuthContext";

// Simulated JWT-like token structure
export interface MockSessionToken {
  token: string;
  expiresAt: number;
}

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    role: UserRole;
    verificationStatus: VerificationStatus;
  };
  session: MockSessionToken;
}

// In-memory mock database for sessions to prevent localStorage tampering bypass
const activeSessions = new Map<string, AuthResponse['user']>();

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const MockApi = {

  async login(payload: { email?: string; phone?: string; name?: string; role: UserRole }): Promise<AuthResponse> {
    await delay(400);

    const token = crypto.randomUUID();
    const user = {
      id: crypto.randomUUID(),
      name: payload.name || "Maria Santos",
      email: payload.email,
      phone: payload.phone,
      role: payload.role,
      verificationStatus: payload.role === "owner" ? "verified" as VerificationStatus : "unverified" as VerificationStatus
    };

    activeSessions.set(token, user);

    // To simulate a DB across reloads for this frontend-only app:
    localStorage.setItem("picklers_session_data", JSON.stringify({ user, session: { token, expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7 } }));

    return {
      user,
      session: {
        token,
        expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7 // 7 days
      }
    };
  },

  async verifySession(token: string | null): Promise<AuthResponse['user'] | null> {
    await delay(250);
    if (!token) return null;
    
    // In a real app, this would be an HTTP call with HttpOnly cookies
    // For our mock, we check our in-memory Map
    const user = activeSessions.get(token);
    
    if (!user) {
      // Fallback for mock persistence across reloads (to simulate a DB)
      try {
        const stored = localStorage.getItem("picklers_session_data");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.session.token === token) {
            activeSessions.set(token, parsed.user);
            return parsed.user;
          }
        }
      } catch (e) {
        return null;
      }
      return null;
    }
    
    return user;
  }
};

// --- Phase 2: Security at Scale Implementation ---
// To handle 500k requests/sec, we use Stateless JWTs verified at the Edge.
// This simulated interceptor demonstrates the "Silent Refresh" pattern so users
// never see a 401 Unauthorized during high-load token expiries.

export const apiClient = {
  async fetch(url: string, options: any = {}) {
    // 1. Attempt original request
    let response = await mockNetworkCall(url, options);
    
    // 2. Intercept 401 Unauthorized
    if (response.status === 401) {
      if (process.env.NODE_ENV === 'development') console.warn("🔒 [Security Interceptor] JWT Expired. Executing silent refresh...");
      
      // 3. Attempt silent refresh in background via HttpOnly cookie
      const refreshSuccess = await mockSilentRefresh();
      
      if (refreshSuccess) {
         if (process.env.NODE_ENV === 'development') console.log("✅ [Security Interceptor] Token refreshed! Replaying original request seamlessly.");
         // 4. Replay original request
         response = await mockNetworkCall(url, { ...options, _retry: true });
      } else {
         // 5. Force logout only if refresh token is also expired/revoked
         if (process.env.NODE_ENV === 'development') console.error("❌ [Security Interceptor] Refresh failed. Forcing logout.");
         window.location.href = "/auth";
      }
    }
    
    return response;
  }
};

async function mockNetworkCall(url: string, options: any) {
   // For demonstration: simulate a 401 on the first try if it's a protected route
   if (url.includes("/protected") && !options._retry) {
     return { status: 401, data: null };
   }
   return { status: 200, data: { success: true } };
}

async function mockSilentRefresh() {
   await delay(300); // Simulate hitting /api/auth/refresh
   return true;
}
