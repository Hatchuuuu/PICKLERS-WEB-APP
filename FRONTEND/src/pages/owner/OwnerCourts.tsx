import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, Plus, X, Check, ChevronLeft, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { WalkInModal } from "@/components/modals/WalkinModal";
import { ManageAvailabilityModal } from "@/components/owner/ManageAvailabilityModal";
import { useOwner } from "@/contexts/OwnerContext";

export function OwnerCourts() {
  const { ownerCourts: courts, updateCourt, addCourt: addCourtContext } = useOwner();
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [manageAvailabilityId, setManageAvailabilityId] = useState<number | null>(null);
  const [lastSavedId, setLastSavedId] = useState<number | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [newName, setNewName] = useState("");
  const [newSurface, setNewSurface] = useState("Indoor · Hard");
  const [newPrice, setNewPrice] = useState("400");
  const [walkInOpen, setWalkInOpen] = useState(false);
  const [walkInSuccess, setWalkInSuccess] = useState<string | null>(null);
  const [isWalkInExpanded, setIsWalkInExpanded] = useState(false);

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

  function addCourt() {
    if (!newName.trim()) return;
    const parsedPrice = parseInt(newPrice, 10);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      // Avoid silent fail, return early (or show toast if we had one)
      return;
    }
    addCourtContext({ id: Date.now(), name: newName, surface: newSurface, price: parsedPrice, available: true, blockedDates: [] });
    setShowAddModal(false);
    setNewName(""); setNewSurface("Indoor · Hard"); setNewPrice("400");
  }

  const surfaces = ["Indoor · Hard", "Indoor · Cushioned", "Indoor · Premium", "Outdoor · Concrete", "Outdoor · Asphalt"];

  return (
    <div className="p-4 max-w-6xl mx-auto w-full">
      <div className="relative h-[68px] mb-4 -mt-[1px] flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <h1 className="text-[26px] min-[390px]:text-[28px] md:text-[32px] font-extrabold tracking-tight leading-none mb-1.5 whitespace-nowrap" style={{ color: "var(--ink-primary)" }}>
              My Courts
            </h1>
            <p className="text-[13px] font-medium leading-relaxed" style={{ color: "var(--ink-muted)" }}>
              Manage your facility's courts
            </p>
          </motion.div>
        <button onClick={() => { setShowAddModal(true); setNewName(""); setNewSurface("Indoor · Hard"); setNewPrice("400"); }}
          className="flex items-center gap-1.5 px-4 py-2 mt-2 rounded-full text-sm font-bold transition-colors active:scale-95 shrink-0 z-10 relative shadow-lg bg-accent-success text-white" style={{ transition: "opacity 150ms ease-out", boxShadow: "0 4px 12px rgba(34,197,94,0.3)" }}
          onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")}
          onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
          <Plus className="w-4 h-4" /> List Court
        </button>
      </div>

      <AnimatePresence>
        {walkInSuccess && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl mb-5"
            style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)" }}>
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
          <div key={c.id} className="rounded-2xl p-5 shadow-xl bg-surface-base border border-border dark:bg-white/[0.02] dark:border-white/[0.05] dark:border-t-white/10 dark:shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-xl" 
            style={{ 
              boxShadow: lastSavedId === c.id ? "0 0 32px rgba(34,197,94,0.4)" : undefined,
              borderColor: lastSavedId === c.id ? "rgba(34,197,94,0.5)" : undefined,
              transition: "box-shadow 0.5s ease-out, border-color 0.5s ease-out"
            }}>
            {editId === c.id ? (
              <div className="space-y-3">
                <input value={newName} onChange={e => setNewName(e.target.value)} className="w-full px-4 py-2.5 rounded-full text-[14px] font-medium outline-none shadow-inner transition-all bg-surface-interactive border border-border text-foreground dark:bg-white/[0.03] dark:border-white/[0.08]" />
                <select value={newSurface} onChange={e => setNewSurface(e.target.value)} className="w-full px-4 py-2.5 rounded-full text-[14px] font-medium outline-none appearance-none shadow-inner transition-all bg-surface-interactive border border-border text-foreground dark:bg-white/[0.03] dark:border-white/[0.08]">
                  {surfaces.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-bold text-muted-foreground pl-1">₱</span>
                  <input value={newPrice} onChange={e => setNewPrice(e.target.value)} type="number" className="flex-1 px-4 py-2.5 rounded-full text-[14px] font-medium outline-none shadow-inner transition-all bg-surface-interactive border border-border text-foreground dark:bg-white/[0.03] dark:border-white/[0.08]" />
                  <span className="text-[14px] font-bold text-muted-foreground pr-1">/hr</span>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => saveEdit()} className="flex-1 py-2.5 rounded-full text-xs font-bold active:scale-[0.97] transition-all hover:opacity-90 bg-accent-success text-white" style={{ boxShadow: "0 4px 12px rgba(34,197,94,0.3)" }}>Save</button>
                  <button onClick={() => setEditId(null)} className="flex-1 py-2.5 rounded-full text-xs font-bold active:scale-[0.97] transition-all hover:opacity-90 bg-surface-interactive border border-border text-foreground hover:bg-surface-interactive/80">Cancel</button>
                </div>
              </div>
            ) : (
              <>
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
                <div className="text-cyan-400 font-bold font-mono text-[15px] mb-4 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]">₱{c.price}/hr</div>
                
                {c.currentBooking && (
                  <div className="mb-4 p-3 rounded-[14px] bg-amber-500/5 border border-amber-500/10">
                    <div className="text-[11px] font-bold text-amber-500/70 uppercase tracking-widest mb-1">Currently Booked</div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                        <User className="w-3.5 h-3.5 text-amber-500" />
                      </div>
                      <div>
                        <div className="text-[14px] font-bold text-foreground">{c.currentBooking.userName}</div>
                        <div className="text-[12px] font-medium text-muted-foreground">{c.currentBooking.time}</div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 mt-4">
                  <button onClick={() => startEdit(c)} 
                    className="flex-1 py-3 rounded-full text-sm font-bold active:scale-[0.97] transition-all hover:opacity-90 bg-surface-interactive border border-border text-foreground hover:bg-surface-interactive/80">
                    Edit
                  </button>
                  <button onClick={() => setManageAvailabilityId(c.id)} 
                    className="flex-1 py-3 rounded-full text-sm font-bold active:scale-[0.97] transition-all hover:opacity-90"
                    style={{ 
                      background: "rgba(239,68,68,0.15)", 
                      color: "#ef4444", 
                      border: "1px solid rgba(239,68,68,0.3)",
                      boxShadow: "0 4px 12px rgba(239,68,68,0.15)"
                    }}>
                    Schedule
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Add Court Modal */}
      <AnimatePresence>
        {showAddModal && (
          <>
            <motion.div key="add-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }} />
            <motion.div key="add-modal" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              transition={{ ease: "easeOut", duration: 0.2 }} className="fixed inset-0 z-50 flex items-center justify-center px-4"
              onClick={() => setShowAddModal(false)}>
              <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: "var(--surface-base)", border: "1px solid var(--border-emphasis)", boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}
                onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold tracking-tight">List New Court</h2>
                  <button onClick={() => setShowAddModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-interactive/80"
                    style={{ border: "1px solid var(--border-default)", color: "var(--ink-muted)" }}><X className="w-4 h-4" /></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Court Name</label>
                    <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Court 7"
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-ring"
                      style={{ background: "rgba(26,45,110,0.5)", border: "1px solid var(--border-default)", color: "var(--ink-primary)" }} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Surface</label>
                    <select value={newSurface} onChange={e => setNewSurface(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none appearance-none"
                      style={{ background: "rgba(26,45,110,0.5)", border: "1px solid var(--border-default)", color: "var(--ink-primary)", colorScheme: "dark" }}>
                      {surfaces.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Price per Hour (₱)</label>
                    <input value={newPrice} onChange={e => setNewPrice(e.target.value)} type="number" min="100" placeholder="400"
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-ring"
                      style={{ background: "rgba(26,45,110,0.5)", border: "1px solid var(--border-default)", color: "var(--ink-primary)" }} />
                  </div>
                </div>
                <button onClick={addCourt} disabled={!newName.trim()}
                  className="w-full mt-5 py-3.5 rounded-2xl font-bold text-sm active:scale-[0.97] disabled:opacity-40 bg-accent-success text-white" style={{ transition: "opacity 150ms ease-out" }}>
                  Add Court
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
          "fixed right-0 bottom-[110px] md:bottom-8 h-[52px] flex items-center justify-center font-bold text-[15px] z-30 overflow-hidden cursor-pointer backdrop-blur-xl border border-white/10 border-r-0 origin-right"
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
    </div>
  );
}
