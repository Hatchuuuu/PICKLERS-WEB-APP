import { useNavigate, useSearchParams } from "react-router";
import { useState, useEffect } from "react";
import { OTPInput } from "input-otp";
import { motion, AnimatePresence } from "motion/react";
import { PicklersLogo } from "@/components/ui/PicklersLogo";
import ShinyText from "@/components/ui/ShinyText";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { MockApi } from "@/lib/api";
import { Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, Phone, User } from "lucide-react";

export function AuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  
  const intent = searchParams.get("intent");
  const redirect = searchParams.get("redirect");

  const [tab, setTab] = useState<"signin" | "signup">(intent === "signup" ? "signup" : "signin");
  const [loading, setLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email");
  const [showPassword, setShowPassword] = useState(false);
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isShaking, setIsShaking] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [otpState, setOtpState] = useState<"idle" | "sent">("idle");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const isPhoneValid = phoneNumber.replace(/\D/g, "").length >= 10;

  const validateEmail = (val: string) => {
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
    if (!isValid && val.length > 5) setEmailError("Please enter a valid email address.");
    else setEmailError("");
    return isValid;
  };

  const validatePassword = (val: string) => {
    const isValid = val.length >= 8;
    if (!isValid && val.length > 0) setPasswordError("Password must be at least 8 characters.");
    else setPasswordError("");
    return isValid;
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    if (otpState === "sent" && otpCode.length === 6 && !loading && !isSuccess) {
      handleFinalSubmit();
    }
  }, [otpCode]);

  function handleSendCode() {
    if (loginMethod === "phone" && !isPhoneValid) return;
    if (loginMethod === "email" && !validateEmail(email)) {
      setEmailError("Please enter a valid email address.");
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 400);
      return;
    }
    setOtpState("sent");
    setCountdown(60);
    setOtpCode("");
    setOtpError(false);
  }

  async function handleFinalSubmit() {
    if (otpState === "sent") {
      setLoading(true);
      const isValid = await MockApi.verifyOTP(otpCode);
      if (!isValid) {
        setLoading(false);
        setOtpError(true);
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 400);
        setTimeout(() => setOtpError(false), 500);
        return;
      }
    }
    
    setLoading(true);
    setIsSuccess(true);
    
    setTimeout(async () => {
      await login({
        name: tab === "signup" && name ? name : undefined,
        email: loginMethod === "email" ? email : undefined,
        phone: loginMethod === "phone" ? phoneNumber : undefined,
        role: intent === "owner" ? "owner" : "player"
      });

      if (redirect) {
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
    }, 400); // Wait for success morph animation
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (tab === "signin") {
      const isEmailValid = loginMethod === "phone" || validateEmail(email);
      const isPassValid = validatePassword(password);
      
      if (!isEmailValid || !isPassValid) {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 400);
        if (!isEmailValid) setEmailError("Please enter a valid email address.");
        if (!isPassValid) setPasswordError("Password must be at least 8 characters.");
        return;
      }
    }
    
    handleFinalSubmit();
  }

  const inputClassName = "w-full rounded-[10px] px-4 py-2.5 text-[15px] outline-none transition-all duration-200 border border-solid focus:scale-[1.005] focus:shadow-[0_0_0_3px_rgba(0,217,139,0.15)] focus:-translate-y-[1px]";
  const inputStyle = {
    background: "var(--surface-interactive)",
    borderColor: "var(--border-default)",
    color: "var(--ink-primary)"
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center px-4 py-4 sm:py-8 bg-background relative overflow-hidden selection:bg-accent-primary/20">
      <div className="absolute top-6 left-6 z-20">
        <button onClick={() => navigate("/")} 
          className="flex items-center gap-2 text-[14px] font-bold transition-colors"
          style={{ color: "var(--ink-secondary)" }}
          onMouseEnter={e => e.currentTarget.style.color = "var(--ink-primary)"}
          onMouseLeave={e => e.currentTarget.style.color = "var(--ink-secondary)"}>
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>
      </div>
      <div className="absolute inset-0 pointer-events-none">
        {/* Background glow removed as per user request */}
      </div>

      <div className="w-full flex justify-center scale-[0.95] sm:scale-100 origin-center">
        <motion.div layout initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ ease: [0.23, 1, 0.32, 1], duration: 0.6, layout: { type: "spring", bounce: 0.2, duration: 0.6 } }}
          className="w-full max-w-[440px] rounded-[24px] p-5 sm:p-8 relative z-10 overflow-hidden bg-white/80 dark:bg-[#111f3a]/60 backdrop-blur-2xl border border-gray-200 dark:border-white/10 shadow-[0_24px_48px_rgba(0,0,0,0.4)]">

        <div className="text-center mb-4 sm:mb-6">
          <div className="flex items-center justify-center mb-4 mt-2">
            <PicklersLogo size={68} />
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <h2 className="text-[22px] sm:text-[26px] font-black tracking-tight mb-1" style={{ color: "var(--ink-primary)" }}>
                {tab === "signin" ? "Welcome Back!" : "Start Playing Pickleball"}
              </h2>
              <p className="text-[14px] font-medium" style={{ color: "var(--ink-secondary)" }}>
                {tab === "signin" ? "Sign in to reserve courts and matches" : "Register to join match sessions near you"}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex relative mb-5 sm:mb-6 border-b border-solid" style={{ borderColor: "var(--border-subtle)" }}>
          {(["signin", "signup"] as const).map((val) => (
            <button key={val} onClick={() => setTab(val)} className="flex-1 py-2.5 text-[15px] font-semibold transition-colors z-10"
              style={{ color: tab === val ? "var(--accent-primary)" : "var(--ink-secondary)" }}>
              {val === "signin" ? "Sign In" : "Create Account"}
            </button>
          ))}
          <motion.div layout className="absolute bottom-0 h-0.5 rounded-t-full z-20"
            style={{ background: "var(--accent-primary)", left: tab === "signin" ? "0%" : "50%", width: "50%" }}
            transition={{ type: "spring", stiffness: 500, damping: 35 }} />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:gap-4">
          <AnimatePresence mode="popLayout">
            {tab === "signup" && otpState === "idle" && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                transition={{ ease: "easeOut", duration: 0.2 }} className="group">
                <label className="block text-[11px] font-bold mb-1.5 tracking-wider transition-colors group-focus-within:text-accent-primary uppercase" 
                  style={{ color: "var(--ink-muted)" }}>FULL NAME</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-muted transition-colors group-focus-within:text-accent-primary" />
                  <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Juan Dela Cruz" className={`${inputClassName} pl-12`} style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = "var(--border-emphasis)")}
                    onBlur={e => (e.currentTarget.style.borderColor = "var(--border-default)")} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="popLayout">
            {otpState === "idle" ? (
              <motion.div key="inputs" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex flex-col gap-3 sm:gap-4">
                {loginMethod === "email" ? (
                  <>
                    <div className="group">
                      <label className="block text-[11px] font-bold mb-1.5 tracking-wider transition-colors group-focus-within:text-accent-primary flex justify-between uppercase" 
                        style={{ color: "var(--ink-muted)" }}>
                        <span>EMAIL ADDRESS</span>
                        <span className="text-accent-primary cursor-pointer hover:underline transition-colors normal-case tracking-normal text-[12px]" onClick={() => setLoginMethod("phone")}>Use phone number instead</span>
                      </label>
                      <motion.div animate={isShaking && emailError ? { x: [-5, 5, -5, 5, 0] } : {}} transition={{ duration: 0.4 }} className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-muted transition-colors group-focus-within:text-accent-primary" />
                        <input type="email" value={email} onChange={e => { setEmail(e.target.value); if (emailError) validateEmail(e.target.value); }} placeholder="you@example.com" className={cn(`${inputClassName} pl-12`, emailError && "border-accent-danger text-accent-danger")} style={tab === "signup" ? { ...inputStyle, paddingRight: "100px" } : inputStyle}
                          onFocus={e => (e.currentTarget.style.borderColor = "var(--border-emphasis)")}
                          onBlur={e => (e.currentTarget.style.borderColor = emailError ? "var(--accent-danger)" : "var(--border-default)")} />
                        {tab === "signup" && (
                          <div className="absolute right-1 top-1 bottom-1">
                            <button type="button" onClick={handleSendCode} disabled={!email.includes('@')}
                              className="h-full px-3 rounded-lg text-xs font-semibold active:scale-[0.96] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              style={{ background: "var(--accent-primary)", color: "var(--surface-base)" }}>
                              Send Code
                            </button>
                          </div>
                        )}
                      </motion.div>
                      <AnimatePresence>
                        {emailError && (
                          <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="text-xs text-accent-danger mt-1.5 font-medium px-1">
                            {emailError}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                    {tab === "signin" && (
                      <div className="group">
                        <label className="block text-[11px] font-bold mb-1.5 tracking-wider transition-colors group-focus-within:text-accent-primary flex justify-between uppercase" 
                          style={{ color: "var(--ink-muted)" }}>
                          <span>PASSWORD</span>
                          <span className="cursor-pointer hover:underline transition-opacity opacity-80 hover:opacity-100 normal-case tracking-normal text-[12px]">Forgot password?</span>
                        </label>
                        <motion.div animate={isShaking && passwordError ? { x: [-5, 5, -5, 5, 0] } : {}} transition={{ duration: 0.4 }} className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-muted transition-colors group-focus-within:text-accent-primary" />
                          <input type={showPassword ? "text" : "password"} value={password} onChange={e => { setPassword(e.target.value); if (passwordError) validatePassword(e.target.value); }} placeholder="••••••••" className={cn(`${inputClassName} pl-12 pr-12`, passwordError && "border-accent-danger text-accent-danger")} style={inputStyle}
                            onFocus={e => (e.currentTarget.style.borderColor = "var(--border-emphasis)")}
                            onBlur={e => (e.currentTarget.style.borderColor = passwordError ? "var(--accent-danger)" : "var(--border-default)")} />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink-primary transition-colors">
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </motion.div>
                        <AnimatePresence>
                          {passwordError && (
                            <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="text-xs text-accent-danger mt-1.5 font-medium px-1">
                              {passwordError}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="group">
                      <label className="block text-[11px] font-bold mb-1.5 tracking-wider transition-colors group-focus-within:text-accent-primary flex justify-between uppercase" 
                        style={{ color: "var(--ink-muted)" }}>
                        <span>PHONE NUMBER</span>
                        <span className="text-accent-primary cursor-pointer hover:underline transition-colors normal-case tracking-normal text-[12px]" onClick={() => setLoginMethod("email")}>Use email instead</span>
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-muted transition-colors group-focus-within:text-accent-primary" />
                        <input type="tel" placeholder="+63 912 345 6789" className={`${inputClassName} pl-12`} style={tab === "signup" ? { ...inputStyle, paddingRight: "100px" } : inputStyle}
                          value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)}
                          onFocus={e => (e.currentTarget.style.borderColor = "var(--border-emphasis)")}
                          onBlur={e => (e.currentTarget.style.borderColor = "var(--border-default)")} />
                        {tab === "signup" && (
                          <div className="absolute right-1 top-1 bottom-1">
                            <button type="button" onClick={handleSendCode} disabled={!isPhoneValid}
                              className="h-full px-3 rounded-lg text-xs font-semibold active:scale-[0.96] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              style={{ background: "var(--accent-primary)", color: "var(--surface-base)" }}>
                              Send Code
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    {tab === "signin" && (
                      <div className="group">
                        <label className="block text-[11px] font-bold mb-1.5 tracking-wider transition-colors group-focus-within:text-accent-primary flex justify-between uppercase" 
                          style={{ color: "var(--ink-muted)" }}>
                          <span>PASSWORD</span>
                          <span className="cursor-pointer hover:underline transition-opacity opacity-80 hover:opacity-100 normal-case tracking-normal text-[12px]">Forgot password?</span>
                        </label>
                        <motion.div animate={isShaking && passwordError ? { x: [-5, 5, -5, 5, 0] } : {}} transition={{ duration: 0.4 }} className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-muted transition-colors group-focus-within:text-accent-primary" />
                          <input type={showPassword ? "text" : "password"} value={password} onChange={e => { setPassword(e.target.value); if (passwordError) validatePassword(e.target.value); }} placeholder="••••••••" className={cn(`${inputClassName} pl-12 pr-12`, passwordError && "border-accent-danger text-accent-danger")} style={inputStyle}
                            onFocus={e => (e.currentTarget.style.borderColor = "var(--border-emphasis)")}
                            onBlur={e => (e.currentTarget.style.borderColor = passwordError ? "var(--accent-danger)" : "var(--border-default)")} />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink-primary transition-colors">
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </motion.div>
                        <AnimatePresence>
                          {passwordError && (
                            <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="text-xs text-accent-danger mt-1.5 font-medium px-1">
                              {passwordError}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            ) : (
              <motion.div key="otp-sent" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="group flex flex-col items-center">
                <label className="block text-[13px] font-medium mb-4 text-center" style={{ color: "var(--ink-muted)" }}>
                  Enter the 6-digit code sent to <span style={{ color: "var(--ink-primary)" }}>{loginMethod === "phone" ? (phoneNumber || "+63 912 345 6789") : email}</span>
                  <button type="button" className="block mx-auto mt-1 text-accent-secondary hover:underline" onClick={() => setOtpState("idle")}>
                    Change {loginMethod === "phone" ? "number" : "email"}
                  </button>
                </label>
                <motion.div animate={isShaking && otpError ? { x: [-10, 10, -10, 10, -5, 5, 0] } : {}} transition={{ duration: 0.4 }}>
                  <OTPInput maxLength={6} value={otpCode} onChange={setOtpCode}
                    render={({ slots }) => (
                      <div className="flex gap-2">
                        {slots.map((slot, idx) => (
                          <div key={idx} className={cn("w-11 h-14 rounded-xl flex items-center justify-center text-lg font-bold transition-all border border-solid", slot.isActive ? "scale-[1.05] shadow-[0_0_0_3px_rgba(0,217,139,0.15)] z-10" : "", otpError ? "border-accent-danger text-accent-danger" : "")}
                            style={{ 
                              background: "var(--surface-interactive)", 
                              borderColor: otpError ? "var(--accent-danger)" : slot.isActive ? "var(--accent-primary)" : "var(--border-default)",
                              color: otpError ? "var(--accent-danger)" : "var(--ink-primary)"
                            }}>
                            {slot.char}
                            {slot.hasFakeCaret && <div className="w-px h-6 bg-accent-primary animate-pulse" />}
                          </div>
                        ))}
                      </div>
                    )}
                  />
                </motion.div>
                {otpError && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-accent-danger text-xs mt-2 font-medium">Invalid code (try 123456)</motion.p>}
                <div className="text-[12px] mt-4" style={{ color: "var(--ink-muted)" }}>
                  {countdown > 0 ? `Code expires in 0:${countdown.toString().padStart(2, "0")}` : (
                    <button type="button" onClick={handleSendCode} className="text-accent-secondary hover:underline">
                      Resend code
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button type="submit" disabled={loading || isSuccess || (otpState === "sent" && otpCode.length < 6)}
            animate={isSuccess ? { width: "48px", borderRadius: "24px" } : { width: "100%", borderRadius: "10px" }}
            className={cn(
              "mt-2 font-semibold text-[15px] active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 relative overflow-hidden group mx-auto",
              isSuccess ? "h-12" : "py-3"
            )}
            style={{ background: "var(--accent-primary)", color: "var(--ink-inverse)", boxShadow: "var(--shadow-sm)", transition: "all 150ms ease-out" }}>
            <div className="absolute inset-0 bg-surface-interactive hover:bg-surface-interactive/80 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            <AnimatePresence mode="wait">
              {isSuccess ? (
                <motion.div key="check" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1, type: "spring" }}>
                  <svg className="w-6 h-6 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
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
                      {otpState === "sent" ? "Verify Code" : (tab === "signin" ? "Sign In" : "Create Account")}
                      <ArrowRight className="w-5 h-5 ml-1" />
                    </>
                  )}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          <div className="flex items-center gap-4 my-3">
            <div className="flex-1 h-px" style={{ background: "var(--border-subtle)" }} />
            <span className="text-[11px] font-bold tracking-wider" style={{ color: "var(--ink-muted)" }}>OR CONTINUE WITH</span>
            <div className="flex-1 h-px" style={{ background: "var(--border-subtle)" }} />
          </div>

          <div className="flex gap-4">
            {["Google", "Facebook"].map(provider => (
              <button key={provider} type="button"
                className="flex-1 py-2.5 rounded-[10px] text-[15px] font-medium active:scale-[0.98] hover:bg-surface-raised transition-all border border-solid flex items-center justify-center gap-2"
                style={{ background: "var(--surface-interactive)", borderColor: "var(--border-default)", color: "var(--ink-primary)" }}>
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
        </form>

      </motion.div>
      </div>
    </div>
  );
}
