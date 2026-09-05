import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from "@/lib/supabase";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/AuthContext";
import { useUserStore } from "@/store/useUserStore";
import { useReducedMotion } from "./useReducedMotion";

export const authSchema = z.object({
  view: z.enum(["auth", "forgot-password", "verify-code", "verify-phone", "reset-password"]),
  tab: z.enum(["signin", "signup"]),
  authMethod: z.enum(["email", "phone"]),
  name: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.view === "auth" || data.view === "forgot-password") {
    if (data.authMethod === "email") {
      const parsed = z.string().trim().email("Please enter a valid email address.").safeParse(data.email);
      if (!parsed.success) ctx.addIssue({ code: z.ZodIssueCode.custom, message: parsed.error.issues[0].message, path: ["email"] });
    } else {
      const parsed = z.string().regex(/^\d{10}$/, "Please enter a valid 10-digit mobile number.").safeParse(data.phone);
      if (!parsed.success) ctx.addIssue({ code: z.ZodIssueCode.custom, message: parsed.error.issues[0].message, path: ["phone"] });
    }
  }
  if (data.view === "auth" && data.tab === "signup") {
    if (!data.name || data.name.trim().length === 0) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Full name is required.", path: ["name"] });
  }
  if (data.view === "auth" || data.view === "reset-password") {
    if (data.tab === "signup" || data.view === "reset-password") {
      if (!data.password || data.password.length < 6) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Password must be at least 6 characters.", path: ["password"] });
      }
      if (data.password !== data.confirmPassword) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Passwords do not match.", path: ["confirmPassword"] });
      }
    } else {
      if (!data.password || data.password.length === 0) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Password is required.", path: ["password"] });
    }
  }
});
export type AuthFormData = z.infer<typeof authSchema>;

