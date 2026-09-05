"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Heart,
  MoreHorizontal,
  Trash2,
  MessageSquare,
  AlertTriangle,
  Reply,
  Send,
  X,
  Flag,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { FeedPost } from "@/types";
import { LockedFeatureWrapper } from "@/components/ui/LockedFeatureWrapper";
import { Avatar } from "@/components/ui/Avatar";
import { formatSkillLevel, cn } from "@/lib/utils";
import Image from "next/image";

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
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function FeedPostCard({
  post,
  onLike,
  onDelete,
  onComment,
  onLikeComment,
  onReport,
  onOpenProfile,
}: {
  post: FeedPost;
  onLike: (id: string) => void;
  onDelete: (id: string) => void;
  onComment: (postId: string, content: string) => void;
  onLikeComment?: (postId: string, commentId: string) => void;
  onReport?: (postId: string, commentId?: string) => void;
  onOpenProfile?: (id: string) => void;
}) {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);
  const [commentDraft, setCommentDraft] = useState("");
  const [replyingTo, setReplyingTo] = useState<{
    authorName: string;
    commentId: string;
  } | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [imageExpanded, setImageExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMe = post.author_id === user?.id;

  return (
    <motion.div
      layout
      className="rounded-2xl overflow-hidden relative"
      style={{
        background: "var(--surface-raised)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      {/* Delete Confirmation Overlay */}
      <AnimatePresence>
        {showConfirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[30] bg-background/90 backdrop-blur-md p-6 flex flex-col items-center justify-center text-center gap-3"
          >
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mb-1">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-foreground text-base">Delete this post?</h4>
            <p className="text-xs text-ink-muted max-w-xs">
              This action cannot be undone and will permanently remove your post.
            </p>
            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-surface-interactive text-foreground hover:bg-surface-hover transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowConfirmDelete(false);
                  onDelete(post.id);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-500 text-white hover:bg-red-600 transition-colors shadow-sm cursor-pointer"
              >
                Delete Post
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Author Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <button
          onClick={() => onOpenProfile?.(post.author_id)}
          className="shrink-0 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
        >
          <Avatar
            name={post.author_name}
            size={40}
            avatarUrl={post.author_avatar_url}
          />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenProfile?.(post.author_id)}
              className="text-[14px] font-extrabold text-foreground truncate hover:underline text-left cursor-pointer"
              style={{
                fontFamily:
                  "var(--font-outfit), var(--font-montserrat), sans-serif",
              }}
            >
              {post.author_name}
            </button>
            {post.author_level && (
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                style={{
                  background: "var(--accent-primary-muted)",
                  color: "var(--accent-primary)",
                }}
              >
                {formatSkillLevel(post.author_level)}
              </span>
            )}
            {post.post_type === "match_result" && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400">
                Match Result
              </span>
            )}
            {post.post_type === "challenge" && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                Open Challenge
              </span>
            )}
            {post.post_type === "highlight" && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                Highlight
              </span>
            )}
          </div>
          <span className="text-[11px] text-ink-muted">
            {relativeTime(post.created_at)}
          </span>
        </div>

        {/* Options Menu (Delete for author, Report for others) */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-interactive transition-colors cursor-pointer"
            aria-label="Post options"
          >
            <MoreHorizontal className="w-4 h-4 text-ink-muted" />
          </button>
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute right-0 top-10 z-10 w-36 rounded-xl shadow-xl overflow-hidden"
              style={{
                background: "var(--surface-base)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              {isMe ? (
                <button
                  onClick={() => {
                    setShowConfirmDelete(true);
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-2 w-full px-4 py-3 text-sm font-medium text-red-500 hover:bg-surface-interactive transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              ) : (
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onReport?.(post.id);
                  }}
                  className="flex items-center gap-2 w-full px-4 py-3 text-sm font-medium text-ink-secondary hover:text-red-400 hover:bg-surface-interactive transition-colors cursor-pointer"
                >
                  <Flag className="w-4 h-4" /> Report
                </button>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Content */}
      {post.content && (
        <p className="px-4 pb-3 text-[15px] leading-relaxed text-foreground whitespace-pre-wrap">
          {post.content}
        </p>
      )}

      {/* Image */}
      {post.image_url && (
        <>
          <button
            onClick={() => setImageExpanded(true)}
            className="w-full relative aspect-square sm:aspect-video bg-surface-interactive overflow-hidden cursor-pointer"
          >
            <Image
              src={post.image_url}
              alt="Post media"
              layout="fill"
              className="object-cover hover:opacity-95 transition-opacity"
            />
          </button>
          {/* Full-screen image viewer */}
          <AnimatePresence>
            {imageExpanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[600] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
                onClick={() => setImageExpanded(false)}
              >
                <button
                  className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white cursor-pointer"
                  aria-label="Close image viewer"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
                <motion.img
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  src={post.image_url}
                  alt="Full image"
                  loading="lazy"
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
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-colors cursor-pointer"
            style={{
              background: post.i_liked
                ? "rgba(239,68,68,0.1)"
                : "transparent",
            }}
          >
            <Heart
              className="w-[18px] h-[18px] transition-all"
              style={{
                color: post.i_liked ? "#f04848" : "var(--ink-muted)",
                fill: post.i_liked ? "#f04848" : "none",
              }}
            />
            <span
              className="text-[13px] font-semibold"
              style={{
                color: post.i_liked ? "#f04848" : "var(--ink-muted)",
              }}
            >
              {post.like_count > 0 ? post.like_count : "Like"}
            </span>
          </motion.button>
        </LockedFeatureWrapper>

        {/* Comment */}
        <LockedFeatureWrapper showLockIcon={false}>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-colors hover:bg-surface-interactive cursor-pointer"
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
            className="overflow-hidden border-t border-border/40 dark:border-white/[0.08]"
          >
            {/* Comments List */}
            {(() => {
              const commentsList = post.recent_comments ?? [];
              const hasMoreComments = commentsList.length > 2;
              const visibleComments = showAllComments
                ? commentsList
                : commentsList.slice(-2);

              return (
                <>
                  {commentsList.length > 0 && (
                    <div className="px-4 pt-3.5 flex flex-col gap-3">
                      {hasMoreComments && !showAllComments && (
                        <button
                          type="button"
                          onClick={() => setShowAllComments(true)}
                          className="text-[12px] font-extrabold text-emerald-400 hover:underline text-left self-start mb-0.5 cursor-pointer"
                          style={{
                            fontFamily:
                              "var(--font-outfit), var(--font-montserrat), sans-serif",
                          }}
                        >
                          View all {commentsList.length} comments
                        </button>
                      )}

                      {visibleComments.map((c) => (
                        <div key={c.id} className="flex gap-2.5 items-start group">
                          <button
                            onClick={() => onOpenProfile?.(c.author_id)}
                            className="shrink-0 mt-0.5 transition-transform hover:scale-105 cursor-pointer"
                          >
                            <Avatar
                              name={c.author_name}
                              size={32}
                              avatarUrl={c.author_avatar_url}
                            />
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="rounded-2xl px-3.5 py-2.5 bg-surface-interactive/80 dark:bg-white/[0.04] border border-border-subtle dark:border-white/10 shadow-sm">
                              <button
                                onClick={() => onOpenProfile?.(c.author_id)}
                                className="text-[12.5px] font-extrabold text-foreground hover:underline text-left block cursor-pointer"
                                style={{
                                  fontFamily:
                                    "var(--font-outfit), var(--font-montserrat), sans-serif",
                                }}
                              >
                                {c.author_name}
                              </button>
                              <p className="text-[13.5px] text-foreground leading-relaxed mt-0.5 whitespace-pre-wrap">
                                {c.content}
                              </p>
                            </div>

                            {/* Comment Actions Row */}
                            <div className="flex items-center gap-3 mt-1 ml-2 text-[11px] font-medium text-ink-muted">
                              <span className="text-[10px] text-ink-muted">
                                {relativeTime(c.created_at)}
                              </span>
                              <button
                                type="button"
                                onClick={() => onLikeComment?.(post.id, c.id)}
                                className={cn(
                                  "flex items-center gap-1.5 font-bold transition-all hover:text-red-500 active:scale-90 cursor-pointer",
                                  c.i_liked ? "text-red-500" : "text-ink-muted"
                                )}
                              >
                                <Heart
                                  className={cn(
                                    "w-3.5 h-3.5 transition-transform",
                                    c.i_liked
                                      ? "fill-red-500 text-red-500 scale-110"
                                      : "text-ink-muted"
                                  )}
                                />
                                <span>
                                  {c.like_count && c.like_count > 0
                                    ? c.like_count
                                    : "Like"}
                                </span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setReplyingTo({
                                    authorName: c.author_name,
                                    commentId: c.id,
                                  });
                                  setCommentDraft(`@${c.author_name} `);
                                  inputRef.current?.focus();
                                }}
                                className="flex items-center gap-1 font-bold text-ink-muted hover:text-emerald-400 transition-colors active:scale-90 cursor-pointer"
                              >
                                <Reply className="w-3.5 h-3.5" />
                                <span>Reply</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}

            {/* Replying Banner */}
            {replyingTo && (
              <div className="mx-3.5 mt-2.5 flex items-center justify-between px-3 py-1.5 text-xs bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 font-medium">
                <span className="flex items-center gap-1.5 truncate">
                  <Reply className="w-3.5 h-3.5" />
                  Replying to <strong className="font-extrabold">{replyingTo.authorName}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setReplyingTo(null);
                    if (commentDraft.startsWith(`@${replyingTo.authorName} `)) {
                      setCommentDraft("");
                    }
                  }}
                  className="text-emerald-400 hover:text-emerald-300 ml-2 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Comment input */}
            <div className="flex items-center gap-2 p-3.5">
              <Avatar name={user?.name ?? "You"} size={32} avatarUrl={null} />
              <input
                ref={inputRef}
                value={commentDraft}
                onChange={(e) => setCommentDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && commentDraft.trim()) {
                    onComment(post.id, commentDraft.trim());
                    setCommentDraft("");
                    setReplyingTo(null);
                    setShowAllComments(true);
                  }
                }}
                placeholder={
                  replyingTo
                    ? `Reply to @${replyingTo.authorName}...`
                    : "Write a comment..."
                }
                className="flex-1 px-4 py-2.5 rounded-full text-xs sm:text-sm outline-none bg-surface-interactive/80 dark:bg-white/[0.05] border border-border-subtle dark:border-white/10 text-foreground placeholder:text-ink-muted focus:border-emerald-500/50 transition-all shadow-inner"
              />
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  if (commentDraft.trim()) {
                    onComment(post.id, commentDraft.trim());
                    setCommentDraft("");
                    setReplyingTo(null);
                    setShowAllComments(true);
                  }
                }}
                disabled={!commentDraft.trim()}
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all shadow-md",
                  commentDraft.trim()
                    ? "bg-emerald-500 hover:bg-emerald-400 text-white shadow-md cursor-pointer"
                    : "bg-surface-interactive text-muted-foreground cursor-not-allowed opacity-50"
                )}
              >
                <Send className="w-4 h-4 stroke-[2.5]" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
export default FeedPostCard;
