import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity } from "lucide-react";
import { apiGet } from "@/lib/api";

type Row = { Domain: string; "Source Count": number; "BA Count": number };

export default function MetricsPanel() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet("/metrics/ba-source-domain-count");
      setRows(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.error("Failed to load metrics", e);
      setError(e?.message || "Error fetching metrics");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex gap-3 items-center mb-4">
          <div className="p-2 border rounded-xl"><Activity className="w-5 h-5"/></div>
          <div>
            <h3 className="text-lg font-semibold">BA vs Source-wise Domain Count</h3>
            <p className="text-xs text-muted-foreground">Statistics of domain distribution across BA and source systems</p>
          </div>
        </div>

        <div className="flex items-center justify-end mb-3">
          <Button variant="outline" onClick={load}>Refresh</Button>
        </div>

        {error && <div className="text-sm text-red-600 border rounded p-2">{error}</div>}

        {loading ? (
          <div className="text-sm text-muted-foreground border rounded-xl p-6 text-center">Loading...</div>
        ) : rows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-auto">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="py-2 pr-4">Domain</th>
                  <th className="py-2 pr-4">Source Count</th>
                  <th className="py-2 pr-4">BA Count</th>
                  <th className="py-2 pr-4">% Difference</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const diff = Math.abs(r["Source Count"] - r["BA Count"]);
                  const total = r["Source Count"] + r["BA Count"];
                  const pct = total > 0 ? ((diff / total) * 100).toFixed(2) : "0.00";

                  return (
                    <tr key={i} className="border-t">
                      <td className="py-2 font-medium">{r.Domain}</td>
                      <td className="py-2">{r["Source Count"]}</td>
                      <td className="py-2">{r["BA Count"]}</td>
                      <td className="py-2 font-semibold">{pct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground border rounded-xl p-6 text-center">No metrics available.</div>
        )}
      </CardContent>
    </Card>
  );
}