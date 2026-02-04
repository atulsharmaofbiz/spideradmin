import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Plus, AlertCircle, Shield, Globe } from "lucide-react";
import { apiGet, apiPost, apiDelete } from "@/lib/api";

const ENTITY_OPTIONS = ["TENDER", "BID_AWARD", "CORRIGENDUM"] as const;

type CrawledEntity = (typeof ENTITY_OPTIONS)[number];

type ScopeSetPanelProps = {
  title: string;
  listPath: string;
  addPath: string;
  delPath: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  keyFormat?: "none" | "suffix" | "prefix" | "domain";
  supportsEntity?: boolean;
  transport?: "query" | "json";
};

type Item = { domain: string; entity?: CrawledEntity | null };

export default function ScopeSetPanel({
  title,
  listPath,
  addPath,
  delPath,
  icon: Icon,
  keyFormat = "none",
  supportsEntity = true,
  transport = "query",
}: ScopeSetPanelProps) {
  const [rows, setRows] = useState<Item[]>([]);
  const [domain, setDomain] = useState("");
  const [entity, setEntity] = useState<CrawledEntity | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseKey = (key: string): Item => {
    if (keyFormat === "suffix") {
      for (const ent of ENTITY_OPTIONS) {
        const suf = "_" + ent;
        if (key.endsWith(suf)) return { domain: key.slice(0, -suf.length), entity: ent };
      }
      return { domain: key };
    }
    if (keyFormat === "prefix") {
      const pipe = key.indexOf("|");
      if (pipe > 0) {
        const maybeEnt = key.slice(0, pipe);
        const rest = key.slice(pipe + 1);
        if ((ENTITY_OPTIONS as readonly string[]).includes(maybeEnt)) {
          return { domain: rest, entity: maybeEnt as CrawledEntity };
        }
      }
      return { domain: key };
    }
    if (keyFormat === "domain") return { domain: key };
    return { domain: key } as Item;
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      if (keyFormat === "suffix" || keyFormat === "prefix" || keyFormat === "domain") {
        const arr = await apiGet<string[]>(listPath);
        setRows((Array.isArray(arr) ? arr : []).map(parseKey));
      } else {
        const data = await apiGet<Item[]>(listPath);
        setRows(data);
      }
    } catch (e) {
      console.error("Failed to load scope set:", e);
      setError("Failed to load data");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const add = async () => {
    if (!domain) return;
    setError(null);

    try {
      if (transport === "query") {
        const qs = new URLSearchParams({ domain });
        if (entity) qs.set("entity", entity);
        await apiPost(`${addPath}?${qs.toString()}`, undefined, { method: "POST" });
      } else {
        await apiPost(addPath, { domain, entity: entity ?? null });
      }

      setDomain("");
      setEntity(undefined);
      await load();
    } catch (e: any) {
      setError(e?.message || "Failed to add domain");
    }
  };

  const remove = async (d: string, e?: string | null) => {
    setError(null);
    try {
      const qs = new URLSearchParams({ domain: d });
      if (e) qs.set("entity", e);
      await apiDelete(`${delPath}?${qs.toString()}`);
      await load();
    } catch (e: any) {
      setError(e?.message || "Failed to remove domain");
    }
  };

  const getEntityBadgeColor = (entity?: string | null) => {
    if (!entity) return "bg-slate-100 text-slate-600 border-slate-200";
    switch (entity) {
      case "TENDER":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "BID_AWARD":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "CORRIGENDUM":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  return (
    <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-white to-slate-50/50">
      <CardContent className="p-6">
        {/* Header Section */}
        <div className="flex items-start gap-4 mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-xl rounded-full" />
            <div className="relative p-3 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
              <Icon className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-1">
              {title}
            </h3>
            <p className="text-sm text-slate-500 flex items-center gap-2">
              <Shield className="w-3.5 h-3.5" />
              Domain scope management with optional entity filtering
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-slate-900">{rows.length}</div>
            <div className="text-xs text-slate-500 uppercase tracking-wide">Domains</div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 animate-in slide-in-from-top-2">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Add Domain Form */}
        <div className="mb-6 p-4 bg-gradient-to-r from-slate-50 to-indigo-50/30 rounded-xl border border-slate-200/60">
          <div className="grid grid-cols-1 md:grid-cols-[2fr,1.5fr,auto] gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                Domain
              </Label>
              <Input
                placeholder="example.gov.in"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="h-10 border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/20"
                onKeyDown={(e) => e.key === "Enter" && add()}
              />
            </div>

            {supportsEntity && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  Entity Type
                </Label>
                <Select
                  value={entity ?? "__ANY__"}
                  onValueChange={(v) =>
                    setEntity(v === "__ANY__" ? undefined : (v as CrawledEntity))
                  }
                >
                  <SelectTrigger className="h-10 border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/20">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__ANY__">
                      <span className="text-slate-500">Any Entity</span>
                    </SelectItem>
                    {ENTITY_OPTIONS.map((v) => (
                      <SelectItem key={v} value={v}>
                        <span className="font-medium">{v}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-end">
              <Button
                onClick={add}
                disabled={!domain}
                className="h-10 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/30 transition-all hover:shadow-xl hover:shadow-indigo-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </div>
          </div>
        </div>

        {/* Domain List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            <p className="mt-3 text-sm text-slate-500">Loading domains...</p>
          </div>
        ) : rows.length ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Configured Domains
              </h4>
            </div>
            <div className="max-h-96 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {rows.map((r, idx) => (
                <div
                  key={idx}
                  className="group relative overflow-hidden bg-white border border-slate-200 rounded-lg hover:border-indigo-300 hover:shadow-md transition-all duration-200"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/0 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative flex items-center justify-between p-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-2 h-2 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/50 animate-pulse" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-slate-900 truncate">
                            {r.domain}
                          </span>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${getEntityBadgeColor(
                              r.entity
                            )}`}
                          >
                            {r.entity || (supportsEntity ? "All Entities" : "")}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {r.entity
                            ? `Scoped to ${r.entity} entity`
                            : "All entity types allowed"}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(r.domain, r.entity || undefined)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-slate-50/50 rounded-xl border-2 border-dashed border-slate-200">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
              <Globe className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-600 mb-1">No domains configured</p>
            <p className="text-xs text-slate-500">Add your first domain to get started</p>
          </div>
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