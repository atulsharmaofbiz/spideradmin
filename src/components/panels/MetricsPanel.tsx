import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Activity,
  RefreshCw,
  AlertCircle,
  Globe,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { apiGet } from "@/lib/api";

type Row = {
  Domain: string;
  "Source Count": number;
  "BA Count": number;
};

export default function MetricsPanel() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // -----------------------
  // Load Metrics
  // -----------------------
  const load = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiGet<Row[]>("/metrics/ba-source-domain-count");
      setRows(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || "Failed to fetch metrics");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // -----------------------
  // Derived Stats
  // -----------------------
  const stats = useMemo(() => {
    const totalDomains = rows.length;

    const totalSource = rows.reduce(
      (sum, r) => sum + Number(r["Source Count"] || 0),
      0
    );

    const totalBA = rows.reduce(
      (sum, r) => sum + Number(r["BA Count"] || 0),
      0
    );

    return { totalDomains, totalSource, totalBA };
  }, [rows]);

  // -----------------------
  // Helpers
  // -----------------------
  const getPctDiff = (r: Row) => {
    const diff = r["BA Count"] - r["Source Count"];
    if (r["Source Count"] === 0) return 0;
    return (diff / r["Source Count"]) * 100;
  };

  const getDiffColor = (pct: number) => {
    if (pct > 0) return "text-green-600";
    if (pct < 0) return "text-red-600";
    return "text-slate-500";
  };

  // -----------------------
  // UI
  // -----------------------
  return (
    <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-white to-indigo-50/30">
      <CardContent className="p-6">

        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-blue-500/20 blur-xl rounded-full" />
            <div className="relative p-3 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-600 shadow-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
          </div>

          <div className="flex-1">
            <h3 className="text-xl font-bold text-indigo-900 mb-1">
              BA vs Source Domain Metrics
            </h3>
            <p className="text-sm text-slate-500">
              Domain distribution comparison across BA and source systems
            </p>
          </div>

          {/* Counter */}
          <div className="text-right">
            <div className="text-2xl font-bold text-indigo-900">
              {stats.totalDomains}
            </div>
            <div className="text-xs text-slate-500 uppercase tracking-wide">
              Domains
            </div>
          </div>
        </div>

        {/* Stat Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <StatCard
            label="Source Total"
            value={stats.totalSource.toLocaleString()}
          />
          <StatCard
            label="BA Total"
            value={stats.totalBA.toLocaleString()}
          />
          <StatCard
            label="Difference"
            value={(stats.totalBA - stats.totalSource).toLocaleString()}
          />
        </div>

        {/* Toolbar */}
        <div className="flex justify-end mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={load}
            disabled={loading}
            className="border-indigo-300 hover:bg-indigo-50"
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            <p className="mt-3 text-sm text-slate-500">
              Loading domain metrics...
            </p>
          </div>
        ) : rows.length ? (
          <div className="overflow-y-auto max-h-[420px] pr-2 custom-scrollbar">
            <table className="w-full text-sm">
              <thead className="border-b bg-slate-50">
                <tr>
                  <th className="py-2 text-left">Domain</th>
                  <th className="py-2 text-right">Source</th>
                  <th className="py-2 text-right">BA</th>
                  <th className="py-2 text-center">% Diff</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((r, i) => {
                  const pct = getPctDiff(r);

                  return (
                    <tr key={i} className="border-b hover:bg-slate-50">
                      <td className="py-2 font-semibold flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5 text-indigo-500" />
                        {r.Domain}
                      </td>

                      <td className="py-2 text-right font-mono">
                        {r["Source Count"].toLocaleString()}
                      </td>

                      <td className="py-2 text-right font-mono">
                        {r["BA Count"].toLocaleString()}
                      </td>

                      <td
                        className={`py-2 text-center font-semibold flex items-center justify-center gap-1 ${getDiffColor(
                          pct
                        )}`}
                      >
                        {pct > 0 && <TrendingUp className="w-4 h-4" />}
                        {pct < 0 && <TrendingDown className="w-4 h-4" />}
                        {pct.toFixed(2)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 bg-slate-50/50 rounded-xl border-2 border-dashed border-slate-200">
            <Globe className="w-10 h-10 mx-auto text-slate-400 mb-3" />
            <p className="text-sm font-medium text-slate-600">
              No Metrics Available
            </p>
            <p className="text-xs text-slate-500">
              Metrics will appear once monitoring data is generated
            </p>
          </div>
        )}
      </CardContent>

      {/* Scrollbar */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
      `}</style>
    </Card>
  );
}

// ---------------------
// Small Stat Card
// ---------------------
function StatCard({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border p-4 bg-white shadow-sm">
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
