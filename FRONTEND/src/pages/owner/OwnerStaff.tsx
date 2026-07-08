import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, X, AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";


export function OwnerStaff() {
  const [staff, setStaff] = useState([
    { id: 1, name: "Bennie Ocampo", email: "bennie@bgchub.com", role: "manager", joined: "Jun 1, 2026" },
    { id: 2, name: "Liza Reyes", email: "liza@bgchub.com", role: "desk", joined: "Jun 15, 2026" },
    { id: 3, name: "Mark Delos Santos", email: "mark@bgchub.com", role: "desk", joined: "Jul 1, 2026" },
  ]);
  const [confirm, setConfirm] = useState<number | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [addStaffOpen, setAddStaffOpen] = useState(false);
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffEmail, setNewStaffEmail] = useState("");
  const [newStaffRole, setNewStaffRole] = useState<"desk" | "manager">("desk");

  function handleDelete(id: number) {
    if (confirmText === "delete this staff") {
      setStaff(prev => prev.filter(s => s.id !== id));
      setConfirm(null);
      setConfirmText("");
    }
  }

  function addStaff() {
    const today = new Date().toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
    setStaff(prev => [...prev, { id: Date.now(), name: newStaffName, email: newStaffEmail, role: newStaffRole, joined: today }]);
    setAddStaffOpen(false);
    setNewStaffName(""); setNewStaffEmail(""); setNewStaffRole("desk");
  }

  return (
    <div className="p-6 max-w-2xl">
      {addStaffOpen && (
        <>
          <motion.div key="staff-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setAddStaffOpen(false)} className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }} />
          <motion.div key="staff-modal" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            transition={{ ease: "easeOut", duration: 0.2 }} className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: "#0b1640", border: "1px solid rgba(0,212,255,0.2)", boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold" style={{ fontFamily: "'Montserrat', sans-serif" }}>ADD STAFF</h2>
                <button onClick={() => setAddStaffOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5"
                  style={{ border: "1px solid rgba(0,212,255,0.15)", color: "#6b82b8" }}><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Full Name</label>
                  <input value={newStaffName} onChange={e => setNewStaffName(e.target.value)} placeholder="e.g. Maria Santos"
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-ring"
                    style={{ background: "rgba(26,45,110,0.5)", border: "1px solid rgba(0,212,255,0.15)", color: "#e8eeff" }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Email</label>
                  <input value={newStaffEmail} onChange={e => setNewStaffEmail(e.target.value)} type="email" placeholder="staff@facility.com"
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-ring"
                    style={{ background: "rgba(26,45,110,0.5)", border: "1px solid rgba(0,212,255,0.15)", color: "#e8eeff" }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Role</label>
                  <div className="flex gap-2">
                    {(["desk", "manager"] as const).map(r => (
                      <button key={r} onClick={() => setNewStaffRole(r)}
                        className="flex-1 py-2.5 rounded-xl text-sm font-medium active:scale-[0.97] capitalize"
                        style={{
                          background: newStaffRole === r ? "rgba(0,212,255,0.15)" : "rgba(26,45,110,0.4)",
                          border: newStaffRole === r ? "1px solid rgba(0,212,255,0.4)" : "1px solid rgba(0,212,255,0.12)",
                          color: newStaffRole === r ? "#00d4ff" : "#6b82b8",
                          transition: "all 150ms ease-out",
                        }}>{r}</button>
                    ))}
                  </div>
                </div>
              </div>
              <button onClick={addStaff} disabled={!newStaffName.trim() || !newStaffEmail.trim()}
                className="w-full mt-5 py-3.5 rounded-2xl font-bold text-sm active:scale-[0.97] disabled:opacity-40"
                style={{ background: "#22c55e", color: "#fff", transition: "opacity 150ms ease-out" }}>
                Add Staff Member
              </button>
            </div>
          </motion.div>
        </>
      )}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Montserrat', sans-serif" }}>STAFF</h1>
          <p className="text-sm text-muted-foreground">Delegate daily operations</p>
        </div>
        <button onClick={() => setAddStaffOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium active:scale-[0.97]"
          style={{ background: "#22c55e", color: "#fff", transition: "opacity 150ms ease-out" }}
          onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")}
          onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
          <Plus className="w-4 h-4" /> Add Staff
        </button>
      </div>
      <div className="flex flex-col gap-3">
        {staff.map(s => (
          <div key={s.id} className="rounded-xl p-4 flex items-center gap-4"
            style={{ background: "#0f1d47", border: "1px solid rgba(0,212,255,0.1)" }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
              style={{ background: "#1a2d6e", color: s.role === "manager" ? "#00d4ff" : "#6b82b8" }}>{s.name[0]}</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-foreground">{s.name}</div>
              <div className="text-xs text-muted-foreground">{s.email}</div>
            </div>
            <div className="shrink-0 text-center hidden sm:block">
              <div className={cn("text-xs px-2 py-0.5 rounded-full font-medium", s.role === "manager" ? "bg-cyan-500/20 text-cyan-400" : "bg-white/10 text-muted-foreground")}>
                {s.role}
              </div>
              <div className="text-xs text-muted-foreground mt-1">{s.joined}</div>
            </div>
            <button onClick={() => setConfirm(s.id)}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-red-500/15 active:scale-[0.97] shrink-0"
              style={{ border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444" }}>
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {confirm !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm rounded-2xl p-6"
              style={{ background: "#0f1d47", border: "1px solid rgba(239,68,68,0.3)" }}>
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                <h3 className="font-semibold text-foreground">Remove Staff Member</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                This action cannot be undone. Type <span className="font-mono text-red-400">delete this staff</span> to confirm.
              </p>
              <input value={confirmText} onChange={e => setConfirmText(e.target.value)} placeholder="delete this staff"
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none mb-4 font-mono"
                style={{ background: "rgba(26,45,110,0.6)", border: "1px solid rgba(239,68,68,0.3)", color: "#e8eeff" }} />
              <div className="flex gap-3">
                <button onClick={() => { setConfirm(null); setConfirmText(""); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium active:scale-[0.97] transition-all"
                  style={{ background: "rgba(26,45,110,0.6)", border: "1px solid rgba(0,212,255,0.15)", color: "#a0b4e0" }}>
                  Cancel
                </button>
                <button onClick={() => handleDelete(confirm!)} disabled={confirmText !== "delete this staff"}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium active:scale-[0.97] disabled:opacity-40 transition-all"
                  style={{ background: "#ef4444", color: "#fff" }}>
                  Remove
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
