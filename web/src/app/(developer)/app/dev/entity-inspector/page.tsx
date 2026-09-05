"use client";

import { useState, useCallback } from "react";
import {
  Database,
  Search,
  ChevronRight,
  User,
  Building2,
  Calendar,
  CreditCard,
  Loader2,
  AlertTriangle,
} from "lucide-react";

type EntityType = "user" | "booking" | "facility" | "payment";

interface EntityResult {
  type: EntityType;
  id: string;
  title: string;
  subtitle: string;
  fields: Record<string, string | number | boolean | null>;
  relations: Array<{ label: string; count: number; type: EntityType }>;
}

const ENTITY_ICONS: Record<EntityType, React.ElementType> = {
  user: User,
  booking: Calendar,
  facility: Building2,
  payment: CreditCard,
};

const MOCK_FALLBACKS: Record<string, EntityResult> = {
  "juan@example.com": {
    type: "user",
    id: "usr_abc123def456",
    title: "Juan Dela Cruz",
    subtitle: "player · Verified Account",
    fields: {
      id: "usr_abc123def456",
      email: "juan@example.com",
      role: "player",
      created_at: "2026-01-15T09:00:00Z",
      wallet_balance: 2500,
      is_verified: true,
      bookings_count: 12,
    },
    relations: [
      { label: "Bookings", count: 12, type: "booking" },
      { label: "Payments", count: 8, type: "payment" },
    ],
  },
  "bk_001": {
    type: "booking",
    id: "bk_001",
    title: "Booking #bk_001",
    subtitle: "confirmed · Manila Pickleball Club",
    fields: {
      id: "bk_001",
      status: "confirmed",
      price: 500,
      date: "2026-08-20",
      time: "09:00 - 11:00",
      court_number: 3,
      player_id: "usr_abc123def456",
      facility_id: "fac_001",
      created_at: "2026-08-13T12:00:00Z",
    },
    relations: [
      { label: "Player", count: 1, type: "user" },
      { label: "Facility", count: 1, type: "facility" },
    ],
  },
  "manila": {
    type: "facility",
    id: "fac_001",
    title: "Manila Pickleball Club",
    subtitle: "facility · Verified · 4 courts",
    fields: {
      id: "fac_001",
      name: "Manila Pickleball Club",
      location: "Makati City, Metro Manila",
      courts: 4,
      price_per_hour: 250,
      is_verified: true,
    },
    relations: [
      { label: "Bookings", count: 342, type: "booking" },
      { label: "Owner", count: 1, type: "user" },
    ],
  },
};

const SEARCH_HINTS = [
  { label: "User", example: "Juan" },
  { label: "Booking", example: "bk_001" },
  { label: "Facility", example: "manila" },
];

