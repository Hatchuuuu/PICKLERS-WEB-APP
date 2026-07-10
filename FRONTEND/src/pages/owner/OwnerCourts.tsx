import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, Plus, X, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { WalkInModal } from "@/components/modals/WalkInModal";
import { useOwner } from "@/contexts/OwnerContext";

export function OwnerCourts() {
  const { ownerCourts: courts, updateCourt, addCourt: addCourtContext } = useOwner();
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [disableConfirmId, setDisableConfirmId] = useState<number | null>(null);
  const [enableConfirmId, setEnableConfirmId] = useState<number | null>(null);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [lastSavedId, setLastSavedId] = useState<number | null>(null);
  const [actionStatus, setActionStatus] = useState<"idle" | "loading" | "success">("idle");
  const [editId, setEditId] = useState<number | null>(null);
  const [newName, setNewName] = useState("");
  const [newSurface, setNewSurface] = useState("Indoor · Hard");
  const [newPrice, setNewPrice] = useState("400");
  const [walkInOpen, setWalkInOpen] = useState(false);
  const [walkInSuccess, setWalkInSuccess] = useState<string | null>(null);

  const filtered = courts.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  function handleWalkIn(name: string, court: string) {
    setWalkInOpen(false);
    setWalkInSuccess(`${name || "Walk-in guest"} logged for ${court}`);
    setTimeout(() => setWalkInSuccess(null), 3000);
  }

  function toggleAvailable(id: number) {
    const target = courts.find(c => c.id === id);
    if (target) {
      updateCourt(id, { available: !target.available });
    }
  }

  function handleActionConfirm(action: "enable" | "disable" | "save", id?: number) {
    setActionStatus("loading");
    setTimeout(() => {
      setActionStatus("success");
      setTimeout(() => {
        if (action === "save") {
          const parsedPrice = parseInt(newPrice, 10);
          if (editId !== null) {
            updateCourt(editId, { 
              name: newName, 
              surface: newSurface, 
              price: (!isNaN(parsedPrice) && parsedPrice > 0) ? parsedPrice : courts.find(c => c.id === editId)?.price 
            });
            const savedId = editId;
            setEditId(null);
            setShowSaveConfirm(false);
            setLastSavedId(savedId);
            setTimeout(() => setLastSavedId(null), 1000);
          }
        } else if (id !== undefined) {
          toggleAvailable(id);
          if (action === "enable") setEnableConfirmId(null);
          if (action === "disable") setDisableConfirmId(null);
        }
        setActionStatus("idle");
      }, 500);
    }, 600);
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
      setEditId(null);
    }
  }

  function addCourt() {
    if (!newName.trim()) return;
    const parsedPrice = parseInt(newPrice, 10);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      // Avoid silent fail, return early (or show toast if we had one)
      return;
    }
    addCourtContext({ id: Date.now(), name: newName, surface: newSurface, price: parsedPrice, available: true });
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
          <div key={c.id} className="rounded-3xl p-5 shadow-xl bg-surface-base border border-border dark:bg-white/[0.02] dark:border-white/[0.05] dark:border-t-white/10 dark:shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-xl" 
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
                  <button onClick={() => setShowSaveConfirm(true)} className="flex-1 py-2.5 rounded-full text-xs font-bold active:scale-[0.97] transition-all hover:opacity-90 bg-accent-success text-white" style={{ boxShadow: "0 4px 12px rgba(34,197,94,0.3)" }}>Save</button>
                  <button onClick={() => setEditId(null)} className="flex-1 py-2.5 rounded-full text-xs font-bold active:scale-[0.97] transition-all hover:opacity-90 bg-surface-interactive border border-border text-foreground hover:bg-surface-interactive/80">Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-bold text-foreground text-[15px] tracking-tight">{c.name}</span>
                  <div className="flex items-center gap-1.5">
                    <motion.div layout className={cn("text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-widest", 
                      c.available ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 shadow-[0_0_12px_rgba(52,211,153,0.15)]" : "bg-red-500/15 text-red-400 border border-red-500/25 shadow-[0_0_12px_rgba(248,113,113,0.15)]"
                    )}>
                      {c.available ? "Available" : "Unavailable"}
                    </motion.div>
                  </div>
                </div>
                <div className="text-[13px] text-muted-foreground mb-2">{c.surface}</div>
                <div className="text-cyan-400 font-bold font-mono text-[15px] mb-4 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]">₱{c.price}/hr</div>
                <div className="flex gap-3 mt-4">
                  <button onClick={() => startEdit(c)} 
                    className="flex-1 py-2.5 rounded-full text-xs font-bold active:scale-[0.97] transition-all hover:opacity-90 bg-surface-interactive border border-border text-foreground hover:bg-surface-interactive/80">
                    Edit
                  </button>
                  <button onClick={() => c.available ? setDisableConfirmId(c.id) : setEnableConfirmId(c.id)} 
                    className="flex-1 py-2.5 rounded-full text-xs font-bold active:scale-[0.97] transition-all hover:opacity-90"
                    style={{ 
                      background: c.available ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)", 
                      color: c.available ? "#ef4444" : "#22c55e", 
                      border: `1px solid ${c.available ? "rgba(239,68,68,0.3)" : "rgba(34,197,94,0.3)"}`,
                      boxShadow: c.available ? "0 4px 12px rgba(239,68,68,0.15)" : "0 4px 12px rgba(34,197,94,0.15)"
                    }}>
                    {c.available ? "Disable" : "Enable"}
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

      <button onClick={() => setWalkInOpen(true)}
        className="fixed bottom-24 right-6 md:bottom-8 md:right-8 flex items-center gap-2.5 px-6 py-3.5 rounded-full font-bold text-[15px] shadow-2xl active:scale-[0.97] z-30 bg-accent-success text-white" style={{ boxShadow: "0 8px 32px rgba(34,197,94,0.4)", transition: "opacity 150ms ease-out, transform 100ms ease-out" }}
        onMouseEnter={e => (e.currentTarget.style.opacity = "0.9")}
        onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
        <Plus className="w-5 h-5" />Log Walk-in
      </button>

      <AnimatePresence>
        {walkInOpen && <WalkInModal onClose={() => setWalkInOpen(false)} onConfirm={handleWalkIn} />}
      </AnimatePresence>

      <AnimatePresence>
        {disableConfirmId !== null && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-surface-base/60 backdrop-blur-sm"
               onClick={() => setDisableConfirmId(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} 
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl p-6 shadow-2xl border text-center"
              style={{ background: "rgba(30, 30, 32, 0.75)", backdropFilter: "blur(40px) saturate(150%)", borderColor: "rgba(255,255,255,0.15)" }}>
              <h3 className="text-xl font-bold text-foreground mb-2">Disable Court?</h3>
              <p className="text-[14px] text-foreground/60 mb-6 leading-relaxed">This will immediately remove this court from the booking schedule. Players will not be able to reserve it until it is re-enabled.</p>
              <div className="flex flex-col gap-3">
                <button onClick={() => handleActionConfirm("disable", disableConfirmId)} disabled={actionStatus !== "idle"}
                  className="w-full py-3.5 rounded-full font-bold active:scale-[0.98] transition-opacity hover:opacity-90 shadow-lg flex items-center justify-center gap-2 bg-accent-danger text-white" style={{ opacity: actionStatus !== "idle" ? 0.8 : 1 }}>
                  {actionStatus === "idle" && "Disable Court"}
                  {actionStatus === "loading" && <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}><Loader2 className="w-5 h-5" /></motion.div>}
                  {actionStatus === "success" && <Check className="w-5 h-5" />}
                </button>
                <button onClick={() => setDisableConfirmId(null)} disabled={actionStatus !== "idle"}
                  className="w-full py-3.5 rounded-full font-bold active:scale-[0.98] transition-opacity hover:opacity-90 shadow-lg"
                  style={{ background: "rgba(34, 197, 94, 0.15)", color: "#4ade80", border: "1px solid rgba(34, 197, 94, 0.25)", opacity: actionStatus !== "idle" ? 0.5 : 1 }}>
                  Keep Available
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {enableConfirmId !== null && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-surface-base/60 backdrop-blur-sm"
               onClick={() => setEnableConfirmId(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} 
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl p-6 shadow-2xl border text-center"
              style={{ background: "rgba(30, 30, 32, 0.75)", backdropFilter: "blur(40px) saturate(150%)", borderColor: "rgba(255,255,255,0.15)" }}>
              <h3 className="text-xl font-bold text-foreground mb-2">Enable Court?</h3>
              <p className="text-[14px] text-foreground/60 mb-6 leading-relaxed">Are you sure you want to enable this court? It will immediately become available for players to book.</p>
              <div className="flex flex-col gap-3">
                <button onClick={() => handleActionConfirm("enable", enableConfirmId)} disabled={actionStatus !== "idle"}
                  className="w-full py-3.5 rounded-full font-bold active:scale-[0.98] transition-opacity hover:opacity-90 shadow-lg flex items-center justify-center gap-2 bg-accent-success text-white" style={{ opacity: actionStatus !== "idle" ? 0.8 : 1 }}>
                  {actionStatus === "idle" && "Enable Court"}
                  {actionStatus === "loading" && <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}><Loader2 className="w-5 h-5" /></motion.div>}
                  {actionStatus === "success" && <Check className="w-5 h-5" />}
                </button>
                <button onClick={() => setEnableConfirmId(null)} disabled={actionStatus !== "idle"}
                  className="w-full py-3.5 rounded-full font-bold active:scale-[0.98] transition-opacity hover:opacity-90 shadow-lg bg-surface-interactive border border-border text-foreground">
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSaveConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-surface-base/60 backdrop-blur-sm"
               onClick={() => setShowSaveConfirm(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} 
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl p-6 shadow-2xl border text-center"
              style={{ background: "rgba(30, 30, 32, 0.75)", backdropFilter: "blur(40px) saturate(150%)", borderColor: "rgba(255,255,255,0.15)" }}>
              <h3 className="text-xl font-bold text-foreground mb-2">Save Changes?</h3>
              <p className="text-[14px] text-foreground/60 mb-6 leading-relaxed">Are you sure you want to save these changes? The updated details will be immediately visible to players.</p>
              <div className="flex flex-col gap-3">
                <button onClick={() => handleActionConfirm("save")} disabled={actionStatus !== "idle"}
                  className="w-full py-3.5 rounded-full font-bold active:scale-[0.98] transition-opacity hover:opacity-90 shadow-lg flex items-center justify-center gap-2 bg-accent-success text-white" style={{ opacity: actionStatus !== "idle" ? 0.8 : 1 }}>
                  {actionStatus === "idle" && "Save Changes"}
                  {actionStatus === "loading" && <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}><Loader2 className="w-5 h-5" /></motion.div>}
                  {actionStatus === "success" && <Check className="w-5 h-5" />}
                </button>
                <button onClick={() => setShowSaveConfirm(false)} disabled={actionStatus !== "idle"}
                  className="w-full py-3.5 rounded-full font-bold active:scale-[0.98] transition-opacity hover:opacity-90 shadow-lg bg-surface-interactive border border-border text-foreground">
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
