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
import { Trash2, Plus } from "lucide-react";
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
    try {
      if (keyFormat === "suffix" || keyFormat === "prefix" || keyFormat === "domain") {
        const arr = await apiGet<string[]>(listPath);        // ✅ goes through /bff
        setRows((Array.isArray(arr) ? arr : []).map(parseKey));
      } else {
        const data = await apiGet<Item[]>(listPath);         // ✅ goes through /bff
        setRows(data);
      }
    } catch (e) {
      console.error("Failed to load scope set:", e);
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

    if (transport === "query") {
      const qs = new URLSearchParams({ domain });
      if (entity) qs.set("entity", entity);

      // ✅ /bff prefix added inside apiPost
      await apiPost(`${addPath}?${qs.toString()}`, undefined, { method: "POST" });
    } else {
      await apiPost(addPath, { domain, entity: entity ?? null });
    }

    setDomain("");
    setEntity(undefined);
    await load();
  };

  const remove = async (d: string, e?: string | null) => {
    const qs = new URLSearchParams({ domain: d });
    if (e) qs.set("entity", e);

    // ✅ goes via BFF, hits /api/public/... on backend
    await apiDelete(`${delPath}?${qs.toString()}`);
    await load();
  };

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-2xl shadow-sm border">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-xs text-muted-foreground">
              Scope optionally narrowed by entity
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="grid gap-1">
              <Label className="text-xs text-muted-foreground">Domain</Label>
              <Input
                placeholder="example.gov"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
              />
            </div>
            {supportsEntity && (
              <div className="grid gap-1">
                <Label className="text-xs text-muted-foreground">
                  Entity (optional)
                </Label>
                <Select
                  value={entity ?? undefined}
                  onValueChange={(v) =>
                    setEntity(v === "__ANY__" ? undefined : (v as CrawledEntity))
                  }
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__ANY__">Any</SelectItem>
                    {ENTITY_OPTIONS.map((v) => (
                      <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex items-end">
              <Button onClick={add}>
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-sm text-muted-foreground border rounded-xl p-6 text-center">
            Loading...
          </div>
        ) : rows.length ? (
          <div className="grid gap-2">
            {rows.map((r, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between border rounded-xl px-3 py-2"
              >
                <div className="text-sm">
                  <span className="font-medium">{r.domain}</span>{" "}
                  <span className="text-muted-foreground">
                    {r.entity || (supportsEntity ? "Any" : "")}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(r.domain, r.entity || undefined)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground border rounded-xl p-6 text-center">
            No data yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}