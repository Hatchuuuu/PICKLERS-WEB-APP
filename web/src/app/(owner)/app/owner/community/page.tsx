"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { FeedTab } from "@/components/community/FeedTab";
import PlayerProfileSheet from "@/components/community/PlayerProfileSheet";
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
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold bg-emerald-500 hover:bg-emerald-600 text-white transition-all shadow-sm"
          >
            <span>Share Update</span>
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
        onOpenChat={(player) => {
          setProfileId(null);
          if (player?.id) {
            router.push(`/app/owner/messages?recipient=${player.id}`);
          }
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
          className="fixed inset-0 z-[600] flex items-end sm:items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px] dark:bg-black/50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.95, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 32 }}
            className="relative w-full max-w-lg rounded-3xl overflow-hidden bg-surface-overlay dark:bg-[#13223F] border border-border dark:border-white/12 shadow-[0_25px_60px_rgba(0,0,0,0.5)] z-[610]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-interactive/30">
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xs font-semibold cursor-pointer">Cancel</button>
              <span className="text-sm font-bold text-foreground">Share Update</span>
              <button
                onClick={handlePost}
                disabled={(!content.trim() && !imageFile) || posting}
                className="text-xs font-bold px-4 py-1.5 rounded-full transition-all disabled:opacity-40 bg-emerald-500 hover:bg-emerald-400 text-white shadow-md cursor-pointer"
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
                    className="w-full resize-none outline-none text-sm leading-relaxed bg-transparent text-foreground placeholder:text-muted-foreground"
                    rows={4}
                    autoFocus
                  />
                  <p className="text-[11px] text-muted-foreground text-right">{content.length}/500</p>
                </div>
              </div>

              {/* Image Preview */}
              {imagePreview && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="relative mt-3 rounded-2xl overflow-hidden border border-border"
                >
                  <img src={imagePreview} alt="Upload preview" className="w-full max-h-64 object-cover rounded-2xl" />
                  <button
                    onClick={removeImage}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white cursor-pointer transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 pb-5 flex items-center gap-3 border-t border-border pt-3 bg-surface-interactive/20">
              <button
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-surface-interactive hover:bg-surface-interactive/80 text-foreground transition-colors cursor-pointer border border-border"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                Add Photo
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