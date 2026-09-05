"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, MessageCircle, Heart, Trophy, UserX } from "lucide-react";
import type { CommunityPlayer } from "@/types";
import Image from "next/image";

import { formatSkillLevel } from "@/lib/utils";
import FollowListModal from "@/components/community/FollowListModal";
import TrophyHistoryModal from "@/components/community/TrophyHistoryModal";

export default function PlayerProfileSheet({ 
  playerId, 
  onClose,
  onOpenChat,
  onOpenProfile
}: { 
  playerId: string | null; 
  onClose: () => void;
  onOpenChat?: (p: any) => void;
  onOpenProfile?: (id: string) => void;
}) {
  const [player, setPlayer] = useState<CommunityPlayer | null>(null);
  const [loading, setLoading] = useState(false);
  const [showFollowList, setShowFollowList] = useState<"followers" | "following" | null>(null);
  const [selectedMedal, setSelectedMedal] = useState<"all" | "gold" | "silver" | "bronze" | null>(null);

  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!playerId) {
      setPlayer(null);
      setNotFound(false);
      return;
    }

    setLoading(true);
    setNotFound(false);
    fetch(`/api/community/players?id=${playerId}`)
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : data?.data || [];
        if (list.length > 0 && list[0]?.name) {
          setPlayer(list[0]);
        } else {
          setPlayer(null);
          setNotFound(true);
        }
      })
      .catch(() => {
        setPlayer(null);
        setNotFound(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [playerId]);

  async function toggleLike() {
    if (!player) return;
    const newFollow = !(player.i_follow ?? player.i_liked);
    const currentFollowers = player.follower_count ?? player.like_count ?? 0;
    const newFollowers = Math.max(0, currentFollowers + (newFollow ? 1 : -1));

    setPlayer(prev => prev ? { 
      ...prev, 
      i_follow: newFollow,
      i_liked: newFollow, 
      like_count: newFollowers,
      follower_count: newFollowers,
    } : null);

    const res = await fetch("/api/community/follows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ following_id: player.id }),
    });

    if (!res.ok) {
      // Revert on error
      setPlayer(prev => prev ? { 
        ...prev, 
        i_follow: !newFollow,
        i_liked: !newFollow, 
        like_count: currentFollowers,
        follower_count: currentFollowers,
      } : null);
    }
  }

  return (
    <AnimatePresence mode="wait">
      {playerId && (
        <>
          <motion.div
            key={`backdrop-${playerId}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] dark:bg-black/50 z-[600]"
          />
          <motion.div
            key={`sheet-${playerId}`}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 350, damping: 32 }}
            className="fixed bottom-0 left-0 right-0 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:max-w-[430px] md:mx-auto max-h-[85dvh] max-h-[85svh] overflow-hidden bg-surface-overlay dark:bg-[#13223F] rounded-t-[32px] md:rounded-[28px] shadow-[0_25px_60px_rgba(0,0,0,0.5)] z-[610] border border-border dark:border-white/12 flex flex-col"
          >
            {/* Header */}
            <div className="sticky top-0 bg-surface-interactive/30 backdrop-blur-md z-10 p-4 px-5 border-b border-border flex justify-between items-center shrink-0">
              <div className="w-12 h-1 bg-muted-foreground/30 rounded-full absolute left-1/2 -translate-x-1/2 top-2 md:hidden" />
              <h2 className="text-sm sm:text-base font-black mt-1 text-foreground tracking-wide" style={{ fontFamily: "var(--font-outfit), var(--font-montserrat), sans-serif" }}>Player Profile</h2>
              <button
                onClick={onClose}
                aria-label="Close sheet"
                className="w-8 h-8 rounded-full bg-surface-interactive hover:bg-surface-interactive/80 border border-border active:scale-90 transition-all text-muted-foreground hover:text-foreground flex items-center justify-center shrink-0 cursor-pointer"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            <div className="p-5 sm:p-6 pb-[max(env(safe-area-inset-bottom,20px),1.5rem)] overflow-y-auto hide-scrollbar">
              {loading ? (
                <div className="flex flex-col items-center gap-4 py-8">
                  <div className="w-24 h-24 rounded-full bg-surface-interactive animate-pulse" />
                  <div className="w-40 h-6 bg-surface-interactive rounded animate-pulse" />
                  <div className="w-24 h-4 bg-surface-interactive rounded animate-pulse" />
                </div>
              ) : notFound || !player ? (
                <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-surface-interactive border border-border">
                    <UserX className="w-7 h-7 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-semibold text-foreground mb-1">Player not found</p>
                  <p className="text-xs text-muted-foreground">This player profile could not be loaded.</p>
                  <button
                    onClick={onClose}
                    className="mt-5 px-5 py-2 rounded-xl text-sm font-semibold transition-all bg-surface-interactive text-foreground border border-border cursor-pointer hover:bg-surface-interactive/80"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center">
                  {/* Glowing Avatar */}
                  <div className="relative mb-3">
                    <div className="w-22 h-22 md:w-26 md:h-26 rounded-full bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 flex items-center justify-center font-black text-white text-3xl md:text-4xl overflow-hidden shadow-[0_0_30px_rgba(0,217,139,0.3)] ring-4 ring-emerald-500/30 p-0.5">
                      <div className="relative w-full h-full rounded-full overflow-hidden bg-background flex items-center justify-center">
                        {player.avatar_url ? (
                          <Image
                            src={player.avatar_url}
                            alt={player.name}
                            layout="fill"
                            className="object-cover"
                          />
                        ) : (
                          <span className="text-foreground font-black" style={{ fontFamily: "var(--font-outfit), var(--font-montserrat), sans-serif" }}>
                            {player.name?.[0]?.toUpperCase() || "P"}
                          </span>
                        )}
                      </div>
                    </div>
                    {player.online && (
                      <div className="absolute bottom-1 right-1 w-5 h-5 md:w-5.5 md:h-5.5 rounded-full border-3 border-background bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                    )}
                  </div>
                  
                  {/* Player Name & Skill Badge */}
                  <h3 className="text-xl sm:text-2xl font-black text-foreground tracking-tight" style={{ fontFamily: "var(--font-outfit), var(--font-montserrat), sans-serif" }}>
                    {player.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1.5 mb-3">
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400 uppercase tracking-wider shadow-sm">
                      {formatSkillLevel(player.level)}
                    </span>
                  </div>

                  {/* Followers & Following Stats Bar */}
                  <div className="flex items-center justify-center gap-6 mb-5 py-2.5 px-6 rounded-2xl bg-surface-interactive border border-border shadow-inner w-full max-w-[280px]">
                    <button
                      type="button"
                      onClick={() => setShowFollowList("followers")}
                      className="flex flex-col items-center group cursor-pointer active:scale-95 transition-all"
                    >
                      <span className="text-base sm:text-lg font-black text-foreground group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors" style={{ fontFamily: "var(--font-outfit), var(--font-montserrat), sans-serif" }}>
                        {player.follower_count ?? player.like_count ?? 128}
                      </span>
                      <span className="text-[10px] font-black uppercase text-muted-foreground group-hover:text-foreground tracking-wider transition-colors">Followers</span>
                    </button>
                    <div className="w-[1px] h-7 bg-border" />
                    <button
                      type="button"
                      onClick={() => setShowFollowList("following")}
                      className="flex flex-col items-center group cursor-pointer active:scale-95 transition-all"
                    >
                      <span className="text-base sm:text-lg font-black text-foreground group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors" style={{ fontFamily: "var(--font-outfit), var(--font-montserrat), sans-serif" }}>
                        {player.following_count ?? 34}
                      </span>
                      <span className="text-[10px] font-black uppercase text-muted-foreground group-hover:text-foreground tracking-wider transition-colors">Following</span>
                    </button>
                  </div>

                  {/* Medal Trophy Cards */}
                  <div className="grid grid-cols-3 w-full gap-3 mb-6">
                    <button
                      type="button"
                      onClick={() => setSelectedMedal("gold")}
                      className="flex flex-col items-center p-3 sm:p-3.5 rounded-2xl bg-surface-interactive border border-border shadow-sm transition-all hover:scale-[1.03] hover:border-amber-400/50 cursor-pointer active:scale-95 group"
                    >
                      <Trophy className="w-6 h-6 text-amber-500 dark:text-amber-400 mb-1 drop-shadow-[0_2px_8px_rgba(251,191,36,0.4)] group-hover:scale-110 transition-transform" strokeWidth={1.75} />
                      <span className="text-lg font-black text-foreground">{player.gold}</span>
                      <span className="text-[10px] uppercase font-black text-muted-foreground group-hover:text-amber-500 dark:group-hover:text-amber-400 tracking-wider transition-colors">Gold</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedMedal("silver")}
                      className="flex flex-col items-center p-3 sm:p-3.5 rounded-2xl bg-surface-interactive border border-border shadow-sm transition-all hover:scale-[1.03] hover:border-slate-300/50 cursor-pointer active:scale-95 group"
                    >
                      <Trophy className="w-6 h-6 text-slate-400 mb-1 drop-shadow-[0_2px_8px_rgba(203,213,225,0.4)] group-hover:scale-110 transition-transform" strokeWidth={1.75} />
                      <span className="text-lg font-black text-foreground">{player.silver}</span>
                      <span className="text-[10px] uppercase font-black text-muted-foreground group-hover:text-slate-300 tracking-wider transition-colors">Silver</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedMedal("bronze")}
                      className="flex flex-col items-center p-3 sm:p-3.5 rounded-2xl bg-surface-interactive border border-border shadow-sm transition-all hover:scale-[1.03] hover:border-amber-600/50 cursor-pointer active:scale-95 group"
                    >
                      <Trophy className="w-6 h-6 text-amber-600 mb-1 drop-shadow-[0_2px_8px_rgba(217,119,6,0.4)] group-hover:scale-110 transition-transform" strokeWidth={1.75} />
                      <span className="text-lg font-black text-foreground">{player.bronze}</span>
                      <span className="text-[10px] uppercase font-black text-muted-foreground group-hover:text-amber-600 tracking-wider transition-colors">Bronze</span>
                    </button>
                  </div>

                  {/* Action Buttons Footer */}
                  <div className="flex gap-3 w-full pt-1">
                    <motion.button 
                      whileTap={{ scale: 0.95 }}
                      onClick={toggleLike}
                      className="flex-1 py-3 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all border shadow-sm cursor-pointer"
                      style={{ 
                        background: player.i_liked ? "rgba(239,68,68,0.12)" : "var(--surface-interactive)",
                        borderColor: player.i_liked ? "rgba(239,68,68,0.3)" : "var(--border)",
                        color: player.i_liked ? "#f04848" : "var(--foreground)"
                      }}
                    >
                      <Heart className="w-4 h-4 transition-transform" style={{ fill: player.i_liked ? "#f04848" : "none", color: player.i_liked ? "#f04848" : "currentColor" }} />
                      {player.i_liked ? "Following" : "Follow"}
                    </motion.button>
                    
                    <motion.button 
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        onClose();
                        if (onOpenChat) onOpenChat(player);
                      }}
                      className="flex-1 py-3 rounded-xl font-extrabold text-xs sm:text-sm text-white bg-emerald-500 hover:bg-emerald-400 flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4 stroke-[2.5]" />
                      Message
                    </motion.button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
          
          {/* Follow List Modal */}
          {showFollowList && player && (
            <FollowListModal
              initialTab={showFollowList}
              player={player}
              onClose={() => setShowFollowList(null)}
              onSelectPlayer={(selectedId) => {
                setShowFollowList(null);
                if (onOpenProfile) onOpenProfile(selectedId);
              }}
            />
          )}

          {/* Trophy History Modal */}
          {selectedMedal && player && (
            <TrophyHistoryModal
              initialMedal={selectedMedal}
              player={player}
              onClose={() => setSelectedMedal(null)}
              onSelectPlayer={(selectedId) => {
                setSelectedMedal(null);
                if (onOpenProfile) onOpenProfile(selectedId);
              }}
            />
          )}
        </>
      )}
    </AnimatePresence>
  );
}

export { PlayerProfileSheet };
