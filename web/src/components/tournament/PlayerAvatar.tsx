"use client";

import { User } from 'lucide-react';

interface PlayerAvatarProps {
  teamName?: string | null;
  teamType?: 'SINGLES' | 'DOUBLES';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  avatarUrl?: string | null;
}

export function PlayerAvatar({ teamName, teamType = 'DOUBLES', size = 'sm', avatarUrl }: PlayerAvatarProps) {
  const s = size === 'sm' ? 28 : size === 'md' ? 36 : size === 'lg' ? 64 : 112;
  const iconS = size === 'sm' ? 12 : size === 'md' ? 16 : size === 'lg' ? 28 : 48;
  const fontSize = size === 'sm' ? '10px' : size === 'md' ? '13px' : size === 'lg' ? '24px' : '42px';

  if (!teamName) {
    if (teamType === 'DOUBLES') {
      return (
        <div className="flex items-center shrink-0" style={{ marginRight: 4 }}>
          <div
            className="rounded-full border border-border/50 bg-surface-base flex items-center justify-center relative z-[1] shadow-md"
            style={{ width: s, height: s }}
          >
            <User style={{ width: iconS, height: iconS }} className="text-slate-400" />
          </div>
          <div
            className="rounded-full border border-border/50 bg-surface-base flex items-center justify-center relative z-0 shadow-md"
            style={{ width: s, height: s, marginLeft: -(s * 0.35) }}
          >
            <User style={{ width: iconS, height: iconS }} className="text-slate-400" />
          </div>
        </div>
      );
    }
    return (
      <div
        className="rounded-full border border-border/50 bg-surface-base flex items-center justify-center shrink-0"
        style={{ width: s, height: s }}
      >
        <User style={{ width: iconS, height: iconS }} className="text-slate-600" />
      </div>
    );
  }

  // Deterministic color generation based on teamName
  const hash = teamName.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
  const hue = Math.abs(hash) % 360;
  const color = `hsl(${hue}, 80%, 55%)`;

  const words = teamName.split(' ').filter(Boolean);
  const p1Initial = words[0]?.charAt(0).toUpperCase() || '?';
  const p2Initial = words[1] 
    ? words[1].charAt(0).toUpperCase() 
    : (words[0]?.length > 1 ? words[0].charAt(1).toUpperCase() : '?');

  if (teamType === 'DOUBLES') {
    return (
      <div className="flex items-center shrink-0" style={{ marginRight: 4 }}>
        <div
          className="rounded-full flex items-center justify-center relative z-[1] border-[1.5px] border-white/20 shadow-md"
          style={{ width: s, height: s, background: `linear-gradient(135deg, ${color}, ${color}88)` }}
        >
          <span className="font-bold text-white drop-shadow-md" style={{ fontSize }}>{p1Initial}</span>
        </div>
        <div
          className="rounded-full flex items-center justify-center relative z-0 border-[1.5px] border-white/20 shadow-md"
          style={{ width: s, height: s, marginLeft: -(s * 0.35), background: `linear-gradient(135deg, ${color}CC, ${color}66)` }}
        >
          <span className="font-bold text-white drop-shadow-md" style={{ fontSize }}>{p2Initial}</span>
        </div>
      </div>
    );
  }

  if (avatarUrl) {
    return (
      <img src={avatarUrl} alt={teamName} className="rounded-full object-cover shrink-0 shadow-[0_0_8px_rgba(0,0,0,0.3)]" style={{ width: s, height: s }} />
    );
  }

  return (
    <div
      className="rounded-full flex items-center justify-center shrink-0 shadow-[0_0_8px_rgba(0,0,0,0.3)]"
      style={{ width: s, height: s, background: `linear-gradient(135deg, ${color}, ${color}88)` }}
    >
      <span className="font-bold text-white" style={{ fontSize }}>{p1Initial}</span>
    </div>
  );
}
