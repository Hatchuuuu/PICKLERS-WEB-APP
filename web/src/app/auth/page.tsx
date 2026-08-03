"use client";
import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from "motion/react";
import { PicklersLogo } from "@/components/ui/PicklersLogo";
import { cn } from "@/lib/utils";
import { Mail, ArrowRight, ArrowLeft, User, Lock, Eye, EyeOff, Phone, AlertCircle } from "lucide-react";
import { OTPInput } from "input-otp";
import { useAuthForm } from "@/hooks/useAuthForm";

function AuthContent() {
  const router = useRouter();
  
  const {
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
  } = useAuthForm();

  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const emailInputRef = useRef<HTMLInputElement | null>(null);
  const phoneInputRef = useRef<HTMLInputElement | null>(null);
  const passwordInputRef = useRef<HTMLInputElement | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (view === "auth" && tab === "signup") {
        nameInputRef.current?.focus();
      } else if (view === "auth" && tab === "signin") {
        if (authMethod === "email") emailInputRef.current?.focus();
        else phoneInputRef.current?.focus();
      } else if (view === "forgot-password") {
        if (authMethod === "email") emailInputRef.current?.focus();
        else phoneInputRef.current?.focus();
      } else if (view === "reset-password") {
        passwordInputRef.current?.focus();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [view, tab, authMethod]);

  const getPasswordStrength = (pass: string) => {
    if (!pass) return 0;
    let score = 1;
    if (pass.length >= 8) score++;
    if (/[A-Za-z]/.test(pass) && /[0-9]/.test(pass)) score++;
    if (score === 2 && /[^A-Za-z0-9]/.test(pass)) score++;
    return score > 3 ? 3 : score;
  };
  const strength = getPasswordStrength(formPassword);
  const strengthLabels = ["", "WEAK", "FAIR", "STRONG"];
  const strengthColors = ["bg-gray-300", "bg-red-400", "bg-yellow-400", "bg-emerald-400"];

  const inputClassName = "w-full rounded-[10px] px-4 py-2 sm:py-2.5 text-[14px] sm:text-[15px] outline-none transition-all duration-300 border focus:scale-[1.005] focus:shadow-[0_0_0_3px_rgba(0,217,139,0.15)] focus:-translate-y-[1px] bg-surface-interactive text-ink-primary border-border-default focus:border-border-emphasis";
  const errors = form.formState.errors;

  const { ref: nameRef, ...nameProps } = form.register("name");
  const { ref: emailRef, ...emailProps } = form.register("email");
  const { ref: phoneRef, ...phoneProps } = form.register("phone", {
    onChange: (e) => {
      let val = e.target.value.replace(/\D/g, "");
      if (val.startsWith("0")) val = val.substring(1);
      if (val.length > 10) val = val.substring(0, 10);
      let formatted = val;
      if (val.length > 6) formatted = `${val.slice(0, 3)} ${val.slice(3, 6)} ${val.slice(6)}`;
      else if (val.length > 3) formatted = `${val.slice(0, 3)} ${val.slice(3)}`;
      e.target.value = formatted;
    }
  });
  const { ref: passwordRef, ...passwordProps } = form.register("password");
  const { ref: confirmPasswordRef, ...confirmPasswordProps } = form.register("confirmPassword");

  return (
    <div className="min-h-[100dvh] flex flex-col items-center px-4 pt-4 pb-24 sm:pt-8 sm:pb-8 bg-background relative overflow-y-auto selection:bg-accent-primary/20">
      
      {/* Subtle Premium Texture Grid */}
      <div className="absolute inset-0 z-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02] pointer-events-none" />

      <div className="w-full max-w-[440px] flex justify-start mb-2 sm:absolute sm:top-6 sm:left-6 sm:mb-0 z-20 shrink-0">
        <button type="button" onClick={() => {
          if (view !== "auth") {
            form.setValue("view", "auth");
            setAuthError("");
            form.clearErrors();
          } else {
            router.push("/");
          }
        }}
          className="flex items-center gap-2 text-[14px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 rounded-md px-2 py-1 -ml-2"
          style={{ color: "var(--ink-secondary)" }}
          onMouseEnter={e => e.currentTarget.style.color = "var(--ink-primary)"}
          onMouseLeave={e => e.currentTarget.style.color = "var(--ink-secondary)"}>
          <ArrowLeft className="w-4 h-4" /> {view !== "auth" ? "Back to Login" : "Back to Home"}
        </button>
      </div>

      <div className="w-full flex justify-center my-auto scale-[0.95] sm:scale-100 origin-center">
        <motion.div layout initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ ease: [0.23, 1, 0.32, 1], duration: 0.6, layout: { type: "spring", bounce: 0, duration: 0.5 } }}
          className={cn(
            "w-full max-w-[440px] flex flex-col justify-start rounded-[24px] px-5 pt-4 pb-6 sm:px-8 sm:pt-6 sm:pb-8 relative z-10 overflow-hidden bg-white/80 dark:bg-[#111f3a]/60 backdrop-blur-2xl border border-gray-200 dark:border-white/10 shadow-[0_24px_48px_rgba(0,0,0,0.1)]",
            "h-auto min-h-auto sm:min-h-[440px]"
          )}>

          <div className="text-center mb-4 sm:mb-6">
            <div className="flex items-center justify-center mb-2 sm:mb-4 mt-0">
              <PicklersLogo size={48} className="transition-transform duration-300 hover:scale-105 active:scale-95 cursor-pointer" />
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={view + tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                <h2 className="text-[20px] sm:text-[26px] font-black tracking-tight mb-1" style={{ color: "var(--ink-primary)" }}>
                  {view === "forgot-password" ? "Reset Your Password" :
                    view === "verify-code" ? "Check Your Code" :
                    view === "verify-phone" ? "Verify Your Phone" :
                      view === "reset-password" ? "Set New Password" :
                        tab === "signin" ? "Welcome Back!" : "Start Playing Pickleball"}
                </h2>
                <p className="text-[14px] font-medium" style={{ color: "var(--ink-secondary)" }}>
                  {view === "forgot-password" ? "Enter your email or phone to receive a code" :
                    view === "verify-code" ? (
                      <>Please check, we sent a code to <span className="font-semibold">{authMethod === 'email' ? formEmail : `+63 ${formPhone}`}</span></>
                    ) :
                    view === "verify-phone" ? (
                        <>We sent an SMS code to <span className="font-semibold">{`+63 ${formPhone}`}</span>. Verify to complete signup.</>
                    ) :
                      view === "reset-password" ? "Enter your new password below" :
                        tab === "signin" ? "Sign in to reserve courts and matches" : "Register to join match sessions near you"}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {view === "auth" && (
              <motion.div role="tablist" aria-label="Authentication modes" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="flex relative mb-4 sm:mb-5 border-b border-solid" style={{ borderColor: "var(--border-subtle)" }}>
                {(["signin", "signup"] as const).map((val) => (
                  <button key={val} type="button" role="tab" aria-selected={tab === val} onClick={() => { form.reset({ view: "auth", tab: val, authMethod: "email", name: "", email: "", phone: "", password: "", confirmPassword: "" }); setAuthError(""); form.clearErrors(); }} className="flex-1 py-1.5 sm:py-2.5 text-[14px] sm:text-[15px] font-semibold transition-colors z-10 focus-visible:outline-none focus-visible:bg-accent-primary/5 rounded-t-md"
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

          <form onSubmit={view === "verify-code" || view === "verify-phone" ? (e) => { e.preventDefault(); handleVerifyCode(otpCode); } : form.handleSubmit(onSubmit)} className="flex flex-col gap-3 sm:gap-3 flex-1 justify-start">
            <fieldset disabled={loading || (view === "forgot-password" && countdown > 0)} className="flex flex-col gap-3 sm:gap-3 flex-1 justify-start pt-1 transition-opacity duration-300 disabled:opacity-50 disabled:cursor-not-allowed border-none p-0 m-0 w-full">
              <AnimatePresence mode="popLayout">
                <motion.div key={view} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex flex-col gap-3 sm:gap-4">

                  {(view === "auth" || view === "forgot-password") && (
                    <>
                      <AnimatePresence mode="popLayout">
                        {view === "auth" && tab === "signup" && (
                          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                            transition={{ ease: "easeOut", duration: 0.2 }} className="group">
                            <label htmlFor="auth-name" className="sr-only">Full Name</label>
                            <div className="relative">
                              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted transition-colors group-focus-within:text-accent-primary z-10 pointer-events-none" />
                              <input id="auth-name" type="text" {...nameProps} ref={(e) => { nameRef(e); nameInputRef.current = e; }} aria-invalid={!!errors.name} aria-describedby="name-error" placeholder="Full Name" className={cn(`${inputClassName} pl-11`, errors.name && "!border-accent-danger text-accent-danger")} />
                            </div>
                            <AnimatePresence>
                              {errors.name && (
                                <motion.p id="name-error" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="text-[11px] text-accent-danger font-semibold mt-1.5 ml-1">
                                  {errors.name.message}
                                </motion.p>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="group">
                        <AnimatePresence>
                          {(view === "forgot-password" || tab === "signin") && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                              <div className="flex justify-between items-center mb-1.5 mt-0.5">
                                <label htmlFor={authMethod === "email" ? "auth-email" : "auth-phone"} className={cn("text-[11px] font-bold tracking-wider transition-colors group-focus-within:text-accent-primary uppercase", view === "auth" && tab === "signup" && "opacity-0 select-none pointer-events-none")}
                                  style={{ color: "var(--ink-muted)" }}>
                                  {authMethod === 'email' ? 'EMAIL ADDRESS' : 'PHONE NUMBER'}
                                </label>
                                <button type="button" onClick={() => { form.setValue("authMethod", authMethod === 'email' ? 'phone' : 'email'); setAuthError(""); form.clearErrors(); }} className="text-[11px] font-semibold text-accent-primary hover:text-emerald-400 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary rounded px-1">
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
                          {authMethod === "email" ? (
                            <input
                              id="auth-email"
                              type="email"
                              autoComplete={tab === "signup" ? "new-password" : "email"}
                              aria-invalid={!!errors.email} aria-describedby="email-error"
                              {...emailProps}
                              ref={(e) => { emailRef(e); emailInputRef.current = e; }}
                              placeholder={tab === "signin" ? "johndoe@gmail.com" : "Email address"}
                              className={cn(`${inputClassName} text-ellipsis transition-[padding] duration-300 relative z-0 pl-11`, (authError.toLowerCase().includes("email") || errors.email) ? "!border-accent-danger text-accent-danger" : "")}
                            />
                          ) : (
                            <input
                              id="auth-phone"
                              type="tel"
                              aria-invalid={!!errors.phone} aria-describedby="phone-error"
                              maxLength={12}
                              {...phoneProps}
                              ref={(e) => { phoneRef(e); phoneInputRef.current = e; }}
                              placeholder="917 123 4567"
                              className={cn(`${inputClassName} text-ellipsis transition-[padding] duration-300 relative z-0 pl-[100px]`, (authError.toLowerCase().includes("number") || errors.phone) ? "!border-accent-danger text-accent-danger" : "")}
                            />
                          )}
                        </motion.div>
                        <AnimatePresence>
                          {(errors.email || errors.phone) && (
                            <motion.p id={authMethod === "email" ? "email-error" : "phone-error"} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="text-[11px] text-accent-danger font-semibold mt-1.5 ml-1">
                              {authMethod === "email" ? errors.email?.message : errors.phone?.message}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>
                    </>
                  )}

                  {(view === "verify-code" || view === "verify-phone") && (
                    <div className="flex flex-col items-center justify-center gap-1 mt-2">
                      <OTPInput
                        autoFocus
                        maxLength={6}
                        value={otpCode}
                        onChange={(val) => {
                          setOtpCode(val);
                          setAuthError("");
                        }}
                        onComplete={(val) => handleVerifyCode(val)}
                        render={({ slots }) => (
                          <div className="flex gap-2 sm:gap-3 justify-center mb-2" aria-label="Enter Verification Code">
                            {slots.map((slot, idx) => (
                              <div
                                key={idx}
                                className={cn(
                                  "relative w-11 h-12 sm:w-12 sm:h-14 text-center text-lg font-bold rounded-[10px] sm:rounded-xl outline-none transition-all duration-200 border flex items-center justify-center",
                                  slot.isActive
                                    ? "border-accent-primary shadow-[0_0_0_2px_rgba(0,217,139,0.1)] -translate-y-[1px]"
                                    : "border-border-default",
                                  slot.char && "border-accent-primary"
                                )}
                              >
                                {slot.char !== null ? (
                                  <div>{slot.char}</div>
                                ) : slot.hasFakeCaret ? (
                                  <div className="absolute pointer-events-none inset-0 flex items-center justify-center animate-caret-blink">
                                    <div className="w-px h-5 sm:h-6 bg-accent-primary" />
                                  </div>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        )}
                      />
                      <AnimatePresence mode="popLayout">
                        <motion.div key="timer-and-resend" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-1.5 w-full">
                          {countdown > 0 && (
                            <div className="text-[12px] font-medium text-foreground/60">
                              Wait <span className={cn("font-bold transition-colors", countdown <= 10 ? "text-accent-danger" : "text-foreground/80")}>{countdown}s</span> before resending
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => handleSendCode(form.getValues())}
                            disabled={countdown > 0}
                            className={cn(
                              "text-[12px] font-semibold transition-all",
                              countdown > 0
                                ? "text-foreground/30 cursor-not-allowed"
                                : "text-accent-primary hover:text-emerald-400 hover:underline"
                            )}
                          >
                            Didn't receive a code? Resend
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
                                <label htmlFor="auth-password" className="text-[11px] font-bold tracking-wider transition-colors group-focus-within:text-accent-primary uppercase"
                                  style={{ color: "var(--ink-muted)" }}>
                                  PASSWORD
                                </label>
                                <button type="button" onClick={() => { form.setValue("view", "forgot-password"); setAuthError(""); form.clearErrors(); }} className="text-[11px] font-semibold text-accent-primary hover:text-emerald-400 hover:underline transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary rounded px-1">
                                  Forgot Password?
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        {tab === "signup" && <label htmlFor="auth-password" className="sr-only">Password</label>}
                        <motion.div animate={isShaking && authError.toLowerCase().includes("password") && !authError.toLowerCase().includes("match") ? { x: [-5, 5, -5, 5, 0] } : {}} transition={{ duration: 0.4 }} className="relative group/input">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted transition-colors group-focus-within/input:text-accent-primary z-10 pointer-events-none" />
                          <input id="auth-password" autoComplete={tab === "signup" ? "new-password" : "current-password"} aria-invalid={!!errors.password} aria-describedby="password-error" type={showPassword ? "text" : "password"} {...passwordProps} ref={(e) => { passwordRef(e); passwordInputRef.current = e; }} placeholder={tab === "signin" ? "••••••••" : "Password"} className={cn(`${inputClassName} pl-11 pr-11 text-ellipsis`, (authError.toLowerCase().includes("password") && !authError.toLowerCase().includes("match") || errors.password) && "!border-accent-danger text-accent-danger")} />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-ink-muted hover:text-ink-primary transition-colors focus:outline-none z-10" aria-label={showPassword ? "Hide password" : "Show password"}>
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </motion.div>
                        <AnimatePresence>
                          {errors.password && (
                            <motion.p id="password-error" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="text-[11px] text-accent-danger font-semibold mt-1.5 ml-1">
                              {errors.password.message}
                            </motion.p>
                          )}
                        </AnimatePresence>

                        <AnimatePresence>
                          {tab === "signup" && formPassword.length > 0 && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-2 ml-1">
                              <div className="flex items-center gap-3 w-full pb-0.5">
                                <div className="flex gap-1.5 h-1.5 flex-1">
                                  {[1, 2, 3].map(level => (
                                    <div key={level} className="flex-1 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                                      <motion.div className={cn("h-full", strengthColors[strength])}
                                        initial={{ width: "0%" }}
                                        animate={{ width: strength >= level ? "100%" : "0%" }}
                                        transition={{ duration: 0.3 }}
                                      />
                                    </div>
                                  ))}
                                </div>
                                <p className={cn("text-[10px] font-bold uppercase tracking-wider text-right transition-colors w-[46px] shrink-0", strengthColors[strength].replace('bg-', 'text-'))}>
                                  {strengthLabels[strength]}
                                </p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <AnimatePresence mode="popLayout">
                        {tab === "signup" && (
                          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ ease: "easeOut", duration: 0.2 }} className="group">
                            <label htmlFor="auth-confirm-password" className="sr-only">Confirm Password</label>
                            <motion.div animate={isShaking && authError.toLowerCase().includes("match") ? { x: [-5, 5, -5, 5, 0] } : {}} transition={{ duration: 0.4 }} className="relative group/input">
                              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted transition-colors group-focus-within/input:text-accent-primary z-10 pointer-events-none" />
                              <input id="auth-confirm-password" aria-invalid={!!errors.confirmPassword} aria-describedby="confirm-password-error" type={showConfirmPassword ? "text" : "password"} {...confirmPasswordProps} ref={(e) => { confirmPasswordRef(e); }} placeholder="Confirm password" className={cn(`${inputClassName} pl-11 pr-11 text-ellipsis`, (authError.toLowerCase().includes("match") || errors.confirmPassword) && "!border-accent-danger text-accent-danger")} />
                              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-ink-muted hover:text-ink-primary transition-colors focus:outline-none z-10" aria-label={showConfirmPassword ? "Hide password" : "Show password"}>
                                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </motion.div>
                            <AnimatePresence>
                              {errors.confirmPassword && (
                                <motion.p id="confirm-password-error" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="text-[11px] text-accent-danger font-semibold mt-1.5 ml-1">
                                  {errors.confirmPassword.message}
                                </motion.p>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  )}

                  {view === "reset-password" && (
                    <>
                      <div className="group">
                        <div className="flex justify-between items-center mb-1.5 mt-1">
                          <label htmlFor="auth-reset-password" className="text-[11px] font-bold tracking-wider uppercase" style={{ color: "var(--ink-muted)" }}>
                            NEW PASSWORD
                          </label>
                        </div>
                        <motion.div className="relative group/input">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted transition-colors group-focus-within/input:text-accent-primary z-10 pointer-events-none" />
                          <input id="auth-reset-password" aria-invalid={!!errors.password} aria-describedby="reset-password-error" type={showPassword ? "text" : "password"} {...passwordProps} ref={(e) => { passwordRef(e); passwordInputRef.current = e; }} placeholder="New password" className={cn(`${inputClassName} pl-11 pr-11`, errors.password && "!border-accent-danger text-accent-danger")} />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-ink-muted hover:text-ink-primary transition-colors focus:outline-none z-10" aria-label={showPassword ? "Hide password" : "Show password"}>
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </motion.div>
                        <AnimatePresence>
                          {errors.password && (
                            <motion.p id="reset-password-error" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="text-[11px] text-accent-danger font-semibold mt-1.5 ml-1">
                              {errors.password.message}
                            </motion.p>
                          )}
                        </AnimatePresence>
                        
                        <AnimatePresence>
                          {formPassword.length > 0 && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-2 ml-1">
                              <div className="flex items-center gap-3 w-full pb-0.5">
                                <div className="flex gap-1.5 h-1.5 flex-1">
                                  {[1, 2, 3].map(level => (
                                    <div key={level} className="flex-1 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                                      <motion.div className={cn("h-full", strengthColors[strength])}
                                        initial={{ width: "0%" }}
                                        animate={{ width: strength >= level ? "100%" : "0%" }}
                                        transition={{ duration: 0.3 }}
                                      />
                                    </div>
                                  ))}
                                </div>
                                <p className={cn("text-[10px] font-bold uppercase tracking-wider text-right transition-colors w-[46px] shrink-0", strengthColors[strength].replace('bg-', 'text-'))}>
                                  {strengthLabels[strength]}
                                </p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <div className="group">
                        <div className="flex justify-between items-center mb-1.5 mt-1">
                          <label htmlFor="auth-reset-confirm" className="text-[11px] font-bold tracking-wider uppercase" style={{ color: "var(--ink-muted)" }}>
                            CONFIRM NEW PASSWORD
                          </label>
                        </div>
                        <motion.div className="relative group/input">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted transition-colors group-focus-within/input:text-accent-primary z-10 pointer-events-none" />
                          <input id="auth-reset-confirm" aria-invalid={!!errors.confirmPassword} aria-describedby="reset-confirm-error" type={showConfirmPassword ? "text" : "password"} {...confirmPasswordProps} ref={(e) => { confirmPasswordRef(e); }} placeholder="Confirm password" className={cn(`${inputClassName} pl-11 pr-11`, errors.confirmPassword && "!border-accent-danger text-accent-danger")} />
                          <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-ink-muted hover:text-ink-primary transition-colors focus:outline-none z-10" aria-label={showConfirmPassword ? "Hide password" : "Show password"}>
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </motion.div>
                        <AnimatePresence>
                          {errors.confirmPassword && (
                            <motion.p id="reset-confirm-error" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="text-[11px] text-accent-danger font-semibold mt-1.5 ml-1">
                              {errors.confirmPassword.message}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>
                    </>
                  )}

                  <AnimatePresence>
                    {authError && (
                      <motion.div role="alert" aria-live="assertive" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="flex items-center gap-2 mt-3 mb-1 px-4 py-3 rounded-xl border shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-2xl bg-red-500/10 border-red-500/20">
                          <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
                          <p className="text-xs text-red-500 dark:text-red-400 font-medium leading-relaxed text-left">
                            {authError}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {successMessage && !authError && (
                      <motion.div role="alert" aria-live="polite" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="flex items-center gap-2 mt-3 mb-1 px-4 py-3 rounded-xl border shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-2xl bg-emerald-500/10 border-emerald-500/20">
                          <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                          </div>
                          <p className="text-xs text-emerald-500 dark:text-emerald-400 font-medium leading-relaxed text-left">
                            {successMessage}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.div layout>
                    <button type="submit" disabled={loading}
                      className={cn(
                        "w-full flex items-center justify-center gap-2 rounded-xl py-2.5 sm:py-3 text-[14px] sm:text-[15px] font-bold text-white shadow-lg transition-all duration-300 outline-none hover:shadow-xl mt-4 sm:mt-5 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2",
                        isSuccess ? "bg-emerald-500" : "bg-accent-primary hover:-translate-y-[2px] active:scale-[0.98] hover:bg-emerald-400",
                        loading && "opacity-80 cursor-wait shadow-none hover:translate-y-0"
                      )}>
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                          {view === "verify-code" || view === "verify-phone" ? "Verifying..." : "Please wait..."}
                        </span>
                      ) : isSuccess ? (
                        <motion.span initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center">
                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                          </div>
                          Success
                        </motion.span>
                      ) : (
                        <span className="flex items-center gap-2">
                          {view === "forgot-password" ? "Send Recovery Code" :
                            view === "verify-code" || view === "verify-phone" ? "Verify Code" :
                              view === "reset-password" ? "Reset Password" :
                                tab === "signin" ? "Sign In" : "Create Account"}
                          <ArrowRight className={cn("w-4 h-4 transition-transform duration-300", !loading && "group-hover:translate-x-1")} />
                        </span>
                      )}
                    </button>
                  </motion.div>

                  {view === "auth" && (
                    <div className="mt-4 sm:mt-6 flex flex-col items-center">
                      <div className="flex items-center w-full gap-4 mb-4 sm:mb-5">
                        <div className="h-px flex-1 bg-border-default"></div>
                        <span className="text-[11px] font-semibold tracking-wider text-ink-muted uppercase">Or continue with</span>
                        <div className="h-px flex-1 bg-border-default"></div>
                      </div>
                      
                      <div className="flex flex-row gap-2 sm:gap-3 w-full">
                        <button type="button" onClick={() => handleOAuth('google')} disabled={loading}
                          className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl py-2 sm:py-2.5 px-2 sm:px-4 bg-surface-interactive border border-border-default text-[13px] sm:text-[14px] font-semibold text-ink-primary transition-all hover:bg-surface-hover hover:border-border-emphasis active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
                          <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                          Google
                        </button>
                        <button type="button" onClick={() => handleOAuth('facebook')} disabled={loading}
                          className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl py-2 sm:py-2.5 px-2 sm:px-4 bg-surface-interactive border border-border-default text-[13px] sm:text-[14px] font-semibold text-ink-primary transition-all hover:bg-surface-hover hover:border-border-emphasis active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
                          <svg className="w-4 h-4 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                          Facebook
                        </button>
                      </div>
                    </div>
                  )}

                </motion.div>
              </AnimatePresence>
            </fieldset>
          </form>

        </motion.div>
      </div>

    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background"><div className="w-5 h-5 border-2 border-accent-primary/30 border-t-accent-primary rounded-full animate-spin" /></div>}>
      <AuthContent />
    </Suspense>
  );
}
