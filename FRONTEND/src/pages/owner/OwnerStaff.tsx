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
    setStaff(prev => prev.filter(s => s.id !== id));
    setConfirm(null);
    setConfirmText("");
  }

  function addStaff() {
    const today = new Date().toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
    setStaff(prev => [...prev, { id: Date.now(), name: newStaffName, email: newStaffEmail, role: newStaffRole, joined: today }]);
    setAddStaffOpen(false);
    setNewStaffName(""); setNewStaffEmail(""); setNewStaffRole("desk");
  }

  return (
    <div className="p-4 max-w-6xl mx-auto w-full max-w-2xl">
      {addStaffOpen && (
        <>
          <motion.div key="staff-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }} />
          <motion.div key="staff-modal" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }} className="fixed inset-0 z-50 flex items-center justify-center px-4"
            onClick={() => setAddStaffOpen(false)}>
            <div className="w-full max-w-sm rounded-2xl p-6 shadow-[0_24px_64px_rgba(0,0,0,0.15)] dark:shadow-[0_24px_64px_rgba(0,0,0,0.5)] border border-border bg-surface-base"
                 onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold tracking-tight">Add Staff</h2>
                <button onClick={() => setAddStaffOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-interactive/80"
                  style={{ border: "1px solid var(--border-default)", color: "var(--ink-muted)" }}><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Full Name</label>
                  <input value={newStaffName} onChange={e => setNewStaffName(e.target.value)} placeholder="e.g. Maria Santos"
                    className="w-full px-4 py-3 rounded-xl text-[15px] outline-none border border-border bg-black/5 dark:bg-white/5 text-foreground focus:border-emerald-500/50 transition-colors placeholder:text-muted-foreground" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Email</label>
                  <input value={newStaffEmail} onChange={e => setNewStaffEmail(e.target.value)} type="email" placeholder="staff@facility.com"
                    className="w-full px-4 py-3 rounded-xl text-[15px] outline-none border border-border bg-black/5 dark:bg-white/5 text-foreground focus:border-emerald-500/50 transition-colors placeholder:text-muted-foreground" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Role</label>
                  <div className="flex gap-2">
                    {(["desk", "manager"] as const).map(r => (
                      <button key={r} onClick={() => setNewStaffRole(r)}
                        className="flex-1 py-2.5 rounded-xl text-sm font-medium active:scale-[0.97] capitalize"
                        style={{
                          background: newStaffRole === r ? "var(--border-default)" : "var(--surface-interactive)",
                          border: newStaffRole === r ? "1px solid rgba(0,212,255,0.4)" : "1px solid var(--border-subtle)",
                          color: newStaffRole === r ? "var(--accent-primary)" : "var(--ink-muted)",
                          transition: "all 150ms ease-out" }}>{r}</button>
                    ))}
                  </div>
                </div>
              </div>
              <button onClick={addStaff} disabled={!newStaffName.trim() || !newStaffEmail.trim()}
                className="w-full mt-5 py-3.5 rounded-2xl font-bold text-sm active:scale-[0.97] disabled:opacity-40 bg-accent-success text-white" style={{ transition: "opacity 150ms ease-out" }}>
                Add Staff Member
              </button>
            </div>
          </motion.div>
        </>
      )}
      <div className="relative h-[68px] mb-4 -mt-[1px] flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <h1 className="text-[26px] min-[390px]:text-[28px] md:text-[32px] font-extrabold tracking-tight leading-none mb-1.5 whitespace-nowrap" style={{ color: "var(--ink-primary)" }}>
              Staff Management
            </h1>
            <p className="text-[13px] font-medium leading-relaxed" style={{ color: "var(--ink-muted)" }}>
              Delegate daily operations
            </p>
          </motion.div>
      </div>
      <div className="flex flex-col gap-3">
        {staff.map(s => (
          <div key={s.id} className="rounded-xl p-4 flex items-center gap-4"
            style={{ background: "var(--surface-raised)", border: "1px solid var(--accent-primary-muted)" }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
              style={{ background: "var(--surface-interactive)", color: s.role === "manager" ? "var(--accent-primary)" : "var(--ink-muted)" }}>{s.name[0]}</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-foreground">{s.name}</div>
              <div className="text-xs text-muted-foreground">{s.email}</div>
            </div>
            <div className="shrink-0 text-center hidden sm:block">
              <div className={cn("text-xs px-2 py-0.5 rounded-full font-medium", s.role === "manager" ? "bg-cyan-500/20 text-cyan-400" : "bg-surface-interactive text-muted-foreground")}>
                {s.role}
              </div>
              <div className="text-xs text-muted-foreground mt-1">{s.joined}</div>
            </div>
            <button onClick={() => setConfirm(s.id)}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-red-500/15 active:scale-[0.97] shrink-0"
              style={{ border: "1px solid rgba(239,68,68,0.2)", color: "var(--accent-danger)" }}>
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <button onClick={() => setAddStaffOpen(true)}
        className="fixed bottom-24 right-6 md:bottom-8 md:right-8 flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold text-sm shadow-2xl active:scale-[0.97] z-30 bg-accent-success text-white" style={{ boxShadow: "0 8px 32px rgba(34,197,94,0.4)", transition: "opacity 150ms ease-out, transform 100ms ease-out" }}
        onMouseEnter={e => (e.currentTarget.style.opacity = "0.9")}
        onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
        <Plus className="w-5 h-5" />Add Staff
      </button>

      <AnimatePresence>
        {confirm !== null && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
               onClick={() => { setConfirm(null); setConfirmText(""); }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} 
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[340px] rounded-[32px] p-6 shadow-2xl border border-black/5 dark:border-white/10 text-center bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-[40px] saturate-150">
              <div className="mb-6">
                <h3 className="text-[20px] font-bold text-foreground mb-2 tracking-tight">Revoke Staff Access?</h3>
                <p className="text-[14px] text-foreground/60 leading-relaxed">This will immediately remove this user's access to the facility dashboard and management system.</p>
              </div>
              <div className="flex flex-col gap-3">
                <button onClick={() => handleDelete(confirm!)} 
                  className="w-full py-3.5 rounded-full text-[15px] font-bold text-white bg-[#FF3B30] shadow-[0_4px_12px_rgba(255,59,48,0.3)] hover:opacity-90 active:scale-[0.98] transition-all" >
                  Revoke Access
                </button>
                <button onClick={() => { setConfirm(null); setConfirmText(""); }} 
                  className="w-full py-3.5 rounded-full text-[15px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/15 active:scale-[0.98] transition-all">
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
