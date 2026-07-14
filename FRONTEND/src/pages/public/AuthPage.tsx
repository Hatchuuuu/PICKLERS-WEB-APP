import { useNavigate, useSearchParams } from "react-router";
import { useState, useRef, KeyboardEvent, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PicklersLogo } from "@/components/ui/PicklersLogo";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { Mail, ArrowRight, ArrowLeft, User, Lock, Eye, EyeOff, Phone, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function AuthPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const intent = searchParams.get("intent");
  const redirect = searchParams.get("redirect");

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      navigate(redirect || (intent === "owner" ? "/app/owner" : "/app"), { replace: true });
    }
  }, [isAuthenticated, isAuthLoading, navigate, redirect, intent]);

  const [tab, setTab] = useState<"signin" | "signup">(intent === "signup" ? "signup" : "signin");
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [authMethod, setAuthMethod] = useState<"email" | "phone">("email");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [authError, setAuthError] = useState("");
  const [isShaking, setIsShaking] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [view, setView] = useState<"auth" | "forgot-password" | "verify-code" | "reset-password">("auth");
  const [otpCode, setOtpCode] = useState<string[]>(Array(6).fill(""));
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (view === "verify-code" && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown, view]);

  const handleSuccessRedirect = () => {
    setTimeout(async () => {
      const isInternalRedirect = redirect && redirect.startsWith('/') && !redirect.startsWith('//');
      if (isInternalRedirect) {
        navigate(redirect);
      } else if (intent === "owner") {
        navigate("/app/owner");
      } else if (intent === "book") {
        navigate("/app");
      } else if (intent === "open-play") {
        navigate("/app/explore");
      } else {
        navigate("/app");
      }
    }, 800);
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmailOrPhone()) {
      setAuthError(authMethod === "email" ? "Please enter a valid email address." : "Please enter a valid 10-digit mobile number.");
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 400);
      return;
    }

    setLoading(true);
    let error = null;

    if (authMethod === "email") {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);
      error = resetError;
    } else {
      const { error: signInError } = await supabase.auth.signInWithOtp({
        phone: `+63${phone.replace(/\D/g, '')}`,
        options: { shouldCreateUser: false }
      });
      error = signInError;
    }

    setLoading(false);
    if (error) {
      setAuthError(error.message);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 400);
      return;
    }

    setAuthError("");
    setCountdown(60);
    setView("verify-code");
  };

  const handleVerifyCode = async (e?: React.FormEvent, autoToken?: string) => {
    if (e) e.preventDefault();
    const token = autoToken || otpCode.join("");
    if (token.length !== 6) {
      setAuthError("Please enter the 6-digit code.");
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 400);
      return;
    }

    setLoading(true);
    let error = null;
    if (authMethod === "email") {
      const { error: verifyError } = await supabase.auth.verifyOtp({ email, token, type: 'recovery' });
      error = verifyError;
    } else {
      const { error: verifyError } = await supabase.auth.verifyOtp({ phone: `+63${phone.replace(/\D/g, '')}`, token, type: 'sms' });
      error = verifyError;
    }

    setLoading(false);
    if (error) {
      setAuthError(error.message);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 400);
      return;
    }

    setAuthError("");
    setOtpCode(Array(6).fill(""));
    setView("reset-password");
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setAuthError("Password must be at least 6 characters.");
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 400);
      return;
    }

    if (password !== confirmPassword) {
      setAuthError("Passwords do not match.");
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 400);
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setLoading(false);
      setAuthError(error.message);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 400);
      return;
    }

    setAuthError("");
    setIsSuccess(true);
    handleSuccessRedirect();
  };

  const handleSkipReset = () => {
    setIsSuccess(true);
    handleSuccessRedirect();
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, "").slice(0, 6).split("");
      const newOtp = [...otpCode];
      for (let i = 0; i < pasted.length; i++) {
        if (index + i < 6) newOtp[index + i] = pasted[i];
      }
      setOtpCode(newOtp);
      const nextIndex = Math.min(index + pasted.length, 5);
      otpRefs.current[nextIndex]?.focus();

      if (newOtp.every(d => d !== "")) {
        handleVerifyCode(undefined, newOtp.join(""));
      }
      return;
    }

    const val = value.replace(/\D/g, "");
    const newOtp = [...otpCode];
    newOtp[index] = val;
    setOtpCode(newOtp);
    setAuthError("");

    if (val && index < 5) {
      otpRefs.current[index + 1]?.focus();
    } else if (newOtp.every(d => d !== "")) {
      handleVerifyCode(undefined, newOtp.join(""));
    }
  };

  const handleOtpKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpCode[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const validateEmailOrPhone = () => {
    if (authMethod === "email") {
      const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!isValid && email.length > 5) setAuthError("Please enter a valid email address.");
      else setAuthError("");
      return isValid;
    } else {
      const cleanPhone = phone.replace(/[\s\-\(\)]/g, "");
      const isValid = /^\d{10}$/.test(cleanPhone);
      if (!isValid && phone.length > 5) setAuthError("Please enter a valid 10-digit mobile number.");
      else setAuthError("");
      return isValid;
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validateEmailOrPhone()) {
      setAuthError(authMethod === "email" ? "Please provide a valid email address to continue." : "Please enter a valid 10-digit mobile number.");
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 400);
      return;
    }

    if (password.length < 6) {
      setAuthError("For your security, please use a password with at least 6 characters.");
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 400);
      return;
    }

    if (tab === "signup" && password !== confirmPassword) {
      setAuthError("Your passwords must match exactly to secure your account.");
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 400);
      return;
    }

    setLoading(true);
    let error = null;

    if (tab === "signup") {
      const { data, error: signUpError } = await supabase.auth.signUp(
        authMethod === "email" ? {
          email,
          password,
          options: { data: { full_name: name, role: intent === "owner" ? "owner" : "player" } }
        } : {
          phone: `+63${phone.replace(/\D/g, '')}`,
          password,
          options: { data: { full_name: name, role: intent === "owner" ? "owner" : "player" } }
        }
      );
      error = signUpError;

      // FIX: Handle cases where auth confirmation is required
      if (!error && data && !data.session) {
        setLoading(false);
        setAuthError(authMethod === "email"
          ? "Account created securely. Please check your email to verify your account before logging in."
          : "Account created securely. We've sent a verification code to your phone.");
        setTab("signin");
        return;
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword(
        authMethod === "email"
          ? { email, password }
          : { phone: `+63${phone.replace(/\D/g, '')}`, password }
      );
      error = signInError;
    }

    if (error) {
      setLoading(false);
      if (error.message === "Invalid login credentials") {
        setAuthError("We couldn't verify those credentials. Please try again or click 'Forgot Password' to reset your access.");
      } else {
        setAuthError(error.message);
      }
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 400);
      return;
    }

    setAuthError("");
    setLoading(true);
    setIsSuccess(true);

    handleSuccessRedirect();
  }

  const handleOAuth = async (provider: 'google' | 'facebook') => {
    setLoading(true);
    try {
      localStorage.setItem("picklers_oauth_intent", tab);
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin + "/app",
        },
      });
      if (error) {
        setLoading(false);
        setAuthError(error.message);
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 400);
      }
    } catch (err: any) {
      setLoading(false);
      setAuthError(err.message || "An unexpected error occurred");
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 400);
    }
  };

  const inputClassName = "w-full rounded-[10px] px-4 py-2 sm:py-2.5 text-[14px] sm:text-[15px] outline-none transition-all duration-200 border border-solid focus:scale-[1.005] focus:shadow-[0_0_0_3px_rgba(0,217,139,0.15)] focus:-translate-y-[1px]";
  const inputStyle = {
    background: "var(--surface-interactive)",
    borderColor: "var(--border-default)",
    color: "var(--ink-primary)"
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-4 py-4 sm:py-8 bg-background relative overflow-y-auto selection:bg-accent-primary/20">
      <div className="w-full max-w-[440px] flex justify-start mb-2 sm:absolute sm:top-6 sm:left-6 sm:mb-0 z-20 shrink-0">
        <button onClick={() => {
          if (view !== "auth") {
            setView("auth");
            setAuthError("");
          } else {
            navigate("/");
          }
        }}
          className="flex items-center gap-2 text-[14px] font-bold transition-colors"
          style={{ color: "var(--ink-secondary)" }}
          onMouseEnter={e => e.currentTarget.style.color = "var(--ink-primary)"}
          onMouseLeave={e => e.currentTarget.style.color = "var(--ink-secondary)"}>
          <ArrowLeft className="w-4 h-4" /> {view !== "auth" ? "Back to Login" : "Back to Home"}
        </button>
      </div>
      <div className="absolute inset-0 pointer-events-none"></div>

      <div className="w-full flex justify-center scale-[0.95] sm:scale-100 origin-center">
        <motion.div layout initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ ease: [0.23, 1, 0.32, 1], duration: 0.6, layout: { type: "spring", bounce: 0.2, duration: 0.6 } }}
          className="w-full max-w-[440px] min-h-[400px] flex flex-col justify-between rounded-[24px] px-5 py-6 sm:px-8 sm:py-8 relative z-10 overflow-hidden bg-white/80 dark:bg-[#111f3a]/60 backdrop-blur-2xl border border-gray-200 dark:border-white/10 shadow-[0_24px_48px_rgba(0,0,0,0.4)]">

          <div className="text-center mb-3 sm:mb-5">
            <div className="flex items-center justify-center mb-1 mt-0">
              <PicklersLogo className="w-12 h-12" />
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={view + tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                <h2 className="text-[22px] sm:text-[26px] font-black tracking-tight mb-1" style={{ color: "var(--ink-primary)" }}>
                  {view === "forgot-password" ? "Reset Your Password" :
                    view === "verify-code" ? "Check Your Code" :
                      view === "reset-password" ? "Set New Password" :
                        tab === "signin" ? "Welcome Back!" : "Start Playing Pickleball"}
                </h2>
                <p className="text-[14px] font-medium" style={{ color: "var(--ink-secondary)" }}>
                  {view === "forgot-password" ? "Enter your email or phone to receive a code" :
                    view === "verify-code" ? (
                      <>Please check, we sent a code to <span className="font-semibold">{authMethod === 'email' ? email : `+63 ${phone}`}</span></>
                    ) :
                      view === "reset-password" ? "Enter your new password below" :
                        tab === "signin" ? "Sign in to reserve courts and matches" : "Register to join match sessions near you"}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {view === "auth" && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="flex relative mb-4 sm:mb-6 border-b border-solid" style={{ borderColor: "var(--border-subtle)" }}>
                {(["signin", "signup"] as const).map((val) => (
                  <button key={val} onClick={() => { setTab(val); if (val === "signup") setAuthMethod("email"); setAuthError(""); }} className="flex-1 py-2.5 text-[15px] font-semibold transition-colors z-10"
                    style={{ color: tab === val ? "var(--accent-primary)" : "var(--ink-secondary)" }}>
                    {val === "signin" ? "Sign In" : "Create Account"}
                  </button>
                ))}
                <motion.div layout className="absolute bottom-0 h-0.5 rounded-t-full z-20"
                  style={{ background: "var(--accent-primary)", left: tab === "signin" ? "0%" : "50%", width: "50%" }}
                  transition={{ type: "spring", stiffness: 500, damping: 35 }} />
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={
            view === "auth" ? handleSubmit :
              view === "forgot-password" ? handleSendCode :
                view === "verify-code" ? handleVerifyCode :
                  handleResetPassword
          } className="flex flex-col gap-3 sm:gap-4 flex-1 justify-center">
            <fieldset disabled={loading} className="flex flex-col gap-3 sm:gap-4 flex-1 justify-center transition-opacity duration-300 disabled:opacity-50 disabled:cursor-not-allowed border-none p-0 m-0 w-full">
              <AnimatePresence mode="popLayout">
                <motion.div key={view} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex flex-col gap-2.5 sm:gap-4">

                  {(view === "auth" || view === "forgot-password") && (
                    <>
                      <AnimatePresence mode="popLayout">
                        {view === "auth" && tab === "signup" && (
                          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                            transition={{ ease: "easeOut", duration: 0.2 }} className="group">
                            <div className="relative">
                              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted transition-colors group-focus-within:text-accent-primary z-10 pointer-events-none" />
                              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Full Name" className={`${inputClassName} pl-11`} style={inputStyle}
                                onFocus={e => (e.currentTarget.style.borderColor = "var(--border-emphasis)")}
                                onBlur={e => (e.currentTarget.style.borderColor = "var(--border-default)")} />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="group">
                        <AnimatePresence>
                          {(view === "forgot-password" || tab === "signin") && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                              <div className="flex justify-between items-center mb-1.5 mt-1">
                                <label className={cn("text-[11px] font-bold tracking-wider transition-colors group-focus-within:text-accent-primary uppercase", view === "auth" && tab === "signup" && "opacity-0 select-none pointer-events-none")}
                                  style={{ color: "var(--ink-muted)" }}>
                                  {authMethod === 'email' ? 'EMAIL ADDRESS' : 'PHONE NUMBER'}
                                </label>
                                <button type="button" onClick={() => { setAuthMethod(authMethod === 'email' ? 'phone' : 'email'); setAuthError(""); }} className="text-[11px] font-semibold text-accent-primary hover:text-emerald-400 transition-all">
                                  {authMethod === 'email' ? 'Use Phone Number instead' : 'Use Email Address instead'}
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        <motion.div animate={isShaking && (authError.toLowerCase().includes("email") || authError.toLowerCase().includes("number")) ? { x: [-5, 5, -5, 5, 0] } : {}} transition={{ duration: 0.4 }} className="relative group/input flex items-center">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none flex items-center justify-center w-5 h-5">
                            <AnimatePresence mode="popLayout">
                              {authMethod === "email" ? (
                                <motion.div key="mail" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, rotate: 90 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                                  <Mail className="w-4 h-4 text-ink-muted transition-colors group-focus-within/input:text-accent-primary" />
                                </motion.div>
                              ) : (
                                <motion.div key="phone" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, rotate: 90 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                                  <Phone className="w-4 h-4 text-ink-muted transition-colors group-focus-within/input:text-accent-primary" />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                          <AnimatePresence>
                            {authMethod === "phone" && (
                              <motion.div initial={{ opacity: 0, width: 0, paddingLeft: 0, paddingRight: 0 }} animate={{ opacity: 1, width: "auto", paddingLeft: 40, paddingRight: 8 }} exit={{ opacity: 0, width: 0, paddingLeft: 0, paddingRight: 0 }} className="absolute z-10 left-0 top-0 bottom-0 flex items-center pointer-events-none overflow-hidden text-[14px] sm:text-[15px] font-medium" style={{ color: "var(--ink-primary)" }}>
                                <span className="mr-1.5 shrink-0 select-none text-[16px] leading-none translate-y-[-1px]">🇵🇭</span>
                                <span className="opacity-70 font-semibold select-none">+63</span>
                              </motion.div>
                            )}
                          </AnimatePresence>
                          <input
                            type={authMethod === "email" ? "email" : "tel"}
                            maxLength={authMethod === "phone" ? 12 : undefined}
                            value={authMethod === "email" ? email : (
                              phone.length > 6 ? `${phone.slice(0, 3)} ${phone.slice(3, 6)} ${phone.slice(6)}` :
                                phone.length > 3 ? `${phone.slice(0, 3)} ${phone.slice(3)}` :
                                  phone
                            )}
                            onChange={e => {
                              if (authMethod === "email") {
                                setEmail(e.target.value);
                              } else {
                                let val = e.target.value.replace(/\D/g, "");
                                if (val.startsWith("0")) {
                                  val = val.substring(1);
                                }
                                if (val.length <= 10) {
                                  setPhone(val);
                                }
                              }
                              setAuthError("");
                            }}
                            placeholder={authMethod === "email" ? "Email address" : "917 123 4567"}
                            className={cn(`${inputClassName} text-ellipsis transition-[padding] duration-300 relative z-0`, (authError.toLowerCase().includes("email") || authError.toLowerCase().includes("number")) ? "border-accent-danger text-accent-danger" : "", authMethod === "email" ? "pl-11" : "pl-[100px]")}
                            style={inputStyle}
                            onFocus={e => (e.currentTarget.style.borderColor = "var(--border-emphasis)")}
                            onBlur={e => (e.currentTarget.style.borderColor = (authError.toLowerCase().includes("email") || authError.toLowerCase().includes("number")) ? "var(--accent-danger)" : "var(--border-default)")}
                          />
                        </motion.div>
                      </div>
                    </>
                  )}

                  {view === "verify-code" && (
                    <div className="flex flex-col items-center justify-center gap-1 mt-2">
                      <div className="flex gap-2 sm:gap-3 justify-center mb-2">
                        {otpCode.map((digit, idx) => (
                          <input
                            key={idx}
                            ref={el => { otpRefs.current[idx] = el; }}
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            value={digit}
                            onChange={(e) => handleOtpChange(idx, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                            className={cn(
                              "w-11 h-12 sm:w-12 sm:h-14 text-center text-lg font-bold rounded-[10px] sm:rounded-xl outline-none transition-all duration-200 border border-solid focus:-translate-y-[1px]",
                              digit ? "border-accent-primary shadow-[0_0_0_2px_rgba(0,217,139,0.1)]" : "focus:border-accent-primary"
                            )}
                            style={inputStyle}
                          />
                        ))}
                      </div>
                      <AnimatePresence mode="popLayout">
                        <motion.div key="timer-and-resend" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-1.5 w-full">
                          {countdown > 0 && (
                            <div className="text-[12px] font-medium text-foreground/60">
                              Code expires in <span className={cn("font-bold transition-colors", countdown <= 10 ? "text-accent-danger" : "text-foreground/80")}>{countdown}s</span>
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={handleSendCode}
                            disabled={countdown > 30}
                            className={cn(
                              "text-[12px] font-semibold transition-all",
                              countdown > 30
                                ? "text-foreground/30 cursor-not-allowed"
                                : "text-accent-primary hover:text-emerald-400 hover:underline"
                            )}
                          >
                            Didn't receive a code? Resend {countdown > 30 && `(${countdown - 30}s)`}
                          </button>
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  )}

                  {view === "auth" && (
                    <>
                      <div className="group">
                        <AnimatePresence>
                          {tab === "signin" && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                              <div className="flex justify-between items-center mb-1.5">
                                <label className="text-[11px] font-bold tracking-wider transition-colors group-focus-within:text-accent-primary uppercase"
                                  style={{ color: "var(--ink-muted)" }}>
                                  PASSWORD
                                </label>
                                <button type="button" onClick={() => { setView("forgot-password"); setAuthError(""); setPassword(""); setConfirmPassword(""); }} className="text-[11px] font-semibold text-accent-primary hover:text-emerald-400 hover:underline transition-all">
                                  Forgot Password?
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        <motion.div animate={isShaking && authError.toLowerCase().includes("password") && !authError.toLowerCase().includes("match") ? { x: [-5, 5, -5, 5, 0] } : {}} transition={{ duration: 0.4 }} className="relative group/input">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted transition-colors group-focus-within/input:text-accent-primary z-10 pointer-events-none" />
                          <input type={showPassword ? "text" : "password"} value={password} onChange={e => { setPassword(e.target.value); setAuthError(""); }} placeholder="Password" className={cn(`${inputClassName} pl-11 pr-11 text-ellipsis`, authError.toLowerCase().includes("password") && !authError.toLowerCase().includes("match") && "border-accent-danger text-accent-danger")} style={inputStyle}
                            onFocus={e => (e.currentTarget.style.borderColor = "var(--border-emphasis)")}
                            onBlur={e => (e.currentTarget.style.borderColor = (authError.toLowerCase().includes("password") && !authError.toLowerCase().includes("match")) ? "var(--accent-danger)" : "var(--border-default)")} />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-ink-muted hover:text-ink-primary transition-colors focus:outline-none z-10">
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </motion.div>
                      </div>

                      <AnimatePresence mode="popLayout">
                        {tab === "signup" && (
                          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ ease: "easeOut", duration: 0.2 }} className="group">
                            <motion.div animate={isShaking && authError.toLowerCase().includes("match") ? { x: [-5, 5, -5, 5, 0] } : {}} transition={{ duration: 0.4 }} className="relative group/input">
                              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted transition-colors group-focus-within/input:text-accent-primary z-10 pointer-events-none" />
                              <input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); setAuthError(""); }} placeholder="Confirm password" className={cn(`${inputClassName} pl-11 pr-11 text-ellipsis`, authError.toLowerCase().includes("match") && "border-accent-danger text-accent-danger")} style={inputStyle}
                                onFocus={e => (e.currentTarget.style.borderColor = "var(--border-emphasis)")}
                                onBlur={e => (e.currentTarget.style.borderColor = authError.toLowerCase().includes("match") ? "var(--accent-danger)" : "var(--border-default)")} />
                              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-ink-muted hover:text-ink-primary transition-colors focus:outline-none z-10">
                                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </motion.div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  )}

                  {view === "reset-password" && (
                    <>
                      <div className="group">
                        <div className="flex justify-between items-center mb-1.5 mt-1">
                          <label className="text-[11px] font-bold tracking-wider uppercase" style={{ color: "var(--ink-muted)" }}>
                            NEW PASSWORD
                          </label>
                        </div>
                        <motion.div className="relative group/input">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted transition-colors group-focus-within/input:text-accent-primary z-10 pointer-events-none" />
                          <input type={showPassword ? "text" : "password"} value={password} onChange={e => { setPassword(e.target.value); setAuthError(""); }} placeholder="New password" className={`${inputClassName} pl-11 pr-11`} style={inputStyle}
                            onFocus={e => (e.currentTarget.style.borderColor = "var(--border-emphasis)")}
                            onBlur={e => (e.currentTarget.style.borderColor = "var(--border-default)")} />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-ink-muted hover:text-ink-primary transition-colors focus:outline-none z-10">
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </motion.div>
                      </div>

                      <div className="group">
                        <div className="flex justify-between items-center mb-1.5 mt-1">
                          <label className="text-[11px] font-bold tracking-wider uppercase" style={{ color: "var(--ink-muted)" }}>
                            CONFIRM NEW PASSWORD
                          </label>
                        </div>
                        <motion.div className="relative group/input">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted transition-colors group-focus-within/input:text-accent-primary z-10 pointer-events-none" />
                          <input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); setAuthError(""); }} placeholder="Confirm password" className={`${inputClassName} pl-11 pr-11`} style={inputStyle}
                            onFocus={e => (e.currentTarget.style.borderColor = "var(--border-emphasis)")}
                            onBlur={e => (e.currentTarget.style.borderColor = "var(--border-default)")} />
                          <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-ink-muted hover:text-ink-primary transition-colors focus:outline-none z-10">
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </motion.div>
                      </div>
                    </>
                  )}

                  <AnimatePresence>
                    {authError && (
                      <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="text-xs text-accent-danger mt-1.5 font-medium px-1 text-center">
                        {authError === "Login unsuccessful. Please ensure your email and password are correct, or click 'Forgot Password' to reset." ? (
                          <>
                            Login unsuccessful. Please ensure your email and password are correct, or click <button type="button" onClick={() => { setView("forgot-password"); setAuthError(""); setPassword(""); setConfirmPassword(""); }} className="font-semibold text-accent-primary hover:text-emerald-400 underline transition-all">Forgot Password</button> to reset.
                          </>
                        ) : (
                          authError
                        )}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>
              </AnimatePresence>

              <motion.button type="submit" disabled={loading || isSuccess || (view === "auth" && password.length < 6) || (view === "reset-password" && password.length < 6)}
                animate={isSuccess ? { width: "48px", borderRadius: "24px" } : { width: "100%", borderRadius: "10px" }}
                className={cn(
                  "font-semibold text-[14px] sm:text-[15px] active:scale-[0.98] flex items-center justify-center gap-2 relative overflow-hidden group mx-auto",
                  (view === "auth" && tab === "signin") ? "mt-4 sm:mt-5" : "mt-1 sm:mt-2",
                  (!isSuccess && loading) && "opacity-60",
                  isSuccess ? "h-12" : "py-2.5 sm:py-3"
                )}
                style={{ background: "var(--accent-primary)", color: "var(--ink-inverse)", boxShadow: "var(--shadow-sm)", transition: "all 150ms ease-out" }}>
                <div className="absolute inset-0 bg-surface-interactive hover:bg-surface-interactive/80 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                <AnimatePresence mode="wait">
                  {isSuccess ? (
                    <motion.div key="check" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1, type: "spring" }}>
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </motion.div>
                  ) : (
                    <motion.span key="text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative z-10 flex items-center justify-center gap-2 w-full whitespace-nowrap">
                      {loading ? (
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.7, ease: "linear" }}
                          className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full" />
                      ) : (
                        <>
                          {view === "forgot-password" ? "Send Code" :
                            view === "verify-code" ? "Verify Code" :
                              view === "reset-password" ? "Update Password" :
                                tab === "signin" ? "Sign In" : "Create Account"}
                          <ArrowRight className="w-5 h-5 ml-1" />
                        </>
                      )}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>

              <div className={cn("flex flex-col justify-end", (view === "auth" && tab === "signin") ? "mt-6 sm:mt-8" : "mt-1 sm:mt-2")}>
                <AnimatePresence mode="popLayout">
                  {view === "reset-password" && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex justify-center my-1 mb-2">
                      <button type="button" onClick={handleSkipReset} className="text-[13px] font-semibold text-accent-primary hover:text-emerald-400 hover:underline transition-all">
                        Skip for now
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence mode="popLayout">
                  {view === "auth" && (
                    <fieldset disabled={loading}>
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                        <div className="flex items-center gap-4 my-3 sm:my-5">
                          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-black/10 to-black/10 dark:via-white/10 dark:to-white/10" />
                          <span className="text-[11px] font-bold tracking-widest text-foreground/40 uppercase">
                            {tab === "signin" ? "SIGN IN WITH" : "OR CONTINUE WITH"}
                          </span>
                          <div className="flex-1 h-px bg-gradient-to-l from-transparent via-black/10 to-black/10 dark:via-white/10 dark:to-white/10" />
                        </div>

                        <div className="flex gap-3 pb-1">
                          {["Google", "Facebook"].map(provider => (
                            <button key={provider} type="button"
                              onClick={() => handleOAuth(provider.toLowerCase() as 'google' | 'facebook')}
                              className="flex-1 h-[44px] sm:h-[48px] rounded-[14px] sm:rounded-[16px] text-[14px] sm:text-[15px] font-semibold tracking-tight transition-all duration-300 flex items-center justify-center gap-2.5 active:scale-[0.97] bg-white dark:bg-white/5 border border-black/[0.04] dark:border-white/10 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:-translate-y-[1px] text-foreground"
                            >
                              {provider === "Google" ? (
                                <svg className="w-4 h-4" viewBox="0 0 24 24">
                                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#1877F2">
                                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                </svg>
                              )}
                              {provider}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    </fieldset>
                  )}
                </AnimatePresence>
              </div>
        </fieldset>
      </form>

          <AnimatePresence>
            {view !== "auth" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ delay: 0.2 }} className="mt-8 flex flex-col items-center justify-center opacity-40 select-none">
                <ShieldCheck className="w-8 h-8 mb-2" />
                <p className="text-xs font-semibold tracking-wider uppercase">Secured by Picklers Auth</p>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      </div>
    </div>
  );
}
