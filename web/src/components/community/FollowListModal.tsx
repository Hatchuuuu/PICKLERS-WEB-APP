"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Search, UserPlus, UserCheck, Heart } from "lucide-react";
import { DEMO_COMMUNITY_PLAYERS } from "@/lib/demoData";
import { Avatar } from "@/components/ui/Avatar";
import { formatSkillLevel } from "@/lib/utils";
import type { CommunityPlayer } from "@/types";

interface FollowListModalProps {
  initialTab?: "followers" | "following";
  player: CommunityPlayer;
  onClose: () => void;
  onSelectPlayer?: (playerId: string) => void;
}

export default function FollowListModal({
  initialTab = "followers",
  player,
  onClose,
  onSelectPlayer,
}: FollowListModalProps) {
  const [activeTab, setActiveTab] = useState<"followers" | "following">(initialTab);
  const [search, setSearch] = useState("");

  // Track follow state per user id locally
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    DEMO_COMMUNITY_PLAYERS.forEach((p) => {
      initial[p.id] = p.i_liked;
    });
    return initial;
  });

  // Mock list generation based on player profile
  const followersList = useMemo(() => {
    return DEMO_COMMUNITY_PLAYERS.filter((p) => p.id !== player.id);
  }, [player.id]);

  const followingList = useMemo(() => {
    return DEMO_COMMUNITY_PLAYERS.filter((p) => p.id !== player.id);
  }, [player.id]);

  const currentList = activeTab === "followers" ? followersList : followingList;

  const filteredList = currentList.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.level && p.level.toLowerCase().includes(search.toLowerCase()))
  );

  function toggleFollow(e: React.MouseEvent, playerId: string) {
    e.stopPropagation();
    setFollowingMap((prev) => ({
      ...prev,
      [playerId]: !prev[playerId],
    }));
  }

  return (
    <AnimatePresence>
      <motion.div
        key="follow-list-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-md z-[150]"
      />
      <motion.div
        key="follow-list-modal"
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", stiffness: 350, damping: 32 }}
        className="fixed bottom-0 left-0 right-0 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:max-w-[440px] md:mx-auto h-[80vh] md:h-[580px] bg-background/95 dark:bg-[#0d1527]/95 backdrop-blur-2xl rounded-t-[32px] md:rounded-[28px] shadow-[0_25px_70px_rgba(0,0,0,0.8)] z-[160] border border-white/20 dark:border-white/[0.15] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="sticky top-0 bg-surface-interactive/30 dark:bg-white/[0.04] backdrop-blur-md z-10 p-4 px-5 border-b border-border/40 dark:border-white/[0.1] flex justify-between items-center shrink-0">
          <div className="w-12 h-1 bg-white/20 rounded-full absolute left-1/2 -translate-x-1/2 top-2" />
          <h3
            className="text-base font-extrabold text-foreground tracking-tight"
            style={{ fontFamily: "var(--font-outfit), var(--font-montserrat), sans-serif" }}
          >
            {player.name}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/20 dark:bg-white/15 hover:bg-black/40 dark:hover:bg-white/30 active:scale-90 transition-all text-foreground flex items-center justify-center shrink-0"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex p-1.5 mx-5 mt-4 rounded-xl bg-surface-interactive/40 dark:bg-white/[0.04] border border-border/40 dark:border-white/[0.08] shrink-0">
          <button
            onClick={() => setActiveTab("followers")}
            className={`flex-1 py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "followers"
                ? "bg-emerald-500 text-slate-950 shadow-[0_2px_10px_rgba(0,217,139,0.3)]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>Followers</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/10 dark:bg-white/10 font-bold">
              {player.follower_count ?? player.like_count ?? followersList.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("following")}
            className={`flex-1 py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "following"
                ? "bg-emerald-500 text-slate-950 shadow-[0_2px_10px_rgba(0,217,139,0.3)]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>Following</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/10 dark:bg-white/10 font-bold">
              {player.following_count ?? followingList.length}
            </span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-5 pt-3.5 pb-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${activeTab}...`}
              className="w-full h-10 pl-10 pr-4 rounded-xl text-xs font-semibold outline-none transition-shadow bg-surface-interactive/30 dark:bg-white/[0.04] border border-border/40 dark:border-white/[0.1] text-foreground focus:border-emerald-500/50"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full flex items-center justify-center bg-white/10 text-muted-foreground hover:text-foreground"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        </div>

        {/* Player List Scroll Container */}
        <div className="flex-1 overflow-y-auto px-5 py-2 space-y-2.5 hide-scrollbar">
          {filteredList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-surface-interactive/40 dark:bg-white/[0.04] border border-white/10 flex items-center justify-center mb-3 text-muted-foreground">
                <Heart className="w-6 h-6 stroke-[1.5]" />
              </div>
              <p className="text-xs font-bold text-foreground">No {activeTab} found</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {search ? `No results for "${search}"` : `No players in ${activeTab} yet`}
              </p>
            </div>
          ) : (
            filteredList.map((p, i) => {
              const isFollowing = followingMap[p.id] ?? p.i_liked;
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i, 6) * 0.03 }}
                  onClick={() => {
                    onClose();
                    onSelectPlayer?.(p.id);
                  }}
                  className="flex items-center justify-between p-3 rounded-2xl bg-surface-interactive/30 dark:bg-white/[0.03] border border-border/40 dark:border-white/[0.08] hover:border-emerald-500/40 hover:bg-white/[0.05] transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={p.name} size={42} online={p.online} avatarUrl={p.avatar_url} />
                    <div className="flex flex-col min-w-0">
                      <span
                        className="text-xs sm:text-sm font-black text-foreground truncate group-hover:text-emerald-400 transition-colors"
                        style={{ fontFamily: "var(--font-outfit), var(--font-montserrat), sans-serif" }}
                      >
                        {p.name}
                      </span>
                      <span className="text-[10.5px] font-extrabold text-emerald-400">
                        {formatSkillLevel(p.level)}
                      </span>
                    </div>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={(e) => toggleFollow(e, p.id)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold flex items-center gap-1.5 transition-all shrink-0 border ${
                      isFollowing
                        ? "bg-white/10 dark:bg-white/10 text-foreground border-white/20 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30"
                        : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-400 shadow-[0_0_12px_rgba(0,217,139,0.3)]"
                    }`}
                  >
                    {isFollowing ? (
                      <>
                        <UserCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Follow</span>
                      </>
                    )}
                  </motion.button>
                </motion.div>
              );
            })
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
