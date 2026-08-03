"use client";

import { useState } from "react";
import { motion } from "motion/react";
import {
  Bell,
  CheckCircle2,
  X,
  Loader2,
  Zap,
  Users,
  Clock,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { useApp } from "@/contexts/AppContext";

export default function OwnerNotificationsPage() {
  const { notifications, markAllNotificationsRead, dismissNotification } = useApp();
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    unreadOnly: false,
    type: "all", // all, booking, community, system
  });
  const [showFilters, setShowFilters] = useState(false);
  const { showToast } = useToast();

  // Filter notifications based on selected filters
  const filteredNotifications = notifications
    .filter((notification) => {
      if (filters.unreadOnly && notification.read) return false;
      if (filters.type === "all") return true;
      return notification.type === filters.type;
    })
    .sort((a, b) => {
      // Sort by read status first (unread first), then by time (newest first)
      if (a.read === b.read) return 0;
      return a.read ? 1 : -1;
    });

  const handleMarkAllRead = async () => {
    setLoading(true);
    try {
      await markAllNotificationsRead();
      showToast("All notifications marked as read", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to mark notifications as read", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      await dismissNotification(id);
    } catch (err) {
      console.error(err);
      showToast("Failed to dismiss notification", "error");
    }
  };

  const handleToggleFilter = () => {
    setShowFilters(!showFilters);
  };

  const handleApplyFilters = () => {
    setShowFilters(false);
  };

  const handleResetFilters = () => {
    setFilters({
      unreadOnly: false,
      type: "all",
    });
    setShowFilters(false);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "booking":
        return <Clock className="w-4 h-4" />;
      case "community":
        return <Users className="w-4 h-4" />;
      case "system":
        return <Zap className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "booking":
        return "bg-blue-500/20 text-blue-500";
      case "community":
        return "bg-green-500/20 text-green-500";
      case "system":
        return "bg-purple-500/20 text-purple-500";
      default:
        return "bg-gray-500/20 text-gray-500";
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <Loader2 className="w-8 h-8 mb-4 text-muted-foreground animate-spin" />
        <p className="text-sm text-muted-foreground">Loading notifications...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bell className="h-5 w-5 text-foreground" />
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleFilter}
            className="px-3 py-1 rounded-xl text-sm font-medium transition-colors hover:bg-surface-hover"
          >
            Filter
            {showFilters ? (
              <ChevronUp className="w-3 h-3 ml-1" />
            ) : (
              <ChevronDown className="w-3 h-3 ml-1" />
            )}
          </button>
          <button
            onClick={handleMarkAllRead}
            disabled={loading || filteredNotifications.every((n) => n.read)}
            className={`${loading ? "opacity-50 cursor-not-allowed" : ""} px-3 py-1 rounded-xl text-sm font-medium transition-colors hover:bg-surface-hover`}
          >
            {loading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              "Mark All as Read"
            )}
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <motion.div
          key="filters"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mb-6 p-4 bg-surface-base border border-border rounded-xl"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-foreground">Filter Notifications</h2>
            <button
              onClick={handleResetFilters}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Reset
            </button>
          </div>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="unread-only"
                checked={filters.unreadOnly}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    unreadOnly: e.target.checked,
                  }))
                }
                className="h-4 w-4 text-primary-600"
              />
              <label htmlFor="unread-only" className="text-sm font-medium text-foreground">
                Unread only
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <div className="flex space-x-2">
                <button
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      type: "all",
                    }))
                  }
                  className={`px-3 py-1 rounded-xl text-sm font-medium ${
                    filters.type === "all"
                      ? "bg-primary-600 text-white"
                      : "border border-border bg-surface-hover text-sm font-medium hover:bg-surface-hover/80"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      type: "booking",
                    }))
                  }
                  className={`px-3 py-1 rounded-xl text-sm font-medium ${
                    filters.type === "booking"
                      ? "bg-primary-600 text-white"
                      : "border border-border bg-surface-hover text-sm font-medium hover:bg-surface-hover/80"
                  }`}
                >
                  Booking
                </button>
                <button
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      type: "community",
                    }))
                  }
                  className={`px-3 py-1 rounded-xl text-sm font-medium ${
                    filters.type === "community"
                      ? "bg-primary-600 text-white"
                      : "border border-border bg-surface-hover text-sm font-medium hover:bg-surface-hover/80"
                  }`}
                >
                  Community
                </button>
                <button
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      type: "system",
                    }))
                  }
                  className={`px-3 py-1 rounded-xl text-sm font-medium ${
                    filters.type === "system"
                      ? "bg-primary-600 text-white"
                      : "border border-border bg-surface-hover text-sm font-medium hover:bg-surface-hover/80"
                  }`}
                >
                  System
                </button>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleApplyFilters}
                className="px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium text-foreground">
            {filters.type === "all" && filters.unreadOnly
              ? "No unread notifications"
              : filters.type !== "all"
              ? `No ${filters.type} notifications`
              : "No notifications yet"}
          </p>
          <p className="text-sm text-muted-foreground">
            You'll see notifications here when there are updates related to your facilities, clubs, or bookings.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: parseInt(notification.id) * 0.02 }}
              className="p-4 bg-surface-base border border-border rounded-xl flex items-start gap-4"
            >
              <div className="flex-shrink-0">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${getTypeColor(
                  notification.type
                )}`}>
                  {getTypeIcon(notification.type)}
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div>
                      <h3 className={`font-semibold text-foreground ${
                        !notification.read ? "" : "text-muted-foreground"
                      }`}>
                        {notification.title}
                      </h3>
                      <p className="text-[14px] line-clamp-2 text-foreground mt-1">
                        {notification.body}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{notification.time}</span>
                    {!notification.read && (
                      <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-primary-600/20 text-primary-600">
                        New
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-end space-x-3">
                {!notification.read && (
                  <button
                    onClick={() => {
                      // Mark as read when clicked
                      // In a real app, we'd update the notification as read
                      // For now, we'll just dismiss it or leave it as is
                    }}
                    className="p-1 rounded-full hover:bg-blue-500/10 transition-colors text-blue-500"
                    aria-label="Mark as read"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleDismiss(notification.id)}
                  className="p-1 rounded-full hover:bg-red-500/10 transition-colors text-red-500"
                  aria-label="Dismiss notification"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}