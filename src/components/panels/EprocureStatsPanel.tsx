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

// TYPES

type EprocureStat = {
  domain: string;
  date: string;
  stage: string;
  dateLastCreated: string;
  dateLastCompleted: string;
  dateDiffInMinutes: number | null;
  tasksCreated: number;
};

type DateRange = {
  from: string;
  to: string;
};

type StatsData = {
  totalRows: number;
  totalTasks: number;
  avgTasks: number;
};

// DATE UTILITIES

const MONTH_MAP: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

/**
 * Parses date string in DD-Mon-YYYY format (e.g., "15-Jan-2024")
 * @returns timestamp in milliseconds, or null if invalid
 */
function parseDateString(dateString: string): number | null {
  if (!dateString || typeof dateString !== "string") {
    return null;
  }

  const parts = dateString.split("-");
  if (parts.length !== 3) {
    return null;
  }

  const [dayStr, monthStr, yearStr] = parts;
  const day = Number(dayStr);
  const year = Number(yearStr);
  const month = MONTH_MAP[monthStr];

  if (!day || !year || month === undefined) {
    return null;
  }

  if (day < 1 || day > 31 || year < 1900) {
    return null;
  }

  const date = new Date(year, month, day);

  // Validate the date is actually valid (no Feb 30, etc)
  if (
    date.getDate() !== day ||
    date.getMonth() !== month ||
    date.getFullYear() !== year
  ) {
    return null;
  }

  return date.getTime();
}

/**
 * Formats ISO date string for display
 */
