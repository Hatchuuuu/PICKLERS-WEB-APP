import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Search, MessageCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/types";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";

export default function MessagesTab({
  onOpenChat,
  onGoToCommunity,
  onOpenProfile
}: {
  onOpenChat: (p: { id: string; name: string; online: boolean; avatar_url?: string | null }) => void;
  onGoToCommunity: () => void;
  onOpenProfile?: (id: string) => void;
}) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await fetch("/api/community/inbox");
      if (res.ok) setConversations(await res.json());
      setLoading(false);
    })();
  }, []);

  const filteredConversations = conversations.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.last_message.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="flex flex-col gap-3 pt-2">
      {/* Search Input Skeleton */}
      <div className="h-12 rounded-2xl animate-pulse mb-2" style={{ background: "var(--surface-raised)" }} />
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
    <div className="flex flex-col gap-5 pt-1 w-full">
      {/* Search Input */}
      <div className="relative z-10">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--ink-muted)" }} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search messages..."
          className="w-full h-12 pl-11 pr-10 rounded-2xl text-[14px] outline-none transition-shadow focus:shadow-[0_0_20px_rgba(0,217,139,0.15)]"
          style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)", color: "var(--ink-primary)" }}
        />
        {search && (
          <button onClick={() => setSearch("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center bg-surface-interactive hover:bg-border-default transition-colors">
            <X className="w-3 h-3 text-ink-secondary" />
          </button>
        )}
      </div>

      {filteredConversations.length === 0 ? (
        <EmptyState icon={Search} title="No results found" subtitle={`No messages matching "${search}"`} />
      ) : (
        <div className="flex flex-col gap-3">
          {filteredConversations.map((c, i) => (
            <motion.div
              key={c.user_id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => onOpenChat({ id: c.user_id, name: c.name, online: c.online, avatar_url: c.avatar_url })}
              className="flex items-center gap-4 p-4 rounded-2xl text-left w-full group transition-all cursor-pointer hover:bg-surface-hover active:scale-[0.99]"
              style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}
            >
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onOpenProfile?.(c.user_id); }}
                className="shrink-0 transition-transform hover:scale-105 active:scale-95"
              >
                <Avatar name={c.name} size={48} online={c.online} avatarUrl={c.avatar_url} />
              </button>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span
                    className="text-[15px] font-extrabold text-foreground truncate"
                    style={{ fontFamily: "var(--font-outfit), var(--font-montserrat), sans-serif" }}
                  >
                    {c.name}
                  </span>
                  <span className="text-[11px] font-bold shrink-0 text-muted-foreground">
                    {new Date(c.last_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                  </span>
                </div>
                
                <div className="flex items-center justify-between gap-2">
                  <span className={cn("text-[13px] truncate", c.unread_count > 0 ? "font-bold text-foreground" : "text-muted-foreground font-medium")}>
                    {c.last_message}
                  </span>
                  {c.unread_count > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-slate-950 bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                    >
                      {c.unread_count > 9 ? "9+" : c.unread_count}
                    </motion.span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
