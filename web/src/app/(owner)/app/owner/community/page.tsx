"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { FeedTab } from "@/components/community/FeedTab";
import type { FeedPost } from "@/types";

export default function OwnerCommunityPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [activeTab] = useState<"feed" | "messages" | "community">("feed");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);

  useEffect(() => {
    // Sync URL with tab state
    const currentTab = searchParams.get("tab");
    if (activeTab !== currentTab) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", String(activeTab));
      router.replace(`${pathname}?${params.toString()}`);
    }
  }, [activeTab, searchParams, pathname, router]);

  // Future: Implement owner-specific tabs like "My Facility Posts", "Following", etc.
  // For now, we reuse the existing FeedTab but could customize it later

  return (
    <div className="flex flex-col gap-4 pt-1 w-full">
      {/* Owner Community Header */}
      <div className="flex items-center justify-between px-4 pt-2 pb-1">
        <h1 className="text-[22px] font-bold text-foreground">Community Feed</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-all hover:bg-surface-interactive"
          >
            <p className="w-4 h-4" style={{ background: "var(--accent-primary)" }} />
            Share Update
          </button>
        </div>
      </div>

      {/* Feed Content */}
      <div className="flex-1 min-h-0 w-full overflow-hidden">
        <FeedTab
          onOpenProfile={(id) => setProfileId(id)}
        />
      </div>

      {/* Profile Sheet (reuse from community) */}
      <PlayerProfileSheet
        playerId={profileId}
        onClose={() => setProfileId(null)}
        onOpenChat={(_p) => {
          setProfileId(null);
          // TODO: Implement open chat functionality
        }}
      />

      {/* Create Post Modal */}
      <CreatePostModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={(_post) => {
          // Newly created post handled
        }}
      />
    </div>
  );
}

// Import the PlayerProfileSheet from the community components
function PlayerProfileSheet({
  playerId,
  onClose,
  onOpenChat,
}: {
  playerId: string | null;
  onClose: () => void;
  onOpenChat: (p: any) => void;
}) {
  // Simple placeholder - in a real implementation, this would be imported from the community components
  if (!playerId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pb-4">
      <div className="relative w-full max-w-md">
        {/* This would normally import the actual PlayerProfileSheet component */}
        <div className="bg-surface-raised rounded-t-3xl shadow-2xl border border-subtle">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Player Profile</h3>
              <button onClick={onClose} className="text-ink-muted hover:text-foreground">
                ✕
              </button>
            </div>
            <p className="text-sm text-ink-muted">Profile placeholder - would show player details</p>
            <button
              onClick={() => {
                // Mock player data
                onOpenChat({
                  id: playerId,
                  name: "Player Name",
                  online: true,
                  avatar_url: null
                });
              }}
              className="w-full mt-4 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{ background: "var(--accent-primary)", color: "var(--surface-base)" }}
            >
              Start Chat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Reuse the CreatePostModal from the community feed tab
function CreatePostModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (post: FeedPost) => void;
}) {
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
              <span className="text-sm font-bold text-foreground">Share Update</span>
              <button
                onClick={handlePost}
                disabled={(!content.trim() && !imageFile) || posting}
                className="text-sm font-bold px-4 py-1.5 rounded-full transition-all disabled:opacity-40"
                style={{ background: "var(--accent-primary)", color: "var(--surface-base)" }}
              >
                {posting ? "Sharing..." : "Share"}
              </button>
            </div>

            {/* Body */}
            <div className="p-5">
              <div className="flex gap-3">
                <Avatar name="You" size={40} avatarUrl={null} />
                <div className="flex-1">
                  <p className="text-sm font-bold text-foreground mb-2">You</p>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value.slice(0, 500))}
                    placeholder="What's happening at your facility?"
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
                <p className="w-4 h-4" style={{ background: "var(--accent-primary)" }} />
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

// Simple Avatar component (reusable)
function Avatar({ name, size, avatarUrl }: { name: string; size: number; avatarUrl?: string | null }) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <div className={`flex-shrink-0 h-${size} w-${size}`}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          className="h-full w-full rounded-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-full bg-accent-primary/20 text-accent-primary font-bold text-xs">
          {getInitials(name)}
        </div>
      )}
    </div>
  );
}