function formatDateForDisplay(isoDateString: string): string {
  if (!isoDateString) {
    return "-";
  }

  const date = new Date(isoDateString);
  if (isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function getDateRangeBounds(range: DateRange): {
  fromTimestamp: number | null;
  toTimestamp: number | null;
} {
  const fromTimestamp = range.from
    ? new Date(range.from).setHours(0, 0, 0, 0)
    : null;

  const toTimestamp = range.to
    ? new Date(range.to).setHours(23, 59, 59, 999)
    : null;

  return { fromTimestamp, toTimestamp };
}

// DATA TRANSFORMATION

function normalizeEprocureStat(raw: any): EprocureStat {
  return {
    domain: raw?.domain ?? "",
    date: raw?.date ?? "",
    stage: raw?.stage ?? "",
    dateLastCreated: raw?.dateLastCreated ?? "",
    dateLastCompleted: raw?.dateLastCompleted ?? "",
    dateDiffInMinutes: raw?.dateDiffInMinutes != null
      ? Number(raw.dateDiffInMinutes)
      : null,
    tasksCreated: Number(raw?.tasksCreated) || 0,
  };
}

// FILTERING & SORTING

function isStatInDateRange(
  stat: EprocureStat,
  fromTimestamp: number | null,
  toTimestamp: number | null
): boolean {
  if (!stat.date) {
    return false;
  }

  const statTimestamp = parseDateString(stat.date);
  if (statTimestamp == null) {
    return false;
  }

  if (fromTimestamp != null && statTimestamp < fromTimestamp) {
    return false;
  }

  if (toTimestamp != null && statTimestamp > toTimestamp) {
    return false;
  }

  return true;
}

function sortStatsByDateDesc(stats: EprocureStat[]): EprocureStat[] {
  return [...stats].sort((a, b) => {
    const tsA = parseDateString(a.date) ?? 0;
    const tsB = parseDateString(b.date) ?? 0;
    return tsB - tsA;
  });
}

function filterAndSortStats(
  stats: EprocureStat[],
  dateRange: DateRange
): EprocureStat[] {
  const { fromTimestamp, toTimestamp } = getDateRangeBounds(dateRange);

  const filtered = stats.filter((stat) =>
    isStatInDateRange(stat, fromTimestamp, toTimestamp)
  );

  return sortStatsByDateDesc(filtered);
}

// STATISTICS

function calculateStats(stats: EprocureStat[]): StatsData {
  const totalRows = stats.length;
  const totalTasks = stats.reduce((sum, stat) => sum + stat.tasksCreated, 0);
  const avgTasks = totalRows > 0 ? Math.round(totalTasks / totalRows) : 0;

  return { totalRows, totalTasks, avgTasks };
}

// API

async function fetchEprocureStats(): Promise<EprocureStat[]> {
  const data = await apiGet<any[]>("/metrics/eprocure-stats");

  if (!Array.isArray(data)) {
    return [];
  }

  return data.map(normalizeEprocureStat);
}

// HOOKS

function useEprocureStats() {
  const [stats, setStats] = useState<EprocureStat[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchEprocureStats();
      setStats(data);
    } catch (e: any) {
      setError(e?.message || "Failed to load eProcure stats");
      setStats([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return { stats, loading, error, reload: load };
}

// UI COMPONENTS

function StatCard({
  icon,
  label,
  value,
  subtitle,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  subtitle: string;
}) {
  return (
    <div className="rounded-xl border p-4 bg-white shadow-sm">
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
        {icon}
        {label}
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-slate-500">{subtitle}</div>
    </div>
  );
}

function PageHeader() {
  return (
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
  );
}

function StatsOverview({ stats }: { stats: StatsData }) {
  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <StatCard
        icon={<Calendar />}
        label="Total Entries"
        value={stats.totalRows}
        subtitle="Filtered records"
      />

      <StatCard
        icon={<FileText />}
        label="Tasks Created"
        value={stats.totalTasks.toLocaleString()}
        subtitle="Across all stages"
      />

      <StatCard
        icon={<TrendingUp />}
        label="Avg Tasks"
        value={stats.avgTasks}
        subtitle="Per entry"
      />
    </div>
  );
}

function DateRangeFilter({
  dateRange,
  onRangeChange,
  onClear,
  onRefresh,
}: {
  dateRange: DateRange;
  onRangeChange: (range: DateRange) => void;
  onClear: () => void;
  onRefresh: () => void;
}) {
  const hasActiveFilters = dateRange.from || dateRange.to;

  return (
    <div className="bg-slate-50 rounded-xl p-4 mb-6 border">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-slate-600" />

          <input
            type="date"
            value={dateRange.from}
            onChange={(e) =>
              onRangeChange({ ...dateRange, from: e.target.value })
            }
            className="h-9 border rounded px-3 text-sm"
          />

          <input
            type="date"
            value={dateRange.to}
            onChange={(e) =>
              onRangeChange({ ...dateRange, to: e.target.value })
            }
            className="h-9 border rounded px-3 text-sm"
          />

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={onClear}>
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </div>

        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="w-4 h-4 mr-1" />
          Refresh
        </Button>
      </div>
    </div>
  );
}

function StatTableRow({ stat }: { stat: EprocureStat }) {
  const isZeroTasks = stat.tasksCreated === 0;

  return (
    <tr
      className={`border-b ${isZeroTasks ? "bg-red-50/40" : ""}`}
    >
      <td className="py-2 font-semibold">{stat.domain}</td>
      <td className="py-2">{stat.stage}</td>
      <td className="py-2 text-center">{stat.date}</td>
      <td className="py-2 text-center font-mono">{stat.tasksCreated}</td>
      <td className="py-2 text-center">
        {formatDateForDisplay(stat.dateLastCreated)}
      </td>
      <td className="py-2">{formatDateForDisplay(stat.dateLastCompleted)}</td>
    </tr>
  );
}

function StatTable({ stats }: { stats: EprocureStat[] }) {
  return (
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
        {stats.map((stat) => (
          <StatTableRow
            key={`${stat.domain}-${stat.stage}-${stat.date}`}
            stat={stat}
          />
        ))}
      </tbody>
    </table>
  );
}

function LoadingState() {
  return (
    <div className="text-center py-12 text-sm text-slate-500">
      Loading statistics...
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12 text-sm text-slate-500">
      No statistics available
    </div>
  );
}

function ErrorAlert({ message }: { message: string }) {
  return <div className="text-red-600 text-sm mb-4">{message}</div>;
}

// MAIN COMPONENT

export default function EprocurePanel() {
  const [dateRange, setDateRange] = useState<DateRange>({ from: "", to: "" });

  const { stats: allStats, loading, error, reload } = useEprocureStats();

  const filteredStats = useMemo(
    () => filterAndSortStats(allStats, dateRange),
    [allStats, dateRange]
  );

  const statsData = useMemo(
    () => calculateStats(filteredStats),
    [filteredStats]
  );

  const clearFilters = () => {
    setDateRange({ from: "", to: "" });
  };

  return (
    <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-white to-purple-50/30">
      <CardContent className="p-6">
        <PageHeader />

        <StatsOverview stats={statsData} />

        <DateRangeFilter
          dateRange={dateRange}
          onRangeChange={setDateRange}
          onClear={clearFilters}
          onRefresh={reload}
        />

        {error && <ErrorAlert message={error} />}

        {loading ? (
          <LoadingState />
        ) : filteredStats.length > 0 ? (
          <StatTable stats={filteredStats} />
        ) : (
          <EmptyState />
        )}
      </CardContent>
    </Card>
  );
}