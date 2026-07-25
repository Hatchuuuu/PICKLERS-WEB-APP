"use client";

import { motion } from "motion/react";

export interface AvatarProps {
  name: string;
  size?: number;
  online?: boolean;
  avatarUrl?: string | null;
  className?: string;
  animateOnline?: boolean;
}

const AVATAR_COLORS = [
  "from-emerald-500 to-teal-600",
  "from-blue-500 to-indigo-600",
  "from-violet-500 to-purple-600",
  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-600",
];

export function Avatar({
  name,
  size = 40,
  online,
  avatarUrl,
  className = "",
  animateOnline = false,
}: AvatarProps) {
  const color = AVATAR_COLORS[(name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];
  const badgeSize = Math.max(8, Math.round(size * 0.28));

  return (
    <div
      className={`relative shrink-0 rounded-full select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <div
        className={`w-full h-full rounded-full bg-gradient-to-br ${color} flex items-center justify-center font-bold text-white overflow-hidden shadow-sm`}
        style={{ fontSize: size * 0.38 }}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name || "User Avatar"}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          name?.[0]?.toUpperCase() || "P"
        )}
      </div>
      {online && (
        animateOnline ? (
          <motion.span
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute bottom-0 right-0 rounded-full border-2 border-background bg-emerald-400"
            style={{ width: badgeSize, height: badgeSize }}
          />
        ) : (
          <span
            className="absolute bottom-0 right-0 rounded-full border-2 border-background bg-emerald-400"
            style={{ width: badgeSize, height: badgeSize }}
          />
        )
      )}
    </div>
  );
}
