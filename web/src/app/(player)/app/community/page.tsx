"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Heart, Search, Users, MessageCircle, Send, ChevronLeft, X,
  Medal, Shield, Plus, CheckCircle2, Clock, UserCheck, UserX,
  Settings2, Inbox, ChevronRight
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import type { CommunityPlayer, Club, ClubMember, DirectMessage, Conversation } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// SMALL HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function Avatar({ name, size = 44, online }: { name: string; size?: number; online?: boolean }) {
  const colors = [
    "from-emerald-500 to-teal-600",
    "from-blue-500 to-indigo-600",
    "from-violet-500 to-purple-600",
    "from-rose-500 to-pink-600",
    "from-amber-500 to-orange-600",
  ];
  const color = colors[(name.charCodeAt(0) ?? 0) % colors.length];
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div className={`w-full h-full rounded-full bg-gradient-to-br ${color} flex items-center justify-center font-bold text-white`}
        style={{ fontSize: size * 0.38 }}>
        {name[0]?.toUpperCase()}
      </div>
      {online && (
        <span className="absolute bottom-0 right-0 rounded-full border-2 border-background bg-emerald-400"
          style={{ width: size * 0.28, height: size * 0.28 }} />
      )}
    </div>
  );
}

function LevelBadge({ level }: { level: string }) {
  return (
    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
      style={{ background: "var(--accent-primary-muted)", color: "var(--accent-primary)" }}>
      {level}
    </span>
  );
}

