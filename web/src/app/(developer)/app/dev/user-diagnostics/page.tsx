"use client";

import Link from "next/link";
import { useState, useCallback } from "react";
import {
  Search,
  User,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Activity,
  CreditCard,
  Calendar,
  Mail,
  ExternalLink,
} from "lucide-react";

interface UserDiagnostic {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
  last_sign_in_at: string | null;
  wallet_balance: number;
  is_verified: boolean;
  is_banned: boolean;
  auth_provider: string;
  bookings_total: number;
  bookings_confirmed: number;
  bookings_cancelled: number;
  payments_total: number;
  payments_amount: number;
  active_sessions: number;
  recent_events: Array<{ type: string; description: string; at: string }>;
}

const eventIcons: Record<string, React.ElementType> = {
  booking: Calendar,
  payment: CreditCard,
  login: Activity,
  application: CheckCircle2,
  facility: CheckCircle2,
};

export default function UserDiagnosticsPage() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<UserDiagnostic | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSearch = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setLoading(true);
    setNotFound(false);
    setResult(null);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/dev/user-diagnostics?q=${encodeURIComponent(trimmed)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.diagnostic) {
          setResult(data.diagnostic);
          return;
        }
      }
      if (res.status === 404) {
        setNotFound(true);
      } else {
        const errJson = await res.json().catch(() => ({}));
        setErrorMessage(errJson.error || "Failed to fetch user diagnostic record");
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Error executing diagnostic request");
    } finally {
      setLoading(false);
    }
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const statusBadge = (ok: boolean, trueLabel: string, falseLabel: string) => (
    <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded border ${ok ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
      {ok ? trueLabel : falseLabel}
    </span>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-xl font-bold text-slate-100 font-mono tracking-tight">
            USER DIAGNOSTICS
          </h1>
          <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            HEALTH_INSPECTOR
          </span>
        </div>
        <p className="text-xs text-slate-400">Inspect user accounts read-only health state — auth status, wallet, session count, and diagnostic event history</p>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl border backdrop-blur-2xl bg-red-500/10 border-red-500/20 text-red-400 text-xs font-mono">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="ml-auto opacity-70 hover:opacity-100">Dismiss</button>
        </div>
      )}

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter user name, email, or UUID..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 text-sm font-mono font-semibold transition-all disabled:opacity-40"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Diagnose
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16 text-slate-500 font-mono text-sm gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
          Executing user health diagnostics...
        </div>
      )}

      {notFound && !loading && (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500 font-mono text-sm">
          <AlertTriangle className="w-8 h-8 mb-3 text-amber-400 opacity-60" />
          No user record found for <code className="text-amber-400 mx-1">{query}</code>
        </div>
      )}

      {result && !loading && (
        <div className="space-y-5">
          {/* Identity Banner */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <User className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-base font-bold font-mono text-slate-100">{result.name}</span>
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded uppercase">{result.role}</span>
                  {statusBadge(!result.is_banned, "ACTIVE", "BANNED")}
                  {statusBadge(result.is_verified, "VERIFIED", "UNVERIFIED")}
                </div>
                <div className="text-xs font-mono text-slate-400 mt-1">{result.email}</div>
                <div className="text-[11px] font-mono text-slate-500 mt-0.5">ID: {result.id} · Provider: {result.auth_provider}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/app/admin/users?search=${encodeURIComponent(result.email || result.id)}`}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-xs font-mono text-emerald-400 hover:bg-emerald-500/20 transition-all font-semibold"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Manage in Business Admin →</span>
              </Link>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Wallet Balance", value: `₱${result.wallet_balance.toLocaleString()}`, color: "text-emerald-400" },
              { label: "Active Sessions", value: result.active_sessions, color: result.active_sessions > 0 ? "text-cyan-400" : "text-slate-400" },
              { label: "Bookings", value: `${result.bookings_confirmed}/${result.bookings_total}`, color: "text-slate-100" },
              { label: "Total Payments", value: `₱${result.payments_amount.toLocaleString()}`, color: "text-slate-100" },
            ].map((s) => (
              <div key={s.label} className="bg-slate-900/40 border border-slate-800 rounded-xl p-4">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">{s.label}</div>
                <div className={`text-xl font-bold font-mono mt-1 ${s.color}`}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Booking Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-3">Booking Summary</h3>
              <div className="space-y-2">
                {[
                  { label: "Total Bookings", value: result.bookings_total, color: "text-slate-200" },
                  { label: "Confirmed", value: result.bookings_confirmed, color: "text-emerald-400" },
                  { label: "Cancelled", value: result.bookings_cancelled, color: "text-red-400" },
                  { label: "Payments Processed", value: result.payments_total, color: "text-slate-200" },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 font-mono text-xs">{row.label}</span>
                    <span className={`font-mono font-bold ${row.color}`}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Events */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-3">Recent Activity</h3>
              <div className="space-y-3">
                {result.recent_events.map((ev, i) => {
                  const EvIcon = eventIcons[ev.type] || Activity;
                  return (
                    <div key={i} className="flex items-start gap-3">
                      <div className="p-1.5 rounded-lg bg-slate-800 text-slate-400 shrink-0 mt-0.5">
                        <EvIcon className="w-3 h-3" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-slate-300">{ev.description}</p>
                        <p className="text-[10px] font-mono text-slate-500 mt-0.5">{new Date(ev.at).toLocaleString()}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {!result && !loading && !notFound && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-600 font-mono text-sm">
          <User className="w-10 h-10 mb-3 opacity-30" />
          Enter a user email or ID above to run diagnostics
        </div>
      )}
    </div>
  );
}
