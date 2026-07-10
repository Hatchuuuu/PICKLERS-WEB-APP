import { useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "motion/react";
import {
  X, Menu, ArrowRight, Radio, Building, CalendarCheck, UserSearch,
  Search, CalendarDays, CheckCircle2, ChevronDown, Instagram, Twitter, Facebook,
  Star, ShieldCheck, CreditCard, Zap, Users, MapPin, Trophy, Sun, Moon
} from "lucide-react";
import { useTheme } from "next-themes";
import { FACILITIES, OPEN_MATCHES } from "@/data/mockData";
import { PicklersLogo } from "@/components/ui/PicklersLogo";
import { FacilityCard } from "@/components/shared/FacilityCard";
import { MatchCard } from "@/components/shared/MatchCard";
import AnimatedContent from "@/components/ui/AnimatedContent";
import CountUp from "@/components/ui/CountUp";
import GradientText from "@/components/ui/GradientText";
import ShinyText from "@/components/ui/ShinyText";
import { DraggableMarquee } from "@/components/shared/DraggableMarquee";

const shimmerStyles = `
  @keyframes shimmer {
    100% { transform: translateX(100%); }
  }
`;

export function LandingPage() {
  const navigate = useNavigate();
  const [toggle, setToggle] = useState<"facilities" | "open-play">("facilities");
  const [isFetching, setIsFetching] = useState(true);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    // Initial fetch simulation for optimistic UI
    const timer = setTimeout(() => setIsFetching(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleToggle = (val: "facilities" | "open-play") => {
    if (val === toggle) return;
    setToggle(val);
    setIsFetching(true);
    setTimeout(() => setIsFetching(false), 600); // Simulate CDN/Redis cache hit
  };

  // Force scroll to top on page refresh/load
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);

    return () => {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'auto';
      }
    };
  }, []);

  // Scroll-linked navbar
  const { scrollY } = useScroll();
  const navHeight = useTransform(scrollY, [0, 100], [84, 68]);
  const navBackground = useTransform(scrollY, [0, 100], ["rgba(0, 0, 0, 0)", "var(--surface-base)"]);
  const navBorder = "rgba(255, 255, 255, 0.08)";
  const navShadow = useTransform(scrollY, [0, 100], ["none", "0 4px 24px rgba(0,0,0,0.4)"]);
  const navBlur = useTransform(scrollY, [0, 100], ["blur(0px)", "blur(20px)"]);
  const logoScale = useTransform(scrollY, [0, 100], [1, 0.95]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-accent-primary/20">
      {/* Scroll-Linked Navbar */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12"
        style={{
          height: navHeight,
          backgroundColor: navBackground,
          borderBottomWidth: "1px",
          borderBottomStyle: "solid",
          borderBottomColor: navBorder,
          boxShadow: navShadow,
          backdropFilter: navBlur,
          WebkitBackdropFilter: navBlur
        }}
      >
        <div className="flex items-center gap-2">
          <motion.div style={{ scale: logoScale, originX: 0, originY: 0.5 }}>
            <PicklersLogo size={36} />
          </motion.div>
          <ShinyText
            text="PICKLERS"
            className="font-black"
            style={{
              fontFamily: "'Arial Black', Impact, sans-serif",
              letterSpacing: "-0.05em",
              fontSize: useTransform(scrollY, [0, 100], ["1.25rem", "1.125rem"]) as unknown as string
            }}
            color="var(--ink-primary)"
            shineColor="#4abd96"
            speed={3}
            delay={0}
          />
        </div>

        <div className="hidden md:flex items-center gap-8">
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="text-foreground/80 hover:text-foreground transition-colors p-2 rounded-full hover:bg-surface-interactive focus:outline-none"
              aria-label="Toggle Theme"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={theme === "dark" ? "dark" : "light"}
                  initial={{ y: -10, opacity: 0, rotate: -45 }}
                  animate={{ y: 0, opacity: 1, rotate: 0 }}
                  exit={{ y: 10, opacity: 0, rotate: 45 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  {theme === "dark" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                </motion.div>
              </AnimatePresence>
            </button>
          )}
          <button onClick={() => navigate("/auth")} className="text-base py-2.5 font-medium text-secondary-foreground hover:text-foreground transition-colors inline-flex items-center justify-center">
            Log In
          </button>
          <button onClick={() => navigate("/auth?intent=signup")}
            className="text-base px-6 py-2.5 rounded-xl font-semibold active:scale-[0.97] transition-all shadow-sm inline-flex items-center justify-center"
            style={{ background: "var(--accent-primary)", color: "var(--ink-inverse)", boxShadow: "var(--shadow-sm)" }}>
            Sign Up
          </button>
        </div>
        <button className="md:hidden text-foreground" onClick={() => setMobileMenu(v => !v)}>
          {mobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </motion.nav>

      <AnimatePresence>
        {mobileMenu && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="fixed top-[60px] left-0 right-0 z-40 p-4 bg-surface-base/95 border-b border-border backdrop-blur-xl">
            <button onClick={() => { navigate("/auth?intent=signup"); setMobileMenu(false); }}
              className="w-full py-3.5 rounded-[10px] font-semibold shadow-sm"
              style={{ background: "var(--accent-primary)", color: "var(--ink-inverse)" }}>
              Sign Up / Log In
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section id="features" className="relative flex flex-col items-center justify-center text-center px-6 pt-[118px] pb-24 min-h-screen overflow-hidden">


        <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }} className="relative z-10 w-full max-w-4xl mx-auto">
          <div className="relative inline-flex items-center justify-center mb-8 group">
            {/* The Glass Badge Body (Static Glassmorphism) */}
            <div className="relative inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[13px] font-medium w-full h-full"
              style={{
                background: "rgba(255, 255, 255, 0.08)", // White glass background
                backdropFilter: "blur(16px)", // Stronger blur
                WebkitBackdropFilter: "blur(16px)",
                color: "var(--accent-primary)",
                border: "1px solid rgba(255, 255, 255, 0.15)", // Stronger white border
                boxShadow: "0 4px 24px -4px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)" // Glass inner shadow
              }}>
              <motion.div animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}>
                <Radio className="w-3.5 h-3.5" />
              </motion.div>
              #1 Philippines Pickleball Booking App
            </div>

            {/* The Animated Tracing Border (Hollowed out using mask so it doesn't bleed into the glass) */}
            <div className="absolute inset-0 rounded-full p-[1.5px] pointer-events-none overflow-hidden"
              style={{
                mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                WebkitMaskComposite: "xor",
                maskComposite: "exclude"
              }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px]">
                <motion.div
                  className="w-full h-full opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                  style={{
                    background: "conic-gradient(from 0deg, transparent 0 120deg, #3b82f6 180deg, transparent 180deg 300deg, #3b82f6 360deg)"
                  }}
                />
              </div>
            </div>
          </div>

          <h1 className="text-6xl sm:text-7xl md:text-[100px] lg:text-[120px] leading-[0.95] tracking-[-0.03em] mb-[14px] flex justify-center"
            style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, textShadow: "var(--shadow-glow)" }}>
            <GradientText
              colors={["#4abd96", "#93f2d2", "#308c6e", "#6ce3be", "#4abd96"]}
              animationSpeed={4}
              yoyo={false}
              showBorder={false}
              className="px-4"
            >
              PICKLERS
            </GradientText>
          </h1>
          <div className="text-xl sm:text-2xl md:text-[28px] font-bold tracking-[0.15em] md:tracking-[0.2em] mb-8 flex items-center justify-center gap-2 sm:gap-4 md:gap-5 leading-none"
            style={{ color: "var(--ink-primary)" }}>
            <span className="-mr-[0.15em] md:-mr-[0.2em]">FIND</span>
            <span className="text-white text-[1.2em] md:text-[1.3em] tracking-normal opacity-90 shrink-0 leading-none flex items-center justify-center relative -top-[3px]">•</span>
            <span className="-mr-[0.15em] md:-mr-[0.2em]">BOOK</span>
            <span className="text-white text-[1.2em] md:text-[1.3em] tracking-normal opacity-90 shrink-0 leading-none flex items-center justify-center relative -top-[3px]">•</span>
            <span className="-mr-[0.15em] md:-mr-[0.2em]">PLAY</span>
          </div>
          <p className="max-w-2xl mx-auto text-lg sm:text-xl mb-12 leading-relaxed" style={{ color: "var(--ink-secondary)" }}>
            Book premium pickleball courts across the Philippines, join open play sessions,
            connect with players, and manage everything in one place.
          </p>

          <div className="flex flex-row items-center justify-center gap-2 sm:gap-4 mb-8 w-full max-w-xl mx-auto px-2">
            <button onClick={() => navigate("/auth?intent=book")}
              className="px-5 sm:px-8 py-3.5 sm:py-4 rounded-full font-semibold text-[13px] sm:text-base active:scale-[0.98] transition-all relative overflow-hidden group flex items-center justify-center gap-2 sm:gap-2.5 animate-kid-jump whitespace-nowrap bg-accent-primary text-white shadow-[0_8px_32px_-8px_rgba(0,217,139,0.5)]" style={{ animationDelay: "1.5s" }}>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              <div className="absolute top-0 -left-[100%] w-[50%] h-full bg-gradient-to-r from-transparent via-white/90 to-transparent skew-x-[-20deg]" style={{ animation: "button-shine 9s ease infinite", animationDelay: "0s" }} />
              <CalendarCheck className="relative z-10 w-[18px] h-[18px] sm:w-5 sm:h-5" />
              <span className="relative z-10">Book a Court</span>
            </button>
            <button onClick={() => navigate("/auth?intent=open-play")}
              className="px-5 sm:px-8 py-3.5 sm:py-4 rounded-full font-semibold text-[13px] sm:text-base active:scale-[0.98] transition-all relative overflow-hidden group flex items-center justify-center gap-2 sm:gap-2.5 animate-kid-jump whitespace-nowrap"
              style={{ background: "var(--accent-secondary)", color: "#ffffff", boxShadow: "0 8px 32px -8px rgba(59, 130, 246, 0.5)", animationDelay: "2.5s" }}>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              <div className="absolute top-0 -left-[100%] w-[50%] h-full bg-gradient-to-r from-transparent via-white/90 to-transparent skew-x-[-20deg]" style={{ animation: "button-shine 9s ease infinite", animationDelay: "3s" }} />
              <UserSearch className="relative z-10 w-[18px] h-[18px] sm:w-5 sm:h-5" />
              <span className="relative z-10">Join Open Play</span>
            </button>
          </div>

          <button onClick={() => navigate("/auth?intent=owner")}
            className="relative overflow-hidden group flex items-center gap-2 sm:gap-3 pr-4 sm:pr-5 pl-1.5 sm:pl-2 py-1.5 sm:py-2 rounded-full mx-auto transition-all hover:bg-surface-interactive/80 active:scale-95 mt-2 max-w-[95vw]"
            style={{
              border: "1px solid rgba(0, 217, 139, 0.3)",
              boxShadow: "0 0 24px -6px rgba(0, 217, 139, 0.4), inset 0 0 12px -6px rgba(0, 217, 139, 0.2)"
            }}>
            <div className="absolute top-0 -left-[100%] w-[50%] h-full bg-gradient-to-r from-transparent via-white/15 to-transparent skew-x-[-20deg]" style={{ animation: "button-shine 9s ease infinite", animationDelay: "6s" }} />
            <div className="relative z-10 flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full shrink-0"
              style={{ background: "var(--accent-primary-muted)", color: "var(--accent-primary)" }}>
              <Building className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div className="relative z-10 flex items-center gap-1 sm:gap-1.5 text-[12px] sm:text-[14px] font-medium tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
              <span style={{ color: "var(--ink-primary)" }}>Are you a Court Owner?</span>
              <span style={{ color: "var(--accent-primary)" }}>List your court</span>
            </div>
            <ArrowRight className="relative z-10 w-3.5 h-3.5 sm:w-4 sm:h-4 ml-0.5 opacity-80 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" style={{ color: "var(--accent-primary)" }} />
          </button>
        </motion.div>
      </section>

      {/* Trusted Partners Marquee */}
      <style dangerouslySetInnerHTML={{ __html: shimmerStyles }} />
      <section className="py-12 md:py-16 border-y border-solid overflow-hidden flex flex-col items-center relative z-10 border-border/40 bg-surface-base/30" >
        <p className="text-[11px] md:text-[12px] font-semibold tracking-[0.25em] uppercase mb-8 md:mb-12 text-foreground/40 bg-clip-text">TRUSTED BY ELITE CLUBS & FACILITIES</p>
        <DraggableMarquee />
      </section>

      {/* Stats bar */}
      <section className="px-6 py-16 md:py-24 relative z-10">
        <AnimatedContent
          distance={80}
          direction="vertical"
          reverse={false}
          duration={1.2}
          ease="power3.out"
          initialOpacity={0}
          animateOpacity
          scale={0.98}
          threshold={0.15}
        >
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-6">

              {/* Card 1 */}
              <div className="flex flex-col items-center justify-center text-center p-6 md:p-8 rounded-2xl relative overflow-hidden group"
                style={{

                  backdropFilter: "blur(24px)",
                  WebkitBackdropFilter: "blur(24px)",
                  boxShadow: "0 16px 32px -12px rgba(0,0,0,0.5)"
                }}>

                {/* Soft Green Tracing Beam */}
                <div className="absolute inset-0 rounded-2xl pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-500 z-0"
                  style={{
                    padding: "1px",
                    WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                    WebkitMaskComposite: "xor",
                    maskComposite: "exclude",
                  }}>
                  <motion.div className="absolute top-1/2 left-1/2 w-[300%] h-[300%] -translate-x-1/2 -translate-y-1/2"
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                    style={{ background: "conic-gradient(from 0deg, transparent 60%, rgba(0, 217, 139, 0.3) 85%, var(--accent-primary) 100%)" }} />
                </div>

                <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent z-10" />

                <div className="text-3xl md:text-[34px] leading-none font-bold tracking-tight mb-2.5 text-foreground" >
                  <CountUp from={0} to={142} duration={2} />+
                </div>
                <div className="text-[11px] font-bold tracking-[0.15em] uppercase text-foreground" >Venues</div>
              </div>

              {/* Card 2 */}
              <div className="flex flex-col items-center justify-center text-center p-6 md:p-8 rounded-2xl relative overflow-hidden group"
                style={{

                  backdropFilter: "blur(24px)",
                  WebkitBackdropFilter: "blur(24px)",
                  boxShadow: "0 16px 32px -12px rgba(0,0,0,0.5)"
                }}>

                {/* Soft Green Tracing Beam */}
                <div className="absolute inset-0 rounded-2xl pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-500 z-0"
                  style={{
                    padding: "1px",
                    WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                    WebkitMaskComposite: "xor",
                    maskComposite: "exclude",
                  }}>
                  <motion.div className="absolute top-1/2 left-1/2 w-[300%] h-[300%] -translate-x-1/2 -translate-y-1/2"
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                    style={{ background: "conic-gradient(from 0deg, transparent 60%, rgba(0, 217, 139, 0.3) 85%, var(--accent-primary) 100%)" }} />
                </div>

                <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent z-10" />

                <div className="text-3xl md:text-[34px] leading-none font-bold tracking-tight mb-2.5 text-foreground" >
                  <CountUp from={0} to={12450} separator="," duration={2} />+
                </div>
                <div className="text-[11px] font-bold tracking-[0.15em] uppercase text-foreground" >Players</div>
              </div>

              {/* Card 3 */}
              <div className="flex flex-col items-center justify-center text-center p-6 md:p-8 rounded-2xl relative overflow-hidden group"
                style={{

                  backdropFilter: "blur(24px)",
                  WebkitBackdropFilter: "blur(24px)",
                  boxShadow: "0 16px 32px -12px rgba(0,0,0,0.5)"
                }}>

                {/* Soft Green Tracing Beam (Staggered) */}
                <div className="absolute inset-0 rounded-2xl pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-500 z-0"
                  style={{
                    padding: "1px",
                    WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                    WebkitMaskComposite: "xor",
                    maskComposite: "exclude",
                  }}>
                  <motion.div className="absolute top-1/2 left-1/2 w-[300%] h-[300%] -translate-x-1/2 -translate-y-1/2"
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 4, ease: "linear", delay: -2 }}
                    style={{
                      background: "conic-gradient(from 0deg, transparent 60%, rgba(0, 217, 139, 0.3) 85%, var(--accent-primary) 100%)"
                    }} />
                </div>

                <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent z-10" />

                <div className="text-3xl md:text-[34px] leading-none font-bold tracking-tight mb-2.5 flex items-center justify-center gap-1 text-foreground" >
                  <CountUp from={0} to={5} duration={1.5} />–<CountUp from={0} to={10} duration={1.5} />%
                </div>
                <div className="text-[11px] font-bold tracking-[0.15em] uppercase text-foreground" >Service Fee</div>
              </div>

              {/* Card 4 */}
              <div className="flex flex-col items-center justify-center text-center p-6 md:p-8 rounded-2xl relative overflow-hidden group"
                style={{

                  backdropFilter: "blur(24px)",
                  WebkitBackdropFilter: "blur(24px)",
                  boxShadow: "0 16px 32px -12px rgba(0,0,0,0.5)"
                }}>

                {/* Soft Green Tracing Beam (Staggered) */}
                <div className="absolute inset-0 rounded-2xl pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-500 z-0"
                  style={{
                    padding: "1px",
                    WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                    WebkitMaskComposite: "xor",
                    maskComposite: "exclude",
                  }}>
                  <motion.div className="absolute top-1/2 left-1/2 w-[300%] h-[300%] -translate-x-1/2 -translate-y-1/2"
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 4, ease: "linear", delay: -2 }}
                    style={{
                      background: "conic-gradient(from 0deg, transparent 60%, rgba(0, 217, 139, 0.3) 85%, var(--accent-primary) 100%)"
                    }} />
                </div>

                <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent z-10" />

                <div className="text-3xl md:text-[34px] leading-none font-bold tracking-tight mb-2.5 flex items-baseline justify-center gap-1 text-foreground" >
                  <CountUp from={0} to={200} duration={2} /><span className="text-[18px] md:text-[22px] font-medium text-foreground/40">/day</span>
                </div>
                <div className="text-[11px] font-bold tracking-[0.15em] uppercase text-foreground" >Signups</div>
              </div>

            </div>
          </div>
        </AnimatedContent>
      </section>

      {/* Toggle section */}
      <section id="venues" className="px-6 py-24 max-w-6xl mx-auto">
        <AnimatedContent
          distance={40}
          direction="vertical"
          reverse={false}
          duration={0.8}
          ease="power3.out"
          initialOpacity={0}
          animateOpacity
          scale={1}
          threshold={0.2}
          delay={0.1}
        >
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: "'Arial Black', Impact, sans-serif", letterSpacing: "-0.01em" }}>
              Play Pickleball, Anywhere.
            </h2>
            <p className="text-lg" style={{ color: "var(--ink-secondary)" }}>Discover premium facilities and join active matches near you.</p>
          </div>
        </AnimatedContent>

        <div className="flex justify-center mb-12">
          <div className="relative flex rounded-full p-1"
            style={{
              background: "rgba(0, 0, 0, 0.25)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              boxShadow: "inset 0 2px 6px rgba(0,0,0,0.2)"
            }}>
            <motion.div layout className="absolute inset-y-1 rounded-full"
              style={{
                background: toggle === "facilities" ? "var(--accent-primary)" : "var(--accent-secondary)",
                boxShadow: "0 2px 10px rgba(0,0,0,0.2), 0 1px 2px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.15)",
                left: toggle === "facilities" ? "4px" : "calc(50%)",
                width: "calc(50% - 4px)"
              }}
              transition={{ type: "spring", stiffness: 500, damping: 35, mass: 1 }} />
            {(["facilities", "open-play"] as const).map((val, idx) => (
              <button key={val} onClick={() => handleToggle(val)}
                className="relative z-10 w-[140px] sm:w-[160px] flex items-center justify-center py-2 rounded-full text-[13.5px] sm:text-[14.5px] font-medium tracking-tight transition-colors duration-300"
                style={{
                  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
                  WebkitFontSmoothing: "antialiased",
                  textShadow: toggle === val ? "0 1px 2px rgba(0,0,0,0.1)" : "none"
                }}>
                {idx === 0 ? "Pickle Facilities" : "Open Play"}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {isFetching ? (
            <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <div className={toggle === "facilities" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "grid grid-cols-1 md:grid-cols-2 gap-5"}>
                {[1, 2, 3, 4, 5, 6, 7, 8].slice(0, toggle === "facilities" ? 8 : 6).map(i => (
                  <div key={i} className={`rounded-[28px] overflow-hidden relative ${toggle === "facilities" ? "h-[380px]" : "h-[160px]"}`}
                    style={{ boxShadow: "0 8px 32px -8px rgba(0,0,0,0.3)" }}>
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                    <div className="w-full h-full p-5 flex flex-col justify-end opacity-50">
                      <div className="w-1/3 h-4 bg-surface-interactive rounded-full mb-3" />
                      <div className="w-2/3 h-6 bg-surface-interactive rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : toggle === "facilities" ? (
            <motion.div key="fac" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {FACILITIES.slice(0, 8).map((f, i) => (
                  <motion.div key={f.id}
                    className="h-full"
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ delay: Math.min(i, 4) * 0.1, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}>
                    <FacilityCard f={f} onFav={() => { }} onViewCourts={() => navigate("/auth")} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div key="play" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <div id="players" className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {OPEN_MATCHES.map((m, i) => (
                  <motion.div key={m.id}
                    className="h-full"
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ delay: Math.min(i, 4) * 0.1, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}>
                    <MatchCard m={m} publicMode={true} onJoin={() => navigate("/auth")} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Bento Box Features */}
      <section className="px-6 py-24 max-w-6xl mx-auto border-t border-solid relative z-10 border-border" >
        <AnimatedContent distance={40} direction="vertical" duration={0.8} ease="power3.out" initialOpacity={0} animateOpacity scale={1} threshold={0.2}>
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              Built for the modern player.
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: "var(--ink-secondary)" }}>Everything you need to elevate your pickleball experience, wrapped in an interface you'll actually love using.</p>
          </div>
        </AnimatedContent>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[280px]">
          {/* Feature 1 - Large */}
          <motion.div initial={{ opacity: 0, scale: 0.98, y: 20 }} whileInView={{ opacity: 1, scale: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="md:col-span-2 rounded-[32px] p-8 md:p-10 relative overflow-hidden group flex flex-col justify-end bg-surface-raised border border-border backdrop-blur-xl" >
            <div className="absolute top-0 right-0 p-8 text-emerald-400/10 group-hover:text-emerald-400/20 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-700 ease-out"><Trophy className="w-32 h-32 md:w-48 md:h-48" /></div>
            <div className="relative z-10">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-5 border border-emerald-500/20"><ShieldCheck className="w-6 h-6 md:w-7 md:h-7" /></div>
              <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3 tracking-tight">Skill-Based Matchmaking</h3>
              <p className="text-foreground/60 max-w-md leading-relaxed text-[15px] md:text-[16px]">Integrated with DUPR and self-rating systems to ensure you're always playing competitive, fun matches at your exact level.</p>
            </div>
          </motion.div>

          {/* Feature 2 - Small */}
          <motion.div initial={{ opacity: 0, scale: 0.98, y: 20 }} whileInView={{ opacity: 1, scale: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
            className="rounded-[32px] p-8 relative overflow-hidden group flex flex-col justify-end bg-surface-raised border border-border backdrop-blur-xl" >
            <div className="absolute top-0 right-0 p-6 text-blue-400/10 group-hover:text-blue-400/20 group-hover:scale-110 transition-all duration-700 ease-out"><CreditCard className="w-24 h-24" /></div>
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400 mb-4 border border-blue-500/20"><CreditCard className="w-6 h-6" /></div>
              <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2 tracking-tight">Split Payments</h3>
              <p className="text-foreground/60 leading-relaxed text-[14px] md:text-[15px]">No more chasing friends for Venmo. Split court costs instantly.</p>
            </div>
          </motion.div>

          {/* Feature 3 - Small */}
          <motion.div initial={{ opacity: 0, scale: 0.98, y: 20 }} whileInView={{ opacity: 1, scale: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="rounded-[32px] p-8 relative overflow-hidden group flex flex-col justify-end bg-surface-raised border border-border backdrop-blur-xl" >
            <div className="absolute top-0 right-0 p-6 text-purple-400/10 group-hover:text-purple-400/20 group-hover:scale-110 transition-all duration-700 ease-out"><Zap className="w-24 h-24" /></div>
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400 mb-4 border border-purple-500/20"><Zap className="w-6 h-6" /></div>
              <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2 tracking-tight">Instant Booking</h3>
              <p className="text-foreground/60 leading-relaxed text-[14px] md:text-[15px]">Live availability sync. Secure a court in under 15 seconds flat.</p>
            </div>
          </motion.div>

          {/* Feature 4 - Large */}
          <motion.div initial={{ opacity: 0, scale: 0.98, y: 20 }} whileInView={{ opacity: 1, scale: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="md:col-span-2 rounded-[32px] p-8 md:p-10 relative overflow-hidden group flex flex-col justify-end bg-surface-raised border border-border backdrop-blur-xl" >
            <div className="absolute top-0 right-0 p-8 text-orange-400/10 group-hover:text-orange-400/20 group-hover:scale-110 group-hover:translate-x-4 transition-all duration-700 ease-out"><Users className="w-32 h-32 md:w-48 md:h-48" /></div>
            <div className="relative z-10">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-orange-500/20 flex items-center justify-center text-orange-400 mb-5 border border-orange-500/20"><Users className="w-6 h-6 md:w-7 md:h-7" /></div>
              <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3 tracking-tight">Vibrant Community</h3>
              <p className="text-foreground/60 max-w-md leading-relaxed text-[15px] md:text-[16px]">Join clubs, climb local leaderboards, chat with players, and get notified when your favorite group hosts an open play.</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-6 py-24 border-t border-solid relative overflow-hidden z-10 border-border" >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[400px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10">
          <AnimatedContent distance={40} direction="vertical" duration={0.8} ease="power3.out" initialOpacity={0} animateOpacity scale={1} threshold={0.2}>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                Loved by the community.
              </h2>
              <p className="text-lg" style={{ color: "var(--ink-secondary)" }}>Join thousands of players already finding their matches.</p>
            </div>
          </AnimatedContent>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: "Miguel Santos", role: "3.5 Player", text: "Finding an open play at my skill level used to be a nightmare of group chats. Picklers makes it effortless.", rating: 5 },
              { name: "Sarah Lim", role: "4.0 Player", text: "The split payment feature alone makes this app worth it. No more fronting the court fee and tracking down Gcash transfers.", rating: 5 },
              { name: "The Picklerry", role: "Partner Venue", text: "Since joining the platform, our daytime court utilization has gone up 40%. The management dashboard is incredibly intuitive.", rating: 5 },
            ].map((t, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                className="rounded-[32px] p-8 relative group cursor-default transition-all duration-300 hover:scale-[1.02] bg-surface-raised border border-border backdrop-blur-xl" >
                <div className="flex items-center gap-1 mb-6">
                  {[...Array(t.rating)].map((_, j) => <Star key={j} className="w-4 h-4 fill-emerald-500 text-emerald-500" />)}
                </div>
                <p className="text-[16px] leading-relaxed mb-8 text-foreground/80 font-medium">"{t.text}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-[15px] border border-emerald-500/30">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-[15px] text-foreground tracking-tight">{t.name}</div>
                    <div className="text-[13px] text-foreground/40 font-medium mt-0.5">{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="px-6 py-24 border-t border-solid relative border-border bg-background">
        <div className="max-w-5xl mx-auto">
          <AnimatedContent distance={40} direction="vertical" duration={0.8} ease="power3.out" initialOpacity={0} animateOpacity scale={1} threshold={0.2}>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                How It Works
              </h2>
              <p className="text-lg" style={{ color: "var(--ink-secondary)" }}>From finding a court to the first serve in three easy steps.</p>
            </div>
          </AnimatedContent>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 relative">
            {/* Connection line for desktop */}
            <div className="hidden md:block absolute top-[48px] left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent z-0" />

            {[
              { icon: <Search className="w-6 h-6" />, title: "Find a Court", desc: "Browse premium pickleball facilities near you, check real-time availability, and compare court fees." },
              { icon: <CalendarDays className="w-6 h-6" />, title: "Book & Pay", desc: "Secure your court with a few taps. Split the cost with friends or keep it exclusive. Cashless and hassle-free." },
              { icon: <CheckCircle2 className="w-6 h-6" />, title: "Show Up & Play", desc: "Just arrive at the venue, show your booking confirmation, and start playing. We handle the rest." }
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1], delay: i * 0.1 }}
                className="relative z-10 flex flex-col items-center text-center group"
              >
                <div className="w-24 h-24 mb-6 rounded-3xl flex items-center justify-center relative transition-transform duration-300 group-hover:scale-105 group-hover:-translate-y-1 bg-surface-raised border border-border backdrop-blur-xl" >
                  <div className="absolute inset-0 rounded-3xl bg-emerald-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="text-emerald-400 group-hover:text-emerald-300 transition-colors duration-300">
                    {step.icon}
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3 tracking-tight">{step.title}</h3>
                <p className="text-[15px] leading-relaxed max-w-[280px]" style={{ color: "var(--ink-secondary)" }}>
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="px-6 py-24 border-t border-solid border-border" >
        <div className="max-w-3xl mx-auto">
          <AnimatedContent distance={40} direction="vertical" duration={0.8} ease="power3.out" initialOpacity={0} animateOpacity scale={1} threshold={0.2}>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                Frequently Asked Questions
              </h2>
            </div>
          </AnimatedContent>

          <div className="flex flex-col gap-3">
            {[
              { q: "Is Picklers free to use?", a: "Yes, joining the platform and browsing venues is completely free. You only pay for the courts you book or the open play sessions you join, plus a small platform fee." },
              { q: "How do cancellations work?", a: "You can cancel any booking up to 24 hours in advance for a full refund. Cancellations made within 24 hours are subject to the venue's specific policy." },
              { q: "Can I host my own private matches?", a: "Absolutely. You can book a court and keep it private for your group, or open it up for others to join and split the cost." },
              { q: "Are there skill levels for open play?", a: "Yes! Every open play session displays the target DUPR or self-rating skill level, so you'll always find a match that fits your competitive level." }
            ].map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1], delay: i * 0.05 }}
                className="overflow-hidden rounded-2xl transition-colors duration-300 cursor-pointer"
                style={{
                  background: openFaq === i ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
                  border: "1px solid",
                  borderColor: openFaq === i ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)"
                }}
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <div className="px-6 py-5 flex items-center justify-between">
                  <h4 className="text-base font-semibold tracking-tight pr-4 text-foreground" >
                    {faq.q}
                  </h4>
                  <motion.div
                    animate={{ rotate: openFaq === i ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                    className="text-emerald-500/70"
                  >
                    <ChevronDown className="w-5 h-5" />
                  </motion.div>
                </div>
                <AnimatePresence initial={false}>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                    >
                      <div className="px-6 pb-5 pt-0 text-[15px] leading-relaxed" style={{ color: "var(--ink-muted)" }}>
                        <motion.div
                          initial={{ y: -8 }}
                          animate={{ y: 0 }}
                          exit={{ y: -8 }}
                          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                        >
                          {faq.a}
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* Premium Grid Footer */}
      <footer className="px-6 py-16 md:py-24 border-t border-solid" style={{ borderColor: "var(--border-subtle)", background: "var(--surface-base)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 mb-16">
            <div className="md:col-span-1">
              <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex items-center gap-2 mb-6 cursor-pointer hover:opacity-80 transition-opacity">
                <PicklersLogo size={36} />
                <ShinyText text="PICKLERS" className="text-xl font-black" style={{ fontFamily: "'Arial Black', Impact, sans-serif", letterSpacing: "-0.05em", paddingRight: "0.1em" }} color="var(--ink-primary)" shineColor="#4abd96" speed={3} delay={0} />
              </button>
              <p className="text-[15px] leading-relaxed mb-8" style={{ color: "var(--ink-muted)" }}>
                The Philippines' premier pickleball booking and community platform. Find courts, join matches, and play.
              </p>
              <div className="flex items-center gap-4 text-foreground/40">
                <button className="hover:text-emerald-400 transition-colors duration-200 cursor-pointer"><Instagram className="w-5 h-5" /></button>
                <button className="hover:text-emerald-400 transition-colors duration-200 cursor-pointer"><Facebook className="w-5 h-5" /></button>
                <button className="hover:text-emerald-400 transition-colors duration-200 cursor-pointer"><Twitter className="w-5 h-5" /></button>
              </div>
            </div>

            <div className="md:col-span-1 md:col-start-3">
              <h4 className="font-semibold mb-6 tracking-tight" style={{ color: "var(--ink-primary)" }}>Platform</h4>
              <ul className="flex flex-col gap-4">
                <li><button onClick={() => scrollTo("venues")} className="text-[15px] hover:text-emerald-400 transition-colors duration-200" style={{ color: "var(--ink-secondary)" }}>Find Courts</button></li>
                <li><button onClick={() => { setToggle("open-play"); scrollTo("venues"); }} className="text-[15px] hover:text-emerald-400 transition-colors duration-200" style={{ color: "var(--ink-secondary)" }}>Open Play</button></li>
                <li><button onClick={() => navigate("/auth?intent=owner")} className="text-[15px] hover:text-emerald-400 transition-colors duration-200" style={{ color: "var(--ink-secondary)" }}>List Your Court</button></li>
                <li><button className="text-[15px] hover:text-emerald-400 transition-colors duration-200" style={{ color: "var(--ink-secondary)" }}>Pricing</button></li>
              </ul>
            </div>

            <div className="md:col-span-1">
              <h4 className="font-semibold mb-6 tracking-tight" style={{ color: "var(--ink-primary)" }}>Company</h4>
              <ul className="flex flex-col gap-4">
                <li><button className="text-[15px] hover:text-emerald-400 transition-colors duration-200" style={{ color: "var(--ink-secondary)" }}>About Us</button></li>
                <li><button className="text-[15px] hover:text-emerald-400 transition-colors duration-200" style={{ color: "var(--ink-secondary)" }}>Careers</button></li>
                <li><button className="text-[15px] hover:text-emerald-400 transition-colors duration-200" style={{ color: "var(--ink-secondary)" }}>Contact Support</button></li>
                <li><button className="text-[15px] hover:text-emerald-400 transition-colors duration-200" style={{ color: "var(--ink-secondary)" }}>Privacy & Terms</button></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-solid" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
            <span className="text-[14px]" style={{ color: "var(--ink-muted)" }}>© 2026 Picklers PH. All rights reserved.</span>
            <div className="flex gap-6 text-[14px]" style={{ color: "var(--ink-muted)" }}>
              <button className="hover:text-emerald-400 transition-colors duration-200">Terms of Service</button>
              <button className="hover:text-emerald-400 transition-colors duration-200">Privacy Policy</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
