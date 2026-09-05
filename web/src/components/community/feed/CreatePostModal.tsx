"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Image as ImageIcon, X, Trophy, Swords, Sparkles, FileText } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { FeedPost } from "@/types";
import { Avatar } from "@/components/ui/Avatar";

export function CreatePostModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (post: FeedPost) => void;
}) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState<"text" | "match_result" | "challenge" | "highlight">("text");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      alert("Image must be under 15MB");
      return;
    }

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

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const compressedFile = new File([blob], file.name, {
          type: "image/jpeg",
          lastModified: Date.now(),
        });
        setImageFile(compressedFile);
        setImagePreview(URL.createObjectURL(compressedFile));
      },
      "image/jpeg",
      0.85
    );
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
      const uploadRes = await fetch("/api/community/feed/upload", {
        method: "POST",
        body: formData,
      });
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
      body: JSON.stringify({
        content: content.trim() || null,
        image_url,
        post_type: postType,
      }),
    });

    if (res.ok) {
      const post = await res.json();
      onCreated(post);
      setContent("");
      removeImage();
      setPostType("text");
      onClose();
    }
    setPosting(false);
  }

  if (!open) return null;

  const POST_TYPES: {
    id: "text" | "match_result" | "challenge" | "highlight";
    label: string;
    icon: any;
    placeholder: string;
  }[] = [
    { id: "text", label: "General", icon: FileText, placeholder: "What's on your mind?" },
    { id: "match_result", label: "Match Score", icon: Trophy, placeholder: "Share your latest match score and who you played with!" },
    { id: "challenge", label: "Open Challenge", icon: Swords, placeholder: "Looking for an opponent or partner? Post date, court, and rating." },
    { id: "highlight", label: "Highlight", icon: Sparkles, placeholder: "Share a great rally, tip, or memorable court moment!" },
  ];

  const currentTypeConfig = POST_TYPES.find(p => p.id === postType) || POST_TYPES[0];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[600] flex items-end sm:items-center justify-center p-0 sm:p-4"
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
            initial={{ scale: 0.95, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 32 }}
            className="relative w-full max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden bg-surface-overlay dark:bg-[#13223F] border border-border dark:border-white/12 shadow-[0_25px_60px_rgba(0,0,0,0.5)] z-[610]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-interactive/30">
              <button
                onClick={onClose}
                className="text-muted-foreground text-sm font-semibold hover:text-foreground transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <span className="text-sm font-bold text-foreground">Create Post</span>
              <button
                onClick={handlePost}
                disabled={(!content.trim() && !imageFile) || posting}
                className="text-xs sm:text-sm font-bold px-4 py-1.5 rounded-full transition-all disabled:opacity-40 cursor-pointer bg-emerald-500 hover:bg-emerald-400 text-white shadow-sm"
              >
                {posting ? "Posting..." : "Post"}
              </button>
            </div>

            {/* Post Type Selector */}
            <div className="px-5 pt-3 flex gap-2 overflow-x-auto no-scrollbar">
              {POST_TYPES.map((t) => {
                const Icon = t.icon;
                const active = postType === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setPostType(t.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      active
                        ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 dark:text-emerald-400 shadow-sm"
                        : "bg-surface-interactive border border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* Body */}
            <div className="p-5">
              <div className="flex gap-3">
                <Avatar name={user?.name ?? "You"} size={40} avatarUrl={null} />
                <div className="flex-1">
                  <p className="text-sm font-bold text-foreground mb-2">
                    {user?.name ?? "You"}
                  </p>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value.slice(0, 500))}
                    placeholder={currentTypeConfig.placeholder}
                    className="w-full resize-none outline-none text-[15px] leading-relaxed bg-transparent text-foreground placeholder:text-muted-foreground"
                    rows={4}
                    autoFocus
                  />
                  <p className="text-[11px] text-muted-foreground text-right">
                    {content.length}/500
                  </p>
                </div>
              </div>

              {/* Image Preview */}
              {imagePreview && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="relative mt-3 rounded-2xl overflow-hidden"
                >
                  <img
                    src={imagePreview}
                    alt="Upload preview"
                    loading="lazy"
                    className="w-full max-h-64 object-cover rounded-2xl"
                  />
                  <button
                    onClick={removeImage}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors cursor-pointer"
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
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors bg-surface-interactive hover:bg-surface-interactive/80 text-emerald-500 dark:text-emerald-400 border border-border cursor-pointer"
              >
                <ImageIcon className="w-4 h-4" />
                Photo
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
export default CreatePostModal;
