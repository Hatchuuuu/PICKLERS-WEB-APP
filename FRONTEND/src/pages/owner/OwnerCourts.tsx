import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, Plus, X
} from "lucide-react";
import { cn } from "@/lib/utils";


export function OwnerCourts() {
  const [courts, setCourts] = useState([
    { id: 1, name: "Court 1", surface: "Indoor · Hard", price: 400, available: true },
    { id: 2, name: "Court 2", surface: "Indoor · Hard", price: 400, available: true },
    { id: 3, name: "Court 3", surface: "Indoor · Cushioned", price: 450, available: false },
    { id: 4, name: "Center Court", surface: "Indoor · Premium", price: 600, available: true },
    { id: 5, name: "Court 5", surface: "Outdoor · Concrete", price: 300, available: false },
    { id: 6, name: "Court 6", surface: "Outdoor · Concrete", price: 300, available: true },
  ]);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [newName, setNewName] = useState("");
  const [newSurface, setNewSurface] = useState("Indoor · Hard");
  const [newPrice, setNewPrice] = useState("400");

  const filtered = courts.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  function toggleAvailable(id: number) {
    setCourts(prev => prev.map(c => c.id === id ? { ...c, available: !c.available } : c));
  }

  function startEdit(c: typeof courts[0]) {
    setEditId(c.id);
    setNewName(c.name);
    setNewSurface(c.surface);
    setNewPrice(String(c.price));
  }

  function saveEdit() {
    setCourts(prev => prev.map(c => c.id === editId ? { ...c, name: newName, surface: newSurface, price: Number(newPrice) || c.price } : c));
    setEditId(null);
  }

  function addCourt() {
    if (!newName.trim()) return;
    setCourts(prev => [...prev, { id: Date.now(), name: newName, surface: newSurface, price: Number(newPrice) || 400, available: true }]);
    setShowAddModal(false);
    setNewName(""); setNewSurface("Indoor · Hard"); setNewPrice("400");
  }

  const surfaces = ["Indoor · Hard", "Indoor · Cushioned", "Indoor · Premium", "Outdoor · Concrete", "Outdoor · Asphalt"];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Montserrat', sans-serif" }}>MY COURTS</h1>
          <p className="text-sm text-muted-foreground">Manage your facility's courts</p>
        </div>
        <button onClick={() => { setShowAddModal(true); setNewName(""); setNewSurface("Indoor · Hard"); setNewPrice("400"); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium active:scale-[0.97]"
          style={{ background: "#22c55e", color: "#fff", transition: "opacity 150ms ease-out" }}
          onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")}
          onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
          <Plus className="w-4 h-4" /> List Court
        </button>
      </div>
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter by court name..."
          className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-ring"
          style={{ background: "rgba(26,45,110,0.4)", border: "1px solid rgba(0,212,255,0.12)", color: "#e8eeff" }} />
      </div>
      {filtered.length === 0 && <div className="text-center py-16 text-muted-foreground text-sm">No courts match "{search}"</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(c => (
          <div key={c.id} className="rounded-xl p-4" style={{ background: "#0f1d47", border: "1px solid rgba(0,212,255,0.1)" }}>
            {editId === c.id ? (
              <div className="space-y-2">
                <input value={newName} onChange={e => setNewName(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: "rgba(26,45,110,0.6)", border: "1px solid rgba(0,212,255,0.2)", color: "#e8eeff" }} />
                <select value={newSurface} onChange={e => setNewSurface(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none appearance-none"
                  style={{ background: "rgba(26,45,110,0.6)", border: "1px solid rgba(0,212,255,0.2)", color: "#e8eeff", colorScheme: "dark" }}>
                  {surfaces.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">₱</span>
                  <input value={newPrice} onChange={e => setNewPrice(e.target.value)} type="number" className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ background: "rgba(26,45,110,0.6)", border: "1px solid rgba(0,212,255,0.2)", color: "#e8eeff" }} />
                  <span className="text-xs text-muted-foreground">/hr</span>
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={saveEdit} className="flex-1 py-2 rounded-lg text-xs font-medium active:scale-[0.97]"
                    style={{ background: "#22c55e", color: "#fff" }}>Save</button>
                  <button onClick={() => setEditId(null)} className="flex-1 py-2 rounded-lg text-xs font-medium active:scale-[0.97]"
                    style={{ background: "rgba(255,255,255,0.06)", color: "#a0b4e0", border: "1px solid rgba(0,212,255,0.15)" }}>Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-foreground text-sm">{c.name}</span>
                  <div className="flex items-center gap-1.5">
                    <div className={cn("w-2 h-2 rounded-full", c.available ? "bg-emerald-400" : "bg-red-400")} />
                    <span className="text-xs" style={{ color: c.available ? "#22c55e" : "#ef4444" }}>
                      {c.available ? "Available" : "Unavailable"}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mb-2">{c.surface}</div>
                <div className="text-cyan-400 font-bold font-mono text-sm mb-3">₱{c.price}/hr</div>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(c)} className="flex-1 py-2 rounded-lg text-xs font-medium active:scale-[0.97]"
                    style={{ background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.2)", color: "#00d4ff", transition: "background-color 150ms ease-out" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,212,255,0.18)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "rgba(0,212,255,0.1)")}>Edit</button>
                  <button onClick={() => toggleAvailable(c.id)} className="flex-1 py-2 rounded-lg text-xs font-medium active:scale-[0.97]"
                    style={{ background: c.available ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)", border: c.available ? "1px solid rgba(239,68,68,0.2)" : "1px solid rgba(34,197,94,0.2)", color: c.available ? "#ef4444" : "#22c55e", transition: "all 150ms ease-out" }}>
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
              onClick={() => setShowAddModal(false)} className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }} />
            <motion.div key="add-modal" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              transition={{ ease: "easeOut", duration: 0.2 }} className="fixed inset-0 z-50 flex items-center justify-center px-4">
              <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: "#0b1640", border: "1px solid rgba(0,212,255,0.2)", boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold" style={{ fontFamily: "'Montserrat', sans-serif" }}>LIST NEW COURT</h2>
                  <button onClick={() => setShowAddModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5"
                    style={{ border: "1px solid rgba(0,212,255,0.15)", color: "#6b82b8" }}><X className="w-4 h-4" /></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Court Name</label>
                    <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Court 7"
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-ring"
                      style={{ background: "rgba(26,45,110,0.5)", border: "1px solid rgba(0,212,255,0.15)", color: "#e8eeff" }} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Surface</label>
                    <select value={newSurface} onChange={e => setNewSurface(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none appearance-none"
                      style={{ background: "rgba(26,45,110,0.5)", border: "1px solid rgba(0,212,255,0.15)", color: "#e8eeff", colorScheme: "dark" }}>
                      {surfaces.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Price per Hour (₱)</label>
                    <input value={newPrice} onChange={e => setNewPrice(e.target.value)} type="number" min="100" placeholder="400"
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-ring"
                      style={{ background: "rgba(26,45,110,0.5)", border: "1px solid rgba(0,212,255,0.15)", color: "#e8eeff" }} />
                  </div>
                </div>
                <button onClick={addCourt} disabled={!newName.trim()}
                  className="w-full mt-5 py-3.5 rounded-2xl font-bold text-sm active:scale-[0.97] disabled:opacity-40"
                  style={{ background: "#22c55e", color: "#fff", transition: "opacity 150ms ease-out" }}>
                  Add Court
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