export function useAuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const intent = searchParams.get("intent");
  const redirect = searchParams.get("redirect");
  const tabParam = searchParams.get("tab") || searchParams.get("mode");
  const isSignupTab = tabParam === "signup" || tabParam === "register" || intent === "signup";
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated && !isSignupTab) {
      const adminState = useUserStore.getState().isAdmin;
      router.replace(redirect || (adminState ? "/app/admin" : intent === "owner" ? "/app/owner" : "/app"));
    }
  }, [isAuthenticated, isAuthLoading, router, redirect, intent, isSignupTab]);

  const [loading, setLoading] = useState(false);
  
  const [authError, setAuthError] = useState(() => {
    const errorParam = searchParams.get("error");
    const errorDesc = searchParams.get("error_description");
    
    if (errorParam === "server_error" && errorDesc?.includes("Unable to exchange external code")) {
      return "Google Sign-In is currently disabled. The administrator needs to configure the Google OAuth credentials in Supabase.";
    } else if (errorParam === "OAuth_Timeout") {
      return "Sign in timed out. Please try again.";
    } else if (errorParam) {
      return errorDesc ? decodeURIComponent(errorDesc).replace(/\+/g, " ") : errorParam;
    }
    return "";
  });

  const [successMessage, setSuccessMessage] = useState("");
  const [isShaking, setIsShaking] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const [otpCode, setOtpCode] = useState<string>("");
  const [countdown, setCountdown] = useState(0);

  const mapSupabaseError = (message: string): string => {
    // Common Supabase auth error messages mapped to user-friendly messages
    // Also includes known good user messages to preserve them
    const errorMap: Record<string, string> = {
      // Supabase error mappings
      "Invalid login credentials": "We couldn't verify those credentials. Please try again or click 'Forgot Password' to reset your access.",
      "Email not confirmed": "Please check your email to confirm your account before signing in.",
      "User does not exist": "We couldn't find an account with that email. Please check your email address or sign up for a new account.",
      "Password should be at least 6 characters": "Password must be at least 6 characters long.",
      "Too many requests": "Too many attempts. Please wait a moment before trying again.",
      "Unable to exchange external code": "Google Sign-In is currently disabled. The administrator needs to configure the Google OAuth credentials in Supabase.",
      "OAuth provider not enabled": "This sign-in method is not currently available.",
      "Saltsum verification failed": "We couldn't verify your request. Please try again.",
      "Email invalid": "Please enter a valid email address.",
      "Phone number invalid": "Please enter a valid 10-digit mobile number.",
      "User already exists": "An account with this email already exists. Please sign in instead.",
      "Phone number already exists": "An account with this phone number already exists. Please sign in instead.",
      "Confirm new password": "Passwords do not match.",
      "Password reset token is invalid or has expired": "The password reset link has expired. Please request a new password reset link.",

      // Known good user messages to preserve (map to self)
      "Please enter the 6-digit code.": "Please enter the 6-digit code.",
      "Please check your email to confirm your account before signing in.": "Please check your email to confirm your account before signing in.",
      "We couldn't verify those credentials. Please try again or click 'Forgot Password' to reset your access.": "We couldn't verify those credentials. Please try again or click 'Forgot Password' to reset your access.",
      "Too many attempts. Please wait a moment.": "Too many attempts. Please wait a moment.",
      "Account created securely. Please check your email to verify your account before logging in.": "Account created securely. Please check your email to verify your account before logging in.",
      "Google Sign-In is currently disabled. The administrator needs to configure the Google OAuth credentials in Supabase.": "Google Sign-In is currently disabled. The administrator needs to configure the Google OAuth credentials in Supabase.",
      "Sign in timed out. Please try again.": "Sign in timed out. Please try again."
    };

    // Return mapped message if exists, otherwise return generic message for unknown errors
    return errorMap[message] || "An unexpected error occurred. Please try again.";
  };

  useEffect(() => {
    const stored = localStorage.getItem("picklers_otp_cooldown");
    if (stored) {
      const targetTime = parseInt(stored, 10);
      const remaining = Math.max(0, Math.ceil((targetTime - Date.now()) / 1000));
      if (remaining > 0) {
        setCountdown(remaining);
      } else {
        localStorage.removeItem("picklers_otp_cooldown");
      }
    }
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
        if (countdown - 1 <= 0) localStorage.removeItem("picklers_otp_cooldown");
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const form = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
    mode: "onChange",
    defaultValues: {
      view: "auth",
      tab: isSignupTab ? "signup" : "signin",
      authMethod: "email",
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    }
  });

  useEffect(() => {
    if (isSignupTab) {
      form.reset({
        view: "auth",
        tab: "signup",
        authMethod: "email",
        name: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
      });
    }
  }, [isSignupTab]);

  const view = form.watch("view");
  const tab = form.watch("tab");
  const authMethod = form.watch("authMethod");
  const formEmail = form.watch("email") || "";
  const formPhone = form.watch("phone") || "";
  const formPassword = form.watch("password") || "";

  const handleSuccessRedirect = () => {
    setTimeout(async () => {
      const userStore = useUserStore.getState();
      await userStore.fetchUserStatus();
      const currentState = useUserStore.getState();

      const isInternalRedirect = redirect && redirect.startsWith('/') && !redirect.startsWith('//') && redirect !== '/app';

      if (isInternalRedirect) {
        router.push(redirect);
      } else if (currentState.isDev) {
        // Direct developer routing (Case 3 & Case 4)
        router.push("/app/dev");
      } else if (currentState.isAdmin) {
        // Direct admin routing
        router.push("/app/admin");
      } else if (intent === "owner") {
        router.push("/app/owner");
      } else if (intent === "book") {
        router.push("/app");
      } else if (intent === "open-play") {
        router.push("/app/explore");
      } else {
        router.push("/app");
      }
    }, 600);
  };


  const shakeError = (msg: unknown) => {
    let errorMessage = typeof msg === "string" ? msg : "An unexpected error occurred.";
    if (errorMessage === "{}" || !errorMessage) errorMessage = "An unexpected error occurred. Please try again.";

    // Map Supabase errors to user-friendly messages
    const finalMessage = mapSupabaseError(errorMessage);

    setAuthError(finalMessage);
    // Only trigger shaking animation if user has not indicated a preference for reduced motion
    if (!prefersReducedMotion) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 400);
    }
  };

  const checkRateLimit = async () => {
    try {
      const res = await fetch('/api/auth/ratelimit', { method: 'POST' });
      if (res.status === 429) {
        const data = await res.json();
        setLoading(false);
        shakeError(data.error || "Too many attempts. Please wait a moment.");
        return false;
      }
      return true;
    } catch (e) {
      return true; // Fail open if API fails
    }
  };

  const handleSendCode = async (data: AuthFormData) => {
    setLoading(true);
    if (!(await checkRateLimit())) return;
    let error = null;

    if (data.authMethod === "email") {
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: data.email!.trim(),
        options: { shouldCreateUser: false }
      });
      error = signInError;
    } else {
      const { error: signInError } = await supabase.auth.signInWithOtp({
        phone: `+63${data.phone!.replace(/\D/g, '')}`,
        options: { shouldCreateUser: false }
      });
      error = signInError;
    }

    setLoading(false);
    if (error) return shakeError(error.message);

    const newTarget = Date.now() + 60000;
    localStorage.setItem("picklers_otp_cooldown", newTarget.toString());
    setCountdown(60);
    form.setValue("view", "verify-code");
  };

  const handleVerifyCode = async (token: string) => {
    if (token.length !== 6) return shakeError("Please enter the 6-digit code.");

    setLoading(true);
    if (!(await checkRateLimit())) return;
    let error = null;
    
    if (authMethod === "email") {
      const { error: verifyError } = await supabase.auth.verifyOtp({ email: formEmail.trim(), token, type: 'email' });
      error = verifyError;
    } else {
      const { error: verifyError } = await supabase.auth.verifyOtp({ phone: `+63${formPhone.replace(/\D/g, '')}`, token, type: 'sms' });
      error = verifyError;
    }

    setLoading(false);
    if (error) return shakeError(error.message);

    setAuthError("");
    setOtpCode("");
    
    if (view === "verify-phone") {
        setIsSuccess(true);
        handleSuccessRedirect();
    } else {
        form.setValue("view", "reset-password");
    }
  };

  const handleResetPassword = async (data: AuthFormData) => {
    setLoading(true);
    if (!(await checkRateLimit())) return;
    const { error } = await supabase.auth.updateUser({ password: data.password! });
    if (error) {
      setLoading(false);
      return shakeError(error.message);
    }
    setIsSuccess(true);
    setLoading(false);
    handleSuccessRedirect();
  };

  const handleMainSubmit = async (data: AuthFormData) => {
    setLoading(true);
    if (!(await checkRateLimit())) return;
    let error = null;
    let responseData = null;

    if (data.tab === "signup") {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp(
        data.authMethod === "email" ? {
          email: data.email!.trim(),
          password: data.password!,
          options: { 
              data: { full_name: data.name!, role: intent === "owner" ? "owner" : "player" },
              emailRedirectTo: `${window.location.origin}/auth/callback?next=/app`
          }
        } : {
          phone: `+63${data.phone!.replace(/\D/g, '')}`,
          password: data.password!,
          options: { data: { full_name: data.name!, role: intent === "owner" ? "owner" : "player" } }
        }
      );
      error = signUpError;
      responseData = signUpData;

      if (!error && responseData && !responseData.session) {
        setLoading(false);
        if (data.authMethod === "email") {
            setSuccessMessage("Account created securely. Please check your email to verify your account before logging in.");
            form.setValue("tab", "signin");
        } else {
            form.setValue("view", "verify-phone");
            const newTarget = Date.now() + 60000;
            localStorage.setItem("picklers_otp_cooldown", newTarget.toString());
            setCountdown(60);
        }
        form.clearErrors();
        return;
      }
    } else {
        setLoading(true);
        if (!(await checkRateLimit())) return;
        let error = null;
        let responseData = null;

        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword(
          data.authMethod === "email"
            ? { email: data.email!.trim(), password: data.password! }
            : { phone: `+63${data.phone!.replace(/\D/g, '')}`, password: data.password! }
        );
        error = signInError;
        responseData = signInData;

        if (!error && responseData && data.authMethod === "email") {
            // Check email confirmation for email sign-in
            const { data: userData, error: userError } = await supabase.auth.getUser();
            if (userError) {
                error = userError;
            } else if (!userData.user?.email_confirmed_at) {
                // Sign out and show error
                await supabase.auth.signOut();
                shakeError("Please check your email to confirm your account before signing in.");
                setLoading(false);
                return;
            }
        }
    }

    if (error) {
      setLoading(false);
      shakeError(error.message);
      return;
    }

    setIsSuccess(true);
    setLoading(false);
    handleSuccessRedirect();
  };

  const onSubmit = async (data: AuthFormData) => {
    setAuthError("");
    setSuccessMessage("");
    try {
      if (view === "forgot-password") await handleSendCode(data);
      else if (view === "reset-password") await handleResetPassword(data);
      else await handleMainSubmit(data);
    } catch (err: unknown) {
      setLoading(false);
      const message = err instanceof Error ? err.message : "An unexpected frontend error occurred.";
      shakeError(message);
    }
  };

  const handleOAuth = async (provider: 'google' | 'facebook') => {
    setLoading(true);
    if (!(await checkRateLimit())) return;

    try {
      let nextTarget = "/app";
      if (redirect) {
        nextTarget = (redirect.startsWith("/") && !redirect.startsWith("//")) ? redirect : "/app";
      } else if (intent === "owner") {
        nextTarget = "/app/owner";
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextTarget)}&intent=${tab}`,
        },
      });
      
      if (error) {
        setLoading(false);
        shakeError(error.message);
      }
    } catch (err: unknown) {
      setLoading(false);
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      shakeError(errorMessage);
    }
  };

  return {
    form,
    view,
    tab,
    authMethod,
    formEmail,
    formPhone,
    formPassword,
    loading,
    authError,
    setAuthError,
    successMessage,
    isShaking,
    isSuccess,
    otpCode,
    setOtpCode,
    countdown,
    handleVerifyCode,
    handleResetPassword,
    onSubmit,
    handleOAuth,
    handleSendCode
  };
}
