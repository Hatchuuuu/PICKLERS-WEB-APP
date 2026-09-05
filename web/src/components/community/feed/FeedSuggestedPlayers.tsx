"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Heart } from "lucide-react";
import type { CommunityPlayer } from "@/types";
import { Avatar } from "@/components/ui/Avatar";
import { formatSkillLevel } from "@/lib/utils";

export function FeedSuggestedPlayers({
  onOpenProfile,
}: {
  onOpenProfile?: (id: string) => void;
}) {
  const [players, setPlayers] = useState<CommunityPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/community/players?q=`);
        if (res.ok) {
          const raw = await res.json();
          const allPlayers: CommunityPlayer[] = Array.isArray(raw) ? raw : raw?.data || [];
          setPlayers(allPlayers.slice(0, 3)); // Only show top 3 recommendations
        }
      } catch {
        // Silently handle
      }
      setLoading(false);
    })();
  }, []);

  async function toggleFollow(p: CommunityPlayer) {
    const isFollowing = p.i_follow ?? p.i_liked;
    const nextFollowing = !isFollowing;
    const currentFollowers = p.follower_count ?? p.like_count ?? 0;
    const nextCount = Math.max(0, currentFollowers + (nextFollowing ? 1 : -1));

    setPlayers((prev) =>
      prev.map((pl) =>
        pl.id === p.id
          ? {
              ...pl,
              i_follow: nextFollowing,
              i_liked: nextFollowing,
              follower_count: nextCount,
              like_count: nextCount,
            }
          : pl
      )
    );

    const res = await fetch("/api/community/follows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ following_id: p.id }),
    });

    if (!res.ok) {
      setPlayers((prev) =>
        prev.map((pl) =>
          pl.id === p.id
            ? {
                ...pl,
                i_follow: isFollowing,
                i_liked: isFollowing,
                follower_count: currentFollowers,
                like_count: currentFollowers,
              }
            : pl
        )
      );
    }
  }

  if (loading || players.length === 0) return null;

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: "var(--surface-raised)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      <h3
        className="text-[13px] font-extrabold uppercase tracking-wider mb-4"
        style={{ color: "var(--ink-primary)" }}
      >
        People You May Know
      </h3>
      <div className="flex flex-col gap-4">
        {players.map((p) => {
          const isFollowing = p.i_follow ?? p.i_liked;
          return (
            <div key={p.id} className="flex items-center gap-3">
              <button
                onClick={() => onOpenProfile?.(p.id)}
                className="shrink-0 transition-transform hover:scale-105 active:scale-95 text-left cursor-pointer"
              >
                <Avatar name={p.name} size={42} avatarUrl={p.avatar_url} />
              </button>
              <div className="flex-1 min-w-0">
                <button
                  onClick={() => onOpenProfile?.(p.id)}
                  className="text-[14px] font-bold text-foreground leading-tight truncate hover:underline text-left block cursor-pointer"
                >
                  {p.name}
                </button>
                <span className="text-[11px] text-ink-muted">
                  {formatSkillLevel(p.level)}
                </span>
              </div>
              <motion.button
                whileTap={{ scale: 0.8 }}
                onClick={() => toggleFollow(p)}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer"
                style={{
                  background: isFollowing
                    ? "rgba(239,68,68,0.12)"
                    : "var(--surface-interactive)",
                }}
                aria-label={isFollowing ? "Unfollow player" : "Follow player"}
              >
                <Heart
                  className="w-4 h-4 transition-all"
                  style={{
                    color: isFollowing ? "#f04848" : "var(--ink-muted)",
                    fill: isFollowing ? "#f04848" : "none",
                  }}
                />
              </motion.button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
export default FeedSuggestedPlayers;
