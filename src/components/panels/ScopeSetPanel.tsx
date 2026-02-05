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

// TYPES

const ENTITY_OPTIONS = ["TENDER", "BID_AWARD", "CORRIGENDUM"] as const;

type CrawledEntity = (typeof ENTITY_OPTIONS)[number];

type Item = {
  domain: string;
  entity?: CrawledEntity | null;
};

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

// KEY PARSING STRATEGIES

function parseSuffixFormat(key: string): Item {
  for (const entity of ENTITY_OPTIONS) {
    const suffix = `_${entity}`;
    if (key.endsWith(suffix)) {
      return {
        domain: key.slice(0, -suffix.length),
        entity
      };
    }
  }
  return { domain: key };
}

function parsePrefixFormat(key: string): Item {
  const pipeIndex = key.indexOf("|");

  if (pipeIndex <= 0) {
    return { domain: key };
  }

  const possibleEntity = key.slice(0, pipeIndex);
  const domain = key.slice(pipeIndex + 1);

  const isValidEntity = ENTITY_OPTIONS.includes(possibleEntity as CrawledEntity);

  return isValidEntity
    ? { domain, entity: possibleEntity as CrawledEntity }
    : { domain: key };
}

function parseKey(key: string, format: string): Item {
  switch (format) {
    case "suffix":
      return parseSuffixFormat(key);
    case "prefix":
      return parsePrefixFormat(key);
    case "domain":
    case "none":
    default:
      return { domain: key };
  }
}

// API HELPERS

async function fetchDomains(listPath: string, keyFormat: string): Promise<Item[]> {
  const requiresParsing = ["suffix", "prefix", "domain"].includes(keyFormat);

  if (requiresParsing) {
    const keys = await apiGet<string[]>(listPath);
    const keysArray = Array.isArray(keys) ? keys : [];
    return keysArray.map((key) => parseKey(key, keyFormat));
  }

  return await apiGet<Item[]>(listPath);
}

async function addDomain(
  addPath: string,
  domain: string,
  entity: CrawledEntity | undefined,
  transport: "query" | "json"
): Promise<void> {
  if (transport === "query") {
    const params = new URLSearchParams({ domain });
    if (entity) params.set("entity", entity);
    await apiPost(`${addPath}?${params.toString()}`, undefined, { method: "POST" });
  } else {
    await apiPost(addPath, { domain, entity: entity ?? null });
  }
}

async function removeDomain(
  delPath: string,
  domain: string,
  entity?: string | null
): Promise<void> {
  const params = new URLSearchParams({ domain });
  if (entity) params.set("entity", entity);
  await apiDelete(`${delPath}?${params.toString()}`);
}

// ENTITY BADGE STYLING

const ENTITY_BADGE_COLORS: Record<string, string> = {
  TENDER: "bg-emerald-50 text-emerald-700 border-emerald-200",
  BID_AWARD: "bg-blue-50 text-blue-700 border-blue-200",
  CORRIGENDUM: "bg-amber-50 text-amber-700 border-amber-200",
  default: "bg-slate-100 text-slate-600 border-slate-200",
};

function getEntityBadgeColor(entity?: string | null): string {
  if (!entity) return ENTITY_BADGE_COLORS.default;
  return ENTITY_BADGE_COLORS[entity] ?? ENTITY_BADGE_COLORS.default;
}

// HOOKS

