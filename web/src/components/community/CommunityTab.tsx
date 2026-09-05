import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "motion/react";
import { Search, Heart, Shield, MessageCircle, CheckCircle2, Medal, X, Clock } from "lucide-react";
import type { CommunityPlayer, Club } from "@/types";
import { LockedFeatureWrapper } from "@/components/ui/LockedFeatureWrapper";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { useActionLock } from "@/hooks/useActionLock";
import { ClubDetailModal } from "./ClubDetailModal";

function LevelBadge({ level }: { level: string }) {
  return (
    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
      style={{ background: "var(--accent-primary-muted)", color: "var(--accent-primary)" }}>
      {level}
    </span>
  );
}

export default function CommunityTab({
  onOpenChat,
  onOpenProfile
}: {
  onOpenChat: (p: { id: string; name: string; online: boolean; avatar_url?: string | null }) => void;
  onOpenProfile?: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Data
  const [players, setPlayers] = useState<CommunityPlayer[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);

  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchData = useCallback(async (q: string) => {
    setLoading(true);
    const [pRes, cRes] = await Promise.all([
      fetch(`/api/community/players?q=${encodeURIComponent(q)}`),
      fetch(`/api/community/clubs`)
    ]);

    if (pRes.ok) {
      const raw = await pRes.json();
      setPlayers(Array.isArray(raw) ? raw : raw?.data || []);
    }
    if (cRes.ok) {
      const rawClubs = await cRes.json();
      const allClubs: Club[] = Array.isArray(rawClubs) ? rawClubs : rawClubs?.data || [];
      setClubs(q.trim() ? allClubs.filter(c => c.name.toLowerCase().includes(q.toLowerCase())) : allClubs);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData("");
  }, [fetchData]);

  function handleSearch(v: string) {
    setSearch(v);
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => fetchData(v), 300);
  }

  const { runWithLock } = useActionLock();

  // --- Actions ---

  async function toggleLike(p: CommunityPlayer) {
    runWithLock(async () => {
      // Optimistic
      const newFollow = !(p.i_follow ?? p.i_liked);
      const currentFollowers = p.follower_count ?? p.like_count ?? 0;
      const newCount = Math.max(0, currentFollowers + (newFollow ? 1 : -1));

      setPlayers(prev => prev.map(pl =>
        pl.id === p.id ? { 
          ...pl, 
          i_follow: newFollow, 
          i_liked: newFollow, 
          like_count: newCount,
          follower_count: newCount
        } : pl
      ));
      const res = await fetch("/api/community/follows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ following_id: p.id }),
      });
      if (!res.ok) {
        // Revert
        setPlayers(prev => prev.map(pl => pl.id === p.id ? { 
          ...pl, 
          i_follow: !newFollow, 
          i_liked: !newFollow, 
          like_count: currentFollowers,
          follower_count: currentFollowers 
        } : pl));
      }
    });
  }

  async function handleJoinClub(club: Club) {
    if (club.my_status !== "none") return;
    runWithLock(async () => {
      setJoiningId(club.id);
      const res = await fetch(`/api/community/clubs/${club.id}/join`, { method: "POST" });
      if (res.ok) {
        setClubs(prev => prev.map(c => c.id === club.id ? { ...c, my_status: "pending" } : c));
      }
      setJoiningId(null);
    });
  }

  return (
    <div className="flex flex-col gap-5 pt-1">
      {/* Search Input */}
      <div className="relative z-10">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--ink-muted)" }} />
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search players and clubs..."
          className="w-full h-12 pl-11 pr-10 rounded-2xl text-[14px] outline-none transition-shadow focus:shadow-[0_0_20px_rgba(0,217,139,0.15)]"
          style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)", color: "var(--ink-primary)" }}
        />
        {search && (
          <button onClick={() => { setSearch(""); fetchData(""); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center bg-surface-interactive hover:bg-border-default transition-colors cursor-pointer">
            <X className="w-3 h-3 text-ink-secondary" />
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-[76px] rounded-2xl animate-pulse" style={{ background: "var(--surface-raised)" }} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-6">

          {/* PLAYERS SECTION */}
          {players.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="text-[12px] font-extrabold uppercase tracking-wider px-1" style={{ fontFamily: "var(--font-outfit), var(--font-montserrat), sans-serif", color: "var(--ink-muted)" }}>
                {search ? "Players" : "Discover Players"}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {players.slice(0, search ? players.length : 10).map((p, i) => (
                  <motion.div key={`player-${p.id}`}
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.04, duration: 0.35 }}
                    className="flex items-center gap-4 p-4 rounded-2xl"
                    style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
                    <button onClick={() => onOpenProfile?.(p.id)} className="shrink-0 transition-transform hover:scale-105 active:scale-95 text-left cursor-pointer">
                      <Avatar name={p.name} size={46} online={p.online} avatarUrl={p.avatar_url} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <button onClick={() => onOpenProfile?.(p.id)} className="text-[15px] font-extrabold text-foreground leading-tight truncate hover:underline text-left cursor-pointer" style={{ fontFamily: "var(--font-outfit), var(--font-montserrat), sans-serif" }}>
                          {p.name}
                        </button>
                        <LevelBadge level={p.level} />
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Medal className="w-3.5 h-3.5 text-amber-400" strokeWidth={1.5} />
                          <span className="text-xs text-ink-muted">{p.gold}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Medal className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.5} />
                          <span className="text-xs text-ink-muted">{p.silver}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Medal className="w-3.5 h-3.5 text-orange-400" strokeWidth={1.5} />
                          <span className="text-xs text-ink-muted">{p.bronze}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <LockedFeatureWrapper showLockIcon={false}>
                        <motion.button whileTap={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}
                          onClick={() => toggleLike(p)}
                          className="flex flex-col items-center gap-0.5 min-w-[44px] min-h-[44px] justify-center rounded-xl transition-colors cursor-pointer"
                          style={{ background: p.i_liked ? "rgba(239,68,68,0.12)" : "transparent" }}>
                          <Heart className="w-4 h-4 transition-all" style={{ color: p.i_liked ? "#f04848" : "var(--ink-muted)", fill: p.i_liked ? "#f04848" : "none" }} />
                          <span className="text-[10px] font-mono" style={{ color: p.i_liked ? "#f04848" : "var(--ink-muted)" }}>{p.like_count}</span>
                        </motion.button>
                      </LockedFeatureWrapper>
                      <LockedFeatureWrapper featureLabel="send direct messages" showLockIcon={false}>
                        <button onClick={() => onOpenChat(p)}
                          className="w-11 h-11 flex items-center justify-center rounded-xl bg-surface-interactive border border-border-subtle hover:bg-surface-hover active:scale-95 transition-all cursor-pointer">
                          <MessageCircle className="w-4 h-4 text-cyan-400" />
                        </button>
                      </LockedFeatureWrapper>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* CLUBS SECTION */}
          {clubs.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="text-[12px] font-extrabold uppercase tracking-wider px-1 mt-2" style={{ fontFamily: "var(--font-outfit), var(--font-montserrat), sans-serif", color: "var(--ink-muted)" }}>
                {search ? "Clubs" : "Discover Clubs"}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {clubs.map((club, i) => (
                  <motion.div key={`club-${club.id}`}
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 6) * 0.05 }}
                    className="flex items-center gap-4 p-4 rounded-2xl transition-colors hover:border-emerald-500/30"
                    style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
                    <button
                      onClick={() => setSelectedClub(club)}
                      className="flex items-center gap-4 flex-1 min-w-0 text-left cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-accent-primary-muted">
                        <Shield className="w-6 h-6 text-accent-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[15px] font-extrabold text-foreground leading-tight block mb-0.5 hover:underline" style={{ fontFamily: "var(--font-outfit), var(--font-montserrat), sans-serif" }}>{club.name}</span>
                        <p className="text-[11px] text-ink-muted">
                          {club.member_count} member{club.member_count !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </button>
                    <div className="shrink-0">
                      {club.my_status === "none" && (
                        <LockedFeatureWrapper showLockIcon={false}>
                          <button onClick={() => handleJoinClub(club)} disabled={joiningId === club.id}
                            className="h-9 px-4 rounded-xl text-[12px] font-bold text-white bg-accent-primary active:scale-95 transition-all disabled:opacity-60 cursor-pointer">
                            {joiningId === club.id ? "..." : "Join"}
                          </button>
                        </LockedFeatureWrapper>
                      )}
                      {club.my_status === "pending" && (
                        <div className="h-9 px-3 rounded-xl flex items-center justify-center gap-1.5 text-[12px] font-bold bg-[rgba(255,186,59,0.1)] text-accent-warning border border-[rgba(255,186,59,0.2)]">
                          <Clock className="w-3.5 h-3.5" />
                          Pending
                        </div>
                      )}
                      {(club.my_status === "member" || club.my_status === "admin") && (
                        <div className="h-9 px-3 rounded-xl flex items-center justify-center gap-1.5 text-[12px] font-bold bg-accent-primary-muted text-accent-primary">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {players.length === 0 && clubs.length === 0 && search && (
            <EmptyState icon={Search} title="No results found" subtitle={`We couldn't find anyone or any club matching "${search}"`} />
          )}

        </div>
      )}

      {/* Club Detail Modal */}
      {selectedClub && (
        <ClubDetailModal
          club={selectedClub}
          onClose={() => setSelectedClub(null)}
          onOpenProfile={onOpenProfile}
          onStatusChange={(clubId, newStatus) => {
            setClubs((prev) =>
              prev.map((c) => (c.id === clubId ? { ...c, my_status: newStatus } : c))
            );
            if (selectedClub?.id === clubId) {
              setSelectedClub((prev) => (prev ? { ...prev, my_status: newStatus } : null));
            }
          }}
        />
      )}
    </div>
  );
}
