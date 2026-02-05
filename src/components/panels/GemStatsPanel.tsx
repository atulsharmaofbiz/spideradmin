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

// TYPES

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

type DateRange = {
  from: string;
  to: string;
};

type StatsData = {
  total: number;
  completed: number;
  totalPages: number;
  completionRate: string;
};

// DATE UTILITIES

/**
 * Parses task date string in DD-MM-YYYY format
 * @returns timestamp in milliseconds, or null if invalid
 */
function parseTaskDate(dateString: string): number | null {
  if (!dateString || typeof dateString !== "string") {
    return null;
  }

  const parts = dateString.split("-");
  if (parts.length !== 3) {
    return null;
  }

  const [day, month, year] = parts.map(Number);

  if (!day || !month || !year || day > 31 || month > 12) {
    return null;
  }

  const date = new Date(year, month - 1, day);

  // Validate the date is actually valid (no Feb 30, etc)
  if (
    date.getDate() !== day ||
    date.getMonth() !== month - 1 ||
    date.getFullYear() !== year
  ) {
    return null;
  }

  return date.getTime();
}

function formatDate(timestamp: number): string {
  if (timestamp == null || typeof timestamp !== "number") {
    return "-";
  }

  return new Date(timestamp).toLocaleDateString("en-US", {
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

function normalizeGemStat(raw: any): GemStat {
  return {
    task: raw?.task ?? "",
    fromDate: raw?.fromDate ?? "",
    toDate: raw?.toDate ?? "",
    lastCompletionDate: Number(raw?.lastCompletionDate) || 0,
    completed: Boolean(raw?.completed),
    totalPages: Number(raw?.totalPages) || 0,
    lastCrawledPageNo: Number(raw?.lastCrawledPageNo) || 0,
    resumable: Boolean(raw?.resumable),
  };
}

// FILTERING & SORTING

function isTaskInDateRange(
  task: GemStat,
  fromTimestamp: number | null,
  toTimestamp: number | null
): boolean {
  if (!task.task) {
    return false;
  }

  const taskTimestamp = parseTaskDate(task.task);
  if (taskTimestamp == null) {
    return false;
  }

  if (fromTimestamp != null && taskTimestamp < fromTimestamp) {
    return false;
  }

  if (toTimestamp != null && taskTimestamp > toTimestamp) {
    return false;
  }

  return true;
}

function sortTasksByDateDesc(tasks: GemStat[]): GemStat[] {
  return [...tasks].sort((a, b) => {
    const tsA = parseTaskDate(a.task) ?? 0;
    const tsB = parseTaskDate(b.task) ?? 0;
    return tsB - tsA;
  });
}

function filterAndSortTasks(
  tasks: GemStat[],
  dateRange: DateRange
): GemStat[] {
  const { fromTimestamp, toTimestamp } = getDateRangeBounds(dateRange);

  const filtered = tasks.filter((task) =>
    isTaskInDateRange(task, fromTimestamp, toTimestamp)
  );

  return sortTasksByDateDesc(filtered);
}

// STATISTICS

function calculateStats(tasks: GemStat[]): StatsData {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const totalPages = tasks.reduce((sum, t) => sum + t.totalPages, 0);

  const completionRate =
    total > 0 ? ((completed / total) * 100).toFixed(1) : "0";

  return { total, completed, totalPages, completionRate };
}

// API

async function fetchGemStats(): Promise<GemStat[]> {
  const data = await apiGet<any[]>("/metrics/gem-stats");

  if (!Array.isArray(data)) {
    return [];
  }

  return data.map(normalizeGemStat);
}

// HOOKS

function useGemStats() {
  const [stats, setStats] = useState<GemStat[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchGemStats();
      setStats(data);
    } catch (e: any) {
      setError(e?.message || "Failed to load GeM stats");
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

function StatsOverview({ stats }: { stats: StatsData }) {
  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <StatCard
        icon={<Calendar />}
        label="Total Tasks"
        value={stats.total}
        subtitle="In selected range"
      />

      <StatCard
        icon={<TrendingUp />}
        label="Completion Rate"
        value={`${stats.completionRate}%`}
        subtitle={`${stats.completed} of ${stats.total}`}
      />

      <StatCard
        icon={<FileText />}
        label="Total Pages"
        value={stats.totalPages.toLocaleString()}
        subtitle="Pages crawled"
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

function TaskStatusIcon({ completed }: { completed: boolean }) {
  return completed ? (
    <CheckCircle2 className="text-green-600 w-4 h-4 inline" />
  ) : (
    <XCircle className="text-red-600 w-4 h-4 inline" />
  );
}

function TaskTableRow({ task }: { task: GemStat }) {
  return (
    <tr className="border-b">
      <td className="py-2 font-semibold">{task.task}</td>
      <td className="py-2 text-right">
        {task.totalPages.toLocaleString()}
      </td>
      <td className="py-2 text-center">
        <TaskStatusIcon completed={task.completed} />
      </td>
      <td className="py-2">{formatDate(task.lastCompletionDate)}</td>
    </tr>
  );
}

function TaskTable({ tasks }: { tasks: GemStat[] }) {
  return (
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
        {tasks.map((task) => (
          <TaskTableRow
            key={`${task.task}-${task.lastCompletionDate}`}
            task={task}
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

function PageHeader() {
  return (
    <div className="flex items-start gap-4 mb-6">
      <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 shadow-lg">
        <Activity className="w-6 h-6 text-white" />
      </div>
      <div>
        <h3 className="text-xl font-bold text-blue-900">
          GeM Crawl Statistics
        </h3>
        <p className="text-sm text-slate-500">Daily crawl execution summary</p>
      </div>
    </div>
  );
}

// MAIN COMPONENT

export default function GemStatPanel() {
  const [dateRange, setDateRange] = useState<DateRange>({ from: "", to: "" });

  const { stats: allStats, loading, error, reload } = useGemStats();

  const filteredTasks = useMemo(
    () => filterAndSortTasks(allStats, dateRange),
    [allStats, dateRange]
  );

  const statsData = useMemo(
    () => calculateStats(filteredTasks),
    [filteredTasks]
  );

  const clearFilters = () => {
    setDateRange({ from: "", to: "" });
  };

  return (
    <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-white to-blue-50/30">
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
        ) : filteredTasks.length > 0 ? (
          <TaskTable tasks={filteredTasks} />
        ) : (
          <EmptyState />
        )}
      </CardContent>
    </Card>
  );
}