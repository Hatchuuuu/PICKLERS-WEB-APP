import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Heart, Search, Users, MessageCircle, Send, ChevronLeft
} from "lucide-react";


type ChatMessage = { from: "me" | "them"; text: string; ts: string };

const MOCK_CHATS: Record<number, ChatMessage[]> = {
  1: [
    { from: "them", text: "Hey! Good game yesterday 🏓", ts: "2:14 PM" },
    { from: "me", text: "Thanks! Your backhand is insane haha", ts: "2:15 PM" },
    { from: "them", text: "Rematch this Saturday?", ts: "2:16 PM" },
  ],
  2: [
    { from: "them", text: "Are you joining the BGC open play?", ts: "Yesterday" },
    { from: "me", text: "Yes! Booked Court 2 at 7AM", ts: "Yesterday" },
  ],
  3: [],
  4: [
    { from: "them", text: "Hi! Looking for a doubles partner 🤝", ts: "Mon" },
  ],
  5: [
    { from: "them", text: "Congrats on the tournament win!", ts: "Last week" },
    { from: "me", text: "Thank you! You should join next time", ts: "Last week" },
  ],
};

export function CommunityTab() {
  const [search, setSearch] = useState("");
  const [liked, setLiked] = useState<Set<number>>(new Set());
  const [likes, setLikes] = useState<Record<number, number>>({ 1: 12, 2: 8, 3: 3, 4: 17, 5: 24 });
  const [chatOpen, setChatOpen] = useState<number | null>(null);
  const [messages, setMessages] = useState<Record<number, ChatMessage[]>>(MOCK_CHATS);
  const [draft, setDraft] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const allPlayers = [
    { id: 1, name: "Juan Dela Cruz", level: "4.0+", gold: 4, silver: 1, bronze: 7, online: true },
    { id: 2, name: "Ana Reyes", level: "3.5", gold: 2, silver: 3, bronze: 5, online: true },
    { id: 3, name: "Carlo Mendoza", level: "3.0", gold: 0, silver: 2, bronze: 8, online: false },
    { id: 4, name: "Grace Villanueva", level: "3.5", gold: 1, silver: 4, bronze: 3, online: true },
    { id: 5, name: "Bennie Alcantara", level: "4.0+", gold: 6, silver: 2, bronze: 9, online: false },
  ];
  const filtered = allPlayers.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  const chatPlayer = allPlayers.find(p => p.id === chatOpen);

  function toggleLike(id: number) {
    const isLiked = liked.has(id);
    setLiked(prev => {
      const next = new Set(prev);
      if (isLiked) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    setLikes(prev => ({ ...prev, [id]: prev[id] + (isLiked ? -1 : 1) }));
  }

  function sendMessage() {
    if (!draft.trim() || chatOpen === null) return;
    const now = new Date();
    const ts = now.toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" });
    setMessages(prev => ({
      ...prev,
      [chatOpen]: [...(prev[chatOpen] || []), { from: "me", text: draft.trim(), ts }],
    }));
    setDraft("");
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  useEffect(() => {
    if (chatOpen !== null) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
    }
  }, [chatOpen]);

  if (chatOpen !== null && chatPlayer) {
    const thread = messages[chatOpen] || [];
    return (
      <div className="flex flex-col h-full" style={{ height: "calc(100vh - 120px)" }}>
        {/* Chat header */}
        <div className="flex items-center gap-3 px-4 py-3 shrink-0"
          style={{ borderBottom: "1px solid rgba(0,212,255,0.1)", background: "#0b1640" }}>
          <button onClick={() => setChatOpen(null)}
            className="w-9 h-9 flex items-center justify-center rounded-xl active:scale-95 transition-transform"
            style={{ background: "rgba(0,212,255,0.08)" }}>
            <ChevronLeft className="w-4 h-4 text-cyan-400" />
          </button>
          <div className="relative">
            <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
              style={{ background: "rgba(0,212,255,0.15)", color: "#00d4ff" }}>{chatPlayer.name[0]}</div>
            {chatPlayer.online && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-400 border-2"
                style={{ borderColor: "#0b1640" }} />
            )}
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">{chatPlayer.name}</div>
            <div className="text-xs" style={{ color: chatPlayer.online ? "#22c55e" : "#6b82b8" }}>
              {chatPlayer.online ? "Online" : "Offline"} · Level {chatPlayer.level}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
          {thread.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
              <MessageCircle className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-sm text-muted-foreground">No messages yet.<br />Say hi to {chatPlayer.name.split(" ")[0]}! 👋</p>
            </div>
          )}
          {thread.map((msg, i) => (
            <div key={i} className={`flex ${msg.from === "me" ? "justify-end" : "justify-start"}`}>
              <div className="max-w-[75%]">
                <div className="px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed"
                  style={msg.from === "me"
                    ? { background: "#00d4ff", color: "#080f2e", borderBottomRightRadius: "4px" }
                    : { background: "#1a2d6e", color: "#e8eeff", borderBottomLeftRadius: "4px" }}>
                  {msg.text}
                </div>
                <div className={`text-[10px] text-muted-foreground mt-1 ${msg.from === "me" ? "text-right" : "text-left"}`}>
                  {msg.ts}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 shrink-0 flex gap-2"
          style={{ borderTop: "1px solid rgba(0,212,255,0.1)", background: "#0b1640" }}>
          <input
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-ring"
            style={{ background: "rgba(26,45,110,0.6)", border: "1px solid rgba(0,212,255,0.15)", color: "#e8eeff" }}
          />
          <button onClick={sendMessage}
            className="w-10 h-10 rounded-xl flex items-center justify-center active:scale-95 transition-transform"
            style={{ background: draft.trim() ? "#00d4ff" : "rgba(0,212,255,0.1)" }}>
            <Send className="w-4 h-4" style={{ color: draft.trim() ? "#080f2e" : "#6b82b8" }} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Montserrat', sans-serif" }}>COMMUNITY</h1>
      <p className="text-sm text-muted-foreground mb-6">Chat and connect with players near you</p>
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search players..."
          className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-ring"
          style={{ background: "rgba(26,45,110,0.4)", border: "1px solid rgba(0,212,255,0.12)", color: "#e8eeff" }} />
      </div>
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No players found for &quot;{search}&quot;</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((p, i) => {
            const isLiked = liked.has(p.id);
            const lastMsg = (messages[p.id] || []).slice(-1)[0];
            return (
              <motion.div key={p.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-4 p-4 rounded-xl cursor-pointer group"
                style={{ background: "#0f1d47", border: "1px solid rgba(0,212,255,0.1)" }}
                onClick={() => setChatOpen(p.id)}>
                {/* Avatar with online dot */}
                <div className="relative shrink-0">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-base"
                    style={{ background: "rgba(0,212,255,0.12)", color: "#00d4ff" }}>{p.name[0]}</div>
                  {p.online && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-400 border-2"
                      style={{ borderColor: "#0f1d47" }} />
                  )}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{p.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono"
                      style={{ background: "rgba(0,212,255,0.1)", color: "#00d4ff" }}>Lv {p.level}</span>
                  </div>
                  <div className="text-xs text-muted-foreground truncate mt-0.5">
                    {lastMsg ? lastMsg.text : "🥇 " + p.gold + "  🥈 " + p.silver + "  🥉 " + p.bronze}
                  </div>
                </div>
                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                  {/* Like */}
                  <motion.button
                    onClick={() => toggleLike(p.id)}
                    whileTap={{ scale: 0.85 }}
                    className="flex flex-col items-center gap-0.5 min-w-[44px] min-h-[44px] justify-center rounded-xl"
                    style={{ background: isLiked ? "rgba(239,68,68,0.1)" : "transparent" }}>
                    <Heart className="w-4 h-4"
                      style={{ color: isLiked ? "#ef4444" : "#6b82b8", fill: isLiked ? "#ef4444" : "none", transition: "all 150ms ease-out" }} />
                    <span className="text-[10px] font-mono" style={{ color: isLiked ? "#ef4444" : "#6b82b8" }}>{likes[p.id]}</span>
                  </motion.button>
                  {/* Message */}
                  <button
                    onClick={() => setChatOpen(p.id)}
                    className="w-11 h-11 flex items-center justify-center rounded-xl active:scale-95 transition-transform"
                    style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.15)" }}>
                    <MessageCircle className="w-4 h-4 text-cyan-400" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
