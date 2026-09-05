"use client";

import { useEffect, useState, useCallback } from "react";
import { ShieldAlert, AlertTriangle, RotateCcw, Flag, Trash2, Check, Shield, Loader2 } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface ModerationPost {
  id: string;
  content: string;
  image_url?: string;
  is_flagged?: boolean;
  is_removed?: boolean;
  created_at: string;
  author?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

export default function AdminModerationPage() {
  const { showToast } = useToast();
  const [posts, setPosts] = useState<ModerationPost[]>([]);
  const [flaggedCount, setFlaggedCount] = useState<number>(0);
  const [filter, setFilter] = useState<string>("all");
  const [page, setPage] = useState<number>(1);
  const [totalPosts, setTotalPosts] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const limit = 15;

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/moderation?filter=${filter}&page=${page}&limit=${limit}`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Failed to load moderation posts");
      }
      const json = await res.json();
      setPosts(json.data || []);
      setTotalPosts(json.total || 0);
      setFlaggedCount(json.flagged_count || 0);
    } catch (e: unknown) {
      console.error("Failed to load moderation posts:", e);
      setError(e instanceof Error ? e.message : "Failed to load community posts");
    } finally {
      setIsLoading(false);
    }
  }, [filter, page]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleModerationAction = async (id: string, action: "approve" | "flag" | "remove") => {
    setActiveActionId(id);
    try {
      const res = await fetch(`/api/admin/moderation/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (res.ok) {
        const actionLabels = {
          approve: "Post approved and restored to feed.",
          flag: "Post flagged for investigation.",
          remove: "Post removed from community feed.",
        };
        showToast(actionLabels[action], "success");
        fetchPosts();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || `Failed to ${action} post`, "error");
      }
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Moderation action failed", "error");
    } finally {
      setActiveActionId(null);
    }
  };

  const totalPages = Math.ceil(totalPosts / limit) || 1;

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight flex items-center gap-2.5">
            <ShieldAlert className="w-7 h-7 text-emerald-400" />
            <span>Community Feed Moderation</span>
          </h1>
          <p className="text-sm font-medium text-muted-foreground">
            Audit reported social feed posts, remove harmful content, and maintain community safety standards
          </p>
        </div>
      </div>

      {/* Flagged Count Alert Banner */}
      {flaggedCount > 0 && (
        <div className="flex items-center justify-between p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
            <span className="text-sm font-bold">
              {flaggedCount} post{flaggedCount === 1 ? "" : "s"} flagged for community violation review
            </span>
          </div>
          <button
            onClick={() => {
              setFilter("flagged");
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 transition-colors"
          >
            Review Flagged
          </button>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border bg-red-500/10 border-red-500/20 text-red-500 dark:text-red-400 backdrop-blur-2xl shadow-lg">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchPosts}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500/20 text-red-400 hover:bg-red-500/30"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Filter and Post List */}
      <div className="p-5 rounded-2xl border border-border bg-surface-base flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Feed Items Queue
            </span>
          </div>

          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Filter community feed posts by moderation status"
            className="px-3 py-1.5 rounded-xl text-xs font-bold border border-border bg-surface-raised text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">All Posts</option>
            <option value="flagged">Flagged Only</option>
            <option value="clean">Clean Only</option>
          </select>
        </div>

        <div className="flex flex-col gap-3">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="p-4 rounded-xl border border-border bg-surface-raised/30 animate-pulse flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3 w-full sm:w-2/3">
                    <div className="w-9 h-9 rounded-full bg-surface-raised shrink-0" />
                    <div className="flex flex-col gap-2 w-full">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-3.5 rounded bg-surface-raised" />
                        <div className="w-16 h-3 rounded bg-surface-raised/60" />
                      </div>
                      <div className="w-full h-3 rounded bg-surface-raised/70" />
                      <div className="w-4/5 h-3 rounded bg-surface-raised/50" />
                    </div>
                  </div>
                  <div className="flex gap-2 self-end sm:self-auto shrink-0">
                    <div className="w-16 h-7 rounded-xl bg-surface-raised" />
                    <div className="w-16 h-7 rounded-xl bg-surface-raised" />
                    <div className="w-16 h-7 rounded-xl bg-surface-raised" />
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground font-medium">
              No feed posts found matching current filter.
            </div>
          ) : (
            posts.map((p) => (
              <div
                key={p.id}
                className={cn(
                  "p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors",
                  p.is_flagged
                    ? "border-rose-500/30 bg-rose-500/5"
                    : p.is_removed
                    ? "border-border bg-surface-raised/20 opacity-60"
                    : "border-border bg-surface-raised/40"
                )}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-xs">
                    {p.author?.name?.[0] || "P"}
                  </div>
                  <div className="flex flex-col gap-1.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground truncate">{p.author?.name || "Player"}</span>
                      <span className="text-[10px] text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</span>
                      {p.is_flagged && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 border border-rose-500/20 text-rose-400">
                          FLAGGED
                        </span>
                      )}
                      {p.is_removed && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-raised border border-border text-muted-foreground">
                          REMOVED
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground break-words">{p.content}</p>
                    {p.image_url && (
                      <div className="mt-1">
                        <div className="w-32 h-24">
                          <Image
                            src={p.image_url}
                            alt="Post attachment"
                            width={4}
                            height={3}
                            layout="responsive"
                            className="object-cover rounded-lg border border-border"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <button
                    disabled={activeActionId === p.id}
                    onClick={() => handleModerationAction(p.id, "approve")}
                    className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 flex items-center gap-1 transition-colors disabled:opacity-50"
                    title="Approve post and clear flag"
                  >
                    {activeActionId === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>Approve</span>
                  </button>

                  <button
                    disabled={activeActionId === p.id}
                    onClick={() => handleModerationAction(p.id, "flag")}
                    className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 flex items-center gap-1 transition-colors disabled:opacity-50"
                    title="Flag post for review"
                  >
                    {activeActionId === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Flag className="w-3.5 h-3.5" />}
                    <span>Flag</span>
                  </button>

                  <button
                    disabled={activeActionId === p.id}
                    onClick={() => handleModerationAction(p.id, "remove")}
                    className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 flex items-center gap-1 transition-colors disabled:opacity-50"
                    title="Takedown post"
                  >
                    {activeActionId === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination Bar */}
        {totalPosts > limit && (
          <div className="flex items-center justify-between border-t border-border pt-3 px-1 text-xs">
            <span className="text-muted-foreground font-medium">
              Showing Page {page} of {totalPages} ({totalPosts} total items)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1 || isLoading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-xl border border-border bg-surface-raised text-foreground font-bold hover:bg-surface-interactive disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages || isLoading}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-xl border border-border bg-surface-raised text-foreground font-bold hover:bg-surface-interactive disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
