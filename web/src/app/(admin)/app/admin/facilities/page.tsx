"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Building2,
  Search,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Star,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import { SkeletonTableRows } from "@/components/admin/AdminSkeleton";
import { FacilityDetailDrawer } from "@/components/admin/FacilityDetailDrawer";
import Image from "next/image";

interface AdminFacility {
  id: number | string;
  name: string;
  location: string;
  type: string;
  price: number;
  rating: number;
  hours: string;
  image?: string;
  owner?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

export default function AdminFacilitiesPage() {
  const [facilities, setFacilities] = useState<AdminFacility[]>([]);
  const [inspectFacility, setInspectFacility] = useState<AdminFacility | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const LIMIT = 20;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  const fetchFacilities = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (typeFilter !== "all") params.set("type", typeFilter);
      params.set("page", String(page));

      const res = await fetch(`/api/admin/facilities?${params.toString()}`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Failed to load facility list");
      }
      const json = await res.json();
      setFacilities(json.data || []);
      setTotal(json.total || 0);
    } catch (err: unknown) {
      console.error("Failed to load facilities:", err);
      setError(err instanceof Error ? err.message : "Failed to load facilities data");
    } finally {
      setIsLoading(false);
    }
  }, [search, typeFilter, page]);

  // Reset page to 1 when filters change
  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handleTypeChange = (val: string) => {
    setTypeFilter(val);
    setPage(1);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFacilities();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchFacilities]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight flex items-center gap-2.5">
            <Building2 className="w-7 h-7 text-emerald-400 shrink-0" />
            <span>Facilities & Courts Control</span>
          </h1>
          <p className="text-sm font-medium text-muted-foreground">
            Platform venue oversight, court status controls, and partner metrics
          </p>
        </div>
        <div className="px-3.5 py-1.5 rounded-xl border bg-emerald-500/10 border-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{total} Total Registered Venues</span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl border border-border bg-surface-base/80 backdrop-blur-2xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search facilities by name or location..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-border bg-surface-raised/60 text-xs font-semibold focus:outline-none focus:border-emerald-500/50"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => handleTypeChange(e.target.value)}
            aria-label="Filter facilities by venue type"
            className="px-3 py-2 rounded-xl border border-border bg-surface-raised/60 text-xs font-semibold text-foreground focus:outline-none focus:border-emerald-500/50"
          >
            <option value="all">All Types</option>
            <option value="Indoor">Indoor</option>
            <option value="Outdoor">Outdoor</option>
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
            onClick={fetchFacilities}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500/20 text-red-400 hover:bg-red-500/30"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Facilities Grid / Table */}
      <div className="rounded-2xl border border-border bg-surface-base/80 backdrop-blur-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-raised/80 border-b border-border text-muted-foreground font-mono uppercase">
              <tr>
                <th className="px-4 py-3.5 font-bold">Facility Name</th>
                <th className="px-4 py-3.5 font-bold">Type</th>
                <th className="px-4 py-3.5 font-bold">Location</th>
                <th className="px-4 py-3.5 font-bold">Rate</th>
                <th className="px-4 py-3.5 font-bold">Rating</th>
                <th className="px-4 py-3.5 font-bold">Owner</th>
                <th className="px-4 py-3.5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <SkeletonTableRows rows={6} cols={7} />
              ) : facilities.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground font-medium">
                    No facilities found matching filter parameters.
                  </td>
                </tr>
              ) : (
                facilities.map((fac) => (
                  <tr key={fac.id} className="hover:bg-surface-raised/40 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-foreground">
                      <div className="flex items-center gap-3">
                        {fac.image ? (
                          <div className="w-9 h-9">
                            <Image
                              src={fac.image}
                              alt={fac.name}
                              width={1}
                              height={1}
                              layout="responsive"
                              className="rounded-lg object-cover border border-border shrink-0"
                            />
                          </div>
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">
                            {fac.name[0]}
                          </div>
                        )}
                        <span>{fac.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        fac.type === 'Indoor'
                          ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400'
                          : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                      }`}>
                        {fac.type}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground font-medium">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate max-w-[180px]">{fac.location}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-mono font-bold text-emerald-400">
                      ₱{fac.price}/hr
                    </td>
                    <td className="px-4 py-3.5 font-mono font-bold text-amber-400">
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{fac.rating || '4.5'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-foreground font-medium">
                      {fac.owner?.name || 'Verified Owner'}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => setInspectFacility(fac)}
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
              className="p-1.5 rounded-lg border border-border disabled:opacity-40 hover:bg-surface-raised"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="p-1.5 rounded-lg border border-border disabled:opacity-40 hover:bg-surface-raised"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Facility Inspection Drawer */}
      <FacilityDetailDrawer
        facility={inspectFacility}
        onClose={() => setInspectFacility(null)}
      />
    </div>
  );
}
