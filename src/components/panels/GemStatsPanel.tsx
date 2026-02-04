import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Activity,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Calendar,
  TrendingUp,
  FileText,
  Filter,
  X,
} from "lucide-react";
import { apiGet } from "@/lib/api";

type GemStat = {
  task: string;
  fromDate: string;
  toDate: string;
  lastCompletionDate: number;
  completed: boolean;
  totalPages: number;
  lastCrawledPageNo: number;
  resumable: boolean;
};

export default function GemStatPanel() {
  const [rows, setRows] = useState<GemStat[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // ---------------------------
  // Safe Data Loader
  // ---------------------------
  const load = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiGet("/metrics/gem-stats");

      const safeRows: GemStat[] = Array.isArray(data)
        ? data.map((r: any) => ({
            task: r?.task ?? "",
            fromDate: r?.fromDate ?? "",
            toDate: r?.toDate ?? "",
            lastCompletionDate: Number(r?.lastCompletionDate) || 0,
            completed: Boolean(r?.completed),
            totalPages: Number(r?.totalPages) || 0,
            lastCrawledPageNo: Number(r?.lastCrawledPageNo) || 0,
            resumable: Boolean(r?.resumable),
          }))
        : [];

      setRows(safeRows);
    } catch (e: any) {
      setError(e?.message || "Failed to load GeM stats");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // ---------------------------
  // Safe Date Formatters
  // ---------------------------
  const fmtDateOnly = (ts?: number) => {
    if (!ts || isNaN(ts)) return "-";

    try {
      return new Date(ts).toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      });
    } catch {
      return "-";
    }
  };

  const parseTaskDate = (d?: string) => {
    if (!d || typeof d !== "string") return 0;

    const parts = d.split("-");
    if (parts.length !== 3) return 0;

    const [dd, mm, yyyy] = parts.map(Number);
    if (!dd || !mm || !yyyy) return 0;

    return new Date(yyyy, mm - 1, dd).getTime();
  };

  // ---------------------------
  // Filter + Sort
  // ---------------------------
  const filteredAndSortedRows = useMemo(() => {
    return rows
      .filter((r) => {
        if (!r?.task) return false;

        const taskTs = parseTaskDate(r.task);
        if (!taskTs) return false;

        const fromTs = fromDate
          ? new Date(fromDate).setHours(0, 0, 0, 0)
          : null;

        const toTs = toDate
          ? new Date(toDate).setHours(23, 59, 59, 999)
          : null;

        if (fromTs && taskTs < fromTs) return false;
        if (toTs && taskTs > toTs) return false;

        return true;
      })
      .sort((a, b) => parseTaskDate(b.task) - parseTaskDate(a.task));
  }, [rows, fromDate, toDate]);

  // ---------------------------
  // Stats
  // ---------------------------
  const stats = useMemo(() => {
    const total = filteredAndSortedRows.length;

    const completed = filteredAndSortedRows.filter(
      (r) => r.completed
    ).length;

    const totalPages = filteredAndSortedRows.reduce(
      (sum, r) => sum + Number(r.totalPages || 0),
      0
    );

    return { total, completed, totalPages };
  }, [filteredAndSortedRows]);

  const completionRate =
    stats.total > 0
      ? ((stats.completed / stats.total) * 100).toFixed(1)
      : "0";

  // ---------------------------
  // UI
  // ---------------------------
  return (
    <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-white to-blue-50/30">
      <CardContent className="p-6">

        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 shadow-lg">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-blue-900">
              GeM Crawl Statistics
            </h3>
            <p className="text-sm text-slate-500">
              Daily crawl execution summary
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <StatCard
            icon={<Calendar />}
            label="Total Tasks"
            value={stats.total}
            sub="In selected range"
          />

          <StatCard
            icon={<TrendingUp />}
            label="Completion Rate"
            value={`${completionRate}%`}
            sub={`${stats.completed} of ${stats.total}`}
          />

          <StatCard
            icon={<FileText />}
            label="Total Pages"
            value={stats.totalPages.toLocaleString()}
            sub="Pages crawled"
          />
        </div>

        {/* Filters */}
        <div className="bg-slate-50 rounded-xl p-4 mb-6 border">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Filter className="w-4 h-4 text-slate-600" />

              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="h-9 border rounded px-3 text-sm"
              />

              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="h-9 border rounded px-3 text-sm"
              />

              {(fromDate || toDate) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFromDate("");
                    setToDate("");
                  }}
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>

            <Button variant="outline" size="sm" onClick={load}>
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="text-red-600 text-sm mb-4">{error}</div>
        )}

        {/* Table */}
        {loading ? (
          <div className="text-center py-12 text-sm text-slate-500">
            Loading statistics...
          </div>
        ) : filteredAndSortedRows.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="border-b bg-slate-50">
              <tr>
                <th className="py-2 text-left">Task Date</th>
                <th className="py-2 text-right">Pages</th>
                <th className="py-2 text-center">Status</th>
                <th className="py-2 text-left">Last Completion</th>
              </tr>
            </thead>

            <tbody>
              {filteredAndSortedRows.map((r) => (
                <tr
                  key={`${r.task}-${r.lastCompletionDate}`}
                  className="border-b"
                >
                  <td className="py-2 font-semibold">{r.task}</td>

                  <td className="py-2 text-right">
                    {Number(r.totalPages || 0).toLocaleString()}
                  </td>

                  <td className="py-2 text-center">
                    {r.completed ? (
                      <CheckCircle2 className="text-green-600 w-4 h-4 inline" />
                    ) : (
                      <XCircle className="text-red-600 w-4 h-4 inline" />
                    )}
                  </td>

                  <td className="py-2">
                    {fmtDateOnly(r.lastCompletionDate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12 text-sm text-slate-500">
            No statistics available
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ----------------------------------
// Small reusable stat card
// ----------------------------------
function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub: string;
}) {
  return (
    <div className="rounded-xl border p-4 bg-white shadow-sm">
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
        {icon}
        {label}
      </div>

      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-slate-500">{sub}</div>
    </div>
  );
}
