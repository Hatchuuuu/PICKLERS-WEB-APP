import { useState } from "react";
import { useNavigate } from "react-router";
import { 
  ChevronRight, User, Mail, Phone, Trophy, Bell, Smartphone, Users, 
  CreditCard, Banknote, Coins, ShieldCheck 
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "motion/react";
import { LogOut } from "lucide-react";
import { useTheme } from "next-themes";

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`w-12 h-[28px] rounded-full flex items-center px-0.5 transition-colors duration-300 shrink-0 ${checked ? "bg-emerald-500" : "bg-surface-interactive border border-black/5 dark:border-white/5"}`}
    >
      <motion.div
        className="w-[24px] h-[24px] rounded-full bg-surface-raised border border-border shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
        animate={{ x: checked ? 20 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </button>
  );
}

export function PlayerSettingsTab() {
  const navigate = useNavigate();
  const { user, logout, verifyAccount } = useAuth();
  
  const [profile, setProfile] = useState({
    name: user?.name || "Juan Dela Cruz",
    email: user?.email || "juan@picklers.ph",
    phone: "0917 123 4567",
    skill: "4.0+",
  });

  const [notifications, setNotifications] = useState({
    booking: true,
    matches: false,
    community: true,
  });

  const { theme, setTheme } = useTheme();
  const darkMode = theme === "dark";

  const [payments, setPayments] = useState({
    gcash: "09xx xxx xxxx",
    cash: "Default",
    credits: "₱1,200",
  });

  const [editingField, setEditingField] = useState<{type: "profile" | "payment", key: string, label: string} | null>(null);
  const [editValue, setEditValue] = useState("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleEditClick = (type: "profile" | "payment", key: string, label: string, currentValue: string) => {
    setEditValue(currentValue);
    setEditingField({ type, key, label });
  };

  const saveEdit = () => {
    if (editingField) {
      if (editingField.type === "profile") {
        setProfile({ ...profile, [editingField.key as keyof typeof profile]: editValue });
      } else {
        setPayments({ ...payments, [editingField.key as keyof typeof payments]: editValue });
      }
      setEditingField(null);
    }
  };

  return (
    <div className="min-h-full pb-20 pt-4 px-4 max-w-xl mx-auto w-full">
      
      {/* Header */}
      <div className="relative h-[68px] mb-4 -mt-[1px] flex items-center justify-between">
        <AnimatePresence>
          <motion.div 
            key="title" 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: -20 }}
            className="absolute left-0 top-0"
          >
            <h1 className="text-[32px] font-extrabold tracking-tight leading-none mb-1.5" style={{ color: "var(--ink-primary)" }}>
              Settings
            </h1>
            <p className="text-sm text-muted-foreground">Manage your account and app preferences</p>
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Premium Apple ID Banner (Owner Access) */}
      {user?.role === "owner" ? (
        <div className="rounded-[20px] p-5 mb-8 relative overflow-hidden group cursor-pointer"
          onClick={() => navigate("/app/owner")}
          style={{ background: "var(--surface-raised)", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent pointer-events-none" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-14 h-14 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, #10B981 0%, #059669 100%)", boxShadow: "0 4px 12px rgba(16,185,129,0.3)" }}>
              <ShieldCheck className="w-7 h-7 text-foreground" />
            </div>
            <div className="flex-1">
              <div className="text-[17px] font-bold text-foreground mb-0.5">Owner Access Verified</div>
              <div className="text-[13px] text-foreground/50">Tap to open dashboard</div>
            </div>
            <ChevronRight className="w-5 h-5 text-foreground/30" />
          </div>
        </div>
      ) : (
        user?.role === "player" && (
          <div onClick={() => navigate("/app/owner-onboarding")} 
            className="mb-8 rounded-[16px] p-4 cursor-pointer relative overflow-hidden group active:scale-[0.98] transition-transform bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border border-cyan-500/20">
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 rounded-[12px] flex items-center justify-center shrink-0 bg-cyan-500/20 text-cyan-500 shadow-inner">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="text-[16px] font-bold text-foreground mb-0.5">Own a court?</div>
                <div className="text-[14px] text-foreground/60 font-medium">Apply to list your facility</div>
              </div>
              <ChevronRight className="w-5 h-5 text-foreground/30" />
            </div>
          </div>
        )
      )}

      {/* Profile Section */}
      <div className="mb-10">
        <h3 className="text-[12px] font-black text-foreground/40 uppercase tracking-[0.15em] mb-4 px-2">Profile Details</h3>
        <div className="flex flex-col gap-2.5">
          
          <button onClick={() => handleEditClick("profile", "name", "Full Name", profile.name)} className="w-full flex items-center justify-between p-4 rounded-[20px] bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors active:scale-[0.98] border border-black/5 dark:border-white/5">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-full flex items-center justify-center bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400">
                <User className="w-[22px] h-[22px] stroke-[2]" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-[13px] font-bold text-foreground/50 uppercase tracking-wide mb-0.5">Name</span>
                <span className="text-[16px] font-bold text-foreground">{profile.name}</span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-foreground/20" />
          </button>
          
          <button onClick={() => handleEditClick("profile", "email", "Email Address", profile.email)} className="w-full flex items-center justify-between p-4 rounded-[20px] bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors active:scale-[0.98] border border-black/5 dark:border-white/5">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-full flex items-center justify-center bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400">
                <Mail className="w-[22px] h-[22px] stroke-[2]" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-[13px] font-bold text-foreground/50 uppercase tracking-wide mb-0.5">Email</span>
                <span className="text-[16px] font-bold text-foreground truncate max-w-[150px] sm:max-w-[200px]">{profile.email}</span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-foreground/20" />
          </button>
          
          <button onClick={() => handleEditClick("profile", "phone", "Phone Number", profile.phone)} className="w-full flex items-center justify-between p-4 rounded-[20px] bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors active:scale-[0.98] border border-black/5 dark:border-white/5">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-full flex items-center justify-center bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <Phone className="w-[22px] h-[22px] stroke-[2]" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-[13px] font-bold text-foreground/50 uppercase tracking-wide mb-0.5">Phone</span>
                <span className="text-[16px] font-bold text-foreground">{profile.phone}</span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-foreground/20" />
          </button>
          
          <button onClick={() => handleEditClick("profile", "skill", "Skill Level", profile.skill)} className="w-full flex items-center justify-between p-4 rounded-[20px] bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors active:scale-[0.98] border border-black/5 dark:border-white/5">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-full flex items-center justify-center bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400">
                <Trophy className="w-[22px] h-[22px] stroke-[2]" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-[13px] font-bold text-foreground/50 uppercase tracking-wide mb-0.5">Skill Level</span>
                <span className="text-[16px] font-bold text-foreground">{profile.skill}</span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-foreground/20" />
          </button>

        </div>
      </div>

      {/* Notifications Section */}
      <div className="mb-10">
        <h3 className="text-[12px] font-black text-foreground/40 uppercase tracking-[0.15em] mb-4 px-2">Alerts & Preferences</h3>
        <div className="flex flex-col gap-2.5">
          
          <div className="w-full flex items-center justify-between p-4 rounded-[20px] bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-full flex items-center justify-center bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400">
                <Bell className="w-[22px] h-[22px] stroke-[2]" />
              </div>
              <span className="text-[16px] font-bold text-foreground">Booking Confirmations</span>
            </div>
            <Toggle checked={notifications.booking} onChange={() => setNotifications({ ...notifications, booking: !notifications.booking })} />
          </div>
          
          <div className="w-full flex items-center justify-between p-4 rounded-[20px] bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-full flex items-center justify-center bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400">
                <Smartphone className="w-[22px] h-[22px] stroke-[2]" />
              </div>
              <span className="text-[16px] font-bold text-foreground">Open Match Alerts</span>
            </div>
            <Toggle checked={notifications.matches} onChange={() => setNotifications({ ...notifications, matches: !notifications.matches })} />
          </div>
          
          <div className="w-full flex items-center justify-between p-4 rounded-[20px] bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-full flex items-center justify-center bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                <Users className="w-[22px] h-[22px] stroke-[2]" />
              </div>
              <span className="text-[16px] font-bold text-foreground">Community Updates</span>
            </div>
            <Toggle checked={notifications.community} onChange={() => setNotifications({ ...notifications, community: !notifications.community })} />
          </div>

        </div>
      </div>

      {/* Appearance Section */}
      <div className="mb-10">
        <h3 className="text-[12px] font-black text-foreground/40 uppercase tracking-[0.15em] mb-4 px-2">Appearance</h3>
        <div className="flex flex-col gap-2.5">
          
          <div className="w-full flex items-center justify-between p-4 rounded-[20px] bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-full flex items-center justify-center bg-zinc-500/10 dark:bg-zinc-500/20 text-zinc-600 dark:text-zinc-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
                </svg>
              </div>
              <span className="text-[16px] font-bold text-foreground">Dark Mode</span>
            </div>
            <Toggle checked={theme === "dark"} onChange={() => setTheme(theme === "dark" ? "light" : "dark")} />
          </div>

        </div>
      </div>

      {/* Payment Methods Section */}
      <div className="mb-10">
        <h3 className="text-[12px] font-black text-foreground/40 uppercase tracking-[0.15em] mb-4 px-2">Wallet & Payment</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          
          <button onClick={() => handleEditClick("payment", "gcash", "GCash Number", payments.gcash)} className="w-full flex items-center justify-between p-4 rounded-[20px] bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors active:scale-[0.98] border border-black/5 dark:border-white/5">
            <div className="flex flex-col items-start gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#0055FE]/10 text-[#0055FE]">
                <CreditCard className="w-5 h-5 stroke-[2]" />
              </div>
              <div className="flex flex-col items-start text-left">
                <span className="text-[15px] font-bold text-foreground">GCash</span>
                <span className="text-[13px] font-medium text-foreground/50 mt-0.5">{payments.gcash}</span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-foreground/20 self-end" />
          </button>
          
          <button onClick={() => handleEditClick("payment", "cash", "Cash Preference", payments.cash)} className="w-full flex items-center justify-between p-4 rounded-[20px] bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors active:scale-[0.98] border border-black/5 dark:border-white/5">
            <div className="flex flex-col items-start gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Banknote className="w-5 h-5 stroke-[2]" />
              </div>
              <div className="flex flex-col items-start text-left">
                <span className="text-[15px] font-bold text-foreground">Cash on Site</span>
                <span className="text-[13px] font-medium text-foreground/50 mt-0.5">{payments.cash}</span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-foreground/20 self-end" />
          </button>
          
          <button onClick={() => handleEditClick("payment", "credits", "Pickle Credits", payments.credits)} className="w-full flex items-center justify-between p-4 rounded-[20px] bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors active:scale-[0.98] border border-black/5 dark:border-white/5 sm:col-span-2">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-full flex items-center justify-center bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
                <Coins className="w-[22px] h-[22px] stroke-[2]" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-[13px] font-bold text-foreground/50 uppercase tracking-wide mb-0.5">Credits Balance</span>
                <span className="text-[16px] font-bold text-foreground">{payments.credits}</span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-foreground/20" />
          </button>

        </div>
      </div>

      {/* Sign Out Section */}
      <div className="mb-12">
        <button 
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full flex items-center justify-center gap-3 p-4 rounded-[20px] text-[16px] font-bold text-[#FF453A] hover:bg-black/5 dark:hover:bg-white/5 transition-colors active:scale-[0.98] bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 shadow-sm">
          <LogOut className="w-5 h-5 stroke-[2.5]" />
          SIGN OUT
        </button>
      </div>

      {/* Developer Zone (Only visible when pending) */}
      {user?.verificationStatus === "pending" && (
        <div className="mb-8">
          <h3 className="text-[12px] font-bold text-red-400/80 uppercase tracking-widest mb-2 px-4">Developer Tools</h3>
          <div className="rounded-[16px] overflow-hidden" style={{ background: "rgba(239, 68, 68, 0.05)", border: "1px dashed rgba(239, 68, 68, 0.2)" }}>
            <button onClick={() => verifyAccount()} className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-surface-interactive/80 transition-colors text-left">
              <div>
                <div className="text-[15px] font-bold text-red-400">Instantly Approve Account</div>
                <div className="text-[12px] text-red-400/60">Bypass the manual review state for testing.</div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Edit Modal State */}
      <AnimatePresence>
        {editingField && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="w-full max-w-sm rounded-[24px] overflow-hidden bg-white/95 dark:bg-[#1C1C1E]/95 border border-black/5 dark:border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.2)] dark:shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
              
              <div className="px-6 pt-6 pb-4">
                <h2 className="text-[20px] font-bold text-foreground mb-1" >Edit {editingField.label}</h2>
                <p className="text-[13px] text-foreground/50 mb-4">Update your profile information.</p>
                
                <input 
                  autoFocus
                  type="text"
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-[16px] outline-none bg-black/5 border border-black/10 text-foreground dark:bg-white/5 dark:border-white/10 dark:text-white"
                />
              </div>

              <div className="flex border-t border-white/5">
                <button onClick={() => setEditingField(null)}
                  className="flex-1 py-4 text-[16px] font-medium text-foreground/60 hover:bg-surface-interactive/80 transition-colors">
                  Cancel
                </button>
                <div className="w-px bg-surface-interactive/80" />
                <button onClick={saveEdit}
                  className="flex-1 py-4 text-[16px] font-bold text-blue-500 hover:bg-surface-interactive/80 transition-colors">
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logout Confirm Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-surface-base/80 dark:bg-[#0A1118]/80 backdrop-blur-3xl"
              onClick={() => setShowLogoutConfirm(false)} />
            <motion.div initial={{ y: "100%", opacity: 0.5 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="relative w-full max-w-sm flex flex-col gap-2 z-10 items-center">
              <div className="w-full max-w-[340px] bg-surface-base/80 dark:bg-[#0A1118]/80 backdrop-blur-3xl rounded-[28px] overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.4)] dark:shadow-[0_32px_80px_-12px_rgba(0,0,0,0.8)] border border-black/5 dark:border-white/[0.08]">
                 <div className="p-6 text-center pb-5">
                   <div className="w-14 h-14 rounded-[18px] bg-gradient-to-br from-red-500/10 to-red-500/5 flex items-center justify-center mx-auto mb-4 ring-1 ring-red-500/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
                     <LogOut className="w-7 h-7 text-red-500 drop-shadow-[0_2px_8px_rgba(239,68,68,0.4)]" style={{ marginLeft: "-2px" }} strokeWidth={1.5} />
                   </div>
                   <h3 className="text-[20px] font-bold text-foreground tracking-tight mb-2">Sign Out</h3>
                   <p className="text-[14px] text-foreground/70 leading-relaxed font-medium px-2">
                     You will need to sign in again to access your bookings and profile.
                   </p>
                 </div>
                 <div className="p-5 pt-0 flex gap-2.5">
                   <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-3.5 rounded-[16px] text-[15px] font-semibold text-foreground bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 active:scale-[0.98] transition-all">
                     Cancel
                   </button>
                   <button onClick={() => { logout(); navigate("/"); }} className="flex-[1.5] py-3.5 rounded-[16px] text-[15px] font-bold text-white bg-gradient-to-r from-red-500 to-red-400 hover:from-red-400 hover:to-red-400 active:scale-[0.98] transition-all shadow-[0_8px_20px_rgba(239,68,68,0.25)] ring-1 ring-red-400/50">
                     Sign Out
                   </button>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
