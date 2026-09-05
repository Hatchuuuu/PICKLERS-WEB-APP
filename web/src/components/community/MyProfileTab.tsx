"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Trophy,
  Edit3,
  Settings,
  Plus,
  Share2,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import type { CommunityPlayer, FeedPost } from "@/types";
import { formatSkillLevel } from "@/lib/utils";
import FollowListModal from "@/components/community/FollowListModal";
import TrophyHistoryModal from "@/components/community/TrophyHistoryModal";
import { FeedPostCard } from "./feed/FeedPostCard";
import { CreatePostModal } from "./feed/CreatePostModal";
import { ReportModal } from "./feed/ReportModal";

export function MyProfileTab({
  onOpenProfile,
}: {
  onOpenProfile?: (id: string) => void;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<CommunityPlayer | null>(null);
  const [myPosts, setMyPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFollowList, setShowFollowList] = useState<
    "followers" | "following" | null
  >(null);
  const [selectedMedal, setSelectedMedal] = useState<
    "all" | "gold" | "silver" | "bronze" | null
  >(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [reportTarget, setReportTarget] = useState<{
    postId?: string;
    commentId?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchProfileData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    try {
      const [pRes, postsRes] = await Promise.all([
        fetch(`/api/community/players?id=${user.id}`),
        fetch(`/api/community/feed?author_id=${user.id}`),
      ]);

      if (pRes.ok) {
        const raw = await pRes.json();
        const list = Array.isArray(raw) ? raw : raw?.data || [];
        if (list.length > 0) {
          setProfile(list[0]);
        } else {
          // Fallback construct from auth
          setProfile({
            id: user.id,
            name: user.name || "Pickler",
            avatar_url: user.avatarUrl || undefined,
            level: "2.5",
            gold: 0,
            silver: 0,
            bronze: 0,
            online: true,
            follower_count: 0,
            following_count: 0,
            like_count: 0,
            i_liked: false,
            i_follow: false,
          });
        }
      }

      if (postsRes.ok) {
        const rawPosts = await postsRes.json();
        const list = Array.isArray(rawPosts) ? rawPosts : rawPosts?.data || [];
        setMyPosts(list);
      }
    } catch {
      // Ignore network errors gracefully
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  async function handleLike(postId: string) {
    setMyPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              i_liked: !p.i_liked,
              like_count: p.like_count + (p.i_liked ? -1 : 1),
            }
          : p
      )
    );
    await fetch(`/api/community/feed/${postId}/like`, { method: "POST" });
  }

  async function handleDelete(postId: string) {
    setMyPosts((prev) => prev.filter((p) => p.id !== postId));
    await fetch(`/api/community/feed/${postId}`, { method: "DELETE" });
  }

  async function handleComment(postId: string, content: string) {
    const tempId = `temp_${Date.now()}`;
    const tempComment = {
      id: tempId,
      post_id: postId,
      author_id: user?.id ?? "",
      author_name: user?.name ?? "You",
      author_avatar_url: user?.avatarUrl ?? null,
      content,
      created_at: new Date().toISOString(),
      like_count: 0,
      i_liked: false,
    };

    setMyPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              comment_count: p.comment_count + 1,
              recent_comments: [...(p.recent_comments ?? []), tempComment],
            }
          : p
      )
    );

    const res = await fetch(`/api/community/feed/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });

    if (res.ok) {
      const comment = await res.json();
      setMyPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                recent_comments: (p.recent_comments ?? []).map((c) =>
                  c.id === tempId ? comment : c
                ),
              }
            : p
        )
      );
    }
  }

  function handleShareProfile() {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4 pt-2">
        <div
          className="h-64 rounded-3xl animate-pulse"
          style={{ background: "var(--surface-raised)" }}
        />
        <div
          className="h-40 rounded-2xl animate-pulse"
          style={{ background: "var(--surface-raised)" }}
        />
      </div>
    );
  }

  const currentPlayer: CommunityPlayer = profile || {
    id: user?.id ?? "",
    name: user?.name ?? "You",
    avatar_url: user?.avatarUrl ?? undefined,
    level: "2.5",
    gold: 0,
    silver: 0,
    bronze: 0,
    online: true,
    follower_count: 0,
    following_count: 0,
    like_count: 0,
    i_liked: false,
    i_follow: false,
  };

  return (
    <div className="flex flex-col gap-5 pt-1 w-full pb-10">
      {/* Profile Header Hero Card */}
      <div
        className="rounded-3xl p-6 relative overflow-hidden flex flex-col items-center text-center shadow-lg border"
        style={{
          background: "var(--surface-raised)",
          borderColor: "var(--border-subtle)",
        }}
      >
        {/* Subtle Ambient Background Gradient Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        {/* Top Right Quick Settings Icon */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <button
            onClick={() => router.push("/app/settings")}
            className="w-9 h-9 rounded-full bg-surface-interactive flex items-center justify-center text-ink-muted hover:text-foreground transition-all active:scale-95 cursor-pointer"
            title="Account Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {/* Avatar */}
        <div className="relative mb-3 mt-2">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 flex items-center justify-center font-black text-white text-3xl sm:text-4xl overflow-hidden shadow-[0_0_30px_rgba(0,217,139,0.3)] ring-4 ring-emerald-500/30 p-0.5">
            <div className="relative w-full h-full rounded-full overflow-hidden bg-background flex items-center justify-center">
              {currentPlayer.avatar_url ? (
                <img
                  src={currentPlayer.avatar_url}
                  alt={currentPlayer.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span
                  className="text-foreground font-black"
                  style={{
                    fontFamily:
                      "var(--font-outfit), var(--font-montserrat), sans-serif",
                  }}
                >
                  {currentPlayer.name?.[0]?.toUpperCase() || "P"}
                </span>
              )}
            </div>
          </div>
          <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full border-3 border-background bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
        </div>

        {/* Player Name */}
        <h2
          className="text-xl sm:text-2xl font-black text-foreground tracking-tight"
          style={{
            fontFamily:
              "var(--font-outfit), var(--font-montserrat), sans-serif",
          }}
        >
          {currentPlayer.name || "Player Profile"}
        </h2>

        {/* Skill Level Badge */}
        <div className="flex items-center gap-2 mt-1.5 mb-4">
          <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 uppercase tracking-wider shadow-sm">
            {formatSkillLevel(currentPlayer.level || "2.5")}
          </span>
        </div>

        {/* Followers / Following Stats Bar */}
        <div className="flex items-center justify-center gap-6 mb-5 py-2.5 px-6 rounded-2xl bg-surface-interactive/40 dark:bg-white/[0.04] backdrop-blur-md border border-border/40 dark:border-white/[0.1] shadow-inner w-full max-w-[280px]">
          <button
            type="button"
            onClick={() => setShowFollowList("followers")}
            className="flex flex-col items-center group cursor-pointer active:scale-95 transition-all"
          >
            <span
              className="text-base sm:text-lg font-black text-foreground group-hover:text-emerald-400 transition-colors"
              style={{
                fontFamily:
                  "var(--font-outfit), var(--font-montserrat), sans-serif",
              }}
            >
              {currentPlayer.follower_count ?? currentPlayer.like_count ?? 0}
            </span>
            <span className="text-[10px] font-black uppercase text-ink-muted group-hover:text-foreground tracking-wider transition-colors">
              Followers
            </span>
          </button>
          <div className="w-[1px] h-7 bg-border-subtle dark:bg-white/10" />
          <button
            type="button"
            onClick={() => setShowFollowList("following")}
            className="flex flex-col items-center group cursor-pointer active:scale-95 transition-all"
          >
            <span
              className="text-base sm:text-lg font-black text-foreground group-hover:text-emerald-400 transition-colors"
              style={{
                fontFamily:
                  "var(--font-outfit), var(--font-montserrat), sans-serif",
              }}
            >
              {currentPlayer.following_count ?? 0}
            </span>
            <span className="text-[10px] font-black uppercase text-ink-muted group-hover:text-foreground tracking-wider transition-colors">
              Following
            </span>
          </button>
        </div>

        {/* Trophy Medal Cards */}
        <div className="grid grid-cols-3 w-full gap-3 mb-5">
          <button
            type="button"
            onClick={() => setSelectedMedal("gold")}
            className="flex flex-col items-center p-3 rounded-2xl bg-surface-interactive/30 dark:bg-white/[0.04] backdrop-blur-md border border-border dark:border-white/[0.1] shadow-sm transition-all hover:scale-[1.03] hover:border-amber-400/50 cursor-pointer active:scale-95 group"
          >
            <Trophy
              className="w-5 h-5 text-amber-400 mb-1 drop-shadow-[0_2px_8px_rgba(251,191,36,0.4)] group-hover:scale-110 transition-transform"
              strokeWidth={1.75}
            />
            <span className="text-base font-black text-foreground">
              {currentPlayer.gold ?? 0}
            </span>
            <span className="text-[10px] uppercase font-black text-ink-muted group-hover:text-amber-400 tracking-wider transition-colors">
              Gold
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedMedal("silver")}
            className="flex flex-col items-center p-3 rounded-2xl bg-surface-interactive/30 dark:bg-white/[0.04] backdrop-blur-md border border-border dark:border-white/[0.1] shadow-sm transition-all hover:scale-[1.03] hover:border-slate-300/50 cursor-pointer active:scale-95 group"
          >
            <Trophy
              className="w-5 h-5 text-slate-300 mb-1 drop-shadow-[0_2px_8px_rgba(203,213,225,0.4)] group-hover:scale-110 transition-transform"
              strokeWidth={1.75}
            />
            <span className="text-base font-black text-foreground">
              {currentPlayer.silver ?? 0}
            </span>
            <span className="text-[10px] uppercase font-black text-ink-muted group-hover:text-slate-200 tracking-wider transition-colors">
              Silver
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedMedal("bronze")}
            className="flex flex-col items-center p-3 rounded-2xl bg-surface-interactive/30 dark:bg-white/[0.04] backdrop-blur-md border border-border dark:border-white/[0.1] shadow-sm transition-all hover:scale-[1.03] hover:border-amber-600/50 cursor-pointer active:scale-95 group"
          >
            <Trophy
              className="w-5 h-5 text-amber-600 mb-1 drop-shadow-[0_2px_8px_rgba(217,119,6,0.4)] group-hover:scale-110 transition-transform"
              strokeWidth={1.75}
            />
            <span className="text-base font-black text-foreground">
              {currentPlayer.bronze ?? 0}
            </span>
            <span className="text-[10px] uppercase font-black text-ink-muted group-hover:text-amber-500 tracking-wider transition-colors">
              Bronze
            </span>
          </button>
        </div>

        {/* Action Buttons Row */}
        <div className="flex gap-2.5 w-full pt-1">
          <button
            onClick={() => router.push("/app/settings")}
            className="flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-surface-interactive hover:bg-surface-hover text-foreground flex items-center justify-center gap-2 transition-all border border-border-subtle cursor-pointer active:scale-95"
          >
            <Edit3 className="w-4 h-4" />
            Edit Profile
          </button>
          <button
            onClick={handleShareProfile}
            className="py-2.5 px-4 rounded-xl font-bold text-xs bg-surface-interactive hover:bg-surface-hover text-ink-secondary hover:text-foreground flex items-center justify-center gap-1.5 transition-all border border-border-subtle cursor-pointer active:scale-95"
          >
            <Share2 className="w-4 h-4" />
            {copied ? "Copied!" : "Share"}
          </button>
        </div>
      </div>

      {/* My Posts Feed Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between px-1">
          <h3
            className="text-[13px] font-extrabold uppercase tracking-wider text-ink-primary"
            style={{
              fontFamily:
                "var(--font-outfit), var(--font-montserrat), sans-serif",
            }}
          >
            My Activity ({myPosts.length})
          </h3>
          <button
            onClick={() => setShowCreateModal(true)}
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New Post
          </button>
        </div>

        {myPosts.length === 0 ? (
          <div
            className="rounded-3xl p-8 flex flex-col items-center justify-center text-center gap-3 border"
            style={{
              background: "var(--surface-raised)",
              borderColor: "var(--border-subtle)",
            }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{
                background: "var(--surface-interactive)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <Sparkles className="w-6 h-6 text-emerald-400" />
            </div>
            <p className="text-sm font-bold text-foreground">No posts yet</p>
            <p className="text-xs text-ink-muted max-w-xs">
              Share match highlights, court recommendations, or tips with the
              community!
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-emerald-500 hover:bg-emerald-400 transition-all shadow-md cursor-pointer active:scale-95"
            >
              Create Your First Post
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {myPosts.map((post) => (
              <FeedPostCard
                key={post.id}
                post={post}
                onLike={handleLike}
                onDelete={handleDelete}
                onComment={handleComment}
                onReport={(postId, commentId) =>
                  setReportTarget({ postId, commentId })
                }
                onOpenProfile={onOpenProfile}
              />
            ))}
          </div>
        )}
      </div>

      {/* Follow List Modal */}
      {showFollowList && (
        <FollowListModal
          initialTab={showFollowList}
          player={currentPlayer}
          onClose={() => setShowFollowList(null)}
          onSelectPlayer={(selectedId) => {
            setShowFollowList(null);
            if (onOpenProfile) onOpenProfile(selectedId);
          }}
        />
      )}

      {/* Trophy History Modal */}
      {selectedMedal && (
        <TrophyHistoryModal
          initialMedal={selectedMedal}
          player={currentPlayer}
          onClose={() => setSelectedMedal(null)}
          onSelectPlayer={(selectedId) => {
            setSelectedMedal(null);
            if (onOpenProfile) onOpenProfile(selectedId);
          }}
        />
      )}

      {/* Create Post Modal */}
      <CreatePostModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={(newPost) => setMyPosts((prev) => [newPost, ...prev])}
      />

      {/* Report Modal */}
      <ReportModal
        open={!!reportTarget}
        postId={reportTarget?.postId}
        commentId={reportTarget?.commentId}
        onClose={() => setReportTarget(null)}
      />
    </div>
  );
}
export default MyProfileTab;
