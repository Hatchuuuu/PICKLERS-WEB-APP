"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "motion/react";
import { Search, MessageSquare, Send, ChevronLeft, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  useOwnerConversations,
  useSendOwnerMessage,
  useMarkConversationRead,
  type Conversation,
} from "@/hooks/useOwnerConversations";

interface DemoConversation {
  id: string;
  otherUserId?: string;
  name: string;
  avatar: string;
  role: string;
  online: boolean;
  unread: number;
  lastMessage: string;
  lastTime: string;
  messages: Array<{
    id: string;
    sender: "them" | "me";
    text: string;
    time: string;
    dateLabel?: string;
  }>;
}

const INITIAL_CONVERSATIONS: DemoConversation[] = [
  {
    id: "conv-1",
    name: "Alex Johnson",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    role: "Head Instructor • 4.5 DUPR",
    online: true,
    unread: 0,
    lastMessage: "Great game yesterday by the way, that dink rally was 🔥",
    lastTime: "7:17 PM",
    messages: [
      { id: "m1", sender: "them", text: "Planning to arrive at 7:45 to warm up 🏓", time: "Jul 30 7:35 PM", dateLabel: "Jul 30 7:32 PM" },
      { id: "m2", sender: "me", text: "Perfect, see you then!", time: "Jul 30 7:37 PM" },
      { id: "m3", sender: "them", text: "Hey! Are you joining the Saturday morning doubles?", time: "Jul 31 7:27 PM", dateLabel: "Friday, Jul 31" },
      { id: "m4", sender: "them", text: "Great game yesterday by the way, that dink rally was 🔥", time: "Yesterday 7:17 PM", dateLabel: "Yesterday" }
    ]
  },
  {
    id: "conv-2",
    name: "Coach Carlos",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    role: "Facility Manager",
    online: true,
    unread: 2,
    lastMessage: "Hey! Are courts 3 and 4 available for the junior training clinic tomorrow morning?",
    lastTime: "10:42 AM",
    messages: [
      { id: "m5", sender: "them", text: "Good morning! Quick question regarding tomorrow's court allocations.", time: "10:40 AM", dateLabel: "Jul 30 7:35 PM" },
      { id: "m6", sender: "them", text: "Hey! Are courts 3 and 4 available for the junior training clinic tomorrow morning?", time: "10:42 AM" }
    ]
  },
  {
    id: "conv-3",
    name: "Sarah Jenkins",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    role: "Club Member • 4.5 DUPR",
    online: true,
    unread: 1,
    lastMessage: "Hi! Can I host a 12-player Open Play session this Saturday at 4 PM?",
    lastTime: "Yesterday",
    messages: [
      { id: "m7", sender: "them", text: "Hello! Love playing at your facility.", time: "Yesterday 3:15 PM", dateLabel: "Yesterday" },
      { id: "m8", sender: "them", text: "Hi! Can I host a 12-player Open Play session this Saturday at 4 PM?", time: "Yesterday 3:16 PM" }
    ]
  },
  {
    id: "conv-4",
    name: "Picklers System Assistant",
    avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150",
    role: "Automated Facility Alerts",
    online: true,
    unread: 0,
    lastMessage: "System Notice: Your court listing 'Championship Court 1' schedule was updated.",
    lastTime: "Jul 29",
    messages: [
      { id: "m9", sender: "them", text: "System Notice: Your court listing 'Championship Court 1' schedule was updated.", time: "Jul 29", dateLabel: "Jul 29" }
    ]
  }
];

