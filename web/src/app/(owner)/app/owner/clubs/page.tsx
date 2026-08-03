"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Plus,
  Trash2,
  Edit2,
  Users,
  Loader2,
  X,
} from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { useRouter } from "next/navigation";

export default function OwnerClubsPage() {
  const [clubs, setClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [editing, setEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { showToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    fetchClubs();
  }, []);

  async function fetchClubs() {
    setLoading(true);
    try {
      const res = await fetch("/api/clubs");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setClubs(data);
    } catch (err) {
      console.error(err);
      showToast("Failed to load clubs", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!formName.trim()) {
      showToast("Club name is required", "error");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/clubs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          description: formDesc.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to create");
      }
      setFormName("");
      setFormDesc("");
      setCreating(false);
      await fetchClubs();
      showToast("Club created", "success");
    } catch (err) {
      console.error(err);
      showToast("Could not create club", "error");
      setCreating(false);
    }
  }

  async function handleUpdate() {
    if (!editId) return;
    if (!editName.trim()) {
      showToast("Club name is required", "error");
      return;
    }
    setEditing(true);
    try {
      const res = await fetch(`/api/clubs/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          description: editDesc.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to update");
      }
      setEditing(false);
      setEditId(null);
      await fetchClubs();
      showToast("Club updated", "success");
    } catch (err) {
      console.error(err);
      showToast("Could not update club", "error");
      setEditing(false);
    }
  }

  async function handleDelete(targetId?: string) {
    const idToDelete = targetId || deleteId;
    if (!idToDelete) return;
    setDeleteId(idToDelete);
    setDeleting(true);
    try {
      const res = await fetch(`/api/clubs/${idToDelete}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete");
      }
      setDeleteId(null);
      setDeleting(false);
      await fetchClubs();
      showToast("Club deleted", "success");
    } catch (err) {
      console.error(err);
      showToast("Could not delete club", "error");
      setDeleting(false);
    }
  }

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">My Clubs</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setCreating(true);
            }}
            className="px-3 py-1 rounded-xl text-sm font-medium transition-colors hover:bg-surface-hover"
          >
            <Plus className="w-4 h-4 mr-1" /> New Club
          </button>
        </div>
      </div>

      {/* Create Club Form */}
      {creating && (
        <motion.div
          key="create-form"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mb-6 p-4 bg-surface-base border border-border rounded-xl"
        >
          <h2 className="text-lg font-semibold text-foreground mb-4">New Club</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleCreate();
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium mb-1">Club Name</label>
              <input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Enter club name"
                className="w-full px-4 py-2 rounded-xl border border-border bg-surface-raised text-sm focus:outline-none focus:ring-2 focus-ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description (optional)</label>
              <textarea
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="Describe your club"
                rows={3}
                className="w-full px-4 py-2 rounded-xl border border-border bg-surface-raised text-sm focus:outline-none focus:ring-2 focus-ring-primary"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setCreating(false)}
                className="px-4 py-2 rounded-xl border border-border bg-surface-hover text-sm font-medium hover:bg-surface-hover/80"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!formName.trim()}
                className="px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
              >
                Create Club
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Edit Club Form */}
      {editing && editId && (
        <motion.div
          key="edit-form"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mb-6 p-4 bg-surface-base border border-border rounded-xl"
        >
          <h2 className="text-lg font-semibold text-foreground mb-4">Edit Club</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleUpdate();
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium mb-1">Club Name</label>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Club name"
                className="w-full px-4 py-2 rounded-xl border border-border bg-surface-raised text-sm focus:outline-none focus:ring-2 focus-ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                placeholder="Club description"
                rows={3}
                className="w-full px-4 py-2 rounded-xl border border-border bg-surface-raised text-sm focus:outline-none focus:ring-2 focus-ring-primary"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setEditId(null);
                  setEditName("");
                  setEditDesc("");
                }}
                className="px-4 py-2 rounded-xl border border-border bg-surface-hover text-sm font-medium hover:bg-surface-hover/80"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!editName.trim()}
                className="px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
              >
                Save Changes
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Clubs List */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 mx-auto mb-4 text-muted-foreground animate-spin" />
          <p className="text-sm text-muted-foreground">Loading clubs...</p>
        </div>
      ) : clubs.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium text-foreground">You haven't created any clubs yet</p>
          <p className="text-sm text-muted-foreground">
            Create a club to bring players together around your facility.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {clubs.map((club) => (
            <motion.div
              key={club.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: parseInt(club.id) * 0.02 }}
              className="p-4 bg-surface-base border border-border rounded-xl flex items-start gap-4"
            >
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100">
                      <Users className="w-4 h-4 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {club.name}
                      </h3>
                      <p className="text-[14px] line-clamp-2 text-foreground mt-1">
                        {club.description || "No description"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      {club.member_count} members
                    </span>
                  </div>
                </div>
                <div className="flex items-end space-x-3">
                  {!editing || editId !== club.id ? (
                    <>
                      <button
                        onClick={() => {
                          setEditId(club.id);
                          setEditName(club.name || "");
                          setEditDesc(club.description || "");
                          setEditing(true);
                        }}
                        className="p-1 rounded-full hover:bg-blue-500/10 transition-colors text-blue-500"
                        aria-label="Edit club"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          router.push(`/app/owner/clubs/${club.id}/members`);
                        }}
                        className="p-1 rounded-full hover:bg-green-500/10 transition-colors text-green-500"
                        aria-label="Manage members"
                      >
                        <Users className="w-4 h-4" />
                      </button>
                      {!deleting || deleteId !== club.id ? (
                        <button
                          onClick={() => handleDelete(club.id)}
                          className="p-1 rounded-full hover:bg-red-500/10 transition-colors text-red-500"
                          aria-label="Delete club"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          className="p-1 rounded-full bg-red-500/20 text-red-500"
                          aria-label="Deleting..."
                        >
                          <X className="w-4 h-4 animate-pulse" />
                        </button>
                      )}
                    </>
                  ) : (
                    <span className="text-xs text-muted-italic">
                      Editing...
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}