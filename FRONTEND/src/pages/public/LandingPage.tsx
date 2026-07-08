import { useNavigate } from "react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Menu,
  ArrowRight, Radio
} from "lucide-react";
import { useCountUp } from "@/lib/utils";
import { FACILITIES, OPEN_MATCHES } from "@/data/mockData";
import { PicklersLogo } from "@/components/ui/PicklersLogo";
import { FacilityCard } from "@/components/shared/FacilityCard";
import { MatchCard } from "@/components/shared/MatchCard";


export function LandingPage() {
  const navigate = useNavigate();
  const [toggle, setToggle] = useState<"facilities" | "open-play">("facilities");
  const [mobileMenu, setMobileMenu] = useState(false);
  const venues = useCountUp(142);
  const players = useCountUp(12450);
  const regs = useCountUp(200);

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'Outfit', sans-serif" }}>
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
        style={{ background: "rgba(8,15,46,0.85)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(0,212,255,0.08)" }}>
        <div className="flex items-center gap-2">
          <PicklersLogo size={26} />
          <span className="text-xl font-bold tracking-wider" style={{ fontFamily: "'Montserrat', sans-serif", color: "#00d4ff" }}>PICKLERS</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-blue-200">
          {["Features", "Venues", "Players"].map(l => (
            <a key={l} href="#" className="hover:text-white transition-colors">{l}</a>
          ))}
        </div>
        <div className="hidden md:flex items-center gap-3">
          <button onClick={() => navigate("/auth")} className="text-sm text-blue-200 hover:text-white px-4 py-2 transition-colors">Log In</button>
          <button onClick={() => navigate("/auth")} className="text-sm px-4 py-2 rounded-full font-medium active:scale-[0.97] transition-all"
            style={{ background: "#00d4ff", color: "#080f2e" }}>Sign Up</button>
        </div>
        <button className="md:hidden text-white" onClick={() => setMobileMenu(v => !v)}>
          {mobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      <AnimatePresence>
        {mobileMenu && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="fixed top-16 left-0 right-0 z-40 p-4"
            style={{ background: "rgba(8,15,46,0.98)", borderBottom: "1px solid rgba(0,212,255,0.1)" }}>
            <button onClick={() => { navigate("/auth"); setMobileMenu(false); }}
              className="w-full py-3 rounded-xl font-medium" style={{ background: "#00d4ff", color: "#080f2e" }}>
              Sign Up / Log In
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 pt-36 pb-20 min-h-screen overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20"
            style={{ background: "radial-gradient(circle, #00d4ff 0%, transparent 70%)" }} />
          <div className="absolute bottom-0 left-1/4 w-80 h-80 rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #22c55e 0%, transparent 70%)" }} />
        </div>

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }} className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-6 border"
            style={{ background: "rgba(0,212,255,0.1)", borderColor: "rgba(0,212,255,0.3)", color: "#00d4ff" }}>
            <Radio className="w-3 h-3" />
            #1 Philippines Pickleball Booking App
          </div>

          <h1 className="text-7xl sm:text-8xl md:text-[120px] leading-none tracking-tight mb-3"
            style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, textShadow: "0 0 80px rgba(0,212,255,0.4)", color: "#fff" }}>
            PICKLERS
          </h1>
          <div className="text-2xl sm:text-3xl font-semibold tracking-[0.3em] mb-6"
            style={{ fontFamily: "'Montserrat', sans-serif", color: "#00d4ff" }}>
            FIND. BOOK. PLAY.
          </div>
          <p className="max-w-xl mx-auto text-blue-200 text-base sm:text-lg mb-10 leading-relaxed">
            Book premium pickleball courts across the Philippines, join open play sessions,
            connect with players, and manage everything in one place.
          </p>

          <div className="flex flex-row items-center justify-center gap-4 mb-6 w-full max-w-sm mx-auto">
            <button onClick={() => navigate("/auth")}
              className="flex-1 py-3.5 rounded-xl font-semibold text-base active:scale-[0.97]"
              style={{ background: "#22c55e", color: "#fff", boxShadow: "0 8px 32px rgba(34,197,94,0.3)", transition: "opacity 150ms ease-out, transform 100ms ease-out" }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
              Book a Court
            </button>
            <button onClick={() => navigate("/auth")}
              className="flex-1 py-3.5 rounded-xl font-semibold text-base active:scale-[0.97] border-2"
              style={{ borderColor: "#00d4ff", color: "#00d4ff", transition: "background-color 150ms ease-out, transform 100ms ease-out" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,212,255,0.08)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
              Join Open Play
            </button>
          </div>

          <button onClick={() => navigate("/app/owner")}
            className="text-sm text-blue-300 hover:text-white transition-colors flex items-center gap-1 mx-auto">
            Are you a Court Owner? List your Court <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      </section>

      {/* Stats bar */}
      <section className="px-6 py-10 border-y border-border" style={{ background: "rgba(15,29,71,0.6)" }}>
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-white font-mono">{venues.toLocaleString()}</div>
            <div className="text-sm text-blue-300 mt-1">Venues</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white font-mono">{players.toLocaleString()}</div>
            <div className="text-sm text-blue-300 mt-1">Active Players</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white font-mono">5–10%</div>
            <div className="text-sm text-blue-300 mt-1">Service Fee</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white font-mono">{regs}/day</div>
            <div className="text-sm text-blue-300 mt-1">Registrations</div>
          </div>
        </div>
      </section>

      {/* Toggle section */}
      <section className="px-6 py-16 max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold mb-2" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            Play Pickleball, Anywhere.
          </h2>
          <p className="text-blue-200">Discover premium facilities and join active matches near you.</p>
        </div>

        <div className="flex justify-center mb-10">
          <div className="relative flex rounded-full p-1 gap-1"
            style={{ background: "rgba(15,29,71,0.8)", border: "1px solid rgba(0,212,255,0.15)" }}>
            <motion.div layout className="absolute inset-y-1 rounded-full"
              style={{ background: "#00d4ff", left: toggle === "facilities" ? "4px" : "calc(50%)", width: "calc(50% - 4px)" }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }} />
            {(["facilities", "open-play"] as const).map((val, idx) => (
              <button key={val} onClick={() => setToggle(val)}
                className="relative z-10 px-6 py-2.5 rounded-full text-sm font-semibold transition-colors duration-200"
                style={{ color: toggle === val ? "#080f2e" : "#a0b4e0" }}>
                {idx === 0 ? "Pickle Facilities" : "Open Play"}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {toggle === "facilities" ? (
            <motion.div key="fac" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {FACILITIES.map((f, i) => (
                  <motion.div key={f.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, ease: "easeOut" }}>
                    <FacilityCard f={f} onFav={() => {}} onViewCourts={() => navigate("/auth")} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div key="play" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {OPEN_MATCHES.map((m, i) => (
                  <motion.div key={m.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, ease: "easeOut" }}>
                    <MatchCard m={m} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <footer className="px-6 py-10 border-t border-border text-center text-sm text-muted-foreground">
        <div className="flex items-center justify-center gap-2 mb-1">
          <PicklersLogo size={20} />
          <span className="font-bold tracking-wider" style={{ fontFamily: "'Montserrat', sans-serif", color: "#00d4ff" }}>PICKLERS</span>
        </div>
        <span>© 2026 Picklers PH. All rights reserved.</span>
      </footer>
    </div>
  );
}
