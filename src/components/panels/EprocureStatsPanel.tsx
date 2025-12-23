import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity } from "lucide-react";
import { apiGet } from "@/lib/api";

type EprocureStat = {
  domain: string;
  date: string; // DD-MMM-YYYY (e.g. 23-Dec-2025)
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
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet("/metrics/eprocure-stats");
      setRows(Array.isArray(data) ? data : []);
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

  // Parse DD-MMM-YYYY safely
  const parseDate = (d: string) => {
  if (!d) return 0;

  const parts = d.split("-");
  if (parts.length !== 3) return 0;

  const [ddStr, monStr, yyyyStr] = parts;

  const day = Number(ddStr);
  const year = Number(yyyyStr);

  const months: Record<string, number> = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
  };

  const month = months[monStr];

  if (!day || month === undefined || !year) return 0;

  return new Date(year, month, day).getTime();
};

  // Extract only date part (remove time)
  const onlyDate = (val?: string) => {
  if (!val) return "-";

  const d = new Date(val);
  if (isNaN(d.getTime())) return "-";

  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric"
  });
};



  // Filter + sort (most recent first)
  const filteredAndSortedRows = [...rows]
    .filter(r => {
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

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex gap-3 items-center">
          <div className="p-2 border rounded-xl">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">eProcure Crawl Statistics</h3>
            <p className="text-xs text-muted-foreground">
              Stage-wise task creation across domains
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
                  <th className="py-1.5 text-left">Domain</th>
                  <th className="py-1.5 text-left">Stage</th>
                  <th className="py-1.5 text-center">Date</th>
                  <th className="py-1.5 text-center">Tasks</th>
                  <th className="py-1.5 text-center">Last Created</th>
                  <th className="py-1.5 text-left">Last Completed</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedRows.map((r, i) => (
                  <tr
                    key={`${r.domain}-${r.stage}-${r.date}`}
                    className={`border-b last:border-0 hover:bg-muted/30 ${
                      r.tasksCreated === 0 ? "bg-red-50/40" : ""
                    }`}
                  >
                    <td className="py-1.5 font-medium">{r.domain}</td>
                    <td className="py-1.5">{r.stage}</td>
                    <td className="py-1.5 text-center text-muted-foreground">
                      {r.date}
                    </td>
                    <td className="py-1.5 text-center font-mono font-semibold">
                      {r.tasksCreated}
                    </td>
                    <td className="py-1.5 text-center text-muted-foreground">
                      {onlyDate(r.dateLastCreated)}
                    </td>
                    <td className="py-1.5 text-muted-foreground">
                      {onlyDate(r.dateLastCompleted)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground text-center">
            No eProcure stats available.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
