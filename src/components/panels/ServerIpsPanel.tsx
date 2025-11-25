import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Globe } from "lucide-react";
import { apiGet } from "@/lib/api";

type IpRow = { Instance: string; "IP Address": string; "Last Updated": string };

export default function ServerIpsPanel() {
  const [rows, setRows] = useState<IpRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<IpRow[]>("/servers/ip-addresses");
      setRows(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.error("Failed to load server IPs", e);
      setError(e?.message || "Error fetching IP addresses");
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
          <div className="p-2 border rounded-xl"><Globe className="w-5 h-5"/></div>
          <div>
            <h3 className="text-lg font-semibold">Server IP Addresses</h3>
            <p className="text-xs text-muted-foreground">Current IPs with last-update timestamps</p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <div />
          <div>
            <button onClick={load} className="inline-flex items-center gap-2 px-3 py-1 border rounded text-sm">Refresh</button>
          </div>
        </div>

        {error && <div className="text-sm text-red-600 border rounded p-2">{error}</div>}

        {loading ? (
          <div className="text-sm text-muted-foreground border rounded-xl p-6 text-center">Loading...</div>
        ) : rows.length ? (
          <div className="grid gap-2">
            {rows.map((r, i) => (
              <div key={i} className="border rounded-xl p-3 text-sm">
                <div><span className="font-medium">Instance:</span> {r["Instance"]}</div>
                <div><span className="font-medium">IP:</span> {r["IP Address"]}</div>
                <div><span className="font-medium">Last Updated:</span> {r["Last Updated"]}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground border rounded-xl p-6 text-center">No server IPs available.</div>
        )}
      </CardContent>
    </Card>
  );
}