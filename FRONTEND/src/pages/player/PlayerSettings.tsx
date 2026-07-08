import { useNavigate } from "react-router";
import { ChevronRight
} from "lucide-react";


export function PlayerSettingsTab() {
  const navigate = useNavigate();
  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: "'Montserrat', sans-serif" }}>SETTINGS</h1>
      <div className="rounded-xl p-4 mb-6"
        style={{ background: "linear-gradient(135deg, rgba(0,212,255,0.08) 0%, rgba(34,197,94,0.06) 100%)", border: "1px solid rgba(0,212,255,0.2)" }}>
        <div className="text-sm font-semibold text-cyan-400 mb-1">Own a court?</div>
        <div className="text-xs text-muted-foreground mb-3">Apply to list your facility and manage operations with the Owner Dashboard.</div>
        <button onClick={() => navigate("/app/owner")}
          className="text-xs px-4 py-2 rounded-lg font-medium active:scale-[0.97] transition-all"
          style={{ background: "#00d4ff", color: "#080f2e" }}>
          Apply for Owner Dashboard →
        </button>
      </div>
      {[
        { label: "Profile", items: ["Full Name", "Email Address", "Phone Number", "Skill Level"] },
        { label: "Notifications", items: ["Booking Confirmations", "Open Match Alerts", "Community Updates"] },
        { label: "Payment Methods", items: ["GCash · 09xx xxx xxxx", "Cash on Site", "Pickle Credits ₱1,200"] },
      ].map(section => (
        <div key={section.label} className="mb-6">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">{section.label}</h3>
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(0,212,255,0.1)" }}>
            {section.items.map((item, j) => (
              <div key={j} className="flex items-center justify-between px-4 py-3.5 transition-colors hover:bg-white/5"
                style={{ borderTop: j > 0 ? "1px solid rgba(0,212,255,0.08)" : "none", background: "#0f1d47" }}>
                <span className="text-sm text-foreground">{item}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
