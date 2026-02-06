import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Globe,
  RefreshCw,
  AlertCircle,
  Server,
  Clock,
} from "lucide-react";
import { apiGet } from "@/lib/api";

// -------------------- TYPES --------------------

type ServerIp = {
  instance: string;
  ipAddress: string;
  lastUpdated: string;
};

// API returns data with space-separated property names
type ApiServerIp = {
  Instance: string;
  "IP Address": string;
  "Last Updated": string;
};

// -------------------- DATA TRANSFORMATION --------------------

function normalizeServerIp(apiData: ApiServerIp): ServerIp {
  return {
    instance: apiData.Instance,
    ipAddress: apiData["IP Address"],
    lastUpdated: apiData["Last Updated"],
  };
}

// -------------------- DATE FORMATTING --------------------

/**
 * Parses timestamp string and returns Date object
 * Handles format: "YYYY-MM-DD HH:MM:SS"
 */
function parseTimestamp(timestamp: string): Date | null {
  if (!timestamp || typeof timestamp !== "string") {
    return null;
  }

  // Replace space with 'T' for ISO format
  // Use replaceAll to handle any multiple spaces
  const isoFormat = timestamp.trim().replace(/\s+/g, "T");

  const date = new Date(isoFormat);

  if (isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function formatTimestampForDisplay(timestamp: string): string {
  const date = parseTimestamp(timestamp);

  if (!date) {
    return "-";
  }

  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// -------------------- API --------------------

async function fetchServerIps(): Promise<ServerIp[]> {
  const data = await apiGet<ApiServerIp[]>("/servers/ip-addresses");

  if (!Array.isArray(data)) {
    return [];
  }

  return data.map(normalizeServerIp);
}

// -------------------- HOOKS --------------------

function useServerIps() {
  const [servers, setServers] = useState<ServerIp[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchServerIps();
      setServers(data);
    } catch (e) {
      console.error("Failed to load server IPs:", e);
      const errorMessage = e instanceof Error
        ? e.message
        : "Failed to fetch IP addresses";
      setError(errorMessage);
      setServers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return { servers, loading, error, reload: load };
}

// -------------------- UI COMPONENTS --------------------

function PageHeader({ serverCount }: { serverCount: number }) {
  return (
    <div className="flex items-start gap-4 mb-6">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 blur-xl rounded-full" />
        <div className="relative p-3 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 shadow-lg">
          <Globe className="w-6 h-6 text-white" />
        </div>
      </div>

      <div className="flex-1">
        <h3 className="text-xl font-bold text-blue-900 mb-1">
          Server IP Addresses
        </h3>
        <p className="text-sm text-slate-500">
          Current infrastructure IP mappings
        </p>
      </div>

      <div className="text-right">
        <div className="text-2xl font-bold text-blue-900">{serverCount}</div>
        <div className="text-xs text-slate-500 uppercase tracking-wide">
          Servers
        </div>
      </div>
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
        className="border-blue-300 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700"
      >
        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
        Refresh
      </Button>
    </div>
  );
}

function ErrorAlert({ message }: { message: string }) {
  return (
    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 animate-in slide-in-from-top-2">
      <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
      <p className="text-sm text-red-700">{message}</p>
    </div>
  );
}

function ServerIpCard({ server }: { server: ServerIp }) {
  return (
    <div className="group relative bg-white border border-slate-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all">
      <div className="p-4 flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-slate-900">
              {server.instance}
            </span>
          </div>

          <div className="text-sm text-slate-600 font-mono">
            {server.ipAddress}
          </div>

          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Clock className="w-3 h-3" />
            {formatTimestampForDisplay(server.lastUpdated)}
          </div>
        </div>
      </div>
    </div>
  );
}

function ServerIpList({ servers }: { servers: ServerIp[] }) {
  return (
    <div className="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
      {servers.map((server) => (
        <ServerIpCard key={server.instance} server={server} />
      ))}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="text-center py-12">
      <div className="inline-block w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      <p className="mt-3 text-sm text-slate-500">Loading server IPs...</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12 bg-slate-50/50 rounded-xl border-2 border-dashed border-slate-200">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
        <Globe className="w-8 h-8 text-slate-400" />
      </div>

      <p className="text-sm font-medium text-slate-600 mb-1">
        No server IPs found
      </p>

      <p className="text-xs text-slate-500">
        IP data will appear once servers report status
      </p>
    </div>
  );
}

// -------------------- MAIN COMPONENT --------------------

export default function ServerIpsPanel() {
  const { servers, loading, error, reload } = useServerIps();

  return (
    <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-white to-blue-50/30">
      <CardContent className="p-6">
        <PageHeader serverCount={servers.length} />

        <RefreshButton onRefresh={reload} loading={loading} />

        {error && <ErrorAlert message={error} />}

        {loading ? (
          <LoadingState />
        ) : servers.length > 0 ? (
          <ServerIpList servers={servers} />
        ) : (
          <EmptyState />
        )}
      </CardContent>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </Card>
  );
}