import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Activity,
  RefreshCw,
  Calendar,
  FileText,
  TrendingUp,
  Filter,
  X,
} from "lucide-react";
import { apiGet } from "@/lib/api";

type EprocureStat = {
  domain: string;
  date: string;
  stage: string;
  dateLastCreated: string;
  dateLastCompleted: string;
  dateDiffInMinutes: number | null;
  tasksCreated: number;
};

export default function EprocurePanel() {
  const [rows, setRows] = useState<EprocureStat[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // ---------------------------
  // Safe Loader
  // ---------------------------
  const load = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiGet("/metrics/eprocure-stats");

      const safeRows: EprocureStat[] = Array.isArray(data)
        ? data.map((r: any) => ({
            domain: r?.domain ?? "",
            date: r?.date ?? "",
            stage: r?.stage ?? "",
            dateLastCreated: r?.dateLastCreated ?? "",
            dateLastCompleted: r?.dateLastCompleted ?? "",
            dateDiffInMinutes: Number(r?.dateDiffInMinutes) || null,
            tasksCreated: Number(r?.tasksCreated) || 0,
          }))
        : [];

      setRows(safeRows);
    } catch (e: any) {
      setError(e?.message || "Failed to load eProcure stats");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // ---------------------------
  // Date Parsing
  // ---------------------------
  const parseDate = (d?: string) => {
    if (!d) return 0;

    const [dd, mon, yyyy] = d.split("-");
    if (!dd || !mon || !yyyy) return 0;

    const months: Record<string, number> = {
      Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
      Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
    };

    const month = months[mon];
    if (!month && month !== 0) return 0;

    return new Date(Number(yyyy), month, Number(dd)).getTime();
  };

  const onlyDate = (val?: string) => {
    if (!val) return "-";

    const d = new Date(val);
    if (isNaN(d.getTime())) return "-";

    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  // ---------------------------
  // Filter + Sort
  // ---------------------------
  const filteredAndSortedRows = useMemo(() => {
    return rows
      .filter((r) => {
        const rowTs = parseDate(r.date);
        if (!rowTs) return false;

        const fromTs = fromDate
          ? new Date(fromDate).setHours(0, 0, 0, 0)
          : null;

        const toTs = toDate
          ? new Date(toDate).setHours(23, 59, 59, 999)
          : null;

        if (fromTs && rowTs < fromTs) return false;
        if (toTs && rowTs > toTs) return false;

        return true;
      })
      .sort((a, b) => parseDate(b.date) - parseDate(a.date));
  }, [rows, fromDate, toDate]);

  // ---------------------------
  // Stats
  // ---------------------------
  const stats = useMemo(() => {
    const totalRows = filteredAndSortedRows.length;

    const totalTasks = filteredAndSortedRows.reduce(
      (sum, r) => sum + r.tasksCreated,
      0
    );

    const avgTasks =
      totalRows > 0 ? Math.round(totalTasks / totalRows) : 0;

    return { totalRows, totalTasks, avgTasks };
  }, [filteredAndSortedRows]);

  // ---------------------------
  // UI
  // ---------------------------
  return (
    <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-white to-purple-50/30">
      <CardContent className="p-6">

        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg">
            <Activity className="w-6 h-6 text-white" />
          </div>

          <div>
            <h3 className="text-xl font-bold text-purple-900">
              eProcure Crawl Statistics
            </h3>
            <p className="text-sm text-slate-500">
              Stage-wise crawl execution metrics
            </p>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <StatCard
            icon={<Calendar />}
            label="Total Entries"
            value={stats.totalRows}
            sub="Filtered records"
          />

          <StatCard
            icon={<FileText />}
            label="Tasks Created"
            value={stats.totalTasks.toLocaleString()}
            sub="Across all stages"
          />

          <StatCard
            icon={<TrendingUp />}
            label="Avg Tasks"
            value={stats.avgTasks}
            sub="Per entry"
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
                <th className="py-2 text-left">Domain</th>
                <th className="py-2 text-left">Stage</th>
                <th className="py-2 text-center">Date</th>
                <th className="py-2 text-center">Tasks</th>
                <th className="py-2 text-center">Last Created</th>
                <th className="py-2 text-left">Last Completed</th>
              </tr>
            </thead>

            <tbody>
              {filteredAndSortedRows.map((r) => (
                <tr
                  key={`${r.domain}-${r.stage}-${r.date}`}
                  className={`border-b ${
                    r.tasksCreated === 0 ? "bg-red-50/40" : ""
                  }`}
                >
                  <td className="py-2 font-semibold">{r.domain}</td>
                  <td className="py-2">{r.stage}</td>
                  <td className="py-2 text-center">{r.date}</td>
                  <td className="py-2 text-center font-mono">
                    {r.tasksCreated}
                  </td>
                  <td className="py-2 text-center">
                    {onlyDate(r.dateLastCreated)}
                  </td>
                  <td className="py-2">
                    {onlyDate(r.dateLastCompleted)}
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

// --------------------------------
// Shared Stat Card
// --------------------------------
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
