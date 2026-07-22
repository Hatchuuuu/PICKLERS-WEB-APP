"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, MessageCircle, Heart, Medal } from "lucide-react";
import type { CommunityPlayer } from "@/types";

export default function PlayerProfileSheet({ 
  playerId, 
  onClose,
  onOpenChat
}: { 
  playerId: string | null; 
  onClose: () => void;
  onOpenChat?: (p: any) => void;
}) {
  const [player, setPlayer] = useState<CommunityPlayer | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!playerId) {
      setPlayer(null);
      return;
    }
    
    setLoading(true);
    fetch(`/api/community/players?id=${playerId}`)
      .then(res => res.json())
      .then(data => {
        if (data.length > 0) setPlayer(data[0]);
        setLoading(false);
      });
  }, [playerId]);

  async function toggleLike() {
    if (!player) return;
    setPlayer(prev => prev ? { 
      ...prev, 
      i_liked: !prev.i_liked, 
      like_count: prev.like_count + (prev.i_liked ? -1 : 1) 
    } : null);

    const res = await fetch("/api/community/likes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ liked_id: player.id }),
    });

    if (!res.ok) {
      // Revert on error
      setPlayer(prev => prev ? { 
        ...prev, 
        i_liked: !prev.i_liked, 
        like_count: prev.like_count + (!prev.i_liked ? -1 : 1) 
      } : null);
    }
  }

  return (
    <AnimatePresence>
      {playerId && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto bg-surface-base rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.2)] z-50 md:max-w-md md:mx-auto border border-border"
          >
            <div className="sticky top-0 bg-surface-base/80 backdrop-blur-xl z-10 p-4 border-b border-border-subtle flex justify-between items-center">
              <div className="w-12 h-1.5 bg-border-subtle rounded-full absolute left-1/2 -translate-x-1/2 top-2" />
              <h2 className="text-[17px] font-bold mt-2 text-foreground">Player Profile</h2>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-surface-raised flex items-center justify-center mt-2 hover:bg-surface-hover active:scale-95 transition-all">
                <X className="w-4 h-4 text-ink-muted" />
              </button>
            </div>

            <div className="p-6">
              {loading || !player ? (
                <div className="flex flex-col items-center gap-4 py-8">
                  <div className="w-24 h-24 rounded-full bg-surface-raised animate-pulse" />
                  <div className="w-40 h-6 bg-surface-raised rounded animate-pulse" />
                  <div className="w-24 h-4 bg-surface-raised rounded animate-pulse" />
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="relative mb-4">
                    <div className="w-28 h-28 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-4xl overflow-hidden shadow-lg border-4 border-background">
                      {player.avatar_url ? (
                        <img src={player.avatar_url} alt={player.name} className="w-full h-full object-cover" />
                      ) : (
                        player.name?.[0]?.toUpperCase() || "P"
                      )}
                    </div>
                    {player.online && (
                      <div className="absolute bottom-1 right-1 w-6 h-6 rounded-full border-4 border-background bg-emerald-400" />
                    )}
                  </div>
                  
                  <h3 className="text-2xl font-black text-foreground">{player.name}</h3>
                  <div className="flex items-center gap-2 mt-1 mb-6">
                    <span className="px-2.5 py-1 rounded-lg text-sm font-bold bg-accent-primary-muted text-accent-primary">
                      DUPR {player.level}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 w-full gap-3 mb-8">
                    <div className="flex flex-col items-center p-3 rounded-2xl bg-surface-raised border border-border-subtle">
                      <Medal className="w-6 h-6 text-amber-400 mb-1" strokeWidth={1.5} />
                      <span className="text-lg font-black text-foreground">{player.gold}</span>
                      <span className="text-[10px] uppercase font-bold text-ink-muted tracking-wider">Gold</span>
                    </div>
                    <div className="flex flex-col items-center p-3 rounded-2xl bg-surface-raised border border-border-subtle">
                      <Medal className="w-6 h-6 text-slate-400 mb-1" strokeWidth={1.5} />
                      <span className="text-lg font-black text-foreground">{player.silver}</span>
                      <span className="text-[10px] uppercase font-bold text-ink-muted tracking-wider">Silver</span>
                    </div>
                    <div className="flex flex-col items-center p-3 rounded-2xl bg-surface-raised border border-border-subtle">
                      <Medal className="w-6 h-6 text-orange-400 mb-1" strokeWidth={1.5} />
                      <span className="text-lg font-black text-foreground">{player.bronze}</span>
                      <span className="text-[10px] uppercase font-bold text-ink-muted tracking-wider">Bronze</span>
                    </div>
                  </div>

                  <div className="flex gap-3 w-full">
                    <motion.button 
                      whileTap={{ scale: 0.95 }}
                      onClick={toggleLike}
                      className="flex-1 h-12 rounded-xl flex items-center justify-center gap-2 font-bold transition-all border border-border-subtle"
                      style={{ 
                        background: player.i_liked ? "rgba(239,68,68,0.12)" : "var(--surface-raised)",
                        color: player.i_liked ? "#f04848" : "var(--ink-primary)"
                      }}
                    >
                      <Heart className="w-5 h-5" style={{ fill: player.i_liked ? "#f04848" : "none" }} />
                      {player.i_liked ? "Following" : "Follow"}
                    </motion.button>
                    
                    <motion.button 
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        onClose();
                        if (onOpenChat) onOpenChat(player);
                      }}
                      className="flex-1 h-12 rounded-xl flex items-center justify-center gap-2 font-bold text-white shadow-[0_4px_14px_rgba(0,217,139,0.3)] transition-all"
                      style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, #00C67F 100%)" }}
                    >
                      <MessageCircle className="w-5 h-5" />
                      Message
                    </motion.button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
