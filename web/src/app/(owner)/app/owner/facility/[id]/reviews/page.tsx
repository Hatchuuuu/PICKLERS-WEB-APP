"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Trash2, RefreshCw, List, Star, ArrowLeft, AlertTriangle } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { useParams, useRouter } from "next/navigation";

export default function FacilityReviewsPage() {
  const { id } = useParams<{ id: string }>();
  const facilityId = Number(id);
  const router = useRouter();
  const { showToast } = useToast();

  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchReviews();
  }, [facilityId]);

  async function fetchReviews() {
    setLoading(true);
    try {
      const res = await fetch(`/api/facilities/${facilityId}/reviews`);
      if (!res.ok) throw new Error("Failed to fetch reviews");
      const data = await res.json();
      setReviews(data);
    } catch (err) {
      console.error(err);
      showToast("Could not load reviews", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(reviewId: string) {
    setDeleteId(reviewId);
    setDeleting(true);
    try {
      const res = await fetch(`/api/facilities/${facilityId}/reviews?id=${reviewId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete review");
      // Remove from local state
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      showToast("Review deleted", "success");
    } catch (err) {
      console.error(err);
      showToast("Could not delete review", "error");
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="h-8 w-8 rounded-full animate-pulse mb-4" style={{ background: "var(--surface-raised)" }} />
        <p className="text-sm text-muted-foreground">Loading reviews...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Facility Reviews</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              // Navigate to facility detail? For now just go back
              router.push(`/app/owner/facility/${facilityId}`);
            }}
            className="px-3 py-1 rounded-xl text-sm font-medium transition-colors hover:bg-surface-hover"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Facility
          </button>
          <button
            onClick={fetchReviews}
            disabled={loading}
            className="px-3 py-1 rounded-xl text-sm font-medium transition-colors hover:bg-surface-hover disabled:opacity-50"
          >
            <RefreshCw className="w-4 h-4 mr-1" /> Refresh
          </button>
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-12">
          <List className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium text-foreground">No reviews yet</p>
          <p className="text-sm text-muted-foreground">
            Encourage players to leave feedback after their games.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-6 p-4 bg-surface-raised rounded-xl border border-border">
            <div className="flex items-center space-x-4">
              <Star className="w-6 h-6 text-amber-400" />
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Average Rating:
                  <span className="ml-2 font-bold text-amber-500">
                    {(
                      reviews.reduce((sum, r) => sum + r.rating, 0) /
                      reviews.length
                    ).toFixed(1)}
                  </span>
                  <span className="text-xs text-muted-foreground ml-1">
                    ({reviews.length} reviews)
                  </span>
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Based on {reviews.length} player review{
                    reviews.length !== 1 ? "s" : ""
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {reviews.map((review) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: parseInt(review.id) * 0.02 }}
                className="p-4 bg-surface-base border border-border rounded-xl flex items-start gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= review.rating
                                ? "text-amber-400"
                                : "text-muted-foreground/50"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-medium text-muted-foreground ml-2">
                        {review.rating} / 5
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(review.created_at)}
                    </div>
                  </div>
                  <p className="text-[14px] leading-relaxed text-foreground">
                    {review.review_text || "No comment provided"}
                  </p>
                  {review.user_name && (
                    <p className="text-xs text-muted-foreground mt-1">
                      — {review.user_name}
                    </p>
                  )}
                </div>
                <div className="flex-shrink-0">
                  {!deleting || deleteId !== review.id ? (
                    <button
                      onClick={() => handleDelete(review.id)}
                      className="p-1 rounded-full hover:bg-red-500/10 transition-colors text-red-500"
                      aria-label="Delete review"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      className="p-1 rounded-full bg-red-500/20 text-red-500"
                      aria-label="Deleting..."
                    >
                      <AlertTriangle className="w-4 h-4 animate-pulse" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}