"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Globe,
  Copy,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
} from "lucide-react";

interface EnvVar {
  key: string;
  value: string;
  isSecret: boolean;
  category: string;
}

interface EnvCard {
  id: string;
  name: string;
  url: string;
  status: "active" | "degraded" | "inactive";
  commit: string;
  deployedAt: string;
  region: string;
  nodeVersion: string;
  provider: string;
}

export default function EnvironmentsPage() {
  const [environments, setEnvironments] = useState<EnvCard[]>([]);
  const [envVars, setEnvVars] = useState<EnvVar[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchEnvironments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dev/environments");
      if (res.ok) {
        const data = await res.json();
        setEnvironments(data.environments || []);
        setEnvVars(data.envVars || []);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEnvironments();
  }, [fetchEnvironments]);

  const toggleShowSecret = (key: string) => {
    setShowSecrets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    });
  };

  const maskValue = (val: string) => {
    if (val.length <= 8) return "••••••••";
    return val.slice(0, 4) + "••••••••••••" + val.slice(-4);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-100 font-mono tracking-tight">
              ENVIRONMENT MANAGEMENT
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              PROD / STAGING
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Deployment target monitoring, region mapping, and runtime environment variable auditing</p>
        </div>
        <button
          onClick={fetchEnvironments}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-mono transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Target Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-44 rounded-2xl bg-slate-900/40 border border-slate-800 animate-pulse" />
          ))
        ) : (
          environments.map((env) => (
            <div key={env.id} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold font-mono text-slate-100">{env.name}</h3>
                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded border bg-emerald-500/10 border-emerald-500/20 text-emerald-400">
                      {env.status}
                    </span>
                  </div>
                  <a
                    href={env.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-mono text-cyan-400 hover:underline mt-0.5 inline-block"
                  >
                    {env.url}
                  </a>
                </div>
                <Globe className="w-5 h-5 text-cyan-400 shrink-0" />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-slate-800">
                <div>
                  <div className="text-[10px] text-slate-500">REGION</div>
                  <div className="text-slate-300 font-semibold">{env.region}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">COMMIT</div>
                  <div className="text-slate-300 font-semibold">{env.commit}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">RUNTIME</div>
                  <div className="text-slate-300 font-semibold">{env.nodeVersion}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">PROVIDER</div>
                  <div className="text-slate-300 font-semibold">{env.provider}</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Env Vars Audit Table */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold font-mono text-slate-200">
            ENVIRONMENT VARIABLE AUDIT (READ-ONLY)
          </h2>
          <span className="text-[11px] font-mono text-slate-500">{envVars.length} variables loaded</span>
        </div>

        <div className="divide-y divide-slate-800/50">
          {envVars.map((v) => {
            const visible = showSecrets[v.key];
            const displayVal = v.isSecret ? (visible ? v.value : maskValue(v.value)) : v.value;

            return (
              <div key={v.key} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-900/40 transition-colors">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono font-bold text-cyan-300">{v.key}</code>
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">
                      {v.category}
                    </span>
                    {v.isSecret && (
                      <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                        SECRET
                      </span>
                    )}
                  </div>
                  <code className="text-xs font-mono text-slate-400 mt-1 block truncate">{displayVal}</code>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {v.isSecret && (
                    <button
                      onClick={() => toggleShowSecret(v.key)}
                      className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200"
                      title={visible ? "Hide Secret" : "Reveal Secret"}
                    >
                      {visible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  )}
                  <button
                    onClick={() => handleCopy(v.value, v.key)}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200"
                    title="Copy Value"
                  >
                    {copiedKey === v.key ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
