"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Calendar,
  Search,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  User,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { SkeletonTableRows } from "@/components/admin/AdminSkeleton";
import { BookingDetailDrawer, type BookingDetail } from "@/components/admin/BookingDetailDrawer";
import { cn } from "@/lib/utils";

interface AdminBooking {
  id: number | string;
  title?: string;
  date: string;
  time: string;
  location: string;
  price: number;
  status: string;
  created_at?: string;
  player?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    avatar_url?: string;
  };
  facility?: {
    id: number | string;
    name: string;
  };
}

export default function AdminBookingsPage() {
  const { showToast } = useToast();
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<BookingDetail | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const LIMIT = 20;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter !== "all") params.set("status", statusFilter);
      params.set("page", String(page));

      const res = await fetch(`/api/admin/bookings?${params.toString()}`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Failed to load booking ledger");
      }
      const json = await res.json();
      setBookings(json.data || []);
      setTotal(json.total || 0);
    } catch (err: unknown) {
      console.error("Failed to load bookings:", err);
      setError(err instanceof Error ? err.message : "Failed to load reservation data");
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchBookings();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  useEffect(() => {
    fetchBookings();
  }, [page]);

  const handleInspect = async (b: AdminBooking) => {
    try {
      const res = await fetch(`/api/admin/bookings/${b.id}`);
      if (res.ok) {
        const json = await res.json();
        setSelectedBooking(json.data || b);
      } else {
        setSelectedBooking(b);
      }
    } catch {
      setSelectedBooking(b);
    }
  };

  const handleCancelBooking = async (bookingId: string | number) => {
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel", reason: "Admin override cancellation" }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Failed to cancel booking");
      }

      showToast(`Booking #${String(bookingId).slice(0, 8)} cancelled.`, "success");
      setSelectedBooking(null);
      fetchBookings();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Cancellation failed";
      showToast(msg, "error");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
      case "cancelled":
        return "bg-rose-500/10 border-rose-500/20 text-rose-400";
      default:
        return "bg-blue-500/10 border-blue-500/20 text-blue-400";
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight flex items-center gap-2.5">
            <Calendar className="w-7 h-7 text-emerald-400 shrink-0" />
            <span>Bookings & Reservation Ledger</span>
          </h1>
          <p className="text-sm font-medium text-muted-foreground">
            Platform reservation monitoring, dispute resolution, and booking overrides
          </p>
        </div>
        <div className="px-3.5 py-1.5 rounded-xl border bg-emerald-500/10 border-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{total} Total Reservations Recorded</span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl border border-border bg-surface-base/80 backdrop-blur-2xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search bookings by facility or venue location..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-border bg-surface-raised/60 text-xs font-semibold focus:outline-none focus:border-emerald-500/50"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-border bg-surface-raised/60 text-xs font-semibold text-foreground focus:outline-none focus:border-emerald-500/50"
          >
            <option value="all">All Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border bg-red-500/10 border-red-500/20 text-red-500 dark:text-red-400 backdrop-blur-2xl shadow-lg">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchBookings}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500/20 text-red-400 hover:bg-red-500/30"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-border bg-surface-base/80 backdrop-blur-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-raised/80 border-b border-border text-muted-foreground font-mono uppercase">
              <tr>
                <th className="px-4 py-3.5 font-bold">Booking Details</th>
                <th className="px-4 py-3.5 font-bold">Player</th>
                <th className="px-4 py-3.5 font-bold">Date & Time</th>
                <th className="px-4 py-3.5 font-bold">Amount</th>
                <th className="px-4 py-3.5 font-bold">Status</th>
                <th className="px-4 py-3.5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-medium">
              {isLoading ? (
                <SkeletonTableRows rows={6} cols={6} />
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground font-medium">
                    {search || statusFilter !== "all"
                      ? `No reservations match filter "${search || statusFilter}".`
                      : "No reservations recorded yet."}
                  </td>
                </tr>
              ) : (
                bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-surface-raised/40 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-foreground">
                      <div className="flex flex-col">
                        <span>{b.title || b.facility?.name || "Pickleball Reservation"}</span>
                        <span className="text-[11px] font-normal text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-emerald-400" />
                          {b.location}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-foreground">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{b.player?.name || "Player Account"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground font-mono">
                      <div className="flex flex-col">
                        <span>{b.date}</span>
                        <span className="text-[10px] text-muted-foreground/80">{b.time}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-mono font-bold text-emerald-400">
                      ₱{b.price || 0}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold border capitalize", getStatusBadge(b.status))}>
                        {b.status || "confirmed"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => handleInspect(b)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Page {page} of {totalPages} ({total} total entries)
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="p-1.5 rounded-lg border border-border disabled:opacity-40 hover:bg-surface-raised transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="p-1.5 rounded-lg border border-border disabled:opacity-40 hover:bg-surface-raised transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Booking Detail Drawer */}
      <BookingDetailDrawer
        booking={selectedBooking}
        onClose={() => setSelectedBooking(null)}
        onCancelBooking={handleCancelBooking}
      />
    </div>
  );
}
