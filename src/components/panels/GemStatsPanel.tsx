import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, CheckCircle2, XCircle } from "lucide-react";
import { apiGet } from "@/lib/api";

type GemStat = {
  task: string; // DD-MM-YYYY
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
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet("/metrics/gem-stats");
      setRows(Array.isArray(data) ? data : []);
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

  // ✅ Date only (no time)
  const fmtDateOnly = (ts?: number) =>
  ts
    ? new Date(ts).toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric"
      })
    : "-";


  const parseTaskDate = (d: string) => {
  if (!d) return 0;

  const parts = d.split("-");
  if (parts.length !== 3) return 0;

  const [dd, mm, yyyy] = parts.map(Number);
  if (!dd || !mm || !yyyy) return 0;

  return new Date(yyyy, mm - 1, dd).getTime();
};

  const filteredAndSortedRows = [...rows]
    .filter(r => {
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

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex gap-3 items-center">
          <div className="p-2 border rounded-xl">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">GeM Crawl Statistics</h3>
            <p className="text-xs text-muted-foreground">
              Daily crawl execution summary
            </p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-end justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2">
          <div className="flex items-end gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-muted-foreground">From</label>
              <input
                type="date"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                className="h-8 rounded-md border px-2 text-xs"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-muted-foreground">To</label>
              <input
                type="date"
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                className="h-8 rounded-md border px-2 text-xs"
              />
            </div>

            {(fromDate || toDate) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={() => {
                  setFromDate("");
                  setToDate("");
                }}
              >
                Clear
              </Button>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={load}
          >
            Refresh
          </Button>
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}

        {loading ? (
          <div className="text-sm text-muted-foreground text-center">
            Loading...
          </div>
        ) : filteredAndSortedRows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground border-b">
                <tr>
                  <th className="py-1.5 text-left">Task Date</th>
                  <th className="py-1.5 text-right">Pages</th>
                  <th className="py-1.5 text-center">Completed</th>
                  <th className="py-1.5 text-left">Last Completion</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedRows.map((r, i) => (
                  <tr
                    key={r.task}
                    className={`border-b last:border-0 hover:bg-muted/30 ${
                      !r.completed ? "bg-red-50/40" : ""
                    }`}
                  >
                    <td className="py-1.5 font-medium">{r.task}</td>
                    <td className="py-1.5 text-right font-mono">
                      {r.totalPages}
                    </td>
                    <td className="py-1.5 text-center">
                      <span className="inline-flex w-6 justify-center">
                        {r.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                      </span>
                    </td>
                    <td className="py-1.5 text-muted-foreground">
                      {fmtDateOnly(r.lastCompletionDate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground text-center">
            No GeM stats available.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