function useDomainList(listPath: string, keyFormat: string) {
  const [domains, setDomains] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchDomains(listPath, keyFormat);
      setDomains(data);
    } catch (e) {
      console.error("Failed to load scope set:", e);
      setError("Failed to load data");
      setDomains([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [listPath, keyFormat]);

  return { domains, loading, error, reload: load };
}

// UI COMPONENTS

function PageHeader({
  title,
  icon: Icon,
  domainCount
}: {
  title: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  domainCount: number;
}) {
  return (
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
        <div className="text-2xl font-bold text-slate-900">{domainCount}</div>
        <div className="text-xs text-slate-500 uppercase tracking-wide">Domains</div>
      </div>
    </div>
  );
}

function ErrorAlert({ message }: { message: string }) {
  return (
    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 animate-in slide-in-from-top-2">
      <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
      <p className="text-sm text-red-700">{message}</p>
    </div>
  );
}

function DomainForm({
  domain,
  entity,
  supportsEntity,
  onDomainChange,
  onEntityChange,
  onSubmit,
}: {
  domain: string;
  entity: CrawledEntity | undefined;
  supportsEntity: boolean;
  onDomainChange: (value: string) => void;
  onEntityChange: (value: CrawledEntity | undefined) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="mb-6 p-4 bg-gradient-to-r from-slate-50 to-indigo-50/30 rounded-xl border border-slate-200/60">
      <div className="grid grid-cols-1 md:grid-cols-[2fr,1.5fr,auto] gap-4 items-end">

        {/* Domain Input */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5" />
            Domain
          </Label>
          <Input
            placeholder="example.gov.in"
            value={domain}
            onChange={(e) => onDomainChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSubmit()}
            className="h-10 border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/20"
          />
        </div>

        {/* Entity Selection */}
        {supportsEntity && (
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
              Entity Type
            </Label>
            <Select
              value={entity ?? "__ANY__"}
              onValueChange={(v) =>
                onEntityChange(v === "__ANY__" ? undefined : (v as CrawledEntity))
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

        {/* Submit Button */}
        <div className="flex items-end">
          <Button
            onClick={onSubmit}
            disabled={!domain}
            className="h-10 px-6 w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/30 transition-all hover:shadow-xl hover:shadow-indigo-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}

function EntityBadge({
  entity,
  supportsEntity
}: {
  entity?: string | null;
  supportsEntity: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${getEntityBadgeColor(
        entity
      )}`}
    >
      {entity || (supportsEntity ? "All Entities" : "")}
    </span>
  );
}

function DomainListItem({
  domain,
  entity,
  supportsEntity,
  onRemove,
}: {
  domain: string;
  entity?: string | null;
  supportsEntity: boolean;
  onRemove: () => void;
}) {
  return (
    <div className="group relative overflow-hidden bg-white border border-slate-200 rounded-lg hover:border-indigo-300 hover:shadow-md transition-all duration-200">
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/0 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="relative flex items-center justify-between p-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-2 h-2 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/50 animate-pulse" />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-900 truncate">
                {domain}
              </span>
              <EntityBadge entity={entity} supportsEntity={supportsEntity} />
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {entity
                ? `Scoped to ${entity} entity`
                : "All entity types allowed"}
            </div>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function DomainList({
  domains,
  supportsEntity,
  onRemove,
}: {
  domains: Item[];
  supportsEntity: boolean;
  onRemove: (domain: string, entity?: string | null) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
          Configured Domains
        </h4>
      </div>
      <div className="max-h-96 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
        {domains.map((item, idx) => (
          <DomainListItem
            key={idx}
            domain={item.domain}
            entity={item.entity}
            supportsEntity={supportsEntity}
            onRemove={() => onRemove(item.domain, item.entity || undefined)}
          />
        ))}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="text-center py-12">
      <div className="inline-block w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      <p className="mt-3 text-sm text-slate-500">Loading domains...</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12 bg-slate-50/50 rounded-xl border-2 border-dashed border-slate-200">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
        <Globe className="w-8 h-8 text-slate-400" />
      </div>
      <p className="text-sm font-medium text-slate-600 mb-1">No domains configured</p>
      <p className="text-xs text-slate-500">Add your first domain to get started</p>
    </div>
  );
}

// -------------------- MAIN COMPONENT --------------------

export default function ScopeSetPanel({
  title,
  listPath,
  addPath,
  delPath,
  icon,
  keyFormat = "none",
  supportsEntity = true,
  transport = "query",
}: ScopeSetPanelProps) {
  const [domain, setDomain] = useState("");
  const [entity, setEntity] = useState<CrawledEntity | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const { domains, loading, reload } = useDomainList(listPath, keyFormat);

  const handleAdd = async () => {
    if (!domain) return;

    setError(null);

    try {
      await addDomain(addPath, domain, entity, transport);
      setDomain("");
      setEntity(undefined);
      await reload();
    } catch (e: any) {
      setError(e?.message || "Failed to add domain");
    }
  };

  const handleRemove = async (domainToRemove: string, entityToRemove?: string | null) => {
    setError(null);

    try {
      await removeDomain(delPath, domainToRemove, entityToRemove);
      await reload();
    } catch (e: any) {
      setError(e?.message || "Failed to remove domain");
    }
  };

  return (
    <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-white to-slate-50/50">
      <CardContent className="p-6">
        <PageHeader title={title} icon={icon} domainCount={domains.length} />

        {error && <ErrorAlert message={error} />}

        <DomainForm
          domain={domain}
          entity={entity}
          supportsEntity={supportsEntity}
          onDomainChange={setDomain}
          onEntityChange={setEntity}
          onSubmit={handleAdd}
        />

        {loading ? (
          <LoadingState />
        ) : domains.length > 0 ? (
          <DomainList
            domains={domains}
            supportsEntity={supportsEntity}
            onRemove={handleRemove}
          />
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