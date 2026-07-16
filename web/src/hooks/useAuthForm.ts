import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from "@/lib/supabase";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/AuthContext";

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
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      router.replace(redirect || (intent === "owner" ? "/app/owner" : "/app"));
    }
  }, [isAuthenticated, isAuthLoading, router, redirect, intent]);

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
  
  const [otpCode, setOtpCode] = useState<string>("");
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    const stored = sessionStorage.getItem("picklers_otp_cooldown");
    if (stored) {
      const targetTime = parseInt(stored, 10);
      const remaining = Math.max(0, Math.ceil((targetTime - Date.now()) / 1000));
      if (remaining > 0) {
        setCountdown(remaining);
      } else {
        sessionStorage.removeItem("picklers_otp_cooldown");
      }
    }
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
        if (countdown - 1 <= 0) sessionStorage.removeItem("picklers_otp_cooldown");
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const form = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
    mode: "onChange",
    defaultValues: {
      view: "auth",
      tab: intent === "signup" ? "signup" : "signin",
      authMethod: "email",
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    }
  });

  const view = form.watch("view");
  const tab = form.watch("tab");
  const authMethod = form.watch("authMethod");
  const formEmail = form.watch("email") || "";
  const formPhone = form.watch("phone") || "";
  const formPassword = form.watch("password") || "";

  const handleSuccessRedirect = () => {
    setTimeout(async () => {
      const isInternalRedirect = redirect && redirect.startsWith('/') && !redirect.startsWith('//');
      if (isInternalRedirect) router.push(redirect);
      else if (intent === "owner") router.push("/app/owner");
      else if (intent === "book") router.push("/app");
      else if (intent === "open-play") router.push("/app/explore");
      else router.push("/app");
    }, 800);
  };

  const shakeError = (msg: unknown) => {
    let finalMsg = typeof msg === "string" ? msg : "An unexpected error occurred.";
    if (finalMsg === "{}" || !finalMsg) finalMsg = "An unexpected error occurred. Please try again.";
    setAuthError(finalMsg);
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 400);
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
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(data.email!.trim());
      error = resetError;
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
    sessionStorage.setItem("picklers_otp_cooldown", newTarget.toString());
    setCountdown(60);
    form.setValue("view", "verify-code");
  };

  const handleVerifyCode = async (token: string) => {
    if (token.length !== 6) return shakeError("Please enter the 6-digit code.");

    setLoading(true);
    if (!(await checkRateLimit())) return;
    let error = null;
    
    if (authMethod === "email") {
      const { error: verifyError } = await supabase.auth.verifyOtp({ email: formEmail.trim(), token, type: 'recovery' });
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
            sessionStorage.setItem("picklers_otp_cooldown", newTarget.toString());
            setCountdown(60);
        }
        form.clearErrors();
        return;
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword(
        data.authMethod === "email"
          ? { email: data.email!.trim(), password: data.password! }
          : { phone: `+63${data.phone!.replace(/\D/g, '')}`, password: data.password! }
      );
      error = signInError;
    }

    if (error) {
      setLoading(false);
      if (error.message === "Invalid login credentials") {
        shakeError("We couldn't verify those credentials. Please try again or click 'Forgot Password' to reset your access.");
      } else {
        const errMsg = (error.message && error.message !== "{}") ? error.message : "An unexpected error occurred. Please try again.";
        shakeError(errMsg);
      }
      return;
    }

    setIsSuccess(true);
    handleSuccessRedirect();
  };

  const onSubmit = async (data: AuthFormData) => {

    setAuthError("");
    setSuccessMessage("");
    if (view === "forgot-password") await handleSendCode(data);
    else if (view === "reset-password") await handleResetPassword(data);
    else await handleMainSubmit(data);
  };

  const handleOAuth = async (provider: 'google' | 'facebook') => {
    setLoading(true);
    if (!(await checkRateLimit())) return;

    try {
      let nextTarget = "/app";
      if (redirect) {
        nextTarget = redirect.startsWith("http") ? redirect : redirect;
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
    onSubmit,
    handleOAuth,
    handleSendCode
  };
}
