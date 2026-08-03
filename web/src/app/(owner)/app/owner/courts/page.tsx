"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, Plus, X, Check, ChevronLeft, ChevronRight, ChevronDown, User, Flame, Users, Calendar, Clock, DollarSign, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { WalkInModal } from "@/components/modals/WalkinModal";
import { ManageAvailabilityModal } from "@/components/owner/ManageAvailabilityModal";
import { CreateOpenPlayModal } from "@/components/owner/CreateOpenPlayModal";
import { useToast } from "@/contexts/ToastContext";
import { useOwner } from "@/contexts/OwnerContext";
import { useAuth } from "@/contexts/AuthContext";
import { DEMO_MATCHES } from "@/lib/demoData";
import { MatchData } from "@/types";
import { supabase } from "@/lib/supabase";

export default function OwnerCourts() {
  const { ownerCourts: courts, updateCourt, addCourt: addCourtContext } = useOwner();
  const { showToast } = useToast();
  const { user } = useAuth();

  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [manageAvailabilityId, setManageAvailabilityId] = useState<number | null>(null);
  const [lastSavedId, setLastSavedId] = useState<number | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [newName, setNewName] = useState("");
  const [newSurface, setNewSurface] = useState("Indoor · Hard");
  const [newPrice, setNewPrice] = useState("400");
  const [isEditSurfaceOpen, setIsEditSurfaceOpen] = useState(false);
  const [isAddSurfaceOpen, setIsAddSurfaceOpen] = useState(false);
  const [walkInOpen, setWalkInOpen] = useState(false);
  const [walkInSuccess, setWalkInSuccess] = useState<string | null>(null);
  const [isWalkInExpanded, setIsWalkInExpanded] = useState(false);

  // Open Play state
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [openPlaySubTab, setOpenPlaySubTab] = useState<"active" | "completed">("active");
  const [isCreateOpenPlayOpen, setIsCreateOpenPlayOpen] = useState(false);
  const [selectedCourtForOpenPlay, setSelectedCourtForOpenPlay] = useState<number | string | undefined>(undefined);
  const [loadingMatches, setLoadingMatches] = useState(true);

  const isDemo = user?.isDemo || user?.role === "demo" || !user || user?.email?.includes("demo");

  useEffect(() => {
    async function fetchMatches() {
      setLoadingMatches(true);
      try {
        if (isDemo) {
          setMatches(DEMO_MATCHES);
        } else {
          const { data, error } = await supabase
            .from('matches')
            .select('*')
            .order('created_at', { ascending: false });

          if (error || !data || data.length === 0) {
            setMatches(DEMO_MATCHES);
          } else {
            const mapped: MatchData[] = data.map((m) => ({
              id: Number(m.id) || Date.now(),
              facility_name: m.facility || "BGC Pickleball Hub",
              location: m.location || "Taguig, Metro Manila",
              date: m.date,
              time: m.time,
              level: m.level,
              current_players: m.participants || m.current_players || 0,
              max_players: m.max_participants || m.max_players || 4,
              price: m.price,
              type: m.type,
              host: m.created_by || "Facility Owner"
            }));
            setMatches(mapped);
          }
        }
      } catch (err) {
        console.error("Failed to load matches:", err);
        setMatches(DEMO_MATCHES);
      } finally {
        setLoadingMatches(false);
      }
    }

    fetchMatches();
  }, [isDemo]);

  function handleMatchCreated(newMatch: MatchData) {
    setMatches((prev) => [newMatch, ...prev]);
  }

  function handleCancelMatch(id: number, title: string) {
    setMatches((prev) => prev.filter((m) => m.id !== id));
    showToast(`Open Play session '${title}' has been cancelled.`, "success");
  }

  const filtered = courts.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  function handleWalkIn(name: string, court: string) {
    setWalkInOpen(false);
    setWalkInSuccess(`${name || "Walk-in guest"} logged for ${court}`);
    setTimeout(() => setWalkInSuccess(null), 3000);
  }

  function startEdit(c: typeof courts[0]) {
    setEditId(c.id);
    setNewName(c.name);
    setNewSurface(c.surface);
    setNewPrice(String(c.price));
  }

  function saveEdit() {
    const parsedPrice = parseInt(newPrice, 10);
    if (editId !== null) {
      updateCourt(editId, {
        name: newName,
        surface: newSurface,
        price: (!isNaN(parsedPrice) && parsedPrice > 0) ? parsedPrice : courts.find(c => c.id === editId)?.price
      });
      const savedId = editId;
      setEditId(null);
      setLastSavedId(savedId);
      setTimeout(() => setLastSavedId(null), 1000);
    }
  }

  function handleOpenAddModal() {
    let maxCourtNum = 0;
    courts.forEach(c => {
      const matches = c.name.match(/\d+/g);
      if (matches) {
        matches.forEach(numStr => {
          const num = parseInt(numStr, 10);
          if (!isNaN(num) && num > maxCourtNum) {
            maxCourtNum = num;
          }
        });
      }
    });

    const nextNum = maxCourtNum > 0 ? maxCourtNum + 1 : courts.length + 1;
    const suggestedName = `Court ${nextNum}`;

    setNewName(suggestedName);
    setNewSurface("Indoor · Hard");
    setNewPrice("400");
    setShowAddModal(true);
  }

  function addCourt() {
    if (!newName.trim()) {
      showToast("Court name is required.", "error");
      return;
    }
    const parsedPrice = parseInt(newPrice, 10);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      showToast("Please enter a valid hourly rate greater than ₱0.", "error");
      return;
    }
    addCourtContext({ id: Date.now(), name: newName, surface: newSurface, price: parsedPrice, available: true, blockedDates: [] });
    setShowAddModal(false);
    showToast(`${newName} has been listed successfully!`, "success");
    setNewName(""); setNewSurface("Indoor · Hard"); setNewPrice("400");
  }

  const surfaces = ["Indoor · Hard", "Indoor · Cushioned", "Indoor · Premium", "Outdoor · Concrete", "Outdoor · Asphalt"];

  const activeMatches = matches.filter((m) => m.date !== "Yesterday" && m.date !== "Completed");
  const completedMatches = matches.filter((m) => m.date === "Yesterday" || m.date === "Completed");
  const displayedMatches = openPlaySubTab === "active" ? activeMatches : completedMatches;

  const totalPlayers = matches.reduce((acc, m) => acc + m.current_players, 0);
  const totalRevenue = matches.reduce((acc, m) => acc + (m.current_players * m.price), 0);

  return (
    <div className="p-4 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="relative mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
          <h1 className="text-[26px] min-[390px]:text-[28px] md:text-[32px] font-extrabold tracking-tight leading-none mb-1.5 whitespace-nowrap text-foreground">
            My Courts & Open Play
          </h1>
          <p className="text-[13px] font-medium leading-relaxed text-muted-foreground">
            Manage your facility courts, schedule availability, and host joinable Open Play sessions.
          </p>
        </motion.div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all active:scale-95 shrink-0 shadow-[0_4px_12px_rgba(34,197,94,0.3)] bg-accent-success text-white hover:opacity-90"
          >
            <Plus className="w-4 h-4" /> List Court
          </button>
        </div>
      </div>

      {/* COURTS CONTENT */}
      <AnimatePresence>
        {walkInSuccess && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl mb-5 bg-emerald-500/10 border border-emerald-500/25">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-sm text-emerald-400 font-medium">Walk-in confirmed: {walkInSuccess}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter by court name..."
          className="w-full pl-11 pr-4 py-3 rounded-full text-[14px] font-medium outline-none focus:ring-2 focus:ring-[var(--accent-primary)] transition-all shadow-inner bg-surface-interactive border border-border text-foreground dark:bg-white/[0.03] dark:border-white/[0.08]" />
      </div>

      {filtered.length === 0 && <div className="text-center py-16 text-muted-foreground text-sm">No courts match "{search}"</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(c => (
          <div key={c.id} className="rounded-2xl p-5 shadow-xl bg-surface-base border border-border dark:bg-white/[0.02] dark:border-white/[0.05] dark:border-t-white/10 dark:shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-xl transition-all duration-500 ease-out flex flex-col justify-between"
            style={{
              boxShadow: lastSavedId === c.id ? "0 0 32px rgba(34,197,94,0.4)" : undefined,
              borderColor: lastSavedId === c.id ? "rgba(34,197,94,0.5)" : undefined
            }}>
            {editId === c.id ? (
              <div className="space-y-3">
                <input value={newName} onChange={e => setNewName(e.target.value)} className="w-full px-4 py-2.5 rounded-full text-[14px] font-medium outline-none shadow-inner transition-all bg-surface-interactive border border-border text-foreground dark:bg-white/[0.03] dark:border-white/[0.08]" />
                <div>
                  <button
                    type="button"
                    onClick={() => setIsEditSurfaceOpen(!isEditSurfaceOpen)}
                    className="w-full px-4 py-2.5 rounded-full text-[14px] font-medium outline-none shadow-inner transition-all bg-surface-interactive border border-border text-foreground dark:bg-white/[0.03] dark:border-white/[0.08] flex items-center justify-between"
                  >
                    <span>{newSurface}</span>
                    <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", isEditSurfaceOpen && "rotate-180")} />
                  </button>

                  <AnimatePresence>
                    {isEditSurfaceOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ type: "spring", stiffness: 350, damping: 25 }}
                        className="overflow-hidden mt-2 p-1.5 bg-surface-interactive border border-border dark:bg-white/[0.04] dark:border-white/10 rounded-2xl space-y-1"
                      >
                        {surfaces.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => {
                              setNewSurface(s);
                              setIsEditSurfaceOpen(false);
                            }}
                            className={cn(
                              "w-full px-3.5 py-2 rounded-xl text-xs font-bold text-left transition-all flex items-center justify-between",
                              newSurface === s ? "bg-amber-500/20 text-amber-300" : "text-slate-300 hover:bg-white/5"
                            )}
                          >
                            <span>{s}</span>
                            {newSurface === s && <Check className="w-4 h-4 text-amber-400" />}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-bold text-muted-foreground pl-1">₱</span>
                  <input value={newPrice} onChange={e => setNewPrice(e.target.value)} type="number" className="flex-1 px-4 py-2.5 rounded-full text-[14px] font-medium outline-none shadow-inner transition-all bg-surface-interactive border border-border text-foreground dark:bg-white/[0.03] dark:border-white/[0.08]" />
                  <span className="text-[14px] font-bold text-muted-foreground pr-1">/hr</span>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => saveEdit()} className="flex-1 py-2.5 rounded-full text-xs font-bold active:scale-[0.97] transition-all hover:opacity-90 bg-accent-success text-white shadow-[0_4px_12px_rgba(34,197,94,0.3)]">Save</button>
                  <button onClick={() => setEditId(null)} className="flex-1 py-2.5 rounded-full text-xs font-bold active:scale-[0.97] transition-all hover:opacity-90 bg-surface-interactive border border-border text-foreground hover:bg-surface-interactive/80">Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-bold text-foreground text-[15px] tracking-tight">{c.name}</span>
                    <div className="flex items-center gap-1.5">
                      <motion.div layout className={cn("text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-widest",
                        c.currentBooking
                          ? "bg-amber-500/15 text-amber-500 border border-amber-500/25 shadow-[0_0_12px_rgba(245,158,11,0.15)]"
                          : c.available
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 shadow-[0_0_12px_rgba(52,211,153,0.15)]"
                            : "bg-red-500/15 text-red-400 border border-red-500/25 shadow-[0_0_12px_rgba(248,113,113,0.15)]"
                      )}>
                        {c.currentBooking ? "Occupied" : c.available ? "Available" : "Unavailable"}
                      </motion.div>
                    </div>
                  </div>
                  <div className="text-[13px] text-muted-foreground mb-2">{c.surface}</div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-cyan-400 font-bold font-mono text-[15px] drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]">₱{c.price}/hr</div>

                    {c.currentBooking && (
                      <div className="flex items-center gap-2.5 text-right">
                        <div className="flex flex-col items-end">
                          <div className="text-[12px] font-bold text-foreground leading-none mb-1">{c.currentBooking.userName}</div>
                          <div className="text-[10px] font-medium text-amber-500/80 leading-none">{c.currentBooking.time}</div>
                        </div>
                        <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                          <User className="w-3.5 h-3.5 text-amber-500" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2 mt-4 pt-3 border-t border-border/50">
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => startEdit(c)}
                      className="py-2.5 rounded-xl text-xs font-bold active:scale-[0.97] transition-all hover:opacity-90 bg-surface-interactive border border-border text-foreground hover:bg-surface-interactive/80">
                      Edit
                    </button>
                    <button onClick={() => setManageAvailabilityId(c.id)}
                      className="relative py-2.5 px-3 rounded-xl text-xs font-bold active:scale-[0.97] transition-all hover:opacity-90 bg-red-500/15 text-red-500 border border-red-500/30 flex items-center justify-center">
                      <span>Disable</span>
                      <ChevronRight className="absolute right-2.5 w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    disabled={Boolean(c.currentBooking)}
                    onClick={() => {
                      if (c.currentBooking) return;
                      setSelectedCourtForOpenPlay(c.id);
                      setIsCreateOpenPlayOpen(true);
                    }}
                    className={cn(
                      "w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                      c.currentBooking
                        ? "bg-surface-interactive/60 text-muted-foreground border border-border/40 cursor-not-allowed opacity-50"
                        : "bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/30 shadow-[0_4px_16px_rgba(245,158,11,0.15)] active:scale-[0.97]"
                    )}
                  >
                    <Flame className={cn("w-3.5 h-3.5", c.currentBooking ? "text-slate-500" : "text-amber-400")} />
                    <span>Host Open Play Here</span>
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Active Open Play Sessions Section */}
      {activeMatches.length > 0 && (
        <div className="mt-10 pt-6 border-t border-border space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400" />
                <span>Hosted Open Play Sessions</span>
              </h3>
              <p className="text-xs text-muted-foreground">Currently active joinable sessions across your facility</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {activeMatches.length} Active
            </span>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-surface-interactive border border-border">
              <div className="flex items-center justify-between text-muted-foreground text-xs font-bold uppercase tracking-wider mb-1">
                <span>Active Sessions</span>
                <Flame className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-foreground">{activeMatches.length}</div>
            </div>

            <div className="p-4 rounded-2xl bg-surface-interactive border border-border">
              <div className="flex items-center justify-between text-muted-foreground text-xs font-bold uppercase tracking-wider mb-1">
                <span>Total Joined Players</span>
                <Users className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-foreground">{totalPlayers}</div>
            </div>

            <div className="p-4 rounded-2xl bg-surface-interactive border border-border">
              <div className="flex items-center justify-between text-muted-foreground text-xs font-bold uppercase tracking-wider mb-1">
                <span>Estimated Revenue</span>
                <DollarSign className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-black text-cyan-400 font-mono">₱{totalRevenue.toLocaleString()}</div>
            </div>
          </div>

          {/* Sub-tabs & Filter */}
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex gap-2">
              <button
                onClick={() => setOpenPlaySubTab("active")}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                  openPlaySubTab === "active"
                    ? "bg-accent-primary text-white"
                    : "text-muted-foreground hover:text-foreground bg-surface-interactive"
                )}
              >
                Active Games ({activeMatches.length})
              </button>
              <button
                onClick={() => setOpenPlaySubTab("completed")}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                  openPlaySubTab === "completed"
                    ? "bg-accent-primary text-white"
                    : "text-muted-foreground hover:text-foreground bg-surface-interactive"
                )}
              >
                Completed ({completedMatches.length})
              </button>
            </div>
          </div>

          {/* Sessions List */}
          {loadingMatches ? (
            <div className="text-center py-12 text-muted-foreground text-sm">Loading Open Play sessions...</div>
          ) : displayedMatches.length === 0 ? (
            <div className="text-center py-16 p-8 rounded-2xl bg-surface-interactive border border-border">
              <Flame className="w-8 h-8 text-amber-500/50 mx-auto mb-3" />
              <h3 className="text-base font-bold text-foreground mb-1">No Open Play Sessions</h3>
              <p className="text-xs text-muted-foreground mb-4">You haven't hosted any open play sessions in this view yet.</p>
              <button
                onClick={() => setIsCreateOpenPlayOpen(true)}
                className="px-4 py-2 rounded-full text-xs font-bold bg-accent-primary text-white hover:opacity-90 transition-all"
              >
                Host Session Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayedMatches.map((match) => (
                <div
                  key={match.id}
                  className="p-5 rounded-2xl bg-surface-base border border-border dark:bg-white/[0.02] dark:border-white/[0.05] shadow-lg flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                          {match.type}
                        </span>
                        <h3 className="text-lg font-bold text-foreground mt-1.5">{match.facility_name}</h3>
                      </div>
                      <span className="text-sm font-mono font-bold text-cyan-400">₱{match.price}/player</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-accent-primary" />
                        <span>{match.date}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-accent-primary" />
                        <span>{match.time}</span>
                      </div>
                      <div className="flex items-center gap-1.5 col-span-2">
                        <Users className="w-3.5 h-3.5 text-accent-primary" />
                        <span>Level: <strong className="text-foreground">{match.level}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Joined Progress */}
                  <div className="space-y-1.5 pt-2 border-t border-border/50">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-muted-foreground">Players Joined</span>
                      <span className="text-emerald-400">
                        {!match.max_players || match.max_players === 0
                          ? `${match.current_players} joined (Unlimited)`
                          : `${match.current_players} / ${match.max_players}`}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-surface-interactive overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 rounded-full transition-all duration-300"
                        style={{
                          width: !match.max_players || match.max_players === 0
                            ? "100%"
                            : `${Math.min(100, (match.current_players / match.max_players) * 100)}%`
                        }}
                      />
                    </div>
                  </div>

                  {openPlaySubTab === "active" && (
                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => handleCancelMatch(match.id, match.type)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Cancel Session</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Court Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 dark:bg-[#020617]/80 backdrop-blur-2xl"
              onClick={() => setShowAddModal(false)} 
            />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 20 }} 
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="relative w-full max-w-md bg-surface-base dark:bg-[#0C1938]/95 backdrop-blur-3xl rounded-2xl shadow-[0_32px_96px_rgba(0,0,0,0.85)] border border-border dark:border-white/15 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] z-10"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 pb-4 border-b border-border dark:border-white/10 rounded-t-2xl">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-foreground dark:text-white">List New Court</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">Add a new court to your facility catalog</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-muted-foreground hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Fields */}
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Court Name</label>
                  <input 
                    value={newName} 
                    onChange={e => setNewName(e.target.value)} 
                    placeholder="e.g. Championship Court 7"
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all bg-surface-interactive border border-border text-foreground dark:bg-white/[0.05] dark:border-white/15 dark:text-white focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-1 focus:ring-emerald-500 placeholder:text-muted-foreground/60" 
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Surface</label>
                  <div>
                    <button
                      type="button"
                      onClick={() => setIsAddSurfaceOpen(!isAddSurfaceOpen)}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all bg-surface-interactive border border-border text-foreground dark:bg-white/[0.05] dark:border-white/15 dark:text-white flex items-center justify-between"
                    >
                      <span>{newSurface}</span>
                      <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", isAddSurfaceOpen && "rotate-180")} />
                    </button>

                    <AnimatePresence>
                      {isAddSurfaceOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ type: "spring", stiffness: 350, damping: 25 }}
                          className="overflow-hidden mt-2 p-1.5 bg-surface-interactive border border-border dark:bg-white/[0.04] dark:border-white/10 rounded-xl space-y-1"
                        >
                          {surfaces.map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => {
                                setNewSurface(s);
                                setIsAddSurfaceOpen(false);
                              }}
                              className={cn(
                                "w-full px-3.5 py-2.5 rounded-lg text-xs font-bold text-left transition-all flex items-center justify-between",
                                newSurface === s ? "bg-emerald-500/20 text-emerald-300" : "text-slate-200 hover:bg-white/10"
                              )}
                            >
                              <span>{s}</span>
                              {newSurface === s && <Check className="w-4 h-4 text-emerald-400" />}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Price per Hour</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-emerald-400">₱</span>
                    <input 
                      value={newPrice} 
                      onChange={e => setNewPrice(e.target.value)} 
                      type="number" 
                      min="100" 
                      placeholder="400"
                      className="w-full pl-9 pr-4 py-3 rounded-xl text-sm outline-none transition-all bg-surface-interactive border border-border text-foreground dark:bg-white/[0.05] dark:border-white/15 dark:text-white focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-1 focus:ring-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-6 border-t border-border dark:border-white/10 bg-surface-base dark:bg-[#09132A]/95 flex items-center justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-3 rounded-xl text-xs font-bold text-muted-foreground hover:text-white transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={addCourt} 
                  disabled={!newName.trim()}
                  className="px-6 py-3 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-[#080D1C] shadow-[0_4px_16px_rgba(16,185,129,0.3)] border border-emerald-400/50 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none disabled:border-transparent disabled:active:scale-100 disabled:pointer-events-none"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Add Court</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Walk-in Button */}
      <AnimatePresence>
        {isWalkInExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-20 bg-transparent"
            onClick={() => setIsWalkInExpanded(false)}
          />
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => {
          if (!isWalkInExpanded) {
            setIsWalkInExpanded(true);
          } else {
            setWalkInOpen(true);
            setIsWalkInExpanded(false);
          }
        }}
        initial={false}
        animate={{
          width: isWalkInExpanded ? 160 : 40,
          backgroundColor: "var(--accent-success)",
          borderTopRightRadius: 0,
          borderBottomRightRadius: 0,
          borderTopLeftRadius: 12,
          borderBottomLeftRadius: 12,
          x: 0,
          boxShadow: "-4px 0 24px rgba(0,0,0,0.4)"
        }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className={cn(
          "fixed right-0 bottom-[calc(110px+env(safe-area-inset-bottom,0px))] md:bottom-8 h-[52px] flex items-center justify-center font-bold text-[15px] z-[30] overflow-hidden cursor-pointer backdrop-blur-xl border border-white/10 border-r-0 origin-right"
        )}
      >
        <AnimatePresence>
          {isWalkInExpanded ? (
            <motion.div
              key="expanded"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-y-0 right-0 w-[160px] flex items-center justify-center gap-2 text-white whitespace-nowrap"
            >
              <Plus className="w-5 h-5 shrink-0" />
              <span>Log Walk-in</span>
            </motion.div>
          ) : (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-y-0 right-0 w-[40px] text-[#080d1c] flex items-center justify-center"
            >
              <ChevronLeft className="w-5 h-5 -ml-1 stroke-[3]" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {walkInOpen && <WalkInModal onClose={() => setWalkInOpen(false)} onConfirm={handleWalkIn} />}
      </AnimatePresence>

      <AnimatePresence>
        {manageAvailabilityId !== null && (
          <ManageAvailabilityModal
            courtId={manageAvailabilityId}
            onClose={() => setManageAvailabilityId(null)}
          />
        )}
      </AnimatePresence>

      <CreateOpenPlayModal
        isOpen={isCreateOpenPlayOpen}
        onClose={() => setIsCreateOpenPlayOpen(false)}
        onSuccess={handleMatchCreated}
        defaultCourtId={selectedCourtForOpenPlay}
      />
    </div>
  );
}
