"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Plus,
  ClipboardList,
  ArrowLeft,
} from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { useParams, useRouter } from "next/navigation";

export default function FacilityAnnouncementsPage() {
  const { id } = useParams<{ id: string }>();
  const facilityId = Number(id);
  const router = useRouter();
  const { showToast } = useToast();

  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<{
    title: string;
    content: string;
    is_active: boolean;
  }>({ title: "", content: "", is_active: true });

  useEffect(() => {
    fetchAnnouncements();
  }, [facilityId]);

  async function fetchAnnouncements() {
    setLoading(true);
    try {
      const res = await fetch(`/api/facilities/${facilityId}/announcements`);
      if (!res.ok) throw new Error("Failed to fetch announcements");
      const data = await res.json();
      setAnnouncements(data);
    } catch (err) {
      console.error(err);
      showToast("Could not load announcements", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleActive(announcement: any) {
    try {
      const res = await fetch(
        `/api/facilities/${facilityId}/announcements/${announcement.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_active: !announcement.is_active }),
        }
      );
      if (!res.ok) throw new Error("Failed to update");
      const updated = await res.json();
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === announcement.id ? updated : a))
      );
      showToast(
        `Announcement ${updated.is_active ? "activated" : "deactivated"}`,
        "success"
      );
    } catch (err) {
      console.error(err);
      showToast("Could not update announcement", "error");
    }
  }

  async function handleDelete(announcementId: string) {
    setDeleteId(announcementId);
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/facilities/${facilityId}/announcements/${announcementId}`,
        {
          method: "DELETE",
        }
      );
      if (!res.ok) throw new Error("Failed to delete");
      setAnnouncements((prev) =>
        prev.filter((a) => a.id !== announcementId)
      );
      showToast("Announcement deleted", "success");
    } catch (err) {
      console.error(err);
      showToast("Could not delete announcement", "error");
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }

  function handleEditStart(announcement: any) {
    setEditId(announcement.id);
    setEditData({
      title: announcement.title,
      content: announcement.content,
      is_active: announcement.is_active,
    });
    setEditing(true);
  }

  function handleEditCancel() {
    setEditId(null);
    setEditing(false);
    setEditData({ title: "", content: "", is_active: true });
  }

  async function handleEditSave() {
    if (!editId) return;
    try {
      const res = await fetch(
        `/api/facilities/${facilityId}/announcements/${editId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editData),
        }
      );
      if (!res.ok) throw new Error("Failed to update");
      const updated = await res.json();
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === updated.id ? updated : a))
      );
      showToast("Announcement updated", "success");
      setEditId(null);
      setEditing(false);
      setEditData({ title: "", content: "", is_active: true });
    } catch (err) {
      console.error(err);
      showToast("Could not save announcement", "error");
    }
  }

  function handleCreateOpen() {
    // We'll use a modal or just expand a form; for simplicity, we'll toggle editing state with empty id
    setEditId("new");
    setEditData({ title: "", content: "", is_active: true });
    setEditing(true);
  }

  async function handleCreateSubmit() {
    try {
      const res = await fetch(`/api/facilities/${facilityId}/announcements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });
      if (!res.ok) throw new Error("Failed to create");
      const created = await res.json();
      setAnnouncements((prev) => [created, ...prev]);
      showToast("Announcement created", "success");
      setEditId(null);
      setEditing(false);
      setEditData({ title: "", content: "", is_active: true });
    } catch (err) {
      console.error(err);
      showToast("Could not create announcement", "error");
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="h-8 w-8 rounded-full animate-pulse mb-4" style={{ background: "var(--surface-raised)" }} />
        <p className="text-sm text-muted-foreground">Loading announcements...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          Facility Announcements
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              router.push(`/app/owner/facility/${facilityId}`);
            }}
            className="px-3 py-1 rounded-xl text-sm font-medium transition-colors hover:bg-surface-hover"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Facility
          </button>
          <button
            onClick={handleCreateOpen}
            className="px-3 py-1 rounded-xl text-sm font-medium transition-colors hover:bg-surface-hover"
          >
            <Plus className="w-4 h-4 mr-1" /> New Announcement
          </button>
          <button
            onClick={fetchAnnouncements}
            disabled={loading}
            className="px-3 py-1 rounded-xl text-sm font-medium transition-colors hover:bg-surface-hover disabled:opacity-50"
          >
            <ClipboardList className="w-4 h-4 mr-1" /> Refresh
          </button>
        </div>
      </div>

      {/* Create/Edit Form */}
      {editing && (
        <motion.div
          key="form"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mb-6 p-4 bg-surface-base border border-border rounded-xl"
        >
          <h2 className="text-lg font-semibold text-foreground mb-4">
            {editId === "new" ? "New Announcement" : "Edit Announcement"}
          </h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (editId === "new") handleCreateSubmit();
              else handleEditSave();
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                value={editData.title}
                onChange={(e) =>
                  setEditData({ ...editData, title: e.target.value })
                }
                placeholder="Enter announcement title"
                className="w-full px-4 py-2 rounded-xl border border-border bg-surface-raised text-sm focus:outline-none focus:ring-2 focus-ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Content</label>
              <textarea
                value={editData.content}
                onChange={(e) =>
                  setEditData({ ...editData, content: e.target.value })
                }
                placeholder="Enter announcement details"
                rows={4}
                className="w-full px-4 py-2 rounded-xl border border-border bg-surface-raised text-sm focus:outline-none focus:ring-2 focus-ring-primary"
              />
            </div>
            <div className="flex items-center space-x-3">
              <label className="text-sm font-medium flex items-center space-x-1">
                <input
                  type="checkbox"
                  checked={editData.is_active}
                  onChange={(e) =>
                    setEditData({ ...editData, is_active: e.target.checked })
                  }
                  className="h-4 w-4 text-primary-600"
                />
                Active
              </label>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleEditCancel}
                className="px-4 py-2 rounded-xl border border-border bg-surface-hover text-sm font-medium hover:bg-surface-hover/80"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!editData.title.trim() || !editData.content.trim()}
                className="px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
              >
                {editId === "new" ? "Create" : "Save"}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {announcements.length === 0 && !editing ? (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium text-foreground">
            No announcements yet
          </p>
          <p className="text-sm text-muted-foreground">
            Create announcements to inform players about events, closures, or updates.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <motion.div
              key={announcement.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: parseInt(announcement.id) * 0.02 }}
              className="p-4 bg-surface-base border border-border rounded-xl flex items-start gap-4"
            >
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full">
                      {announcement.is_active ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-yellow-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">
                        {announcement.title}
                      </h3>
                      <p className="text-[14px] line-clamp-2 text-foreground mt-1">
                        {announcement.content}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      {formatDate(announcement.created_at)}
                    </span>
                    {announcement.is_active ? (
                      <button
                        onClick={() => handleToggleActive(announcement)}
                        className="px-2 py-0.5 rounded Text-xs text-green-600 hover:text-green-800"
                      >
                        Active
                      </button>
                    ) : (
                      <button
                        onClick={() => handleToggleActive(announcement)}
                        className="px-2 py-0.5 rounded Text-xs text-gray-600 hover:text-gray-800 bg-gray-50"
                      >
                        Inactive
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-end space-x-3">
                  {!editing || editId !== announcement.id ? (
                    <>
                      <button
                        onClick={() => handleEditStart(announcement)}
                        className="p-1 rounded-full hover:bg-blue-500/10 transition-colors text-blue-500"
                        aria-label="Edit announcement"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {!deleting || deleteId !== announcement.id ? (
                        <button
                          onClick={() => handleDelete(announcement.id)}
                          className="p-1 rounded-full hover:bg-red-500/10 transition-colors text-red-500"
                          aria-label="Delete announcement"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          className="p-1 rounded-full bg-red-500/20 text-red-500"
                          aria-label="Deleting..."
                        >
                          <AlertCircle className="w-4 h-4 animate-pulse" />
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