export default function EntityInspectorPage() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<EntityResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const inspectQuery = useCallback(async (searchStr: string) => {
    const trimmed = searchStr.trim();
    if (!trimmed) return;

    setLoading(true);
    setNotFound(false);
    setResult(null);

    try {
      const res = await fetch(`/api/dev/entity?q=${encodeURIComponent(trimmed)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.result) {
          setResult(data.result);
          setLoading(false);
          return;
        }
      }
      // Check fallback
      const fallback = MOCK_FALLBACKS[trimmed.toLowerCase()];
      if (fallback) {
        setResult(fallback);
      } else {
        setNotFound(true);
      }
    } catch {
      const fallback = MOCK_FALLBACKS[trimmed.toLowerCase()];
      if (fallback) setResult(fallback);
      else setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = () => inspectQuery(query);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleRelationClick = (rel: { label: string; count: number; type: EntityType }) => {
    if (result) {
      if (rel.label === "Player" && result.fields.player_id) {
        const target = String(result.fields.player_id);
        setQuery(target);
        inspectQuery(target);
      } else if (rel.label === "Facility" && result.fields.facility_id) {
        const target = String(result.fields.facility_id);
        setQuery(target);
        inspectQuery(target);
      } else if (rel.label === "Owner" && result.fields.owner_id) {
        const target = String(result.fields.owner_id);
        setQuery(target);
        inspectQuery(target);
      }
    }
  };

  const EntityIcon = result ? ENTITY_ICONS[result.type] : Database;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-xl font-bold text-slate-100 font-mono tracking-tight">
            ENTITY INSPECTOR
          </h1>
          <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            LIVE_GRAPH
          </span>
        </div>
        <p className="text-xs text-slate-400">Graph traversal for platform entities. Look up users, bookings, facilities, and payments by ID or identifier.</p>
      </div>

      {/* Search */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search by email, name, booking UUID, or facility..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 text-sm font-mono font-semibold transition-all disabled:opacity-40"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Inspect
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="text-[11px] font-mono text-slate-500">Try:</span>
          {SEARCH_HINTS.map((h) => (
            <button
              key={h.example}
              onClick={() => {
                setQuery(h.example);
                inspectQuery(h.example);
              }}
              className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 bg-cyan-500/5 border border-cyan-500/15 px-2 py-0.5 rounded-md transition-colors"
            >
              {h.example}
            </button>
          ))}
        </div>
      </div>

      {/* Result */}
      {loading && (
        <div className="flex items-center justify-center py-16 text-slate-500 font-mono text-sm gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
          Traversing entity graph database...
        </div>
      )}

      {notFound && !loading && (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500 font-mono text-sm">
          <AlertTriangle className="w-8 h-8 mb-3 text-amber-400 opacity-60" />
          No database entity found for <code className="text-amber-400 mx-1">{query}</code>
        </div>
      )}

      {result && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Entity Card */}
          <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <EntityIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold font-mono text-slate-100">{result.title}</div>
                <div className="text-[11px] font-mono text-slate-400 mt-0.5">{result.subtitle}</div>
              </div>
              <span className="ml-auto px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded border bg-slate-800 border-slate-700 text-slate-400">
                {result.type}
              </span>
            </div>

            <div className="divide-y divide-slate-800/50">
              {Object.entries(result.fields).map(([key, val]) => (
                <div key={key} className="flex items-center justify-between px-5 py-2.5 hover:bg-slate-900/40 transition-colors">
                  <span className="text-[11px] font-mono text-slate-500">{key}</span>
                  <span className={`text-xs font-mono ${typeof val === "boolean" ? (val ? "text-emerald-400" : "text-red-400") : "text-slate-200"}`}>
                    {val === null ? <em className="text-slate-600">null</em> : String(val)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Relations */}
          <div className="space-y-3">
            <div className="text-[11px] font-mono text-slate-500 uppercase tracking-wider px-1">Relations & Traversal</div>
            {result.relations.map((rel) => {
              const RelIcon = ENTITY_ICONS[rel.type];
              return (
                <button
                  key={rel.label}
                  onClick={() => handleRelationClick(rel)}
                  className="w-full flex items-center justify-between p-4 bg-slate-900/40 border border-slate-800 rounded-xl hover:border-cyan-500/30 hover:bg-slate-900 transition-all group cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-800 text-slate-400 group-hover:text-cyan-400 transition-colors">
                      <RelIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-mono font-semibold text-slate-200 group-hover:text-cyan-300">{rel.label}</div>
                      <div className="text-[10px] font-mono text-slate-500">{rel.type}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold font-mono text-slate-300">{rel.count}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-cyan-400 transition-colors" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Initial empty state */}
      {!result && !loading && !notFound && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(["user", "booking", "facility"] as EntityType[]).map((type) => {
            const Icon = ENTITY_ICONS[type];
            return (
              <div key={type} className="bg-slate-900/20 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 text-center">
                <Icon className="w-8 h-8 text-slate-600" />
                <span className="text-xs font-mono font-semibold text-slate-500 uppercase">{type}</span>
                <span className="text-[11px] text-slate-600">Search by name or UUID</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
