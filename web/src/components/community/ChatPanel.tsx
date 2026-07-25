import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "motion/react";
import { Send, ChevronLeft, MessageCircle, Check, CheckCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import type { DirectMessage } from "@/types";
import { Avatar } from "@/components/ui/Avatar";

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (isToday) return time;
  if (isYesterday) return `Yesterday ${time}`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + ` ${time}`;
}

function getDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return "Today";
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

// Typing indicator component
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-2">
      <div className="flex gap-1 px-3 py-2 rounded-2xl" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
            className="w-2 h-2 rounded-full"
            style={{ background: "var(--ink-muted)" }}
          />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CHAT PANEL
// ─────────────────────────────────────────────────────────────────────────────

export default function ChatPanel({ partner, onBack, onOpenProfile }: {
  partner: { id: string; name: string; online: boolean; avatar_url?: string | null };
  onBack: () => void;
  onOpenProfile?: (id: string) => void;
}) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasOlder, setHasOlder] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingBroadcast = useRef<number>(0);

  const myId = user?.id ?? "";

  // ── Fetch Messages (paginated) ──
  const fetchMessages = useCallback(async (before?: string) => {
    const url = before
      ? `/api/community/messages?with=${partner.id}&before=${encodeURIComponent(before)}&limit=50`
      : `/api/community/messages?with=${partner.id}&limit=50`;
    const res = await fetch(url);
    if (res.ok) {
      const data: DirectMessage[] = await res.json();
      if (data.length < 50) setHasOlder(false);
      return data;
    }
    return [];
  }, [partner.id]);

  useEffect(() => {
    (async () => {
      const data = await fetchMessages();
      setMessages(data);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "instant" }), 50);
    })();
  }, [fetchMessages]);

  // ── Load older messages on scroll ──
  async function loadOlder() {
    if (loadingOlder || !hasOlder || messages.length === 0) return;
    setLoadingOlder(true);
    const oldestTs = messages[0]?.created_at;
    const older = await fetchMessages(oldestTs);
    if (older.length > 0) {
      setMessages(prev => [...older, ...prev]);
    }
    setLoadingOlder(false);
  }

  function handleScroll() {
    const el = scrollContainerRef.current;
    if (el && el.scrollTop < 60 && hasOlder && !loadingOlder) {
      loadOlder();
    }
  }

  // ── Supabase Realtime: New messages ──
  useEffect(() => {
    if (!myId) return;
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
      // Listen for read status updates on messages I sent
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "direct_messages", filter: `sender_id=eq.${myId}` },
        (payload) => {
          const updated = payload.new as DirectMessage;
          if (updated.receiver_id !== partner.id) return;
          setMessages(prev => prev.map(m => m.id === updated.id ? { ...m, read: updated.read } : m));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [myId, partner.id]);

  // ── Supabase Broadcast: Typing indicators ──
  useEffect(() => {
    if (!myId) return;
    const channelName = [myId, partner.id].sort().join("-");
    const channel = supabase
      .channel(`typing-${channelName}`)
      .on("broadcast", { event: "typing" }, (payload) => {
        if (payload.payload?.userId === partner.id) {
          setIsPartnerTyping(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setIsPartnerTyping(false), 3000);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [myId, partner.id]);

  // Broadcast that I'm typing (debounced)
  function broadcastTyping() {
    const now = Date.now();
    if (now - lastTypingBroadcast.current < 500) return;
    lastTypingBroadcast.current = now;

    const channelName = [myId, partner.id].sort().join("-");
    supabase.channel(`typing-${channelName}`).send({
      type: "broadcast",
      event: "typing",
      payload: { userId: myId },
    });
  }

  // ── Send Message ──
  async function sendMessage() {
    if (!draft.trim() || sending) return;
    const content = draft.trim();
    setDraft("");
    setSending(true);

    const optimistic: DirectMessage = {
      id: "opt-" + Date.now(),
      sender_id: myId,
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

  // ── Render ──
  // Group messages by date for date separators
  let lastDate = "";

  return (
    <div className="flex flex-col h-full w-full bg-transparent z-20">
      {/* Header */}
      <div className="px-4 pt-6 pb-3 md:pt-4 shrink-0 flex items-center gap-3 sticky top-0 z-10 bg-surface-base/70 border-b border-border backdrop-blur-2xl">
        <button onClick={onBack}
          className="w-8 h-8 rounded-full flex items-center justify-center active:scale-95 transition-all bg-surface-interactive border border-border-subtle">
          <ChevronLeft className="w-5 h-5 pr-0.5 text-accent-primary" />
        </button>
        <button onClick={() => onOpenProfile?.(partner.id)} className="flex items-center gap-3 text-left transition-transform hover:scale-[1.02] active:scale-95">
          <Avatar name={partner.name} size={36} online={partner.online} avatarUrl={partner.avatar_url} />
          <div>
            <div className="text-sm font-bold text-foreground">{partner.name}</div>
            <div className="text-[11px] font-medium" style={{ color: partner.online ? "var(--accent-primary)" : "var(--ink-muted)" }}>
              {isPartnerTyping ? "typing..." : partner.online ? "Online" : "Offline"}
            </div>
          </div>
        </button>
      </div>

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-1"
      >
        {/* Load older spinner */}
        {loadingOlder && (
          <div className="flex justify-center py-3">
            <div className="w-5 h-5 rounded-full border-2 border-accent-primary border-t-transparent animate-spin" />
          </div>
        )}

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
          const msgDate = new Date(msg.created_at).toDateString();
          let showDateSep = false;
          if (msgDate !== lastDate) {
            showDateSep = true;
            lastDate = msgDate;
          }

          return (
            <div key={msg.id}>
              {/* Date separator */}
              {showDateSep && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.6 }}
                  className="flex items-center justify-center py-3"
                >
                  <span className="text-[11px] font-semibold px-3 py-1 rounded-full"
                    style={{ background: "var(--surface-raised)", color: "var(--ink-muted)" }}>
                    {getDateLabel(msg.created_at)}
                  </span>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className={`flex ${isMe ? "justify-end" : "justify-start"} mb-1`}
              >
                <div className="max-w-[78%]">
                  <div className="px-4 py-2.5 rounded-[20px] text-[15px] leading-relaxed"
                    style={isMe
                      ? { background: "linear-gradient(135deg, var(--accent-primary) 0%, #00C67F 100%)", color: "var(--surface-base)", borderBottomRightRadius: 4, boxShadow: "0 2px 10px rgba(0,217,139,0.25)" }
                      : { background: "var(--surface-raised)", color: "var(--ink-primary)", borderBottomLeftRadius: 4, border: "1px solid var(--border-subtle)" }}>
                    {msg.content}
                  </div>
                  {/* Timestamp + read receipt */}
                  <div className={`flex items-center gap-1 mt-0.5 px-1 ${isMe ? "justify-end" : "justify-start"}`}>
                    <span className="text-[10px]" style={{ color: "var(--ink-muted)" }}>
                      {formatTime(msg.created_at)}
                    </span>
                    {isMe && (
                      <span className="flex items-center">
                        {msg.read ? (
                          <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Check className="w-3.5 h-3.5" style={{ color: "var(--ink-muted)" }} />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {isPartnerTyping && <TypingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 pt-3 pb-2 shrink-0 flex gap-2 items-end border-t border-border bg-surface-base/80 backdrop-blur-xl">
        <input
          value={draft}
          onChange={e => {
            setDraft(e.target.value);
            broadcastTyping();
          }}
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
