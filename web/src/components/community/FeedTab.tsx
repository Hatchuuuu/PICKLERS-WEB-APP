"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "motion/react";
import { MessageCircle, Image as ImageIcon, Flame, UserCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { FeedPost, FeedComment } from "@/types";
import { DEMO_FEED_POSTS } from "@/lib/demoData";
import { LockedFeatureWrapper } from "@/components/ui/LockedFeatureWrapper";
import { Avatar } from "@/components/ui/Avatar";
import { useActionLock } from "@/hooks/useActionLock";

import { CreatePostModal } from "./feed/CreatePostModal";
import { FeedPostCard } from "./feed/FeedPostCard";
import { FeedSuggestedPlayers } from "./feed/FeedSuggestedPlayers";
import { ReportModal } from "./feed/ReportModal";

export function FeedTab({ onOpenProfile }: { onOpenProfile?: (id: string) => void }) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedFilter, setFeedFilter] = useState<"all" | "following">("all");
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ postId?: string; commentId?: string } | null>(null);
  const [cacheInfo, setCacheInfo] = useState<{ source: string; timestamp: string } | null>(null);
  const observerRef = useRef<HTMLDivElement>(null);

  const isDemo = user?.isDemo || user?.role === "demo";

  const fetchPosts = useCallback(async (currentCursor: string | null, append = false, currentFilter = feedFilter) => {
    const params = new URLSearchParams();
    if (currentCursor) params.set("cursor", currentCursor);
    if (currentFilter === "following") params.set("filter", "following");

    const url = `/api/community/feed?${params.toString()}`;
    try {
      const res = await fetch(url);
      if (res.ok) {
        const response = await res.json();
        const data: FeedPost[] = Array.isArray(response) ? response : response?.data || [];
        const info = response?.cacheInfo || null;
        setCacheInfo(info);
        let finalPosts = data;
        if (isDemo && !append && currentFilter === "all") {
          const dbIds = new Set(data.map((p) => p.id));
          finalPosts = [
            ...DEMO_FEED_POSTS.filter((dp: FeedPost) => !dbIds.has(dp.id)),
            ...data,
          ];
        }
        if (data.length < 20) setHasMore(false);
        if (data.length > 0) setCursor(data[data.length - 1].created_at);
        setPosts((prev) => (append ? [...prev, ...finalPosts] : finalPosts));
      } else if (isDemo && !append) {
        setPosts(DEMO_FEED_POSTS);
        // Set cacheInfo to indicate demo data
        setCacheInfo({ source: 'demo', timestamp: new Date().toISOString() });
      }
    } catch (error) {
      console.error('Error fetching feed:', error);
      if (isDemo && !append) {
        setPosts(DEMO_FEED_POSTS);
        setCacheInfo({ source: 'demo', timestamp: new Date().toISOString() });
      }
    }
    setLoading(false);
  }, [isDemo, feedFilter]);

  // Refetch when filter changes
  useEffect(() => {
    setLoading(true);
    setCursor(null);
    setHasMore(true);
    fetchPosts(null, false, feedFilter);
  }, [feedFilter, fetchPosts]);

  // Infinite scroll observer
  useEffect(() => {
    if (!observerRef.current || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchPosts(cursor, true, feedFilter);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, cursor, feedFilter, fetchPosts]);

  const { runWithLock } = useActionLock();

  async function handleLike(postId: string) {
    runWithLock(async () => {
      // Optimistic update
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, i_liked: !p.i_liked, like_count: p.like_count + (p.i_liked ? -1 : 1) }
            : p
        )
      );
      const res = await fetch(`/api/community/feed/${postId}/like`, { method: "POST" });
      if (!res.ok) {
        // Rollback
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? { ...p, i_liked: !p.i_liked, like_count: p.like_count + (p.i_liked ? -1 : 1) }
              : p
          )
        );
      }
    });
  }

  async function handleDelete(postId: string) {
    runWithLock(async () => {
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      await fetch(`/api/community/feed/${postId}`, { method: "DELETE" });
    });
  }

  async function handleLikeComment(postId: string, commentId: string) {
    runWithLock(async () => {
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          const updatedComments = (p.recent_comments ?? []).map((c) => {
            if (c.id !== commentId) return c;
            const newLiked = !c.i_liked;
            const newCount = Math.max(0, (c.like_count ?? 0) + (newLiked ? 1 : -1));
            return { ...c, i_liked: newLiked, like_count: newCount };
          });
          return { ...p, recent_comments: updatedComments };
        })
      );

      try {
        await fetch(`/api/community/feed/${postId}/comments/${commentId}/like`, {
          method: "POST",
        });
      } catch {
        // Ignore optimistic failure
      }
    });
  }

  async function handleComment(postId: string, content: string) {
    runWithLock(async () => {
      const tempId = `temp_${Date.now()}`;
      const tempComment: FeedComment = {
        id: tempId,
        post_id: postId,
        author_id: user?.id ?? "",
        author_name: user?.name ?? "You",
        author_avatar_url: null,
        content,
        created_at: new Date().toISOString(),
        like_count: 0,
        i_liked: false,
      };

      // Optimistic update
      setPosts((prev) =>
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
        const comment: FeedComment = await res.json();
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  recent_comments: (p.recent_comments ?? []).map((c) =>
                    c.id === tempId
                      ? {
                          ...comment,
                          like_count: comment.like_count ?? 0,
                          i_liked: comment.i_liked ?? false,
                        }
                      : c
                  ),
                }
              : p
          )
        );
      } else if (isDemo || postId.startsWith("demo_") || !user) {
        // Keep comment in demo/guest mode
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  recent_comments: (p.recent_comments ?? []).map((c) =>
                    c.id === tempId ? { ...tempComment, id: `comment_${Date.now()}` } : c
                  ),
                }
              : p
          )
        );
      } else {
        // Revert on error
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  comment_count: Math.max(0, p.comment_count - 1),
                  recent_comments: (p.recent_comments ?? []).filter((c) => c.id !== tempId),
                }
              : p
          )
        );
      }
    });
  }

  function handlePostCreated(post: FeedPost) {
    setPosts((prev) => [post, ...prev]);
  }

  return (
    <div className="flex flex-col gap-4 pt-1 w-full">
      {/* Create Post Bar */}
      <LockedFeatureWrapper featureLabel="post in the community feed" showLockIcon={true}>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-3 p-4 rounded-2xl text-left transition-all hover:bg-surface-interactive group w-full cursor-pointer"
          style={{
            background: "var(--surface-raised)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <Avatar name={user?.name ?? "You"} size={44} avatarUrl={null} />
          <span className="text-[15px] font-medium text-ink-muted flex-1 px-2">
            What&apos;s on your mind?
          </span>
          <div className="flex items-center gap-2">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center transition-colors hover:bg-surface-interactive"
              style={{ background: "var(--accent-primary-muted)" }}
            >
              <ImageIcon className="w-5 h-5" style={{ color: "var(--accent-primary)" }} />
            </div>
          </div>
        </motion.button>
      </LockedFeatureWrapper>

      {/* Feed Filter Pill Switcher */}
      <div className="flex items-center gap-2 px-1">
        <button
          type="button"
          onClick={() => setFeedFilter("all")}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            feedFilter === "all"
              ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-sm"
              : "bg-surface-raised border border-border-subtle text-ink-muted hover:text-foreground"
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          All Activity
        </button>
        <button
          type="button"
          onClick={() => setFeedFilter("following")}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            feedFilter === "following"
              ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-sm"
              : "bg-surface-raised border border-border-subtle text-ink-muted hover:text-foreground"
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          Following
        </button>
      </div>

      {/* Cache Info Badge */}
      {cacheInfo && (
        <div className="flex items-center gap-2 text-xs mb-2">
          <div
            className={`w-2 h-2 rounded-full ${
              cacheInfo.source === 'heuristic'
                ? 'bg-emerald-500'
                : cacheInfo.source === 'api'
                ? 'bg-blue-500'
                : cacheInfo.source === 'fallback'
                ? 'bg-amber-500'
                : 'bg-gray-500'
            }`}
          />
          <span className="text-muted-foreground">
            {cacheInfo.source === 'heuristic' && '(Cached)'}
            {cacheInfo.source === 'api' && '(Live)'}
            {cacheInfo.source === 'fallback' && '(Fallback)'}
            {cacheInfo.source === 'demo' && '(Demo)'}
          </span>
          <span className="text-muted-foreground ml-2">
            · {new Date(cacheInfo.timestamp).toLocaleTimeString()}
          </span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-2xl animate-pulse"
              style={{ background: "var(--surface-raised)", height: 200 }}
            />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{
              background: "var(--surface-raised)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <MessageCircle className="w-7 h-7" style={{ color: "var(--ink-muted)" }} />
          </div>
          <p className="text-sm font-semibold text-foreground mb-1">
            {feedFilter === "following" ? "No posts from players you follow" : "Your feed is empty"}
          </p>
          <p className="text-xs max-w-xs" style={{ color: "var(--ink-muted)" }}>
            {feedFilter === "following"
              ? "Switch to All Activity or explore players in the Discover tab to build your network!"
              : "Share your latest match highlights or connect with players in Discover!"}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {posts.map((post, i) => (
            <div key={post.id} className="flex flex-col gap-4">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 8) * 0.04, duration: 0.35 }}
              >
                <FeedPostCard
                  post={post}
                  onLike={handleLike}
                  onDelete={handleDelete}
                  onComment={handleComment}
                  onLikeComment={handleLikeComment}
                  onReport={(postId, commentId) => setReportTarget({ postId, commentId })}
                  onOpenProfile={onOpenProfile}
                />
              </motion.div>
              {i === 1 && feedFilter === "all" && <FeedSuggestedPlayers onOpenProfile={onOpenProfile} />}
            </div>
          ))}

          {/* Infinite scroll sentinel */}
          {hasMore && (
            <div ref={observerRef} className="flex justify-center py-6">
              <div className="w-6 h-6 rounded-full border-2 border-accent-primary border-t-transparent animate-spin" />
            </div>
          )}
        </div>
      )}

      {/* Create Post Modal */}
      <CreatePostModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handlePostCreated}
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

export default FeedTab;
