"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Heart, Search, Users, MessageCircle, Send, ChevronLeft, X,
  Medal, Shield, CheckCircle2
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import type { CommunityPlayer, Club, DirectMessage, Conversation } from "@/types";

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

type Tab = "messages" | "community";

function TabBar({ active, onChange, unreadCount }: {
  active: Tab;
  onChange: (t: Tab) => void;
  unreadCount: number;
}) {
  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "messages", label: "Messages", icon: MessageCircle },
    { id: "community", label: "Community", icon: Users },
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
// MESSAGES TAB (Inbox)
// ─────────────────────────────────────────────────────────────────────────────

function MessagesTab({ onOpenChat, onGoToCommunity }: { onOpenChat: (p: { id: string; name: string; online: boolean }) => void, onGoToCommunity: () => void }) {
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

  if (loading) return (
    <div className="flex flex-col gap-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-[76px] rounded-2xl animate-pulse" style={{ background: "var(--surface-raised)" }} />
      ))}
    </div>
  );

  if (conversations.length === 0) return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-8">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
        <MessageCircle className="w-7 h-7" style={{ color: "var(--ink-muted)" }} />
      </div>
      <p className="text-sm font-semibold text-foreground mb-1">No messages yet</p>
      <p className="text-xs mb-4" style={{ color: "var(--ink-muted)" }}>Find someone in Community to start chatting!</p>
      <button onClick={onGoToCommunity}
        className="h-10 px-5 rounded-xl text-[13px] font-semibold text-white active:scale-[0.98] transition-all"
        style={{ background: "var(--accent-primary)" }}>
        Go to Community
      </button>
    </div>
  );

  return (
    <div className="flex flex-col gap-3">
      {conversations.map((c, i) => (
        <motion.button key={c.user_id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
          onClick={() => onOpenChat({ id: c.user_id, name: c.name, online: c.online })}
          className="flex items-center gap-4 p-4 rounded-2xl text-left w-full group transition-all"
          style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
          <Avatar name={c.name} size={48} online={c.online} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className={`text-[15px] font-bold text-foreground truncate ${c.unread_count > 0 ? "text-foreground" : ""}`}>{c.name}</span>
              <span className="text-[11px] shrink-0" style={{ color: c.unread_count > 0 ? "var(--accent-primary)" : "var(--ink-muted)", fontWeight: c.unread_count > 0 ? 600 : 400 }}>
                {new Date(c.last_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className={`text-[13px] truncate ${c.unread_count > 0 ? "font-semibold text-foreground" : ""}`} style={{ color: c.unread_count > 0 ? "var(--ink-primary)" : "var(--ink-secondary)" }}>
                {c.last_message}
              </span>
              {c.unread_count > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-[0_0_10px_rgba(0,217,139,0.3)]"
                  style={{ background: "var(--accent-primary)" }}>
                  {c.unread_count > 9 ? "9+" : c.unread_count}
                </motion.span>
              )}
            </div>
          </div>
        </motion.button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMMUNITY TAB (Players + Clubs unified)
// ─────────────────────────────────────────────────────────────────────────────

function CommunityTab({ onOpenChat }: { onOpenChat: (p: CommunityPlayer) => void }) {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Data
  const [players, setPlayers] = useState<CommunityPlayer[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const searchRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async (q: string) => {
    setLoading(true);
    const [pRes, cRes] = await Promise.all([
      fetch(`/api/community/players?q=${encodeURIComponent(q)}`),
      fetch(`/api/community/clubs`)
    ]);

    if (pRes.ok) setPlayers(await pRes.json());
    if (cRes.ok) {
      const allClubs: Club[] = await cRes.json();
      // Simple client-side filter for clubs since we don't have a search endpoint yet
      setClubs(q.trim() ? allClubs.filter(c => c.name.toLowerCase().includes(q.toLowerCase())) : allClubs);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData("");
  }, [fetchData]);

  function handleSearch(v: string) {
    setSearch(v);
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => fetchData(v), 300);
  }

  // --- Actions ---

  async function toggleLike(p: CommunityPlayer) {
    setPlayers(prev => prev.map(pl =>
      pl.id === p.id ? { ...pl, i_liked: !pl.i_liked, like_count: pl.like_count + (pl.i_liked ? -1 : 1) } : pl
    ));
    const res = await fetch("/api/community/likes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ liked_id: p.id }),
    });
    if (!res.ok) {
      setPlayers(prev => prev.map(pl => pl.id === p.id ? { ...pl, i_liked: p.i_liked, like_count: p.like_count } : pl));
    }
  }

  async function handleJoinClub(club: Club) {
    if (club.my_status !== "none") return;
    setJoiningId(club.id);
    const res = await fetch(`/api/community/clubs/${club.id}/join`, { method: "POST" });
    if (res.ok) {
      setClubs(prev => prev.map(c => c.id === club.id ? { ...c, my_status: "pending" } : c));
    }
    setJoiningId(null);
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Search Input */}
      <div className="relative z-10">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--ink-muted)" }} />
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search players and clubs..."
          className="w-full h-12 pl-11 pr-10 rounded-2xl text-[14px] outline-none transition-shadow focus:shadow-[0_0_20px_rgba(0,217,139,0.15)]"
          style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)", color: "var(--ink-primary)" }}
        />
        {search && (
          <button onClick={() => { setSearch(""); fetchData(""); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center bg-surface-interactive hover:bg-border-default transition-colors">
            <X className="w-3 h-3 text-ink-secondary" />
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map(i => (
             <div key={i} className="h-[76px] rounded-2xl animate-pulse" style={{ background: "var(--surface-raised)" }} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          
          {/* PLAYERS SECTION */}
          {players.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="text-[12px] font-bold uppercase tracking-wider px-1" style={{ color: "var(--ink-muted)" }}>
                {search ? "Players" : "People You May Know"}
              </h2>
              <div className="flex flex-col gap-3">
                {players.slice(0, search ? players.length : 10).map((p, i) => (
                  <motion.div key={`player-${p.id}`}
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.04, duration: 0.35 }}
                    className="flex items-center gap-4 p-4 rounded-2xl"
                    style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
                    <Avatar name={p.name} size={46} online={p.online} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[15px] font-bold text-foreground leading-tight truncate">{p.name}</span>
                        <LevelBadge level={p.level} />
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Medal className="w-3.5 h-3.5 text-amber-400" strokeWidth={1.5} />
                          <span className="text-xs text-ink-muted">{p.gold}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Medal className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.5} />
                          <span className="text-xs text-ink-muted">{p.silver}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Medal className="w-3.5 h-3.5 text-orange-400" strokeWidth={1.5} />
                          <span className="text-xs text-ink-muted">{p.bronze}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <motion.button whileTap={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        onClick={() => toggleLike(p)}
                        className="flex flex-col items-center gap-0.5 min-w-[44px] min-h-[44px] justify-center rounded-xl transition-colors"
                        style={{ background: p.i_liked ? "rgba(239,68,68,0.12)" : "var(--surface-interactive)" }}>
                        <Heart className="w-4 h-4 transition-all" style={{ color: p.i_liked ? "#f04848" : "var(--ink-muted)", fill: p.i_liked ? "#f04848" : "none" }} />
                        <span className="text-[10px] font-mono" style={{ color: p.i_liked ? "#f04848" : "var(--ink-muted)" }}>{p.like_count}</span>
                      </motion.button>
                      <button onClick={() => onOpenChat(p)}
                        className="w-11 h-11 flex items-center justify-center rounded-xl bg-surface-interactive border border-border-subtle hover:bg-surface-hover active:scale-95 transition-all">
                        <MessageCircle className="w-4 h-4 text-cyan-400" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* CLUBS SECTION */}
          {clubs.length > 0 && (
            <div className="flex flex-col gap-3">
               <h2 className="text-[12px] font-bold uppercase tracking-wider px-1 mt-2" style={{ color: "var(--ink-muted)" }}>
                {search ? "Clubs" : "Popular Clubs"}
              </h2>
              <div className="flex flex-col gap-3">
                {clubs.map((club, i) => (
                  <motion.div key={`club-${club.id}`}
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 6) * 0.05 }}
                    className="flex items-center gap-4 p-4 rounded-2xl"
                    style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
                     <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-accent-primary-muted">
                      <Shield className="w-6 h-6 text-accent-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[15px] font-bold text-foreground leading-tight block mb-0.5">{club.name}</span>
                      <p className="text-[11px] text-ink-muted">
                        {club.member_count} member{club.member_count !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="shrink-0">
                      {club.my_status === "none" && (
                        <button onClick={() => handleJoinClub(club)} disabled={joiningId === club.id}
                          className="h-9 px-4 rounded-xl text-[12px] font-bold text-white bg-accent-primary active:scale-95 transition-all disabled:opacity-60">
                          {joiningId === club.id ? "..." : "Join"}
                        </button>
                      )}
                      {club.my_status === "pending" && (
                         <div className="h-9 px-3 rounded-xl flex items-center justify-center gap-1.5 text-[12px] font-bold bg-[rgba(255,186,59,0.1)] text-accent-warning border border-[rgba(255,186,59,0.2)]">
                           Pending
                         </div>
                      )}
                      {(club.my_status === "member" || club.my_status === "admin") && (
                         <div className="h-9 px-3 rounded-xl flex items-center justify-center gap-1.5 text-[12px] font-bold bg-accent-primary-muted text-accent-primary">
                           <CheckCircle2 className="w-3.5 h-3.5" />
                         </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {players.length === 0 && clubs.length === 0 && search && (
             <EmptyState icon={Search} title="No results found" subtitle={`We couldn't find anyone or any club matching "${search}"`} />
          )}

        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CHAT PANEL (slide-in from right)
// ─────────────────────────────────────────────────────────────────────────────

function ChatPanel({ partner, onBack }: { partner: { id: string; name: string; online: boolean }; onBack: () => void }) {
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

  // Supabase Realtime
  useEffect(() => {
    if (!user?.id) return;
    const myId = user.id;
    const channel = supabase
      .channel(`dm-${myId}-${partner.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "direct_messages", filter: `receiver_id=eq.${myId}` },
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
          className="w-8 h-8 rounded-full flex items-center justify-center active:scale-95 transition-all bg-surface-interactive border border-border-subtle">
          <ChevronLeft className="w-5 h-5 pr-0.5 text-accent-primary" />
        </button>
        <Avatar name={partner.name} size={36} online={partner.online} />
        <div>
          <div className="text-sm font-bold text-foreground">{partner.name}</div>
          <div className="text-[11px] font-medium" style={{ color: partner.online ? "var(--accent-primary)" : "var(--ink-muted)" }}>
            {partner.online ? "Online" : "Offline"}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
            <div className="w-16 h-16 rounded-full flex items-center justify-center bg-surface-raised border border-border-subtle mb-4">
               <MessageCircle className="w-7 h-7 text-ink-muted" />
            </div>
            <p className="text-sm font-semibold text-foreground mb-1">Say hi to {partner.name.split(" ")[0]}</p>
            <p className="text-xs text-ink-muted">Conversations are saved automatically once you send a message.</p>
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.sender_id === myId;
          return (
            <motion.div key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className="max-w-[78%]">
                <div className="px-4 py-2.5 rounded-[20px] text-[15px] leading-relaxed"
                  style={isMe
                    ? { background: "linear-gradient(135deg, var(--accent-primary) 0%, #00C67F 100%)", color: "var(--surface-base)", borderBottomRightRadius: 4, boxShadow: "0 2px 10px rgba(0,217,139,0.25)" }
                    : { background: "var(--surface-raised)", color: "var(--ink-primary)", borderBottomLeftRadius: 4, border: "1px solid var(--border-subtle)" }}>
                  {msg.content}
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
          placeholder="Type a message..."
          className="flex-1 px-4 py-2.5 rounded-full text-[15px] outline-none transition-shadow bg-surface-interactive border border-border-subtle text-ink-primary focus:border-accent-primary"
        />
        <motion.button onClick={sendMessage} whileTap={{ scale: 0.9 }} disabled={!draft.trim() || sending}
          className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-all duration-200"
          style={{ background: draft.trim() ? "linear-gradient(135deg, var(--accent-primary) 0%, #00C67F 100%)" : "var(--surface-interactive)", boxShadow: draft.trim() ? "0 2px 12px rgba(0,217,139,0.4)" : "none" }}>
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
  | { type: "chat"; partner: { id: string; name: string; online: boolean } };

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState<Tab>("messages");
  const [panel, setPanel] = useState<Panel>({ type: "none" });
  const [inboxUnread, setInboxUnread] = useState(0);

  // Unread badge logic
  const fetchUnread = useCallback(async () => {
    const res = await fetch("/api/community/inbox");
    if (res.ok) {
      const convos: Conversation[] = await res.json();
      setInboxUnread(convos.reduce((s, c) => s + c.unread_count, 0));
    }
  }, []);

  useEffect(() => {
    fetchUnread();
  }, [fetchUnread]);

  function openChat(p: { id: string; name: string; online: boolean }) {
    setPanel({ type: "chat", partner: p });
  }

  function closePanel() {
    setPanel({ type: "none" });
    fetchUnread(); // Refresh unread count in case a message was sent/read
  }

  return (
    <div className="relative h-full overflow-hidden bg-background">
      <div className="p-4 max-w-2xl mx-auto w-full h-full flex flex-col gap-4">
        
        {/* Header */}
        <div className="flex flex-col gap-1 mt-1 shrink-0">
          <h1 className="text-[32px] font-extrabold tracking-tight leading-none text-ink-primary">
            Community
          </h1>
          <p className="text-sm text-ink-muted">
            Connect and chat with players
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="shrink-0">
          <TabBar active={activeTab} onChange={setActiveTab} unreadCount={inboxUnread} />
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 pb-[90px]">
          <AnimatePresence mode="wait">
            {activeTab === "messages" && (
              <motion.div key="messages"
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.15 }}>
                <MessagesTab onOpenChat={openChat} onGoToCommunity={() => setActiveTab("community")} />
              </motion.div>
            )}
            {activeTab === "community" && (
              <motion.div key="community"
                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }}>
                <CommunityTab onOpenChat={openChat} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Slide-in Chat Panel */}
      <AnimatePresence>
        {panel.type !== "none" && (
          <motion.div
            key="panel"
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 32 }}
            className="absolute inset-0 z-20">
            {panel.type === "chat" && (
              <ChatPanel partner={panel.partner} onBack={closePanel} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