function EmptyState({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-8">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
        <Icon className="w-7 h-7" style={{ color: "var(--ink-muted)" }} />
      </div>
      <p className="text-sm font-semibold text-foreground mb-1">{title}</p>
      <p className="text-xs" style={{ color: "var(--ink-muted)" }}>{subtitle}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB BAR
// ─────────────────────────────────────────────────────────────────────────────

type Tab = "players" | "clubs" | "messages";

function TabBar({ active, onChange, unreadCount }: {
  active: Tab;
  onChange: (t: Tab) => void;
  unreadCount: number;
}) {
  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "players", label: "Players", icon: Users },
    { id: "clubs", label: "Clubs", icon: Shield },
    { id: "messages", label: "Messages", icon: Inbox },
  ];
  return (
    <div className="flex rounded-2xl p-1 gap-1"
      style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
      {tabs.map((t) => {
        const Icon = t.icon;
        const isActive = active === t.id;
        return (
          <button key={t.id} onClick={() => onChange(t.id)}
            className="relative flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[13px] font-semibold transition-colors"
            style={{ color: isActive ? "white" : "var(--ink-secondary)" }}>
            {isActive && (
              <motion.div layoutId="tab-pill" className="absolute inset-0 rounded-xl"
                style={{ background: "var(--accent-primary)" }}
                transition={{ type: "spring", stiffness: 500, damping: 35 }} />
            )}
            <Icon className="relative z-10 w-4 h-4" />
            <span className="relative z-10">{t.label}</span>
            {t.id === "messages" && unreadCount > 0 && (
              <span className="relative z-10 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PLAYERS TAB
// ─────────────────────────────────────────────────────────────────────────────

function PlayersTab({ onOpenChat }: { onOpenChat: (p: CommunityPlayer) => void }) {
  const [players, setPlayers] = useState<CommunityPlayer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const searchRef = useRef<NodeJS.Timeout | null>(null);

  const fetchPlayers = useCallback(async (q: string) => {
    setLoading(true);
    const res = await fetch(`/api/community/players?q=${encodeURIComponent(q)}`);
    if (res.ok) setPlayers(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPlayers("");
  }, [fetchPlayers]);

  function handleSearch(v: string) {
    setSearch(v);
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => fetchPlayers(v), 300);
  }

  async function toggleLike(p: CommunityPlayer) {
    // Optimistic update
    setPlayers(prev => prev.map(pl =>
      pl.id === p.id
        ? { ...pl, i_liked: !pl.i_liked, like_count: pl.like_count + (pl.i_liked ? -1 : 1) }
        : pl
    ));
    const res = await fetch("/api/community/likes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ liked_id: p.id }),
    });
    if (!res.ok) {
      // Revert on failure
      setPlayers(prev => prev.map(pl =>
        pl.id === p.id
          ? { ...pl, i_liked: p.i_liked, like_count: p.like_count }
          : pl
      ));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--ink-muted)" }} />
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search players..."
          className="w-full h-12 pl-11 pr-4 rounded-2xl text-[14px] outline-none transition-shadow focus:shadow-[0_0_20px_rgba(0,217,139,0.15)]"
          style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)", color: "var(--ink-primary)" }}
        />
        {search && (
          <button onClick={() => { setSearch(""); fetchPlayers(""); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: "var(--border-default)" }}>
            <X className="w-3 h-3" style={{ color: "var(--ink-secondary)" }} />
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-[76px] rounded-2xl animate-pulse" style={{ background: "var(--surface-raised)" }} />
          ))}
        </div>
      ) : players.length === 0 ? (
        <EmptyState icon={Users}
          title={search ? `No players found for "${search}"` : "No players yet"}
          subtitle="Players who create accounts will appear here" />
      ) : (
        <div className="flex flex-col gap-3">
          {!search && (
            <p className="text-[11px] font-bold uppercase tracking-wider px-1" style={{ color: "var(--ink-muted)" }}>
              People You May Know
            </p>
          )}
          {players.map((p, i) => (
            <motion.div key={p.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 8) * 0.04, duration: 0.35 }}
              className="flex items-center gap-4 p-4 rounded-2xl cursor-pointer group"
              style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}
              onClick={() => onOpenChat(p)}>
              <Avatar name={p.name} size={46} online={p.online} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[15px] font-bold text-foreground leading-tight">{p.name}</span>
                  <LevelBadge level={p.level} />
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Medal className="w-3.5 h-3.5 text-amber-400" strokeWidth={1.5} />
                    <span className="text-xs" style={{ color: "var(--ink-muted)" }}>{p.gold}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Medal className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.5} />
                    <span className="text-xs" style={{ color: "var(--ink-muted)" }}>{p.silver}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Medal className="w-3.5 h-3.5 text-orange-400" strokeWidth={1.5} />
                    <span className="text-xs" style={{ color: "var(--ink-muted)" }}>{p.bronze}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                {/* Like */}
                <motion.button
                  whileTap={{ scale: 0.7 }}
                  onClick={(e) => { e.stopPropagation(); toggleLike(p); }}
                  className="flex flex-col items-center gap-0.5 min-w-[44px] min-h-[44px] justify-center rounded-xl"
                  style={{ background: p.i_liked ? "rgba(239,68,68,0.12)" : "var(--surface-interactive)" }}>
                  <Heart className="w-4 h-4" style={{
                    color: p.i_liked ? "#f04848" : "var(--ink-muted)",
                    fill: p.i_liked ? "#f04848" : "none",
                    transition: "color 150ms, fill 150ms"
                  }} />
                  <span className="text-[10px] font-mono" style={{ color: p.i_liked ? "#f04848" : "var(--ink-muted)" }}>
                    {p.like_count}
                  </span>
                </motion.button>
                {/* Message */}
                <button
                  onClick={(e) => { e.stopPropagation(); onOpenChat(p); }}
                  className="w-11 h-11 flex items-center justify-center rounded-xl"
                  style={{ background: "var(--surface-interactive)", border: "1px solid var(--border-subtle)" }}>
                  <MessageCircle className="w-4 h-4 text-cyan-400" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CLUBS TAB
// ─────────────────────────────────────────────────────────────────────────────

function ClubsTab({ onManage }: { onManage: (club: Club) => void }) {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [joiningId, setJoiningId] = useState<string | null>(null);

  async function fetchClubs() {
    setLoading(true);
    const res = await fetch("/api/community/clubs");
    if (res.ok) setClubs(await res.json());
    setLoading(false);
  }

  useEffect(() => { fetchClubs(); }, []);

  async function handleJoin(club: Club) {
    if (club.my_status !== "none") return;
    setJoiningId(club.id);
    const res = await fetch(`/api/community/clubs/${club.id}/join`, { method: "POST" });
    if (res.ok) {
      setClubs(prev => prev.map(c => c.id === club.id ? { ...c, my_status: "pending" } : c));
    }
    setJoiningId(null);
  }

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    const res = await fetch("/api/community/clubs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, description: newDesc }),
    });
    if (res.ok) {
      setShowCreateForm(false);
      setNewName("");
      setNewDesc("");
      await fetchClubs();
    }
    setCreating(false);
  }

  const statusLabel = (s: Club["my_status"]) => {
    if (s === "member") return { label: "Member", color: "var(--accent-primary)", bg: "var(--accent-primary-muted)" };
    if (s === "pending") return { label: "Pending", color: "var(--accent-warning)", bg: "rgba(255,186,59,0.12)" };
    if (s === "admin") return { label: "Admin", color: "var(--accent-secondary)", bg: "rgba(59,130,246,0.12)" };
    return null;
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Create Club Button */}
      <button onClick={() => setShowCreateForm(true)}
        className="flex items-center justify-center gap-2 h-12 rounded-2xl font-semibold text-[14px] active:scale-[0.98] transition-all"
        style={{ background: "var(--accent-primary-muted)", border: "1px dashed var(--accent-primary)", color: "var(--accent-primary)" }}>
        <Plus className="w-4 h-4" />
        Create a Club
      </button>

      {/* Create Form Bottom Sheet */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div className="fixed inset-0 z-50 flex items-end"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCreateForm(false)} />
            <motion.div className="relative w-full rounded-t-3xl p-6 flex flex-col gap-4"
              style={{ background: "var(--surface-overlay)", border: "1px solid var(--border-subtle)" }}
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}>
              <div className="w-10 h-1 rounded-full mx-auto mb-2" style={{ background: "var(--border-default)" }} />
              <h3 className="text-lg font-bold text-foreground">Create a Club</h3>
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Club name (required)"
                className="h-12 px-4 rounded-xl text-[14px] outline-none"
                style={{ background: "var(--surface-raised)", border: "1px solid var(--border-default)", color: "var(--ink-primary)" }}
              />
              <textarea
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                placeholder="Description (optional)"
                rows={3}
                className="px-4 py-3 rounded-xl text-[14px] outline-none resize-none"
                style={{ background: "var(--surface-raised)", border: "1px solid var(--border-default)", color: "var(--ink-primary)" }}
              />
              <div className="flex gap-3">
                <button onClick={() => setShowCreateForm(false)}
                  className="flex-1 h-12 rounded-xl font-semibold text-[14px]"
                  style={{ background: "var(--surface-interactive)", color: "var(--ink-secondary)" }}>
                  Cancel
                </button>
                <button onClick={handleCreate} disabled={!newName.trim() || creating}
                  className="flex-1 h-12 rounded-xl font-semibold text-[14px] text-white active:scale-[0.98] transition-all disabled:opacity-50"
                  style={{ background: "var(--accent-primary)" }}>
                  {creating ? "Creating..." : "Create Club"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-[100px] rounded-2xl animate-pulse" style={{ background: "var(--surface-raised)" }} />
          ))}
        </div>
      ) : clubs.length === 0 ? (
        <EmptyState icon={Shield} title="No clubs yet" subtitle="Be the first to create a club!" />
      ) : (
        <div className="flex flex-col gap-3">
          {clubs.map((club, i) => {
            const badge = statusLabel(club.my_status);
            return (
              <motion.div key={club.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 6) * 0.05 }}
                className="p-4 rounded-2xl flex flex-col gap-3"
                style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                    style={{ background: "var(--accent-primary-muted)" }}>
                    <Shield className="w-6 h-6" style={{ color: "var(--accent-primary)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[15px] font-bold text-foreground leading-tight">{club.name}</span>
                      {badge && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                          style={{ background: badge.bg, color: badge.color }}>
                          {badge.label}
                        </span>
                      )}
                    </div>
                    <p className="text-xs truncate" style={{ color: "var(--ink-secondary)" }}>
                      {club.description ?? "No description"}
                    </p>
                    <p className="text-[11px] mt-1" style={{ color: "var(--ink-muted)" }}>
                      {club.member_count} member{club.member_count !== 1 ? "s" : ""} · Admin: {club.admin_name ?? "Unknown"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {(club.my_status === "admin") && (
                    <button onClick={() => onManage(club)}
                      className="flex-1 h-10 rounded-xl flex items-center justify-center gap-1.5 text-[13px] font-semibold"
                      style={{ background: "rgba(59,130,246,0.12)", color: "var(--accent-secondary)" }}>
                      <Settings2 className="w-3.5 h-3.5" /> Manage Members
                    </button>
                  )}
                  {club.my_status === "none" && (
                    <button onClick={() => handleJoin(club)} disabled={joiningId === club.id}
                      className="flex-1 h-10 rounded-xl text-[13px] font-semibold text-white active:scale-[0.98] transition-all disabled:opacity-60"
                      style={{ background: "var(--accent-primary)" }}>
                      {joiningId === club.id ? "Sending..." : "Request to Join"}
                    </button>
                  )}
                  {club.my_status === "pending" && (
                    <div className="flex-1 h-10 rounded-xl flex items-center justify-center gap-1.5 text-[13px] font-medium"
                      style={{ background: "rgba(255,186,59,0.1)", color: "var(--accent-warning)", border: "1px solid rgba(255,186,59,0.2)" }}>
                      <Clock className="w-3.5 h-3.5" /> Pending Approval
                    </div>
                  )}
                  {club.my_status === "member" && (
                    <div className="flex-1 h-10 rounded-xl flex items-center justify-center gap-1.5 text-[13px] font-medium"
                      style={{ background: "var(--accent-primary-muted)", color: "var(--accent-primary)" }}>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Member
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CLUB MANAGE PANEL (slide-in)
// ─────────────────────────────────────────────────────────────────────────────

function ClubManagePanel({ club, onBack }: { club: Club; onBack: () => void }) {
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await fetch(`/api/community/clubs/${club.id}/members`);
      if (res.ok) setMembers(await res.json());
      setLoading(false);
    })();
  }, [club.id]);

  async function handleAction(memberId: string, action: "accept" | "reject") {
    setActioning(memberId);
    const res = await fetch(`/api/community/clubs/${club.id}/members`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ member_user_id: memberId, action }),
    });
    if (res.ok) {
      if (action === "accept") {
        setMembers(prev => prev.map(m => m.user_id === memberId ? { ...m, status: "member" } : m));
      } else {
        setMembers(prev => prev.filter(m => m.user_id !== memberId));
      }
    }
    setActioning(null);
  }

  const pending = members.filter(m => m.status === "pending");
  const confirmed = members.filter(m => m.status === "member" || m.status === "admin");

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 shrink-0 flex items-center gap-3 sticky top-0 z-10 bg-surface-base/70 border-b border-border backdrop-blur-2xl">
        <button onClick={onBack}
          className="w-8 h-8 rounded-full flex items-center justify-center active:scale-95 transition-all"
          style={{ background: "var(--surface-interactive)", border: "1px solid var(--border-subtle)" }}>
          <ChevronLeft className="w-5 h-5 pr-0.5" style={{ color: "var(--accent-primary)" }} />
        </button>
        <div>
          <div className="text-sm font-bold text-foreground">{club.name}</div>
          <div className="text-xs" style={{ color: "var(--ink-muted)" }}>Manage Members</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-6">
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: "var(--surface-raised)" }} />
            ))}
          </div>
        ) : (
          <>
            {pending.length > 0 && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: "var(--ink-muted)" }}>
                  Pending Requests ({pending.length})
                </p>
                <div className="flex flex-col gap-2">
                  {pending.map(m => (
                    <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl"
                      style={{ background: "var(--surface-raised)", border: "1px solid rgba(255,186,59,0.2)" }}>
                      <Avatar name={m.name} size={38} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold text-foreground">{m.name}</p>
                        <p className="text-xs" style={{ color: "var(--ink-muted)" }}>Requested to join</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAction(m.user_id, "reject")}
                          disabled={actioning === m.user_id}
                          className="w-9 h-9 rounded-xl flex items-center justify-center"
                          style={{ background: "rgba(240,72,72,0.1)" }}>
                          <UserX className="w-4 h-4 text-red-500" />
                        </button>
                        <button
                          onClick={() => handleAction(m.user_id, "accept")}
                          disabled={actioning === m.user_id}
                          className="w-9 h-9 rounded-xl flex items-center justify-center"
                          style={{ background: "var(--accent-primary-muted)" }}>
                          <UserCheck className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {confirmed.length > 0 && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: "var(--ink-muted)" }}>
                  Members ({confirmed.length})
                </p>
                <div className="flex flex-col gap-2">
                  {confirmed.map(m => (
                    <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl"
                      style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
                      <Avatar name={m.name} size={38} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold text-foreground">{m.name}</p>
                        <p className="text-xs" style={{ color: "var(--ink-muted)" }}>
                          {m.level} · {m.status === "admin" ? "Admin" : "Member"}
                        </p>
                      </div>
                      {m.status === "admin" && (
                        <span className="text-[10px] font-bold px-2 py-1 rounded-md"
                          style={{ background: "rgba(59,130,246,0.12)", color: "var(--accent-secondary)" }}>
                          Admin
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pending.length === 0 && confirmed.length === 0 && (
              <EmptyState icon={Users} title="No members yet" subtitle="Share this club to invite players" />
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MESSAGES TAB (Inbox)
// ─────────────────────────────────────────────────────────────────────────────

function MessagesTab({ onOpenChat }: { onOpenChat: (p: { id: string; name: string; online: boolean }) => void }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await fetch("/api/community/inbox");
      if (res.ok) setConversations(await res.json());
      setLoading(false);
    })();
  }, []);

  const totalUnread = conversations.reduce((s, c) => s + c.unread_count, 0);

  if (loading) return (
    <div className="flex flex-col gap-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-[72px] rounded-2xl animate-pulse" style={{ background: "var(--surface-raised)" }} />
      ))}
    </div>
  );

  if (conversations.length === 0) return (
    <EmptyState icon={Inbox} title="No messages yet" subtitle="Go to Players tab and message someone to start!" />
  );

  return (
    <div className="flex flex-col gap-2">
      {totalUnread > 0 && (
        <p className="text-[12px] px-1" style={{ color: "var(--ink-muted)" }}>
          {totalUnread} unread message{totalUnread !== 1 ? "s" : ""}
        </p>
      )}
      {conversations.map((c, i) => (
        <motion.button key={c.user_id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
          onClick={() => onOpenChat({ id: c.user_id, name: c.name, online: c.online })}
          className="flex items-center gap-3 p-4 rounded-2xl text-left w-full group"
          style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
          <Avatar name={c.name} size={46} online={c.online} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <span className="text-[14px] font-bold text-foreground truncate">{c.name}</span>
              <span className="text-[11px] shrink-0" style={{ color: "var(--ink-muted)" }}>
                {new Date(c.last_at).toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" })}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[13px] truncate" style={{ color: "var(--ink-secondary)" }}>{c.last_message}</span>
              {c.unread_count > 0 && (
                <span className="shrink-0 w-5 h-5 rounded-full bg-accent-primary flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ background: "var(--accent-primary)" }}>
                  {c.unread_count}
                </span>
              )}
            </div>
          </div>
          <ChevronRight className="w-4 h-4 shrink-0 group-hover:translate-x-0.5 transition-transform" style={{ color: "var(--ink-muted)" }} />
        </motion.button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CHAT PANEL (slide-in from right)
// ─────────────────────────────────────────────────────────────────────────────

function ChatPanel({
  partner,
  onBack,
}: {
  partner: { id: string; name: string; online: boolean };
  onBack: () => void;
}) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch messages
  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/community/messages?with=${partner.id}`);
      if (res.ok) setMessages(await res.json());
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "instant" }), 50);
    })();
  }, [partner.id]);

  // Supabase Realtime subscription
  useEffect(() => {
    if (!user?.id) return;
    const myId = user.id;
    const channel = supabase
      .channel(`dm-${myId}-${partner.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
          filter: `receiver_id=eq.${myId}`,
        },
        (payload) => {
          const msg = payload.new as DirectMessage;
          if (msg.sender_id !== partner.id) return;
          setMessages(prev => [...prev, msg]);
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id, partner.id]);

  async function sendMessage() {
    if (!draft.trim() || sending) return;
    const content = draft.trim();
    setDraft("");
    setSending(true);

    // Optimistic bubble
    const optimistic: DirectMessage = {
      id: "opt-" + Date.now(),
      sender_id: user?.id ?? "",
      receiver_id: partner.id,
      content,
      read: false,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);

    const res = await fetch("/api/community/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiver_id: partner.id, content }),
    });
    if (res.ok) {
      const real = await res.json();
      setMessages(prev => prev.map(m => m.id === optimistic.id ? real : m));
    } else {
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
    }
    setSending(false);
  }

  const myId = user?.id ?? "";

  return (
    <div className="flex flex-col absolute inset-0 bg-background z-20">
      {/* Header */}
      <div className="px-4 py-3 shrink-0 flex items-center gap-3 sticky top-0 z-10 bg-surface-base/70 border-b border-border backdrop-blur-2xl">
        <button onClick={onBack}
          className="w-8 h-8 rounded-full flex items-center justify-center active:scale-95 transition-all"
          style={{ background: "var(--surface-interactive)", border: "1px solid var(--border-subtle)" }}>
          <ChevronLeft className="w-5 h-5 pr-0.5" style={{ color: "var(--accent-primary)" }} />
        </button>
        <Avatar name={partner.name} size={36} online={partner.online} />
        <div>
          <div className="text-sm font-bold text-foreground">{partner.name}</div>
          <div className="text-xs" style={{ color: partner.online ? "var(--accent-primary)" : "var(--ink-muted)" }}>
            {partner.online ? "Online" : "Offline"}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
            <MessageCircle className="w-10 h-10 mb-3 opacity-20" />
            <p className="text-sm text-muted-foreground">
              No messages yet.<br />Say hi to {partner.name.split(" ")[0]}! 👋
            </p>
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.sender_id === myId;
          return (
            <motion.div key={msg.id}
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.2 }}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className="max-w-[78%]">
                <div className="px-4 py-2.5 rounded-[20px] text-[15px] leading-relaxed"
                  style={isMe
                    ? { background: "linear-gradient(135deg, var(--accent-primary) 0%, #00C67F 100%)", color: "var(--surface-base)", borderBottomRightRadius: 4, boxShadow: "0 2px 10px rgba(0,217,139,0.25)" }
                    : { background: "var(--surface-raised)", color: "var(--ink-primary)", borderBottomLeftRadius: 4, border: "1px solid var(--border-subtle)" }}>
                  {msg.content}
                </div>
                <div className={`text-[10px] mt-1 ${isMe ? "text-right" : "text-left"}`}
                  style={{ color: "var(--ink-muted)" }}>
                  {new Date(msg.created_at).toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" })}
                </div>
              </div>
            </motion.div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 pt-3 pb-2 shrink-0 flex gap-2 items-end border-t border-border bg-surface-base/80 backdrop-blur-xl">
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder="Aa"
          className="flex-1 px-4 py-2.5 rounded-full text-[15px] outline-none transition-shadow"
          style={{ background: "var(--surface-interactive)", border: "1px solid var(--border-subtle)", color: "var(--ink-primary)" }}
        />
        <motion.button
          onClick={sendMessage}
          whileTap={{ scale: 0.9 }}
          disabled={!draft.trim() || sending}
          className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-all duration-200"
          style={{
            background: draft.trim() ? "linear-gradient(135deg, var(--accent-primary) 0%, #00C67F 100%)" : "var(--surface-interactive)",
            boxShadow: draft.trim() ? "0 2px 12px rgba(0,217,139,0.4)" : "none",
          }}>
          <Send className="w-5 h-5 ml-0.5" style={{ color: draft.trim() ? "var(--surface-base)" : "var(--ink-muted)" }} />
        </motion.button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

type Panel =
  | { type: "none" }
  | { type: "chat"; partner: { id: string; name: string; online: boolean } }
  | { type: "manage"; club: Club };

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState<Tab>("players");
  const [panel, setPanel] = useState<Panel>({ type: "none" });
  const [inboxUnread, setInboxUnread] = useState(0);

  // Fetch unread count for badge
  useEffect(() => {
    (async () => {
      const res = await fetch("/api/community/inbox");
      if (res.ok) {
        const convos: Conversation[] = await res.json();
        setInboxUnread(convos.reduce((s, c) => s + c.unread_count, 0));
      }
    })();
  }, []);

  function openChat(p: { id: string; name: string; online: boolean }) {
    setPanel({ type: "chat", partner: p });
  }

  function openManage(club: Club) {
    setPanel({ type: "manage", club });
  }

  function closePanel() {
    setPanel({ type: "none" });
  }

  return (
    <div className="relative h-full overflow-hidden">
      {/* Main list view */}
      <div className="p-4 max-w-2xl mx-auto w-full flex flex-col gap-4">
        {/* Page Header */}
        <div className="flex flex-col gap-1 mt-1">
          <h1 className="text-[32px] font-extrabold tracking-tight leading-none" style={{ color: "var(--ink-primary)" }}>
            Community
          </h1>
          <p className="text-sm" style={{ color: "var(--ink-muted)" }}>
            Connect with players, join clubs, and chat
          </p>
        </div>

        {/* Tab Bar */}
        <TabBar active={activeTab} onChange={setActiveTab} unreadCount={inboxUnread} />

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === "players" && (
            <motion.div key="players"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}>
              <PlayersTab onOpenChat={openChat} />
            </motion.div>
          )}
          {activeTab === "clubs" && (
            <motion.div key="clubs"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}>
              <ClubsTab onManage={openManage} />
            </motion.div>
          )}
          {activeTab === "messages" && (
            <motion.div key="messages"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}>
              <MessagesTab onOpenChat={openChat} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Slide-in Panels */}
      <AnimatePresence>
        {panel.type !== "none" && (
          <motion.div
            key={panel.type}
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 32 }}
            className="absolute inset-0 bg-background z-20">
            {panel.type === "chat" && (
              <ChatPanel partner={panel.partner} onBack={closePanel} />
            )}
            {panel.type === "manage" && (
              <ClubManagePanel club={panel.club} onBack={closePanel} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