export default function OwnerMessagesPage() {
  const { user } = useAuth();
  const isDemo = user?.isDemo || user?.role === "demo";
  const { data: liveConversations = [] } = useOwnerConversations();
  const sendMutation = useSendOwnerMessage();
  const markRead = useMarkConversationRead();

  // P1.1: prefer real conversations over the demo seed. The demo seed is
  // only used for explicitly-demo accounts with zero real data, so a real
  // owner never sees the fabricated Alex Johnson / Coach Carlos threads.
  const conversations: Conversation[] = useMemo(() => {
    if (liveConversations.length > 0) return liveConversations;
    if (isDemo) return INITIAL_CONVERSATIONS as unknown as Conversation[];
    return [];
  }, [liveConversations, isDemo]);

  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [inputMsg, setInputMsg] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto select first conversation on desktop viewports, keep null on mobile so inbox list shows first
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth >= 768 && conversations.length > 0) {
      setActiveConvId((cur) => cur ?? conversations[0].id);
    }
  }, [conversations]);

  const activeConv = conversations.find(c => c.id === activeConvId);

  // Auto scroll messages thread
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeConv?.messages]);

  const filteredConversations = conversations.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.lastMessage.toLowerCase().includes(search.toLowerCase())
  );

  function handleSendMessage(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!inputMsg.trim() || !activeConvId) return;

    const conv = conversations.find(c => c.id === activeConvId);
    if (!conv) return;

    // P1.1: demo convs have no otherUserId (the seed uses "conv-1" etc).
    // When sending against a demo conversation, surface a clear notice
    // instead of silently swallowing the input.
    if (isDemo && liveConversations.length === 0) {
      showLocalToast("Demo mode — sign in as a real owner to send messages.");
      setInputMsg("");
      return;
    }

    sendMutation.mutate(
      { toUserId: conv.otherUserId ?? conv.id, content: inputMsg.trim() },
      {
        onSuccess: () => setInputMsg(""),
        onError: (err) => {
          console.error("[owner/messages] send failed", err);
          showLocalToast(err instanceof Error ? err.message : "Failed to send");
        },
      }
    );
  }

  function handleSelectConv(id: string) {
    setActiveConvId(id);
    const conv = conversations.find(c => c.id === id);
    if (conv?.otherUserId && conv.unread > 0) {
      markRead.mutate(conv.otherUserId);
    }
  }

  // Lightweight inline toast — the page doesn't have access to the global
  // toast context cleanly from inside the hook, so we keep it local.
  const [localToast, setLocalToast] = useState<string | null>(null);
  function showLocalToast(msg: string) {
    setLocalToast(msg);
    window.setTimeout(() => setLocalToast(null), 3000);
  }

  return (
    <div className="w-full flex-1 flex flex-col h-[calc(100dvh-64px)] md:h-screen">
      {/* Local toast for demo-mode send attempts and similar inline notices. */}
      {localToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-4 right-4 z-[300] px-4 py-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold shadow-lg backdrop-blur-md"
        >
          {localToast}
        </div>
      )}
      {/* Main Messaging Container */}
      <div className="w-full flex-1 bg-background dark:bg-surface-nav-deep rounded-none border-0 overflow-hidden grid grid-cols-1 md:grid-cols-12 relative">

        {/* Left Sidebar: Conversations Inbox List */}
        <div className={cn(
          "md:col-span-4 lg:col-span-4 border-r border-border dark:border-white/10 flex flex-col h-full bg-surface-raised dark:bg-surface-nav-elevated",
          activeConvId ? "hidden md:flex" : "flex"
        )}>
          {/* Search Header */}
          <div className="p-4 pt-5 sm:pt-6 border-b border-border dark:border-white/10 shrink-0">
            <div className="mb-4">
              <h1 className="text-[26px] min-[390px]:text-[28px] md:text-[32px] font-extrabold tracking-tight leading-none mb-1.5 text-ink-primary dark:text-white">
                Messages
              </h1>
              <p className="text-[13px] font-medium text-ink-muted leading-relaxed">
                Manage and track all your conversations.
              </p>
            </div>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search messages..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm bg-surface-interactive dark:bg-[#111D30] border border-border dark:border-white/10 text-ink-primary outline-none focus:border-emerald-500 transition-all placeholder:text-ink-muted"
              />
            </div>
          </div>

          {/* Conversation Cards List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 hide-scrollbar">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-12 text-ink-muted text-xs">
                No messages found
              </div>
            ) : (
              filteredConversations.map(conv => {
                const isActive = conv.id === activeConvId;
                return (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConv(conv.id)}
                    className={cn(
                      "w-full p-3 rounded-xl text-left transition-all flex items-start gap-3 relative group cursor-pointer",
                      isActive
                        ? "bg-emerald-500/15 border border-emerald-500/30"
                        : "hover:bg-surface-interactive dark:hover:bg-white/[0.04] border border-transparent"
                    )}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={conv.avatar}
                        alt={conv.name}
                        className="w-10 h-10 rounded-full object-cover border border-border dark:border-white/15"
                      />
                      {conv.online && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#00D98B] border-2 border-surface-raised dark:border-[#0B1528]" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className={cn(
                          "text-xs sm:text-sm font-bold truncate",
                          isActive ? "text-[#00D98B]" : "text-ink-primary dark:text-white"
                        )}>
                          {conv.name}
                        </span>
                        <span className="text-[10px] text-ink-muted shrink-0">{conv.lastTime}</span>
                      </div>
                      <p className="text-[11px] text-ink-muted truncate leading-tight mb-1">
                        {conv.role}
                      </p>
                      <p className={cn(
                        "text-xs truncate leading-snug",
                        conv.unread > 0 ? "font-bold text-ink-primary" : "text-ink-muted"
                      )}>
                        {conv.lastMessage}
                      </p>
                    </div>

                    {conv.unread > 0 && (
                      <span className="shrink-0 w-5 h-5 rounded-full bg-emerald-500 text-white font-bold text-[10px] flex items-center justify-center shadow-sm">
                        {conv.unread}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Active Chat Panel (Full-Screen Mobile View matching Player Messages 100%) */}
        <div className={cn(
          "md:col-span-8 lg:col-span-8 flex flex-col bg-[#070F1E]",
          activeConvId ? "fixed inset-0 z-[200] md:relative md:inset-auto md:z-auto md:h-full flex" : "hidden md:flex h-full"
        )}>
          {activeConv ? (
            <>
              {/* Chat Header — Dark Navy Header matching Reference */}
              <div className="px-4 py-3.5 flex items-center justify-between shrink-0 bg-[#0B1528] border-b border-white/10">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveConvId(null)}
                    className="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-all bg-[#132238] border border-white/10 shrink-0 cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5 text-emerald-400" />
                  </button>
                  
                  <div className="relative">
                    <img
                      src={activeConv.avatar}
                      alt={activeConv.name}
                      className="w-10 h-10 rounded-full object-cover border border-white/15"
                    />
                    {activeConv.online && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#00D98B] border-2 border-[#0B1528]" />
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white leading-tight">
                      {activeConv.name}
                    </h3>
                    <p className="text-xs font-semibold text-[#00D98B]">
                      {activeConv.online ? "Online" : "Offline"}
                    </p>
                  </div>
                </div>

                {/* Right Initial / Nitro Badge */}
                <div className="w-8 h-8 rounded-full bg-[#111C2E] border border-white/10 flex items-center justify-center font-bold text-xs text-white shadow-inner">
                  N
                </div>
              </div>

              {/* Chat Messages Thread Viewport */}
              <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4 hide-scrollbar bg-[#070F1E]">
                {activeConv.messages.map(msg => {
                  const isMe = msg.sender === "me";
                  return (
                    <div key={msg.id} className="space-y-3">
                      {msg.dateLabel && (
                        <div className="text-center my-3">
                          <span className="px-3.5 py-1 rounded-full text-[11px] font-semibold bg-[#111C2E] border border-white/5 text-[#64748B]">
                            {msg.dateLabel}
                          </span>
                        </div>
                      )}
                      
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        className={cn("flex flex-col", isMe ? "items-end" : "items-start")}
                      >
                        {/* Bubble */}
                        <div className={cn(
                          "max-w-[85%] sm:max-w-[70%] px-4 py-3 rounded-2xl text-[14px] leading-relaxed shadow-sm",
                          isMe
                            ? "bg-[#00D98B] text-[#091522] font-semibold rounded-tr-xs shadow-[0_2px_12px_rgba(0,217,139,0.25)]"
                            : "bg-[#132238] border border-white/5 text-ink-primary font-normal rounded-tl-xs"
                        )}>
                          <p>{msg.text}</p>
                        </div>
                        
                        {/* Timestamp & Read Receipt */}
                        <div className={cn("flex items-center gap-1 mt-1 text-[11px] text-[#586c8a] px-1", isMe ? "justify-end" : "justify-start")}>
                          <span>{msg.time}</span>
                          {isMe && <CheckCheck className="w-3.5 h-3.5 text-emerald-400 inline ml-0.5" />}
                        </div>
                      </motion.div>
                    </div>
                  );
                })}
              </div>

              {/* Message Input Footer — Exact Reference Image Match */}
              <form
                onSubmit={handleSendMessage}
                className="p-3.5 px-4 border-t border-white/10 bg-[#0A1424] flex items-center gap-3 shrink-0 pb-[max(14px,env(safe-area-inset-bottom,14px))]"
              >
                <input
                  value={inputMsg}
                  onChange={e => setInputMsg(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-3 rounded-full text-sm bg-[#111D30] border border-white/10 text-white outline-none focus:border-emerald-500/50 transition-all placeholder:text-[#586C8A]"
                />
                <button
                  type="submit"
                  disabled={!inputMsg.trim()}
                  className="w-11 h-11 rounded-full bg-[#1C3254] hover:bg-[#233f69] text-[#3B82F6] flex items-center justify-center shrink-0 active:scale-95 transition-all disabled:opacity-40 cursor-pointer"
                  title="Send Message"
                >
                  <Send className="w-5 h-5 ml-0.5 stroke-[2]" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-muted-foreground bg-[#070F1E]">
              <MessageSquare className="w-12 h-12 mb-3 text-muted-foreground/60" />
              <p className="text-sm font-semibold text-foreground">Select a conversation</p>
              <p className="text-xs text-muted-foreground mt-1">Choose a message from the left to start chatting.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}