"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import FeedTab from "@/components/community/FeedTab";
import MessagesTab from "@/components/community/MessagesTab";
import CommunityTab from "@/components/community/CommunityTab";
import ChatPanel from "@/components/community/ChatPanel";
import PlayerProfileSheet from "@/components/community/PlayerProfileSheet";

type Tab = "feed" | "messages" | "community";

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
  const [panel, setPanel] = useState<{ type: "none" | "chat"; partner?: any }>({ type: "none" });
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
        const unread = data.reduce((acc: number, c: any) => acc + c.unread_count, 0);
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

  function openChat(p: { id: string; name: string; online: boolean; avatar_url?: string | null }) {
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
    <div className="p-4 max-w-6xl mx-auto w-full pb-24 md:pb-8">
      {/* Header matching Explore/Play */}
      <div className="relative h-[68px] mb-4 md:mb-6 -mt-[1px] flex items-center justify-between">
        <AnimatePresence>
          <motion.div 
            key="title" 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: -20 }}
            className="absolute left-0 top-0"
          >
            <h1 className="text-[32px] font-extrabold tracking-tight leading-none mb-1.5" style={{ color: "var(--ink-primary)" }}>
              Community
            </h1>
            <p className="text-sm text-muted-foreground">Connect with players, clubs, and see what's happening.</p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="w-full">
        {/* Left-Aligned Content (Aligns with Header) */}
        <div className="w-full max-w-[650px] relative min-h-[500px]">
          
          {/* Top Navigation Tabs (Sticky) */}
          {panel.type !== "chat" && (
            <div className="sticky top-0 md:top-[72px] z-10 bg-background/80 backdrop-blur-xl border-b border-border mb-4 md:mb-6 -mx-4 md:mx-0">
              <div className="flex items-center w-full h-full">
                {(["feed", "messages", "community"] as Tab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className="flex-1 relative flex items-center justify-center pb-3 md:pb-4 transition-colors group"
                  >
                    <span className={`relative text-[15px] font-bold transition-colors ${activeTab === tab ? "text-ink-primary" : "text-ink-muted group-hover:text-ink-primary"}`}>
                      {tab === "community" ? "Discover" : tab.charAt(0).toUpperCase() + tab.slice(1)}
                      {tab === "messages" && inboxUnread > 0 && (
                        <span className="absolute -top-1.5 -right-5 inline-flex items-center justify-center bg-accent-primary text-surface-base text-[10px] font-black rounded-full min-w-[18px] h-[18px] px-1">
                          {inboxUnread}
                        </span>
                      )}
                    </span>
                    {activeTab === tab && (
                      <motion.div
                        layoutId="activeTabIndicator"
                        className="absolute bottom-0 inset-x-4 md:inset-x-6 h-[3px] bg-accent-primary rounded-t-sm"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            {panel.type === "chat" ? (
              <motion.div key="chat-panel"
                initial={{ opacity: 0, scale: 0.98, y: 10 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.98, y: -10 }} 
                transition={{ duration: 0.15 }}
                className="fixed inset-0 z-50 bg-background flex flex-col pb-[90px] md:pb-0 md:static md:z-auto md:h-[700px] md:rounded-2xl md:border md:border-white/5 md:bg-surface-raised overflow-hidden"
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
      </div>

      <PlayerProfileSheet 
        playerId={profileId} 
        onClose={() => setProfileId(null)} 
        onOpenChat={(p) => {
          setProfileId(null);
          openChat(p);
        }}
      />
    </div>
  );
}
