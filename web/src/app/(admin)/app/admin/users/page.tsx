"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Search,
  Ban,
  UserCheck,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import type { AdminUser } from "@/types/admin";
import { useToast } from "@/contexts/ToastContext";
import { cn } from "@/lib/utils";

export default function UserModerationPage() {
  const { showToast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUserForBan, setSelectedUserForBan] = useState<AdminUser | null>(null);
  const [banReason, setBanReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (roleFilter !== "all") params.set("role", roleFilter);

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setUsers(json.data || []);
      }
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, roleFilter]);

  const handleAction = async (targetUserId: string, action: string, extraData?: Record<string, unknown>) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/${targetUserId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extraData }),
      });

      if (res.ok) {
        showToast(`User ${action} action executed successfully.`, "success");
        fetchUsers();
      } else {
        const err = await res.json();
        showToast(err.error || `Failed to perform ${action}`, "error");
      }
    } catch (e: any) {
      showToast(e.message || "Action failed", "error");
    } finally {
      setIsSubmitting(false);
      setSelectedUserForBan(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
          User Moderation Hub
        </h1>
        <p className="text-sm font-medium text-muted-foreground">
          Search, manage account statuses, and grant administrative privileges
        </p>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by user name or email..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-surface-base text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-border bg-surface-base text-sm font-semibold text-foreground focus:outline-none"
        >
          <option value="all">All Roles</option>
          <option value="player">Player</option>
          <option value="owner">Facility Owner</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border border-border bg-surface-base/80 backdrop-blur-2xl shadow-xl overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-sm font-medium text-muted-foreground animate-pulse">
            Loading user list...
          </div>
        ) : users.length === 0 ? (
          <div className="py-20 text-center text-sm font-medium text-muted-foreground flex flex-col items-center gap-2">
            <Users className="w-8 h-8 opacity-40" />
            <span>No users matched your search criteria.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface-raised/60 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-4">User</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Joined</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-medium">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-surface-interactive/50 transition-colors">
                    <td className="p-4 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center font-bold text-emerald-400 text-sm overflow-hidden shrink-0">
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          u.name[0]?.toUpperCase() || "U"
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-foreground truncate">{u.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{u.email || "No email"}</div>
                      </div>
                    </td>

                    <td className="p-4">
                      <span
                        className={cn(
                          "px-2.5 py-1 rounded-full text-xs font-bold border capitalize",
                          u.is_admin
                            ? "bg-violet-500/10 border-violet-500/30 text-violet-400"
                            : u.role === "owner"
                            ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                            : "bg-surface-raised border-border text-foreground"
                        )}
                      >
                        {u.is_admin ? "Admin" : u.role || "Player"}
                      </span>
                    </td>

                    <td className="p-4">
                      {u.is_banned ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 border border-rose-500/30 text-rose-400">
                          Banned
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                          Active
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-xs text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {u.is_banned ? (
                          <button
                            onClick={() => handleAction(u.id, "unban")}
                            disabled={isSubmitting}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 flex items-center gap-1"
                          >
                            <UserCheck className="w-3.5 h-3.5" /> Unban
                          </button>
                        ) : (
                          <button
                            onClick={() => setSelectedUserForBan(u)}
                            disabled={isSubmitting}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 flex items-center gap-1"
                          >
                            <Ban className="w-3.5 h-3.5" /> Ban
                          </button>
                        )}

                        {!u.is_admin ? (
                          <button
                            onClick={() => handleAction(u.id, "promote_admin", { admin_role: "moderator" })}
                            disabled={isSubmitting}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-violet-500/10 border border-violet-500/30 text-violet-400 hover:bg-violet-500/20 flex items-center gap-1"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" /> Promote
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAction(u.id, "demote_admin")}
                            disabled={isSubmitting}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-surface-raised border border-border text-muted-foreground hover:text-foreground"
                          >
                            Demote
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ban Reason Modal */}
      {selectedUserForBan && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface-base border border-border rounded-3xl p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Ban User Account</h3>
                <p className="text-xs text-muted-foreground">
                  Banning <span className="text-foreground font-bold">{selectedUserForBan.name}</span>
                </p>
              </div>
            </div>

            <textarea
              rows={3}
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="Enter mandatory reason for account ban..."
              className="w-full p-3 rounded-xl border border-border bg-surface-raised text-sm text-foreground focus:outline-none"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedUserForBan(null)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold bg-surface-raised hover:bg-surface-interactive"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction(selectedUserForBan.id, "ban", { reason: banReason })}
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-xl text-sm font-bold bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-500/20"
              >
                Confirm Ban
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
