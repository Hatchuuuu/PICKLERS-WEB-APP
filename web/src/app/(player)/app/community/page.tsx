"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Heart, Search, Users, MessageCircle, Send, ChevronLeft, X, Medal } from "lucide-react";

import { useApp } from "@/contexts/AppContext";

export default function CommunityTab() {
  const [search, setSearch] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { 
    chatMessages: messages, 
    setChatMessages: setMessages, 
    likedPlayers: liked, 
    setLikedPlayers: setLiked, 
    playerLikes: likes, 
    setPlayerLikes: setLikes,
    players
  } = useApp();
  const [chatOpen, setChatOpen] = useState<string | number | null>(null);

  const [draft, setDraft] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);


  const filtered = players.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  const chatPlayer = players.find(p => p.id === chatOpen);

  function toggleLike(id: string | number) {
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
    setLikes(prev => ({ ...prev, [id]: (prev[id] || 0) + (isLiked ? -1 : 1) }));
  }

  function sendMessage() {
    if (!draft.trim() || chatOpen === null) return;
    const now = new Date();
    const ts = now.toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" });
    setMessages(prev => ({
      ...prev,
      [chatOpen]: [...(prev[chatOpen] || []), { from: "me" as "me" | "them", text: draft.trim(), ts }],
    }));
    setDraft("");
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  useEffect(() => {
    if (chatOpen !== null) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
    }
  }, [chatOpen]);

  const thread = chatOpen !== null ? messages[chatOpen] || [] : [];

  return (
    <AnimatePresence mode="wait">
      {chatOpen !== null && chatPlayer ? (
        <motion.div 
          key="chat-view"
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="flex flex-col absolute inset-0 bg-background z-20"
        >
        {/* Chat Header */}
        <div className="px-4 py-3 shrink-0 flex items-center gap-3 sticky top-0 z-10 bg-surface-base/70 border-b border-border backdrop-blur-2xl">
          <button onClick={() => setChatOpen(null)} className="w-8 h-8 rounded-full flex items-center justify-center active:scale-95 transition-all bg-surface-interactive border border-border dark:bg-white/[0.06] dark:border-white/[0.05]">
            <ChevronLeft className="w-5 h-5 pr-0.5 text-accent-primary" />
          </button>
          <div className="relative">
            <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
              style={{ background: "var(--border-default)", color: "var(--accent-primary)" }}>{chatPlayer.name[0]}</div>
            {chatPlayer.online && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-400 border-2"
                style={{ borderColor: "var(--surface-base)" }} />
            )}
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">{chatPlayer.name}</div>
            <div className="text-xs" style={{ color: chatPlayer.online ? "var(--accent-success)" : "var(--ink-muted)" }}>
              {chatPlayer.online ? "Online" : "Offline"}
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
                <div className="px-4 py-2.5 rounded-[20px] text-[15px] leading-relaxed shadow-sm"
                  style={msg.from === "me"
                    ? { background: "linear-gradient(135deg, var(--accent-primary) 0%, #00C67F 100%)", color: "var(--surface-base)", borderBottomRightRadius: "4px", boxShadow: "0 2px 10px rgba(0,217,139,0.3)" }
                    : { background: "var(--surface-interactive)", color: "var(--ink-primary)", borderBottomLeftRadius: "4px", border: "1px solid var(--border-subtle)" }}>
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
        <div className="px-4 pt-3 pb-2 shrink-0 flex gap-2 items-end border-t border-border bg-surface-base/80 backdrop-blur-xl">
          <input
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMessage()}
            placeholder="Aa"
            className="flex-1 px-4 py-2.5 rounded-full text-[15px] outline-none transition-shadow bg-surface-interactive border border-border dark:bg-white/[0.06] dark:border-white/[0.08] text-foreground"
          />
          <button onClick={sendMessage}
            className="w-11 h-11 rounded-full flex items-center justify-center active:scale-95 transition-all duration-300 shrink-0"
            style={{ 
              background: draft.trim() ? "linear-gradient(135deg, var(--accent-primary) 0%, #00C67F 100%)" : "var(--surface-interactive)",
              boxShadow: draft.trim() ? "0 2px 12px rgba(0,217,139,0.4)" : "none"
            }}>
            <Send className="w-5 h-5 ml-0.5" style={{ color: draft.trim() ? "var(--surface-base)" : "var(--ink-muted)" }} />
          </button>
        </div>
      </motion.div>
      ) : (
        <motion.div 
          key="community-list"
          initial={{ x: "-20%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "-20%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="p-4 max-w-6xl mx-auto w-full relative"
        >
      <div className="relative h-[68px] mb-4 -mt-[1px] flex items-center justify-between">
        <AnimatePresence>
          {!isSearchOpen ? (
            <motion.div 
              key="title"
              initial={{ opacity: 0, x: -20, filter: "blur(8px)" }} 
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }} 
              exit={{ opacity: 0, x: -20, filter: "blur(8px)" }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="absolute left-0 top-0 flex flex-col mt-[-10px]"
            >
              <h1 className="text-[32px] font-extrabold tracking-tight leading-none mb-1.5" style={{ color: "var(--ink-primary)" }}>
                Community
              </h1>
              <p className="text-sm text-muted-foreground">Chat and connect with players near you</p>
            </motion.div>
          ) : (
            <motion.div 
              key="search"
              initial={{ opacity: 0, x: 20, filter: "blur(8px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, x: 20, filter: "blur(8px)" }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="absolute left-0 right-[64px] top-0"
            >
              <input 
                autoFocus
                type="text" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search players..." 
                className="w-full h-[52px] pl-5 pr-12 rounded-[18px] outline-none font-medium text-[16px] transition-all shadow-sm focus:shadow-[0_0_20px_rgba(0,217,139,0.15)] focus:border-emerald-500/50"
                style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)", color: "var(--ink-primary)" }}
              />
              <Search className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="absolute -right-2 top-0 flex items-start gap-3">
          <div className="flex flex-col items-center gap-1 z-10">
            <button 
              onClick={() => {
                setIsSearchOpen(!isSearchOpen);
                if (isSearchOpen) setSearch("");
              }} 
              className="w-[52px] h-[52px] flex items-center justify-center rounded-[18px] hover:bg-surface-raised transition-colors group relative" 
              aria-label="Search"
            >
              <AnimatePresence mode="popLayout">
                {!isSearchOpen ? (
                  <motion.div key="icon-search" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                    <Search className="w-8 h-8 -mt-[18px] transition-colors group-hover:text-accent-primary" style={{ color: "var(--ink-primary)" }} />
                  </motion.div>
                ) : (
                  <motion.div key="icon-x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                    <X className="w-8 h-8 -mt-[18px] transition-colors group-hover:text-red-500" style={{ color: "var(--ink-primary)" }} />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No players found for &quot;{search}&quot;</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {!search && (
            <div className="flex items-center justify-between mb-2 mt-2 px-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">People You May Know</span>
              <button 
                onClick={() => { setSearch(""); setIsSearchOpen(false); }}
                className="text-[11px] font-semibold text-accent-primary hover:opacity-80 active:scale-95 transition-all">
                See All
              </button>
            </div>
          )}
          {filtered.map((p, i) => {
            const isLiked = liked.has(p.id);
            const lastMsg = (messages[p.id] || []).slice(-1)[0];
            return (
              <motion.div key={p.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-4 p-4 rounded-xl cursor-pointer group"
                style={{ background: "var(--surface-raised)", border: "1px solid var(--accent-primary-muted)" }}
                onClick={() => setChatOpen(p.id)}>
                {/* Avatar with online dot */}
                <div className="relative shrink-0">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-base"
                    style={{ background: "var(--border-subtle)", color: "var(--accent-primary)" }}>{p.name[0]}</div>
                  {p.online && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-400 border-2"
                      style={{ borderColor: "var(--surface-raised)" }} />
                  )}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-[15px] font-bold text-foreground leading-tight whitespace-nowrap">{p.name}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1.5 h-[24px]">
                    {lastMsg ? (
                      <span className="truncate block">{lastMsg.text}</span>
                    ) : (
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1.5 pr-1">
                           <Medal className="w-3.5 h-3.5 text-amber-500 drop-shadow-[0_2px_6px_rgba(245,158,11,0.3)]" strokeWidth={1.5} />
                           <span className="text-[12px] font-medium text-foreground/90">{p.gold}</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-1">
                           <Medal className="w-3.5 h-3.5 text-slate-300 drop-shadow-[0_2px_6px_rgba(203,213,225,0.3)]" strokeWidth={1.5} />
                           <span className="text-[12px] font-medium text-foreground/90">{p.silver}</span>
                        </div>
                        <div className="flex items-center gap-1.5 pl-1">
                           <Medal className="w-3.5 h-3.5 text-orange-500 drop-shadow-[0_2px_6px_rgba(249,115,22,0.3)]" strokeWidth={1.5} />
                           <span className="text-[12px] font-medium text-foreground/90">{p.bronze}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                  {/* Like */}
                  <motion.button
                    onClick={(e) => { e.stopPropagation(); toggleLike(p.id); }}
                    whileTap={{ scale: 0.8 }}
                    animate={{ scale: isLiked ? [1, 1.15, 1] : 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                    className="flex flex-col items-center gap-0.5 min-w-[44px] min-h-[44px] justify-center rounded-xl"
                    style={{ background: isLiked ? "rgba(239,68,68,0.15)" : "transparent" }}>
                    <Heart className="w-4 h-4"
                      style={{ color: isLiked ? "var(--accent-danger)" : "var(--ink-muted)", fill: isLiked ? "var(--accent-danger)" : "none", transition: "color 150ms ease-out, fill 150ms ease-out" }} />
                    <span className="text-[10px] font-mono" style={{ color: isLiked ? "var(--accent-danger)" : "var(--ink-muted)" }}>{likes[p.id]}</span>
                  </motion.button>
                  {/* Message */}
                  <button
                    onClick={() => setChatOpen(p.id)}
                    className="w-11 h-11 flex items-center justify-center rounded-xl active:scale-95 transition-transform"
                    style={{ background: "var(--border-subtle)", border: "1px solid var(--border-default)" }}>
                    <MessageCircle className="w-4 h-4 text-cyan-400" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

