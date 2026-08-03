"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import FeedTab from "@/components/community/FeedTab";
import MessagesTab from "@/components/community/MessagesTab";
import CommunityTab from "@/components/community/CommunityTab";
import ChatPanel from "@/components/community/ChatPanel";
import PlayerProfileSheet from "@/components/community/PlayerProfileSheet";
import { formatSkillLevel } from "@/lib/utils";

type Tab = "feed" | "messages" | "community";

type ChatPartner = { id: string; name: string; online: boolean; avatar_url?: string | null };
type InboxConversation = { user_id: string; last_message: string; last_at: string; unread_count: number };

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function CommunityPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const chatId = searchParams.get("chat");
  const defaultTab = (searchParams.get("tab") as Tab) || "feed";

  const [activeTab, setActiveTab] = useState<Tab>(defaultTab);
  const [inboxUnread, setInboxUnread] = useState(0);
  const [panel, setPanel] = useState<{ type: "none" | "chat"; partner?: ChatPartner }>({ type: "none" });
  const [profileId, setProfileId] = useState<string | null>(null);

  useEffect(() => {
    // Sync URL with tab state
    const currentTab = searchParams.get("tab");
    if (activeTab !== currentTab) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", activeTab);
      router.replace(`${pathname}?${params.toString()}`);
    }
  }, [activeTab, searchParams, pathname, router]);

  const fetchUnread = async () => {
    try {
      const res = await fetch("/api/community/inbox");
      if (res.ok) {
        const data = await res.json();
        const unread = data.reduce((acc: number, c: InboxConversation) => acc + c.unread_count, 0);
        setInboxUnread(unread);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchUnread();
    // Fetch every 15s to keep unread updated if Realtime isn't firing
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, []);

  // Sync panel with URL param on mount / change
  useEffect(() => {
    if (chatId) {
      // Fetch user info for chat if not already set
      if (panel.type === "none" || panel.partner?.id !== chatId) {
        fetch(`/api/community/players?id=${chatId}`).then(res => {
          if (res.ok) res.json().then(data => {
            if (data.length > 0) {
              setPanel({ type: "chat", partner: data[0] });
            }
          });
        });
      }
    } else if (!chatId && panel.type === "chat") {
      setPanel({ type: "none" });
    }
  }, [chatId]);

  function openChat(p: ChatPartner) {
    setPanel({ type: "chat", partner: p });
    const params = new URLSearchParams(searchParams.toString());
    params.set("chat", p.id);
    router.replace(`${pathname}?${params.toString()}`);
  }

  function closePanel() {
    setPanel({ type: "none" });
    const params = new URLSearchParams(searchParams.toString());
    params.delete("chat");
    router.replace(`${pathname}?${params.toString()}`);
    fetchUnread(); // Refresh unread count in case a message was sent/read
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto w-full pb-24 md:pb-8">
      {/* Header matching Explore/Play */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[28px] md:text-[32px] font-extrabold tracking-tight leading-none mb-1.5" style={{ color: "var(--ink-primary)" }}>
            Community
          </h1>
          <p className="text-sm text-muted-foreground">Connect with players, clubs, and see what&apos;s happening in pickleball.</p>
        </div>
      </div>

      {/* Main Grid: Responsive 2-Column on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
        {/* Left Column: Feed / Messages / Discover / Chat */}
        <div className="lg:col-span-7 xl:col-span-8 w-full min-h-[500px]">
          
          {/* Top Navigation Tabs */}
          {panel.type !== "chat" && (
            <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-2xl border-b border-border/50 mb-6 py-1">
              <div className="flex items-center w-full">
                {(["feed", "messages", "community"] as Tab[]).map((tab) => {
                  const isActive = activeTab === tab;
                  const label = tab === "community" ? "Discover" : tab.charAt(0).toUpperCase() + tab.slice(1);
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className="flex-1 relative flex items-center justify-center pb-3 pt-2 transition-colors group select-none"
                    >
                      <span
                        className={`relative z-10 flex items-center gap-2 text-[15px] md:text-[16px] tracking-[-0.01em] transition-all duration-200 ${
                          isActive ? "text-foreground font-extrabold" : "text-muted-foreground hover:text-foreground font-medium"
                        }`}
                        style={{ fontFamily: "var(--font-outfit), sans-serif" }}
                      >
                        {label}
                        {tab === "messages" && inboxUnread > 0 && (
                          <span className="inline-flex items-center justify-center bg-emerald-500 text-black text-[10px] font-black rounded-full min-w-[18px] h-[18px] px-1.5 shadow-[0_0_8px_rgba(16,185,129,0.5)]">
                            {inboxUnread}
                          </span>
                        )}
                      </span>
                      {isActive && (
                        <motion.div
                          layoutId="cleanUnderlineIndicator"
                          className="absolute bottom-0 inset-x-4 md:inset-x-8 h-[3px] bg-emerald-400 rounded-full shadow-[0_0_12px_rgba(52,211,153,0.7)]"
                          transition={{ type: "spring", stiffness: 450, damping: 35 }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            {panel.type === "chat" && panel.partner ? (
              <motion.div key="chat-panel"
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -10 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 z-[200] bg-background dark:bg-[#0A1628] flex flex-col md:static md:z-auto md:h-[680px] md:rounded-3xl md:border md:border-border/60 md:bg-surface-raised overflow-hidden shadow-xl"
              >
                <ChatPanel partner={panel.partner} onBack={closePanel} onOpenProfile={(id) => setProfileId(id)} />
              </motion.div>
            ) : activeTab === "feed" ? (
              <motion.div key="feed"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.15 }}>
                <FeedTab onOpenProfile={(id) => setProfileId(id)} />
              </motion.div>
            ) : activeTab === "messages" ? (
              <motion.div key="messages"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.15 }}>
                <MessagesTab onOpenChat={openChat} onGoToCommunity={() => setActiveTab("community")} onOpenProfile={(id) => setProfileId(id)} />
              </motion.div>
            ) : activeTab === "community" ? (
              <motion.div key="community"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.15 }}>
                <CommunityTab onOpenChat={openChat} onOpenProfile={(id) => setProfileId(id)} />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* Right Column (Desktop Sidebar): Suggested Players & Community Highlights */}
        <div className="hidden lg:flex lg:col-span-5 xl:col-span-4 flex-col gap-6 sticky top-6">
          {/* Community Stats Widget */}
          <div className="rounded-3xl p-5 border border-border/60 bg-surface-raised relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[12px] font-extrabold uppercase tracking-wider text-muted-foreground">Community Pulse</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-surface-interactive border border-border/40">
                <div className="text-2xl font-black text-foreground">1,240+</div>
                <div className="text-xs text-muted-foreground font-medium mt-0.5">Active Players</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-surface-interactive border border-border/40">
                <div className="text-2xl font-black text-emerald-400">48</div>
                <div className="text-xs text-muted-foreground font-medium mt-0.5">Open Play Games</div>
              </div>
            </div>
          </div>

          {/* Suggested Players Widget */}
          <SidebarSuggestedPlayers onOpenProfile={(id) => setProfileId(id)} onOpenChat={openChat} />
        </div>
      </div>

      <PlayerProfileSheet 
        playerId={profileId} 
        onClose={() => setProfileId(null)} 
        onOpenProfile={(id) => setProfileId(id)}
        onOpenChat={(p) => {
          setProfileId(null);
          openChat(p);
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SIDEBAR SUGGESTED PLAYERS WIDGET (Desktop)
// ─────────────────────────────────────────────────────────────────────────────

function SidebarSuggestedPlayers({
  onOpenProfile,
  onOpenChat
}: {
  onOpenProfile?: (id: string) => void;
  onOpenChat: (p: ChatPartner) => void;
}) {
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/community/players?q=`);
        if (res.ok) {
          const allPlayers = await res.json();
          setPlayers(allPlayers.slice(0, 4));
        }
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="rounded-3xl p-5 border border-border/60 bg-surface-raised space-y-4">
        <div className="h-4 w-36 bg-surface-interactive rounded animate-pulse" />
        {[1, 2, 3].map(i => (
          <div key={i} className="h-12 bg-surface-interactive rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (players.length === 0) return null;

  return (
    <div className="rounded-3xl p-5 border border-border/60 bg-surface-raised">
      <h3 className="text-[13px] font-extrabold uppercase tracking-wider mb-4 text-foreground">
        Recommended Players
      </h3>
      <div className="flex flex-col gap-3.5">
        {players.map(p => (
          <div key={p.id} className="flex items-center justify-between gap-3 p-2.5 rounded-2xl hover:bg-surface-interactive transition-colors group">
            <button onClick={() => onOpenProfile?.(p.id)} className="flex items-center gap-3 min-w-0 text-left">
              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-interactive border border-border/40 flex items-center justify-center font-bold text-sm text-foreground">
                  {p.avatar_url ? (
                    <img src={p.avatar_url} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    p.name?.[0] || "P"
                  )}
                </div>
                {p.online && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-surface-raised" />
                )}
              </div>
              <div className="min-w-0">
                <div className="text-[14px] font-bold text-foreground truncate group-hover:text-emerald-400 transition-colors">
                  {p.name}
                </div>
                <div className="text-[12px] text-muted-foreground">
                  {formatSkillLevel(p.level)}
                </div>
              </div>
            </button>

            <button
              onClick={() => onOpenChat(p)}
              className="px-3 py-1.5 rounded-xl text-[12px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all shrink-0 active:scale-95"
            >
              Message
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
