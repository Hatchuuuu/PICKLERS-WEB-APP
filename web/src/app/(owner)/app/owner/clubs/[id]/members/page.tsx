"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Loader2, Users, CheckCircle2, X, ShieldCheck, UserMinus } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { useRouter, useParams } from "next/navigation";

export default function OwnerClubMembersPage() {
  const { id } = useParams<{ id: string }>();
  const clubId = id;
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [promoting, setPromoting] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const { showToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    fetchMembers();
  }, [clubId]);

  async function fetchMembers() {
    setLoading(true);
    try {
      const res = await fetch(`/api/clubs/${clubId}/members`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setMembers(data);
    } catch (err) {
      console.error(err);
      showToast("Failed to load club members", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(userId: string) {
    setApproving(userId);
    try {
      const res = await fetch(`/api/clubs/${clubId}/members/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "member" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to approve");
      }
      await fetchMembers();
      showToast("Member approved", "success");
    } catch (err) {
      console.error(err);
      showToast("Could not approve member", "error");
    } finally {
      setApproving(null);
    }
  }

  async function handleReject(userId: string) {
    setRejecting(userId);
    try {
      const res = await fetch(`/api/clubs/${clubId}/members/${userId}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to reject");
      }
      await fetchMembers();
      showToast("Membership request rejected", "success");
    } catch (err) {
      console.error(err);
      showToast("Could not reject member", "error");
    } finally {
      setRejecting(null);
    }
  }

  async function handlePromote(userId: string) {
    setPromoting(userId);
    try {
      const res = await fetch(`/api/clubs/${clubId}/members/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "admin" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to promote");
      }
      await fetchMembers();
      showToast("Member promoted to admin", "success");
    } catch (err) {
      console.error(err);
      showToast("Could not promote member", "error");
    } finally {
      setPromoting(null);
    }
  }

  async function handleRemove(userId: string) {
    setRemoving(userId);
    try {
      const res = await fetch(`/api/clubs/${clubId}/members/${userId}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to remove");
      }
      await fetchMembers();
      showToast("Member removed", "success");
    } catch (err) {
      console.error(err);
      showToast("Could not remove member", "error");
    } finally {
      setRemoving(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <Loader2 className="w-8 h-8 mb-4 text-muted-foreground animate-spin" />
        <p className="text-sm text-muted-foreground">Loading members...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Club Members</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              router.push(`/app/owner/clubs/${clubId}`);
            }}
            className="px-3 py-1 rounded-xl text-sm font-medium transition-colors hover:bg-surface-hover"
          >
            <Users className="w-4 h-4 mr-1" /> Back to Club
          </button>
        </div>
      </div>

      {members.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium text-foreground">No members yet</p>
          <p className="text-sm text-muted-foreground">
            Invite players to join your club to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {members.map((member, idx) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="p-4 bg-surface-base border border-border rounded-xl flex items-start gap-4"
            >
              <div className="flex-shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100">
                  <Users className="w-4 h-4 text-primary-600" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {member.name}
                      </h3>
                      <p className="text-[14px] text-muted-foreground">
                        Level {member.level}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className={`
                      px-2 py-1 rounded-full text-xs font-medium
                      ${member.status === "pending"
                        ? "bg-yellow-500/20 text-yellow-500"
                        : member.status === "admin"
                        ? "bg-blue-500/20 text-blue-500"
                        : "bg-green-500/20 text-green-500"
                      }
                    `}>
                      {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-end space-x-3">
                {member.status === "pending" ? (
                  <>
                    <button
                      onClick={() => handleApprove(member.id)}
                      disabled={approving === member.id}
                      className="p-1 rounded-full hover:bg-green-500/10 transition-colors text-green-500"
                      aria-label="Approve member"
                    >
                      {approving === member.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleReject(member.id)}
                      disabled={rejecting === member.id}
                      className="p-1 rounded-full hover:bg-red-500/10 transition-colors text-red-500"
                      aria-label="Reject request"
                    >
                      {rejecting === member.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    {member.status === "member" && (
                      <>
                        <button
                          onClick={() => handlePromote(member.id)}
                          disabled={promoting === member.id}
                          className="p-1 rounded-full hover:bg-blue-500/10 transition-colors text-blue-500"
                          aria-label="Promote to admin"
                        >
                          {promoting === member.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <ShieldCheck className="w-4 h-4" />
                          )}
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleRemove(member.id)}
                      disabled={removing === member.id}
                      className="p-1 rounded-full hover:bg-red-500/10 transition-colors text-red-500"
                      aria-label="Remove member"
                    >
                      {removing === member.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <UserMinus className="w-4 h-4" />
                      )}
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}