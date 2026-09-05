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

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-2">
      <div className="flex gap-1 px-3 py-2 rounded-2xl bg-[#132238] border border-white/5">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
            className="w-2 h-2 rounded-full bg-slate-400"
          />
        ))}
      </div>
    </div>
  );
}

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

  useEffect(() => {
    if (!myId) return;
    // Use a deterministic channel name based on sorted participant IDs
    // so both sides share the same channel subscription space
    const channelName = `dm-conv-${[myId, partner.id].sort().join("-")}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
          // Scoped filter: only messages FROM partner TO me in this conversation
          filter: `receiver_id=eq.${myId},sender_id=eq.${partner.id}`,
        },
        (payload) => {
          const msg = payload.new as DirectMessage;
          setMessages(prev => [...prev, msg]);
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "direct_messages",
          // Scoped filter: only read-receipt updates on messages I sent to partner
          filter: `sender_id=eq.${myId},receiver_id=eq.${partner.id}`,
        },
        (payload) => {
          const updated = payload.new as DirectMessage;
          setMessages(prev => prev.map(m => m.id === updated.id ? { ...m, read: updated.read } : m));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [myId, partner.id]);

  useEffect(() => {
    if (!myId) return;
    const channelName = [myId, partner.id].sort().join("-");
    const channel = supabase.channel(`typing-${channelName}`);
    channel.on("broadcast", { event: "typing" }, (payload) => {
      if (payload.payload?.userId === partner.id) {
        setIsPartnerTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsPartnerTyping(false), 3000);
      }
    }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [myId, partner.id]);

  function broadcastTyping() {
    if (!myId) return;
    const now = Date.now();
    if (now - lastTypingBroadcast.current < 2000) return;
    lastTypingBroadcast.current = now;
    const channelName = [myId, partner.id].sort().join("-");
    supabase.channel(`typing-${channelName}`).send({
      type: "broadcast",
      event: "typing",
      payload: { userId: myId },
    });
  }

  async function sendMessage() {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setDraft("");

    const optimistic: DirectMessage = {
      id: `temp-${Date.now()}`,
      sender_id: myId,
      receiver_id: partner.id,
      content: text,
      read: false,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);

    try {
      const res = await fetch("/api/community/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiver_id: partner.id, content: text }),
      });
      if (res.ok) {
        const saved: DirectMessage = await res.json();
        setMessages(prev => prev.map(m => m.id === optimistic.id ? saved : m));
      }
    } catch {
      // optimistic message remains
    } finally {
      setSending(false);
    }
  }

  let lastDate = "";

  return (
    <div className="w-full flex-1 flex flex-col h-full bg-[#070F1E]">
      {/* Header — Dark Navy Header matching Reference */}
      <div className="px-4 py-3.5 flex items-center justify-between shrink-0 bg-[#0B1528] border-b border-white/10">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-all bg-[#132238] border border-white/10 shrink-0 cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5 text-emerald-400" />
          </button>
          
          <button
            type="button"
            onClick={() => onOpenProfile?.(partner.id)}
            className="flex items-center gap-3 text-left group cursor-pointer"
          >
            <div className="relative">
              <Avatar name={partner.name} size={40} avatarUrl={partner.avatar_url} />
              {partner.online && (
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#00D98B] border-2 border-[#0B1528]" />
              )}
            </div>
            <div>
              <p className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors leading-tight">
                {partner.name}
              </p>
              <p className="text-xs font-semibold text-[#00D98B]">
                {partner.online ? "Online" : "Offline"}
              </p>
            </div>
          </button>
        </div>

        {/* Right: My Initial Badge (dynamic) */}
        <div className="w-8 h-8 rounded-full bg-[#111C2E] border border-white/10 flex items-center justify-center font-bold text-xs text-white shadow-inner">
          {user?.name?.[0]?.toUpperCase() ?? "?"}
        </div>
      </div>

      {/* Messages Thread */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4 hide-scrollbar bg-[#070F1E]"
      >
        {loadingOlder && (
          <div className="flex justify-center py-2">
            <div className="w-5 h-5 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
          </div>
        )}

        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
            <div className="w-16 h-16 rounded-full flex items-center justify-center bg-[#132238] border border-white/10 mb-4">
              <MessageCircle className="w-7 h-7 text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-white mb-1">Say hi to {partner.name.split(" ")[0]}</p>
            <p className="text-xs text-slate-400">Conversations are saved automatically once you send a message.</p>
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
            <div key={msg.id} className="space-y-3">
              {/* Date separator */}
              {showDateSep && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center py-2"
                >
                  <span className="text-[11px] font-semibold px-3.5 py-1 rounded-full bg-[#111C2E] border border-white/5 text-[#64748B]">
                    {getDateLabel(msg.created_at)}
                  </span>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div className="max-w-[85%] sm:max-w-[75%]">
                  <div
                    className={`px-4 py-3 rounded-2xl text-[14px] leading-relaxed shadow-sm ${
                      isMe
                        ? "bg-[#00D98B] text-[#091522] font-semibold rounded-tr-xs shadow-[0_2px_12px_rgba(0,217,139,0.25)]"
                        : "bg-[#132238] border border-white/5 text-slate-100 font-normal rounded-tl-xs"
                    }`}
                  >
                    {msg.content}
                  </div>
                  {/* Timestamp + read receipt */}
                  <div className={`flex items-center gap-1 mt-1 text-[11px] text-[#586c8a] px-1 ${isMe ? "justify-end" : "justify-start"}`}>
                    <span>{formatTime(msg.created_at)}</span>
                    {isMe && (
                      <span className="flex items-center ml-0.5">
                        {msg.read ? (
                          <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Check className="w-3.5 h-3.5 text-[#586c8a]" />
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

      {/* Input Toolbar — Exact Reference Image Match */}
      <div className="p-3.5 px-4 border-t border-white/10 bg-[#0A1424] flex items-center gap-3 shrink-0 pb-[max(14px,env(safe-area-inset-bottom,14px))]">
        <input
          value={draft}
          onChange={e => {
            setDraft(e.target.value);
            broadcastTyping();
          }}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder="Type a message..."
          className="flex-1 px-4 py-3 rounded-full text-sm bg-[#111D30] border border-white/10 text-white outline-none focus:border-emerald-500/50 transition-all placeholder:text-[#586C8A]"
        />
        <motion.button
          onClick={sendMessage}
          whileTap={{ scale: 0.95 }}
          disabled={!draft.trim() || sending}
          className="w-11 h-11 rounded-full bg-[#1C3254] hover:bg-[#233f69] text-[#3B82F6] flex items-center justify-center shrink-0 active:scale-95 transition-all disabled:opacity-40 cursor-pointer"
          title="Send Message"
        >
          <Send className="w-5 h-5 ml-0.5 stroke-[2]" />
        </motion.button>
      </div>
    </div>
  );
}
