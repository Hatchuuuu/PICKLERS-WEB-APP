import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Heart, MessageCircle, Send, Image as ImageIcon, X, MoreHorizontal,
  Trash2, MessageSquare, AlertTriangle
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { FeedPost, FeedComment, CommunityPlayer } from "@/types";
import { DEMO_FEED_POSTS } from "@/lib/demoData";
import { LockedFeatureWrapper } from "@/components/ui/LockedFeatureWrapper";
import { Avatar } from "@/components/ui/Avatar";
import { useActionLock } from "@/hooks/useActionLock";

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const d = new Date(dateStr).getTime();
  const diff = now - d;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE POST MODAL
// ─────────────────────────────────────────────────────────────────────────────

function CreatePostModal({ open, onClose, onCreated }: {
  open: boolean;
  onClose: () => void;
  onCreated: (post: FeedPost) => void;
}) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) { alert("Image must be under 15MB"); return; }

    // Simple client-side compression using Canvas
    const img = document.createElement("img");
    img.src = URL.createObjectURL(file);
    await new Promise((res) => (img.onload = res));
    
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    let width = img.width;
    let height = img.height;
    
    // Max 1080px width/height
    const maxDim = 1080;
    if (width > height && width > maxDim) {
      height *= maxDim / width;
      width = maxDim;
    } else if (height > maxDim) {
      width *= maxDim / height;
      height = maxDim;
    }
    
    canvas.width = width;
    canvas.height = height;
    ctx?.drawImage(img, 0, 0, width, height);
    
    canvas.toBlob((blob) => {
      if (!blob) return;
      const compressedFile = new File([blob], file.name, { type: "image/jpeg", lastModified: Date.now() });
      setImageFile(compressedFile);
      setImagePreview(URL.createObjectURL(compressedFile));
    }, "image/jpeg", 0.85);
  }

  function removeImage() {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handlePost() {
    if (!content.trim() && !imageFile) return;
    setPosting(true);

    let image_url: string | null = null;

    // Upload image first if present
    if (imageFile) {
      const formData = new FormData();
      formData.append("file", imageFile);
      const uploadRes = await fetch("/api/community/feed/upload", { method: "POST", body: formData });
      if (uploadRes.ok) {
        const { url } = await uploadRes.json();
        image_url = url;
      } else {
        setPosting(false);
        alert("Failed to upload image. Please try again.");
        return;
      }
    }

    // Create post
    const res = await fetch("/api/community/feed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: content.trim() || null, image_url }),
    });

    if (res.ok) {
      const post = await res.json();
      onCreated(post);
      setContent("");
      removeImage();
      onClose();
    }
    setPosting(false);
  }

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.95, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 32 }}
            className="relative w-full max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden"
            style={{ background: "var(--surface-base)", border: "1px solid var(--border-subtle)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
              <button onClick={onClose} className="text-ink-muted text-sm font-semibold">Cancel</button>
              <span className="text-sm font-bold text-foreground">Create Post</span>
              <button
                onClick={handlePost}
                disabled={(!content.trim() && !imageFile) || posting}
                className="text-sm font-bold px-4 py-1.5 rounded-full transition-all disabled:opacity-40"
                style={{ background: "var(--accent-primary)", color: "var(--surface-base)" }}
              >
                {posting ? "Posting..." : "Post"}
              </button>
            </div>

            {/* Body */}
            <div className="p-5">
              <div className="flex gap-3">
                <Avatar name={user?.name ?? "You"} size={40} avatarUrl={null} />
                <div className="flex-1">
                  <p className="text-sm font-bold text-foreground mb-2">{user?.name ?? "You"}</p>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value.slice(0, 500))}
                    placeholder="What's on your mind?"
                    className="w-full resize-none outline-none text-[15px] leading-relaxed bg-transparent text-foreground placeholder:text-ink-muted"
                    rows={4}
                    autoFocus
                  />
                  <p className="text-[11px] text-ink-muted text-right">{content.length}/500</p>
                </div>
              </div>

              {/* Image Preview */}
              {imagePreview && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="relative mt-3 rounded-2xl overflow-hidden"
                >
                  <img src={imagePreview} alt="Upload preview" className="w-full max-h-64 object-cover rounded-2xl" />
                  <button
                    onClick={removeImage}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 pb-5 flex items-center gap-3 border-t pt-3" style={{ borderColor: "var(--border-subtle)" }}>
              <button
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors"
                style={{ background: "var(--surface-raised)", color: "var(--accent-primary)" }}
              >
                <ImageIcon className="w-4 h-4" />
                Photo
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FEED POST CARD
// ─────────────────────────────────────────────────────────────────────────────

function FeedPostCard({ post, onLike, onDelete, onComment, onOpenProfile }: {
  post: FeedPost;
  onLike: (id: string) => void;
  onDelete: (id: string) => void;
  onComment: (postId: string, content: string) => void;
  onOpenProfile?: (id: string) => void;
}) {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [commentDraft, setCommentDraft] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [imageExpanded, setImageExpanded] = useState(false);
  const isMe = post.author_id === user?.id;

  return (
    <motion.div
      layout
      className="rounded-2xl overflow-hidden relative"
      style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}
    >
      {/* Delete Confirmation Overlay */}
      <AnimatePresence>
        {showConfirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 bg-background/90 backdrop-blur-md p-6 flex flex-col items-center justify-center text-center gap-3"
          >
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mb-1">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-foreground text-base">Delete this post?</h4>
            <p className="text-xs text-ink-muted max-w-xs">This action cannot be undone and will permanently remove your post.</p>
            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-surface-interactive text-foreground hover:bg-surface-hover transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowConfirmDelete(false);
                  onDelete(post.id);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-500 text-white hover:bg-red-600 transition-colors shadow-sm"
              >
                Delete Post
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Author Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <button onClick={() => onOpenProfile?.(post.author_id)} className="shrink-0 transition-transform hover:scale-105 active:scale-95">
          <Avatar name={post.author_name} size={40} avatarUrl={post.author_avatar_url} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <button onClick={() => onOpenProfile?.(post.author_id)} className="text-[14px] font-bold text-foreground truncate hover:underline text-left">
              {post.author_name}
            </button>
            {post.author_level && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                style={{ background: "var(--accent-primary-muted)", color: "var(--accent-primary)" }}>
                {post.author_level}
              </span>
            )}
          </div>
          <span className="text-[11px] text-ink-muted">{relativeTime(post.created_at)}</span>
        </div>
        {isMe && (
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-interactive transition-colors">
              <MoreHorizontal className="w-4 h-4 text-ink-muted" />
            </button>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute right-0 top-10 z-10 w-36 rounded-xl shadow-xl overflow-hidden"
                style={{ background: "var(--surface-base)", border: "1px solid var(--border-subtle)" }}>
                <button
                  onClick={() => { setShowConfirmDelete(true); setShowMenu(false); }}
                  className="flex items-center gap-2 w-full px-4 py-3 text-sm font-medium text-red-500 hover:bg-surface-interactive transition-colors">
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {post.content && (
        <p className="px-4 pb-3 text-[15px] leading-relaxed text-foreground whitespace-pre-wrap">{post.content}</p>
      )}

      {/* Image */}
      {post.image_url && (
        <>
          <button 
            onClick={() => setImageExpanded(true)} 
            className="w-full relative aspect-square sm:aspect-video bg-surface-interactive overflow-hidden"
          >
            <img
              src={post.image_url}
              alt="Post image"
              loading="lazy"
              className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
            />
          </button>
          {/* Full-screen image viewer */}
          <AnimatePresence>
            {imageExpanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
                onClick={() => setImageExpanded(false)}>
                <button className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <X className="w-5 h-5 text-white" />
                </button>
                <motion.img
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  src={post.image_url}
                  alt="Full image"
                  className="max-w-full max-h-[90vh] object-contain rounded-lg"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* Actions Bar */}
      <div className="flex items-center gap-1 px-3 py-2 mt-2">
        {/* Like */}
        <LockedFeatureWrapper showLockIcon={false}>
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={() => onLike(post.id)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-colors"
            style={{ background: post.i_liked ? "rgba(239,68,68,0.1)" : "transparent" }}
          >
            <Heart className="w-[18px] h-[18px] transition-all"
              style={{ color: post.i_liked ? "#f04848" : "var(--ink-muted)", fill: post.i_liked ? "#f04848" : "none" }} />
            <span className="text-[13px] font-semibold"
              style={{ color: post.i_liked ? "#f04848" : "var(--ink-muted)" }}>
              {post.like_count > 0 ? post.like_count : "Like"}
            </span>
          </motion.button>
        </LockedFeatureWrapper>

        {/* Comment */}
        <LockedFeatureWrapper showLockIcon={false}>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-colors hover:bg-surface-interactive"
          >
            <MessageSquare className="w-[18px] h-[18px] text-ink-muted" />
            <span className="text-[13px] font-semibold text-ink-muted">
              {post.comment_count > 0 ? post.comment_count : "Comment"}
            </span>
          </motion.button>
        </LockedFeatureWrapper>
      </div>

      {/* Comments Section */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            {/* Recent comments */}
            {(post.recent_comments ?? []).length > 0 && (
              <div className="px-4 pt-3 flex flex-col gap-3">
                {(post.recent_comments ?? []).map((c) => (
                  <div key={c.id} className="flex gap-2.5">
                    <Avatar name={c.author_name} size={28} avatarUrl={c.author_avatar_url} />
                    <div className="flex-1 min-w-0">
                      <div className="rounded-2xl px-3 py-2" style={{ background: "var(--surface-interactive)" }}>
                        <span className="text-[12px] font-bold text-foreground">{c.author_name}</span>
                        <p className="text-[13px] text-foreground leading-snug">{c.content}</p>
                      </div>
                      <span className="text-[10px] text-ink-muted ml-3">{relativeTime(c.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Comment input */}
            <div className="flex items-center gap-2 p-3">
              <Avatar name={user?.name ?? "You"} size={28} avatarUrl={null} />
              <input
                value={commentDraft}
                onChange={(e) => setCommentDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && commentDraft.trim()) {
                    onComment(post.id, commentDraft.trim());
                    setCommentDraft("");
                  }
                }}
                placeholder="Write a comment..."
                className="flex-1 px-3 py-2 rounded-full text-[13px] outline-none bg-surface-interactive border border-border-subtle text-foreground placeholder:text-ink-muted"
              />
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  if (commentDraft.trim()) {
                    onComment(post.id, commentDraft.trim());
                    setCommentDraft("");
                  }
                }}
                disabled={!commentDraft.trim()}
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all"
                style={{
                  background: commentDraft.trim() ? "var(--accent-primary)" : "var(--surface-interactive)",
                }}
              >
                <Send className="w-3.5 h-3.5"
                  style={{ color: commentDraft.trim() ? "var(--surface-base)" : "var(--ink-muted)" }} />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FEED SUGGESTED PLAYERS (INLINE WIDGET)
// ─────────────────────────────────────────────────────────────────────────────

function FeedSuggestedPlayers({ onOpenProfile }: { onOpenProfile?: (id: string) => void }) {
  const [players, setPlayers] = useState<CommunityPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await fetch(`/api/community/players?q=`);
      if (res.ok) {
        const allPlayers = await res.json();
        setPlayers(allPlayers.slice(0, 3)); // Only show top 3 recommendations
      }
      setLoading(false);
    })();
  }, []);

  async function toggleLike(p: CommunityPlayer) {
    setPlayers(prev => prev.map(pl =>
      pl.id === p.id ? { ...pl, i_liked: !pl.i_liked, like_count: pl.like_count + (pl.i_liked ? -1 : 1) } : pl
    ));
    const res = await fetch("/api/community/likes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ liked_id: p.id }),
    });
    if (!res.ok) {
      setPlayers(prev => prev.map(pl => pl.id === p.id ? { ...pl, i_liked: p.i_liked, like_count: p.like_count } : pl));
    }
  }

  if (loading || players.length === 0) return null;

  return (
    <div className="rounded-2xl p-5" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
      <h3 className="text-[13px] font-extrabold uppercase tracking-wider mb-4" style={{ color: "var(--ink-primary)" }}>
        People You May Know
      </h3>
      <div className="flex flex-col gap-4">
        {players.map(p => (
          <div key={p.id} className="flex items-center gap-3">
            <button onClick={() => onOpenProfile?.(p.id)} className="shrink-0 transition-transform hover:scale-105 active:scale-95 text-left">
              <Avatar name={p.name} size={42} avatarUrl={p.avatar_url} />
            </button>
            <div className="flex-1 min-w-0">
              <button onClick={() => onOpenProfile?.(p.id)} className="text-[14px] font-bold text-foreground leading-tight truncate hover:underline text-left block">
                {p.name}
              </button>
              <span className="text-[11px] text-ink-muted">Level {p.level}</span>
            </div>
            <motion.button whileTap={{ scale: 0.8 }} onClick={() => toggleLike(p)}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
              style={{ background: p.i_liked ? "rgba(239,68,68,0.12)" : "var(--surface-interactive)" }}>
              <Heart className="w-4 h-4" style={{ color: p.i_liked ? "#f04848" : "var(--ink-muted)", fill: p.i_liked ? "#f04848" : "none" }} />
            </motion.button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FEED TAB (Main Export)
// ─────────────────────────────────────────────────────────────────────────────

export default function FeedTab({ onOpenProfile }: { onOpenProfile?: (id: string) => void }) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const observerRef = useRef<HTMLDivElement>(null);

  const isDemo = user?.isDemo || user?.role === "demo";

  const fetchPosts = useCallback(async (currentCursor: string | null, append = false) => {
    const url = currentCursor ? `/api/community/feed?cursor=${encodeURIComponent(currentCursor)}` : `/api/community/feed`;
    try {
      const res = await fetch(url);
      if (res.ok) {
        const data: FeedPost[] = await res.json();
        let finalPosts = data;
        if (isDemo && !append) {
          const dbIds = new Set(data.map(p => p.id));
          finalPosts = [...DEMO_FEED_POSTS.filter((dp: FeedPost) => !dbIds.has(dp.id)), ...data];
        }
        if (data.length < 20) setHasMore(false);
        if (data.length > 0) setCursor(data[data.length - 1].created_at);
        setPosts(prev => append ? [...prev, ...finalPosts] : finalPosts);
      } else if (isDemo && !append) {
        setPosts(DEMO_FEED_POSTS);
      }
    } catch {
      if (isDemo && !append) {
        setPosts(DEMO_FEED_POSTS);
      }
    }
    setLoading(false);
  }, [isDemo]);

  useEffect(() => {
    fetchPosts(null);
  }, [fetchPosts]);

  // Infinite scroll
  useEffect(() => {
    if (!observerRef.current || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchPosts(cursor, true);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, cursor, fetchPosts]);

  const { runWithLock } = useActionLock();

  async function handleLike(postId: string) {
    runWithLock(async () => {
      // Optimistic update
      setPosts(prev => prev.map(p =>
        p.id === postId
          ? { ...p, i_liked: !p.i_liked, like_count: p.like_count + (p.i_liked ? -1 : 1) }
          : p
      ));
      const res = await fetch(`/api/community/feed/${postId}/like`, { method: "POST" });
      if (!res.ok) {
        // Rollback
        setPosts(prev => prev.map(p =>
          p.id === postId
            ? { ...p, i_liked: !p.i_liked, like_count: p.like_count + (p.i_liked ? -1 : 1) }
            : p
        ));
      }
    });
  }

  async function handleDelete(postId: string) {
    runWithLock(async () => {
      setPosts(prev => prev.filter(p => p.id !== postId));
      await fetch(`/api/community/feed/${postId}`, { method: "DELETE" });
    });
  }

  async function handleComment(postId: string, content: string) {
    runWithLock(async () => {
      const tempId = Math.random().toString();
      const tempComment: FeedComment = {
        id: tempId,
        post_id: postId,
        author_id: user?.id ?? "",
        author_name: user?.name ?? "You",
        author_avatar_url: null,
        content,
        created_at: new Date().toISOString()
      };
      
      // Optimistic update
      setPosts(prev => prev.map(p =>
        p.id === postId
          ? {
            ...p,
            comment_count: p.comment_count + 1,
            recent_comments: [...(p.recent_comments ?? []), tempComment].slice(-2),
          }
          : p
      ));

      const res = await fetch(`/api/community/feed/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      
      if (res.ok) {
        const comment: FeedComment = await res.json();
        // Replace temp with real
        setPosts(prev => prev.map(p =>
          p.id === postId
            ? {
              ...p,
              recent_comments: (p.recent_comments ?? []).map(c => c.id === tempId ? comment : c)
            }
            : p
        ));
      } else {
        // Revert if failed
        setPosts(prev => prev.map(p =>
          p.id === postId
            ? {
              ...p,
              comment_count: p.comment_count - 1,
              recent_comments: (p.recent_comments ?? []).filter(c => c.id !== tempId)
            }
            : p
        ));
      }
    });
  }

  function handlePostCreated(post: FeedPost) {
    setPosts(prev => [post, ...prev]);
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4 pt-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-2xl animate-pulse" style={{ background: "var(--surface-raised)", height: 200 }} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pt-1 max-w-2xl mx-auto w-full">
      {/* Create Post Bar */}
      <LockedFeatureWrapper featureLabel="post in the community feed" showLockIcon={true}>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-3 p-4 rounded-2xl text-left transition-all hover:bg-surface-interactive group w-full"
          style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}
        >
          <Avatar name={user?.name ?? "You"} size={44} avatarUrl={null} />
          <span className="text-[15px] font-medium text-ink-muted flex-1 px-2">What&apos;s on your mind?</span>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center transition-colors hover:bg-surface-interactive"
              style={{ background: "var(--accent-primary-muted)" }}>
              <ImageIcon className="w-5 h-5" style={{ color: "var(--accent-primary)" }} />
            </div>
          </div>
        </motion.button>
      </LockedFeatureWrapper>

      {/* Feed Posts */}
      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
            <MessageCircle className="w-7 h-7" style={{ color: "var(--ink-muted)" }} />
          </div>
          <p className="text-sm font-semibold text-foreground mb-1">Your feed is empty</p>
          <p className="text-xs" style={{ color: "var(--ink-muted)" }}>
            Follow players in the Community tab to see their posts here!
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {posts.map((post, i) => (
            <div key={post.id} className="flex flex-col gap-4">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 8) * 0.04, duration: 0.35 }}>
                <FeedPostCard
                  post={post}
                  onLike={handleLike}
                  onDelete={handleDelete}
                  onComment={handleComment}
                  onOpenProfile={onOpenProfile}
                />
              </motion.div>
              {i === 1 && <FeedSuggestedPlayers onOpenProfile={onOpenProfile} />}
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
    </div>
  );
}
