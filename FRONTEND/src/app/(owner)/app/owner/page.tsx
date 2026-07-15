"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Check, Eye, EyeOff } from "lucide-react";
import { BOOKING_REQUESTS } from "@/data/mockData";
import { CourtCard } from "@/components/owner/CourtCard";
import { useAppUIStore } from "@/store/useUIStore";
import { useLiveCourts, useUpdateCourt, useBookingRequests, useResolveRequest } from "@/hooks/useCourts";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

export default function OwnerDashboard() {
  const queryClient = useQueryClient();
  const { activeOwnerTab: activeTab, setActiveOwnerTab: setActiveTab, showMetrics, setShowMetrics } = useAppUIStore();
  
  const { data: courts = [], isLoading: courtsLoading } = useLiveCourts();
  const { mutate: updateCourt } = useUpdateCourt();
  
  const { data: requests = [] } = useBookingRequests();
  const { mutate: resolveRequest } = useResolveRequest();

  const [requestSuccess, setRequestSuccess] = useState<{msg: string, type: "success" | "danger"} | null>(null);
  const [declineModalId, setDeclineModalId] = useState<string | null>(null);
  const [acceptModalId, setAcceptModalId] = useState<string | null>(null);
  const [resolvedRequests, setResolvedRequests] = useState<{id: string, player: string, court: string, total: number, action: "accepted" | "declined"}[]>([]);
  const [timedUpCourts, setTimedUpCourts] = useState<number[]>([]);
  
  



  function handleEndSession(id: number) {
    updateCourt({ id, status: "available", player: null, remaining: 0, maxTime: 0 });
    setTimedUpCourts(prev => prev.filter(cId => cId !== id));
    
    setRequestSuccess({ 
      msg: "Session ended successfully", 
      type: "success" 
    });
    setTimeout(() => setRequestSuccess(null), 3000);
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

  const sortedCourts = [...courts].sort((a, b) => {
    const aIsAlert = timedUpCourts.includes(a.id);
    const bIsAlert = timedUpCourts.includes(b.id);
    if (aIsAlert && !bIsAlert) return -1;
    if (!aIsAlert && bIsAlert) return 1;

    const statusOrder: Record<string, number> = { "occupied": 1, "available": 2, "maintenance": 3 };
    const aOrder = statusOrder[a.status] || 4;
    const bOrder = statusOrder[b.status] || 4;

    if (aOrder !== bOrder) return aOrder - bOrder;

    if (a.status === "occupied" && b.status === "occupied") {
       return (a.remaining || 0) - (b.remaining || 0);
    }
    
    return 0;
  });

  const isCourtsUrgent = timedUpCourts.length > 0;
  const isRequestsUrgent = requests.length >= 3;

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

        {/* Removed Notification Pill per user request */}

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
              {[
                { label: "Monthly Revenue", value: "₱48,200", change: "+12%" },
                { label: "Today's Revenue", value: "₱3,200", change: "+5%" },
                { label: "Active Bookings", value: "12", change: "now" },
                { label: "New Players", value: "8", change: "today" },
                { label: "Repeaters", value: "45%", change: "+3%" },
              ].map((m, index) => (
                <motion.div 
                  key={index} 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: index * 0.05 }} 
                  className={`rounded-[24px] p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group ${index === 4 ? 'col-span-2 lg:col-span-1' : ''}`}
                  style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}
                >
                  <div className="text-xs text-muted-foreground mb-1">{m.label}</div>
                  <div className="text-xl font-bold font-mono text-foreground">{m.value}</div>
                  <div className="text-xs mt-0.5 text-emerald-400">{m.change}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* Mobile Segmented Control (Apple iOS Style) */}
      <div className="xl:hidden flex gap-1.5 bg-surface-raised border border-border/[0.08] p-1.5 rounded-full mb-6">
        <motion.button
          onClick={() => setActiveTab("courts")}
          className={cn(
            "flex-1 relative py-2.5 text-[14px] transition-colors z-10 rounded-full",
            activeTab === "courts" ? "text-[#1a1a1a] font-bold" : "text-foreground/50 hover:text-foreground/80 font-medium"
          )}
          style={{ border: "1px solid transparent" }}
        >
          {isCourtsUrgent && (
            <motion.div className="absolute inset-0 rounded-full border border-[#ff4b4b] shadow-[0_0_12px_rgba(255,75,75,0.6)] -z-10"
              animate={{ opacity: [0.2, 0.8, 0.2] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            />
          )}

          {activeTab === "courts" && (
            <motion.div layoutId="owner-tab-indicator" className="absolute inset-0 rounded-full -z-10 bg-[#FBBF24] shadow-[0_3px_8px_rgba(251,191,36,0.3),0_1px_1px_rgba(0,0,0,0.1)]"
              transition={{ type: "spring", stiffness: 500, damping: 35 }}>
              <motion.div className="absolute inset-0 rounded-full shadow-[0_0_20px_rgba(251,191,36,0.6)]"
                animate={{ opacity: [0.3, 0.8, 0.3] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
              />
            </motion.div>
          )}
          <div className="flex items-center justify-center gap-2 h-full">
            <span>Live Courts</span>
            <AnimatePresence>
              {timedUpCourts.length > 0 && (
                <motion.div 
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="flex items-center justify-center min-w-[20px] h-[20px] px-1 rounded-full text-[11px] font-[800] leading-none bg-[#ff4b4b] text-white"
                >
                  {timedUpCourts.length}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.button>
        <motion.button
          onClick={() => setActiveTab("requests")}
          className={cn(
            "flex-1 relative py-2.5 text-[14px] transition-colors z-10 rounded-full",
            activeTab === "requests" ? "text-[#1a1a1a] font-bold" : "text-foreground/50 hover:text-foreground/80 font-medium"
          )}
          style={{ border: "1px solid transparent" }}
        >
          {isRequestsUrgent && (
            <motion.div className="absolute inset-0 rounded-full border border-[#ff4b4b] shadow-[0_0_12px_rgba(255,75,75,0.6)] -z-10"
              animate={{ opacity: [0.2, 0.8, 0.2] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            />
          )}

          {activeTab === "requests" && (
            <motion.div layoutId="owner-tab-indicator" className="absolute inset-0 rounded-full -z-10 bg-[#FBBF24] shadow-[0_3px_8px_rgba(251,191,36,0.3),0_1px_1px_rgba(0,0,0,0.1)]"
              transition={{ type: "spring", stiffness: 500, damping: 35 }}>
              <motion.div className="absolute inset-0 rounded-full shadow-[0_0_20px_rgba(251,191,36,0.6)]"
                animate={{ opacity: [0.3, 0.8, 0.3] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
              />
            </motion.div>
          )}
          <div className="flex items-center justify-center gap-2 h-full">
            <span>Requests</span>
            <AnimatePresence>
              {requests.length > 0 && (
                <motion.div 
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="flex items-center justify-center min-w-[20px] h-[20px] px-1 rounded-full text-[11px] font-[800] leading-none bg-[#ff4b4b] text-white"
                >
                  {requests.length}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className={cn("xl:col-span-2 order-2 xl:order-1", activeTab !== "courts" && "hidden xl:block")}>
          <div className="mb-4 hidden xl:flex">
            <div className="relative inline-flex items-center justify-center px-4 py-2 rounded-full border border-border bg-surface-raised/50">
              {timedUpCourts.length > 0 && (
                <motion.div className="absolute inset-0 rounded-full border border-[#ff4b4b] shadow-[0_0_15px_rgba(255,75,75,0.6)] pointer-events-none z-10"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                />
              )}
              <h2 className="text-[14px] font-semibold text-foreground/80">Live Courts</h2>
              <AnimatePresence>
                {timedUpCourts.length > 0 && (
                  <motion.div 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="ml-2 flex items-center justify-center min-w-[20px] h-[20px] px-1 rounded-full text-[11px] font-[800] leading-none bg-[#ff4b4b] text-white shadow-sm"
                  >
                    {timedUpCourts.length}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
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
                      <div className="w-12 h-12 rounded-full bg-surface-interactive/80 animate-pulse" />
                      <div className="space-y-2 mt-4">
                        <div className="h-4 bg-surface-interactive/80 rounded-full w-2/3 animate-pulse" />
                        <div className="h-3 bg-surface-interactive/80 rounded-full w-1/2 animate-pulse" />
                      </div>
                    </motion.div>
                  ))}
                </>
              ) : (
                <>
                  {sortedCourts.map((c) => (
                    <motion.div 
                      key={c.id} 
                      layout
                      layoutId={`court-card-${c.id}`}
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
          <div className="mb-4 hidden xl:flex">
            <div className="relative inline-flex items-center justify-center px-4 py-2 rounded-full border border-border bg-surface-raised/50">
              {requests.length > 0 && (
                <motion.div className="absolute inset-0 rounded-full border border-[#ff4b4b] shadow-[0_0_15px_rgba(255,75,75,0.6)] pointer-events-none z-10"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                />
              )}
              <h2 className="text-[14px] font-semibold text-foreground/80">Requests</h2>
              <AnimatePresence>
                {requests.length > 0 && (
                  <motion.div 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="ml-2 flex items-center justify-center min-w-[20px] h-[20px] px-1 rounded-full text-[11px] font-[800] leading-none bg-[#ff4b4b] text-white shadow-sm"
                  >
                    {requests.length}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            {requests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm flex flex-col items-center gap-4">
                <p>No pending requests</p>
                <motion.button 
                  onClick={() => queryClient.setQueryData(['bookingRequests'], BOOKING_REQUESTS)}
                  className="px-4 py-2 rounded-full text-[13px] font-bold transition-all bg-surface-raised border border-border text-foreground"
                  whileHover={{ backgroundColor: "rgba(255,255,255,0.1)" }}
                  whileTap={{ scale: 0.95 }}
                >
                  Reload Mock Requests
                </motion.button>
              </div>
            ) : requests.map(r => (
              <div key={r.id} className="rounded-2xl p-5 transition-all bg-surface-base shadow-lg border border-border dark:bg-white/[0.02] dark:border-white/[0.05] dark:border-t-white/10 dark:shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-xl relative">
                <div className="flex items-start justify-between mb-0.5">
                  <div className="text-[15px] font-bold text-foreground tracking-tight pr-2">{r.player}</div>
                  <div className="text-[10px] font-bold tracking-wider uppercase px-2 py-1 rounded-md bg-white/[0.04] border border-white/[0.05] text-white/60 shrink-0">
                    {r.paymentMethod || 'Cash'}
                  </div>
                </div>
                <div className="text-[13px] text-muted-foreground">{r.court}</div>
                <div className="text-[13px] text-muted-foreground">{r.time}</div>
                <div className="mt-2 text-cyan-400 font-mono text-[15px] font-bold">₱{r.total.toLocaleString()}</div>
                <div className="flex gap-3 mt-4">
                  <button onClick={() => setAcceptModalId(r.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full text-xs font-bold active:scale-[0.97] transition-all shadow-lg hover:opacity-90 bg-accent-success text-white" style={{ boxShadow: "0 4px 12px rgba(34,197,94,0.3)" }}>
                    <Check className="w-3.5 h-3.5" /> Accept
                  </button>
                  <motion.button onClick={() => setDeclineModalId(r.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full text-xs font-bold transition-all bg-surface-interactive border border-border text-muted-foreground hover:bg-black/5 hover:text-foreground dark:bg-white/[0.06] dark:border-white/[0.1] dark:text-white/60 dark:hover:bg-white/[0.1] dark:hover:text-white"
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
              <h2 className="text-sm font-medium tracking-tight mb-3">Recent Activity</h2>
              <div className="flex flex-col gap-3">
                {resolvedRequests.map(r => (
                  <div key={r.id} className="rounded-2xl p-4 flex items-center justify-between bg-surface-interactive/50 border border-border opacity-80 dark:bg-white/[0.02] dark:border-white/[0.05]">
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/20 dark:bg-[#0B132B]/80 backdrop-blur-3xl"
              onClick={() => setAcceptModalId(null)} />
            <motion.div initial={{ y: "100%", opacity: 0.5 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="relative w-full max-w-sm flex flex-col gap-2 z-10 items-center">
              <div className="w-[340px] bg-background dark:bg-gradient-to-b dark:from-[#1A2235] dark:to-[#0B132B] rounded-2xl overflow-hidden shadow-xl dark:shadow-2xl ring-1 ring-black/5 dark:ring-0 relative p-[1px]">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0BCE83]/20 via-transparent to-transparent opacity-50"></div>
                <div className="relative bg-surface-base dark:bg-[#0A1124] rounded-[27px] p-6 pb-7 text-center overflow-hidden flex flex-col items-center">
                   <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-[#0BCE83]/20 blur-[50px] rounded-full pointer-events-none"></div>
                   <div className="relative mb-5 mt-2">
                     <div className="absolute inset-0 bg-[#0BCE83] blur-xl opacity-30 rounded-full animate-pulse"></div>
                     <div className="w-14 h-14 relative z-10 rounded-[18px] bg-gradient-to-b from-[#0BCE83]/20 to-[#0BCE83]/5 flex items-center justify-center border border-[#0BCE83]/30 shadow-[inset_0_1px_2px_rgba(255,255,255,0.2)]">
                       <Check className="w-6 h-6 text-[#0BCE83]" strokeWidth={3} />
                     </div>
                   </div>
                   <h3 className="text-[19px] font-bold text-foreground dark:text-white tracking-tight mb-2">Accept Request?</h3>
                   <p className="text-[14px] text-muted-foreground dark:text-slate-400 font-medium leading-relaxed px-1">
                     This will lock in the court schedule and notify the player that their booking is confirmed.
                   </p>
                   <div className="flex gap-3 w-full mt-7">
                     <button onClick={() => setAcceptModalId(null)} className="flex-1 py-3.5 rounded-xl text-[14px] font-semibold text-foreground/80 dark:text-slate-300 bg-black/5 dark:bg-white/[0.03] border border-black/10 dark:border-white/[0.08] hover:bg-black/10 dark:hover:bg-white/[0.06] hover:text-foreground dark:hover:text-white transition-all active:scale-[0.98]">
                       Cancel
                     </button>
                     <button onClick={() => { handleRequestAction(acceptModalId, "accepted"); setAcceptModalId(null); }} className="flex-1 py-3.5 rounded-xl text-[14px] font-bold text-[#060D1F] bg-gradient-to-b from-[#10e294] to-[#0BCE83] shadow-[0_8px_20px_rgba(11,206,131,0.3),inset_0_1px_1px_rgba(255,255,255,0.4)] hover:shadow-[0_10px_25px_rgba(11,206,131,0.4)] transition-all active:scale-[0.98]">
                       Accept
                     </button>
                   </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {declineModalId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/20 dark:bg-[#0B132B]/80 backdrop-blur-3xl"
              onClick={() => setDeclineModalId(null)} />
            <motion.div initial={{ y: "100%", opacity: 0.5 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="relative w-full max-w-sm flex flex-col gap-2 z-10 items-center">
              <div className="w-[340px] bg-background dark:bg-gradient-to-b dark:from-[#1A2235] dark:to-[#0B132B] rounded-2xl overflow-hidden shadow-xl dark:shadow-2xl ring-1 ring-black/5 dark:ring-0 relative p-[1px]">
                <div className="absolute inset-0 bg-gradient-to-br from-[#FF453A]/20 via-transparent to-transparent opacity-50"></div>
                <div className="relative bg-surface-base dark:bg-[#0A1124] rounded-[27px] p-6 pb-7 text-center overflow-hidden flex flex-col items-center">
                   <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-[#FF453A]/20 blur-[50px] rounded-full pointer-events-none"></div>
                   <div className="relative mb-5 mt-2">
                     <div className="absolute inset-0 bg-[#FF453A] blur-xl opacity-30 rounded-full animate-pulse"></div>
                     <div className="w-14 h-14 relative z-10 rounded-[18px] bg-gradient-to-b from-[#FF453A]/20 to-[#FF3B30]/5 flex items-center justify-center border border-[#FF453A]/30 shadow-[inset_0_1px_2px_rgba(255,255,255,0.2)]">
                       <X className="w-6 h-6 text-[#FF453A]" strokeWidth={3} />
                     </div>
                   </div>
                   <h3 className="text-[19px] font-bold text-foreground dark:text-white tracking-tight mb-2">Decline Request?</h3>
                   <p className="text-[14px] text-muted-foreground dark:text-slate-400 font-medium leading-relaxed px-1">
                     This will reject the reservation request and notify the player. This action cannot be undone.
                   </p>
                   <div className="flex gap-3 w-full mt-7">
                     <button onClick={() => setDeclineModalId(null)} className="flex-1 py-3.5 rounded-xl text-[14px] font-semibold text-foreground/80 dark:text-slate-300 bg-black/5 dark:bg-white/[0.03] border border-black/10 dark:border-white/[0.08] hover:bg-black/10 dark:hover:bg-white/[0.06] hover:text-foreground dark:hover:text-white transition-all active:scale-[0.98]">
                       Cancel
                     </button>
                     <button onClick={() => { handleRequestAction(declineModalId, "declined"); setDeclineModalId(null); }} className="flex-1 py-3.5 rounded-xl text-[14px] font-bold text-white bg-gradient-to-b from-[#FF453A] to-[#E02D23] shadow-[0_8px_20px_rgba(255,59,48,0.3),inset_0_1px_1px_rgba(255,255,255,0.2)] hover:shadow-[0_10px_25px_rgba(255,59,48,0.4)] transition-all active:scale-[0.98]">
                       Decline
                     </button>
                   </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Action Toast Notification */}
      <AnimatePresence>
        {requestSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="fixed bottom-[110px] left-1/2 -translate-x-1/2 z-[200] pointer-events-auto"
          >
            <div className={cn(
              "flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border shadow-[0_8px_30px_rgba(0,0,0,0.4)] backdrop-blur-2xl relative",
              requestSuccess.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500 dark:text-emerald-400"
                : "bg-red-500/10 border-red-500/20 text-red-500 dark:text-red-400"
            )}>
              {requestSuccess.type === "success" ? (
                <Check className="w-[16px] h-[16px] shrink-0" strokeWidth={2.5} />
              ) : (
                <X className="w-[16px] h-[16px] shrink-0" strokeWidth={2.5} />
              )}
              <span className="text-[13px] font-semibold tracking-wide whitespace-nowrap pr-1">
                {requestSuccess.msg}
              </span>
              
              <button 
                onClick={() => setRequestSuccess(null)}
                className="w-5 h-5 rounded-md flex items-center justify-center opacity-60 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 transition-all ml-1.5"
              >
                <X className="w-3.5 h-3.5" strokeWidth={2.5} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
