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

// TYPES

type DomainMetricRow = {
  domain: string;
  sourceCount: number;
  baCount: number;
};

type MetricsSummary = {
  totalDomains: number;
  totalSource: number;
  totalBA: number;
  totalDifference: number;
};

type TrendDirection = "positive" | "negative" | "neutral";

// API RESPONSE TRANSFORMATION

// API returns data with space-separated property names
type ApiRow = {
  Domain: string;
  "Source Count": number;
  "BA Count": number;
};

function normalizeApiRow(apiRow: ApiRow): DomainMetricRow {
  return {
    domain: apiRow.Domain,
    sourceCount: apiRow["Source Count"],
    baCount: apiRow["BA Count"],
  };
}

// CALCULATIONS

function calculatePercentageDifference(
  baCount: number,
  sourceCount: number
): number {
  if (sourceCount === 0) return 0;
  const difference = baCount - sourceCount;
  return (difference / sourceCount) * 100;
}

function getTrendDirection(percentage: number): TrendDirection {
  if (percentage > 0) return "positive";
  if (percentage < 0) return "negative";
  return "neutral";
}

function calculateMetricsSummary(rows: DomainMetricRow[]): MetricsSummary {
  const totalDomains = rows.length;
  const totalSource = rows.reduce((sum, row) => sum + row.sourceCount, 0);
  const totalBA = rows.reduce((sum, row) => sum + row.baCount, 0);
  const totalDifference = totalBA - totalSource;

  return { totalDomains, totalSource, totalBA, totalDifference };
}

// STYLING

const TREND_COLORS: Record<TrendDirection, string> = {
  positive: "text-green-600",
  negative: "text-red-600",
  neutral: "text-slate-500",
};

function getTrendColor(trend: TrendDirection): string {
  return TREND_COLORS[trend];
}

// API

async function fetchDomainMetrics(): Promise<DomainMetricRow[]> {
  const data = await apiGet<ApiRow[]>("/metrics/ba-source-domain-count");

  if (!Array.isArray(data)) {
    return [];
  }

  return data.map(normalizeApiRow);
}

// HOOKS

function useDomainMetrics() {
  const [metrics, setMetrics] = useState<DomainMetricRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchDomainMetrics();
      setMetrics(data);
    } catch (e) {
      console.error("Failed to load domain metrics:", e);
      const errorMessage = e instanceof Error ? e.message : "Failed to fetch metrics";
      setError(errorMessage);
      setMetrics([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return { metrics, loading, error, reload: load };
}

// UI COMPONENTS

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

function PageHeader({ totalDomains }: { totalDomains: number }) {
  return (
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

      <div className="text-right">
        <div className="text-2xl font-bold text-indigo-900">{totalDomains}</div>
        <div className="text-xs text-slate-500 uppercase tracking-wide">
          Domains
        </div>
      </div>
    </div>
  );
}

function MetricsSummary({ summary }: { summary: MetricsSummary }) {
  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <StatCard
        label="Source Total"
        value={summary.totalSource.toLocaleString()}
      />
      <StatCard label="BA Total" value={summary.totalBA.toLocaleString()} />
      <StatCard
        label="Difference"
        value={summary.totalDifference.toLocaleString()}
      />
    </div>
  );
}

function RefreshButton({
  onRefresh,
  loading,
}: {
  onRefresh: () => void;
  loading: boolean;
}) {
  return (
    <div className="flex justify-end mb-6">
      <Button
        variant="outline"
        size="sm"
        onClick={onRefresh}
        disabled={loading}
        className="border-indigo-300 hover:bg-indigo-50"
      >
        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
        Refresh
      </Button>
    </div>
  );
}

function ErrorAlert({ message }: { message: string }) {
  return (
    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
      <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
      <p className="text-sm text-red-700">{message}</p>
    </div>
  );
}

function TrendIcon({ percentage }: { percentage: number }) {
  if (percentage > 0) {
    return <TrendingUp className="w-4 h-4" />;
  }
  if (percentage < 0) {
    return <TrendingDown className="w-4 h-4" />;
  }
  return null;
}

function MetricTableRow({ metric }: { metric: DomainMetricRow }) {
  const percentageDiff = calculatePercentageDifference(
    metric.baCount,
    metric.sourceCount
  );
  const trend = getTrendDirection(percentageDiff);
  const trendColor = getTrendColor(trend);

  return (
    <tr className="border-b hover:bg-slate-50">
      <td className="py-2 font-semibold flex items-center gap-2">
        <Globe className="w-3.5 h-3.5 text-indigo-500" />
        {metric.domain}
      </td>

      <td className="py-2 text-right font-mono">
        {metric.sourceCount.toLocaleString()}
      </td>

      <td className="py-2 text-right font-mono">
        {metric.baCount.toLocaleString()}
      </td>

      <td
        className={`py-2 text-center font-semibold flex items-center justify-center gap-1 ${trendColor}`}
      >
        <TrendIcon percentage={percentageDiff} />
        {percentageDiff.toFixed(2)}%
      </td>
    </tr>
  );
}

function MetricsTable({ metrics }: { metrics: DomainMetricRow[] }) {
  return (
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
          {metrics.map((metric) => (
            <MetricTableRow key={metric.domain} metric={metric} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="text-center py-12">
      <div className="inline-block w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      <p className="mt-3 text-sm text-slate-500">Loading domain metrics...</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12 bg-slate-50/50 rounded-xl border-2 border-dashed border-slate-200">
      <Globe className="w-10 h-10 mx-auto text-slate-400 mb-3" />
      <p className="text-sm font-medium text-slate-600">No Metrics Available</p>
      <p className="text-xs text-slate-500">
        Metrics will appear once monitoring data is generated
      </p>
    </div>
  );
}

// MAIN COMPONENT

export default function MetricsPanel() {
  const { metrics, loading, error, reload } = useDomainMetrics();

  const summary = useMemo(
    () => calculateMetricsSummary(metrics),
    [metrics]
  );

  return (
    <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-white to-indigo-50/30">
      <CardContent className="p-6">
        <PageHeader totalDomains={summary.totalDomains} />

        <MetricsSummary summary={summary} />

        <RefreshButton onRefresh={reload} loading={loading} />

        {error && <ErrorAlert message={error} />}

        {loading ? (
          <LoadingState />
        ) : metrics.length > 0 ? (
          <MetricsTable metrics={metrics} />
        ) : (
          <EmptyState />
        )}
      </CardContent>

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