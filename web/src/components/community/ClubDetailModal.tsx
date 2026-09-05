"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Shield, X, Users, CheckCircle2, UserCheck, UserX, Clock } from "lucide-react";
import type { Club } from "@/types";
import { Avatar } from "@/components/ui/Avatar";
import { formatSkillLevel } from "@/lib/utils";

type ClubMember = {
  id: string;
  user_id: string;
  name: string;
  avatar_url: string | null;
  level: string;
  status: "member" | "admin" | "pending";
  joined_at: string;
};

export function ClubDetailModal({
  club,
  onClose,
  onOpenProfile,
  onStatusChange,
}: {
  club: Club | null;
  onClose: () => void;
  onOpenProfile?: (id: string) => void;
  onStatusChange?: (clubId: string, newStatus: Club["my_status"]) => void;
}) {
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<"members" | "about">("members");

  const fetchMembers = useCallback(async () => {
    if (!club?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/community/clubs/${club.id}/members`);
      if (res.ok) {
        const raw = await res.json();
        setMembers(Array.isArray(raw) ? raw : raw?.data || []);
      }
    } catch {
      // Ignore network errors
    } finally {
      setLoading(false);
    }
  }, [club?.id]);

  useEffect(() => {
    if (club?.id) fetchMembers();
  }, [club?.id, fetchMembers]);

  async function handleJoin() {
    if (!club || club.my_status !== "none") return;
    setJoining(true);
    try {
      const res = await fetch(`/api/community/clubs/${club.id}/join`, {
        method: "POST",
      });
      if (res.ok) {
        onStatusChange?.(club.id, "pending");
      }
    } finally {
      setJoining(false);
    }
  }

  async function handleMemberAction(memberUserId: string, action: "accept" | "reject") {
    if (!club) return;
    const res = await fetch(`/api/community/clubs/${club.id}/members`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ member_user_id: memberUserId, action }),
    });
    if (res.ok) {
      fetchMembers();
    }
  }

  if (!club) return null;

  const isAdmin = club.my_status === "admin";
  const pendingMembers = members.filter((m) => m.status === "pending");
  const approvedMembers = members.filter((m) => m.status !== "pending");

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[600] flex items-end sm:items-center justify-center p-0 sm:p-4"
      >
        {/* Backdrop */}
        <div
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-[2px] dark:bg-black/50"
        />

        {/* Modal Sheet */}
        <motion.div
          initial={{ y: 50, scale: 0.95, opacity: 0 }}
          animate={{ y: 0, scale: 1, opacity: 1 }}
          exit={{ y: 50, scale: 0.95, opacity: 0 }}
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
          className="relative w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col overflow-hidden bg-surface-overlay dark:bg-[#13223F] border border-border dark:border-white/12 shadow-[0_25px_60px_rgba(0,0,0,0.5)] z-[610]"
        >
          {/* Header */}
          <div className="p-6 border-b border-border relative">
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-surface-interactive hover:bg-surface-interactive/80 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 dark:text-emerald-400">
                <Shield className="w-7 h-7" />
              </div>
              <div className="min-w-0 flex-1">
                <h2
                  className="text-xl font-black text-foreground truncate"
                  style={{ fontFamily: "var(--font-outfit), sans-serif" }}
                >
                  {club.name}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {club.member_count} member{club.member_count !== 1 ? "s" : ""}
                  </span>
                  {club.my_status === "admin" && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-500/15 text-amber-500 dark:text-amber-400 border border-amber-500/30">
                      Club Admin
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Membership Action Button */}
            <div className="mt-4 flex gap-2">
              {club.my_status === "none" && (
                <button
                  onClick={handleJoin}
                  disabled={joining}
                  className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-400 active:scale-95 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {joining ? "Sending Request..." : "Request to Join Club"}
                </button>
              )}
              {club.my_status === "pending" && (
                <div className="w-full py-2.5 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Membership Request Pending
                </div>
              )}
              {(club.my_status === "member" || club.my_status === "admin") && (
                <div className="w-full py-2 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  You are a Member
                </div>
              )}
            </div>
          </div>

          {/* Subtabs */}
          <div className="flex border-b border-border px-6 pt-2 bg-surface-interactive/30">
            <button
              onClick={() => setActiveSubTab("members")}
              className={`pb-2.5 px-3 text-xs font-extrabold border-b-2 transition-all cursor-pointer ${
                activeSubTab === "members"
                  ? "border-emerald-500 text-emerald-500 dark:text-emerald-400"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Members ({members.length})
            </button>
            <button
              onClick={() => setActiveSubTab("about")}
              className={`pb-2.5 px-3 text-xs font-extrabold border-b-2 transition-all cursor-pointer ${
                activeSubTab === "about"
                  ? "border-emerald-500 text-emerald-500 dark:text-emerald-400"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              About Club
            </button>
          </div>

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 hide-scrollbar">
            {activeSubTab === "about" ? (
              <div className="space-y-4 text-xs leading-relaxed text-muted-foreground">
                <div className="p-4 rounded-2xl bg-surface-interactive/40 border border-border">
                  <h4 className="font-bold text-foreground mb-1 text-sm">About this Club</h4>
                  <p className="text-muted-foreground">
                    Welcome to {club.name}. Connect with fellow pickleball players, organize friendly matches, and participate in club training sessions.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-surface-interactive/40 border border-border">
                  <h4 className="font-bold text-foreground mb-1 text-sm">Club Guidelines</h4>
                  <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                    <li>Promote good sportsmanship on and off the court.</li>
                    <li>Coordinate game schedules in the community feed.</li>
                    <li>Respect all playing skill ratings and player levels.</li>
                  </ul>
                </div>
              </div>
            ) : loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 rounded-2xl bg-surface-interactive animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Admin Pending Review Section */}
                {isAdmin && pendingMembers.length > 0 && (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3">
                    <h4 className="text-xs font-black text-amber-500 dark:text-amber-400 uppercase tracking-wider">
                      Pending Join Requests ({pendingMembers.length})
                    </h4>
                    {pendingMembers.map((m) => (
                      <div key={m.id} className="flex items-center justify-between gap-3">
                        <button
                          onClick={() => {
                            onClose();
                            onOpenProfile?.(m.user_id);
                          }}
                          className="flex items-center gap-2.5 min-w-0 text-left cursor-pointer"
                        >
                          <Avatar name={m.name} size={36} avatarUrl={m.avatar_url} />
                          <div className="truncate">
                            <span className="text-xs font-bold text-foreground block truncate">
                              {m.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {formatSkillLevel(m.level)}
                            </span>
                          </div>
                        </button>
                        <div className="flex gap-1.5 shrink-0">
                          <button
                            onClick={() => handleMemberAction(m.user_id, "accept")}
                            className="p-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-400 transition-all cursor-pointer"
                            title="Accept"
                          >
                            <UserCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>
                          <button
                            onClick={() => handleMemberAction(m.user_id, "reject")}
                            className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 hover:bg-red-500/20 transition-all cursor-pointer"
                            title="Decline"
                          >
                            <UserX className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Approved Members List */}
                <div className="space-y-2">
                  {approvedMembers.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-surface-interactive/40 border border-border hover:bg-surface-interactive transition-colors"
                    >
                      <button
                        onClick={() => {
                          onClose();
                          onOpenProfile?.(m.user_id);
                        }}
                        className="flex items-center gap-3 min-w-0 text-left cursor-pointer"
                      >
                        <Avatar name={m.name} size={38} avatarUrl={m.avatar_url} />
                        <div className="truncate">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-foreground truncate">
                              {m.name}
                            </span>
                            {m.status === "admin" && (
                              <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-500 dark:text-amber-400">
                                Admin
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {formatSkillLevel(m.level)}
                          </span>
                        </div>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
export default ClubDetailModal;
