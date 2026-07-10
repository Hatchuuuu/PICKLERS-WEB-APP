import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, X, Check, Eye, EyeOff } from "lucide-react";
import { LIVE_COURTS, BOOKING_REQUESTS } from "@/data/mockData";
import { CourtCard } from "@/pages/owner/CourtCard";
import { useAppUIStore } from "@/store/useUIStore";
import { useLiveCourts, useUpdateCourt, useBookingRequests, useResolveRequest } from "@/hooks/useCourts";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

export function OwnerDashboard() {
  const queryClient = useQueryClient();
  const { activeOwnerTab: activeTab, setActiveOwnerTab: setActiveTab, showMetrics, setShowMetrics } = useAppUIStore();
  
  const { data: courts = [], isLoading: courtsLoading } = useLiveCourts();
  const { mutate: updateCourt } = useUpdateCourt();
  
  const { data: requests = [], isLoading: requestsLoading } = useBookingRequests();
  const { mutate: resolveRequest } = useResolveRequest();

  const [requestSuccess, setRequestSuccess] = useState<{msg: string, type: "success" | "danger"} | null>(null);
  const [declineModalId, setDeclineModalId] = useState<string | null>(null);
  const [acceptModalId, setAcceptModalId] = useState<string | null>(null);
  const [resolvedRequests, setResolvedRequests] = useState<{id: string, player: string, court: string, total: number, action: "accepted" | "declined"}[]>([]);
  const [timedUpCourts, setTimedUpCourts] = useState<number[]>([]);
  
  const [isFetchingMetrics, setIsFetchingMetrics] = useState(false);
  const prevShowMetrics = useRef(showMetrics);

  useEffect(() => {
    // Simulate slow DB aggregations (1.5s) when metrics are toggled on
    if (showMetrics && !prevShowMetrics.current) {
      setIsFetchingMetrics(true);
      const timer = setTimeout(() => setIsFetchingMetrics(false), 1500);
      return () => clearTimeout(timer);
    }
    prevShowMetrics.current = showMetrics;
  }, [showMetrics]);

  function handleEndSession(id: number) {
    updateCourt({ id, status: "available", player: null, remaining: 0, maxTime: 0 });
    setTimedUpCourts(prev => prev.filter(cId => cId !== id));
  }



  function handleRequestAction(id: string, action: "accepted" | "declined") {
    const req = requests.find(r => r.id === id);
    if (req) {
      setResolvedRequests(prev => [{ ...req, action }, ...prev]);
    }
    resolveRequest(id);
    setRequestSuccess({ 
      msg: `Booking request ${action}`, 
      type: action === "accepted" ? "success" : "danger" 
    });
    setTimeout(() => setRequestSuccess(null), 3000);
  }

  return (
    <div className="p-4 max-w-6xl mx-auto w-full relative">

      <div className="relative h-[68px] mb-4 -mt-[1px] flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <h1 className="text-[26px] min-[390px]:text-[28px] md:text-[32px] font-extrabold tracking-tight leading-none mb-1.5 whitespace-nowrap" style={{ color: "var(--ink-primary)" }}>
              Facility Dashboard
            </h1>
            <p className="text-[13px] font-medium leading-relaxed" style={{ color: "var(--ink-muted)" }}>
              Manage your courts and track performance
            </p>
          </motion.div>

        {/* Dynamic Island Notification Pill */}
        <AnimatePresence>
          {requests.length > 0 && (
            <motion.div
              initial={{ y: -20, opacity: 0, scale: 0.8 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -20, opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 400, damping: 25, mass: 0.8 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/90 backdrop-blur-md rounded-full px-4 py-2 hidden md:flex items-center gap-3 shadow-2xl z-50 border border-white/10"
              style={{ boxShadow: "0 10px 40px rgba(0,217,139,0.15)" }}
            >
              <motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }} 
                transition={{ repeat: Infinity, duration: 2, ease: [0.32, 0.72, 0, 1] }}
                className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" 
              />
              <span className="text-white text-[13px] font-semibold tracking-wide">
                {requests.length} New Request{requests.length > 1 ? 's' : ''}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <button onClick={() => setShowMetrics(!showMetrics)} 
          className="p-2 -mt-6 rounded-full transition-colors active:scale-95 shrink-0 z-10 relative"
          style={{ 
            color: showMetrics ? "var(--accent-primary)" : "var(--ink-muted)",
            background: showMetrics ? "rgba(0, 217, 139, 0.1)" : "transparent"
          }}
          aria-label={showMetrics ? "Hide metrics" : "Show metrics"}>
          {showMetrics ? <Eye className="w-8 h-8 transition-colors" /> : <EyeOff className="w-8 h-8 transition-colors" />}
        </button>
      </div>

      <AnimatePresence>

        {requestSuccess && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl mb-5"
            style={{ 
              background: requestSuccess.type === "success" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", 
              border: `1px solid ${requestSuccess.type === "success" ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}` 
            }}>
            {requestSuccess.type === "success" ? (
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <X className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span className={`text-sm font-medium ${requestSuccess.type === "success" ? "text-emerald-400" : "text-red-400"}`}>
              {requestSuccess.msg}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {showMetrics && (
          <motion.div
            initial={{ height: 0, opacity: 0, scale: 0.98, filter: "blur(4px)" }}
            animate={{ height: "auto", opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ height: 0, opacity: 0, scale: 0.98, filter: "blur(4px)" }}
            transition={{ duration: 0.4, type: "spring", bounce: 0.15 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
              {isFetchingMetrics ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={`skeleton-${i}`} className="rounded-xl p-4 overflow-hidden relative" style={{ background: "var(--surface-raised)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                    <div className="w-20 h-3 bg-white/10 rounded-full mb-3" />
                    <div className="w-28 h-6 bg-white/20 rounded-full mb-2" />
                    <div className="w-12 h-3 bg-white/10 rounded-full" />
                  </div>
                ))
              ) : (
                [
                  { label: "Monthly Revenue", value: "₱48,200", change: "+12%" },
                  { label: "Today's Revenue", value: "₱3,200", change: "+5%" },
                  { label: "Active Bookings", value: "12", change: "now" },
                  { label: "New Players", value: "8", change: "today" },
                  { label: "Repeaters", value: "45%", change: "+3%" },
                ].map((m, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-xl p-4" style={{ background: "var(--surface-raised)", border: "1px solid var(--accent-primary-muted)" }}>
                    <div className="text-xs text-muted-foreground mb-1">{m.label}</div>
                    <div className="text-xl font-bold font-mono text-foreground">{m.value}</div>
                    <div className="text-xs mt-0.5 text-emerald-400">{m.change}</div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Segmented Control (Apple iOS Style) */}
      <div className="xl:hidden flex bg-white/[0.08] p-1 rounded-full mb-6">
        <motion.button
          onClick={() => setActiveTab("courts")}
          className="flex-1 relative py-2.5 text-[14px] transition-colors z-10 rounded-full"
          animate={timedUpCourts.length > 0 && activeTab !== "courts" ? { scale: [1, 1.02, 1] } : {}}
          transition={{ repeat: Infinity, duration: 2, ease: [0.32, 0.72, 0, 1] }}
          style={{ 
            color: activeTab === "courts" ? "#1a1a1a" : "rgba(255,255,255,0.5)",
            fontWeight: activeTab === "courts" ? "700" : "500",
            border: "1px solid transparent"
          }}
        >
          {activeTab === "courts" && (
            <motion.div layoutId="owner-tab-indicator" className="absolute inset-0 rounded-full -z-10"
              style={{ background: "#FBBF24", boxShadow: "0 3px 8px rgba(251,191,36,0.3), 0 1px 1px rgba(0,0,0,0.1)" }}
              transition={{ type: "spring", stiffness: 500, damping: 35 }} />
          )}
          <span className="flex items-center gap-1.5 justify-center">
            Live Courts
            <AnimatePresence>
              {timedUpCourts.length > 0 && (
                <motion.span 
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="text-[10px] px-1.5 py-0.5 rounded-full" 
                  style={{ 
                    background: "#ff4b4b",
                    color: "#ffffff",
                    fontWeight: "800"
                  }}>
                  {timedUpCourts.length}
                </motion.span>
              )}
            </AnimatePresence>
          </span>
        </motion.button>
        <motion.button
          onClick={() => setActiveTab("requests")}
          className="flex-1 relative py-2.5 text-[14px] transition-colors z-10 flex items-center justify-center gap-1.5 rounded-full"
          animate={requests.length > 0 && activeTab !== "requests" ? { scale: [1, 1.02, 1] } : {}}
          transition={{ repeat: Infinity, duration: 2, ease: [0.32, 0.72, 0, 1] }}
          style={{ 
            color: activeTab === "requests" ? "#1a1a1a" : "rgba(255,255,255,0.5)",
            fontWeight: activeTab === "requests" ? "700" : "500",
            border: "1px solid transparent"
          }}
        >
          {activeTab === "requests" && (
            <motion.div layoutId="owner-tab-indicator" className="absolute inset-0 rounded-full -z-10"
              style={{ background: "#FBBF24", boxShadow: "0 3px 8px rgba(251,191,36,0.3), 0 1px 1px rgba(0,0,0,0.1)" }}
              transition={{ type: "spring", stiffness: 500, damping: 35 }} />
          )}
          <span className="flex items-center gap-1.5 justify-center">
            Requests
            <AnimatePresence>
              {requests.length > 0 && (
                <motion.span 
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="text-[10px] px-1.5 py-0.5 rounded-full" 
                  style={{ 
                    background: "#ff4b4b",
                    color: "#ffffff",
                    fontWeight: "800"
                  }}>
                  {requests.length}
                </motion.span>
              )}
            </AnimatePresence>
          </span>
        </motion.button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className={cn("xl:col-span-2 order-2 xl:order-1", activeTab !== "courts" && "hidden xl:block")}>
          <div className="flex items-center gap-2 mb-3 hidden xl:flex">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Live Courts</h2>
            <AnimatePresence>
              {timedUpCourts.length > 0 && (
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ scale: { repeat: Infinity, duration: 2, ease: [0.32, 0.72, 0, 1] }, opacity: { repeat: Infinity, duration: 2, ease: [0.32, 0.72, 0, 1] } }}
                  className="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.8)]"
                  style={{ background: "#FBBF24" }}
                />
              )}
            </AnimatePresence>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <AnimatePresence mode="popLayout">
              {courtsLoading ? (
                <>
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <motion.div
                      key={`skeleton-${i}`}
                      layoutId={`court-card-${i}`}
                      initial={{ opacity: 0, filter: "blur(4px)", scale: 0.95 }}
                      animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
                      exit={{ opacity: 0, filter: "blur(4px)", scale: 0.95 }}
                      transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                      className="bg-card rounded-[24px] border border-white/5 p-4 h-[160px] flex flex-col justify-between shadow-sm overflow-hidden relative"
                    >
                      <div className="w-12 h-12 rounded-full bg-white/5 animate-pulse" />
                      <div className="space-y-2 mt-4">
                        <div className="h-4 bg-white/5 rounded-full w-2/3 animate-pulse" />
                        <div className="h-3 bg-white/5 rounded-full w-1/2 animate-pulse" />
                      </div>
                    </motion.div>
                  ))}
                </>
              ) : (
                <>
                  {courts.map((c, idx) => (
                    <motion.div 
                      key={c.id} 
                      layoutId={`court-card-${idx + 1}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                    >
                      <CourtCard 
                        court={c} 
                        onEnd={() => handleEndSession(c.id)} 
                        onAlertChange={(isAlert) => {
                          setTimedUpCourts(prev => {
                            if (isAlert && !prev.includes(c.id)) return [...prev, c.id];
                            if (!isAlert && prev.includes(c.id)) return prev.filter(id => id !== c.id);
                            return prev;
                          });
                        }}
                      />
                    </motion.div>
                  ))}
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
        <div className={cn("order-1 xl:order-2", activeTab !== "requests" && "hidden xl:block")}>
          <div className="flex items-center justify-between mb-3 hidden xl:flex">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Requests</h2>
            {requests.length > 0 && (
              <motion.span 
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 2, ease: [0.32, 0.72, 0, 1] }}
                className="text-xs px-2 py-0.5 rounded-full shadow-[0_0_12px_rgba(52,211,153,0.3)]" 
                style={{ 
                  background: "var(--accent-primary)",
                  color: "var(--surface-base)",
                  fontWeight: "800",
                }}>
                {requests.length}
              </motion.span>
            )}
          </div>
          <div className="flex flex-col gap-3">
            {requests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm flex flex-col items-center gap-4">
                <p>No pending requests</p>
                <motion.button 
                  onClick={() => queryClient.setQueryData(['bookingRequests'], BOOKING_REQUESTS)}
                  className="px-4 py-2 rounded-full text-[13px] font-bold transition-all"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
                  whileHover={{ backgroundColor: "rgba(255,255,255,0.1)" }}
                  whileTap={{ scale: 0.95 }}
                >
                  Reload Mock Requests
                </motion.button>
              </div>
            ) : requests.map(r => (
              <div key={r.id} className="rounded-3xl p-5 transition-all" style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.05)", borderTop: "1px solid rgba(255, 255, 255, 0.1)", backdropFilter: "blur(20px)", boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)" }}>
                <div className="text-[15px] font-bold text-foreground mb-0.5 tracking-tight">{r.player}</div>
                <div className="text-[13px] text-muted-foreground">{r.court}</div>
                <div className="text-[13px] text-muted-foreground">{r.time}</div>
                <div className="text-cyan-400 font-mono text-[15px] font-bold mt-2">₱{r.total.toLocaleString()}</div>
                <div className="flex gap-3 mt-4">
                  <button onClick={() => setAcceptModalId(r.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full text-xs font-bold active:scale-[0.97] transition-all shadow-lg hover:opacity-90"
                    style={{ background: "var(--accent-success)", color: "#fff", boxShadow: "0 4px 12px rgba(34,197,94,0.3)" }}>
                    <Check className="w-3.5 h-3.5" /> Accept
                  </button>
                  <motion.button onClick={() => setDeclineModalId(r.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full text-xs font-bold transition-all"
                    style={{ background: "rgba(255,255,255,0.06)", color: "var(--ink-secondary)", border: "1px solid rgba(255,255,255,0.1)" }}
                    whileHover={{ backgroundColor: "rgba(255,255,255,0.1)" }}
                    whileTap={{ scale: 0.97 }}>
                    <X className="w-3.5 h-3.5" /> Decline
                  </motion.button>
                </div>
              </div>
            ))}
          </div>

          {/* Resolved Requests History */}
          {resolvedRequests.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Recent Activity</h2>
              <div className="flex flex-col gap-3">
                {resolvedRequests.map(r => (
                  <div key={r.id} className="rounded-2xl p-4 flex items-center justify-between"
                    style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.05)", opacity: 0.8 }}>
                    <div>
                      <div className="text-[14px] font-bold text-foreground mb-0.5">{r.player}</div>
                      <div className="text-[12px] text-muted-foreground">{r.court}</div>
                    </div>
                    <div className={cn("text-[11px] px-2.5 py-1 rounded-full font-bold", 
                      r.action === "accepted" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400")}>
                      {r.action.toUpperCase()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {acceptModalId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
               onClick={() => setAcceptModalId(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} 
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl p-6 shadow-2xl border text-center"
              style={{ background: "rgba(30, 30, 32, 0.75)", backdropFilter: "blur(40px) saturate(150%)", borderColor: "rgba(255,255,255,0.15)" }}>
              <h3 className="text-xl font-bold text-white mb-2">Are you sure you want to accept?</h3>
              <p className="text-[14px] text-white/60 mb-6 leading-relaxed">
                This will lock in the court schedule and notify the player that their booking is confirmed.
              </p>
              <div className="flex flex-col gap-3">
                <button onClick={() => { handleRequestAction(acceptModalId, "accepted"); setAcceptModalId(null); }} 
                  className="w-full py-3.5 rounded-full font-bold active:scale-[0.98] transition-opacity hover:opacity-90 shadow-lg"
                  style={{ background: "#22c55e", color: "#ffffff" }}>
                  Yes
                </button>
                <button onClick={() => setAcceptModalId(null)} 
                  className="w-full py-3.5 rounded-full font-bold active:scale-[0.98] transition-opacity hover:opacity-90 shadow-lg"
                  style={{ background: "rgba(255, 255, 255, 0.1)", color: "#ffffff", border: "1px solid rgba(255, 255, 255, 0.2)" }}>
                  No
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {declineModalId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
               onClick={() => setDeclineModalId(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} 
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl p-6 shadow-2xl border text-center"
              style={{ background: "rgba(30, 30, 32, 0.75)", backdropFilter: "blur(40px) saturate(150%)", borderColor: "rgba(255,255,255,0.15)" }}>
              <h3 className="text-xl font-bold text-white mb-2">Are you sure you want to cancel?</h3>
              <p className="text-[14px] text-white/60 mb-6 leading-relaxed">This will reject the reservation request and notify the player. This action cannot be undone.</p>
              <div className="flex flex-col gap-3">
                <button onClick={() => { handleRequestAction(declineModalId, "declined"); setDeclineModalId(null); }} 
                  className="w-full py-3.5 rounded-full font-bold active:scale-[0.98] transition-opacity hover:opacity-90 shadow-lg"
                  style={{ background: "#ef4444", color: "#ffffff" }}>
                  Yes
                </button>
                <button onClick={() => setDeclineModalId(null)} 
                  className="w-full py-3.5 rounded-full font-bold active:scale-[0.98] transition-opacity hover:opacity-90 shadow-lg"
                  style={{ background: "rgba(34, 197, 94, 0.15)", color: "#4ade80", border: "1px solid rgba(34, 197, 94, 0.25)" }}>
                  No
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
