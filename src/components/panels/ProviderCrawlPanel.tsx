import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectValue,
  SelectItem,
} from "@/components/ui/select";
import { BugPlay } from "lucide-react";

import { fetchProviders,injectProvider,INSTANCE_OPTIONS, InstanceOpt,EntityType } from "@/lib/provider";

//Types

type CrawlForm = {
  provider?: string;
  entity?: EntityType;
  instance?: InstanceOpt;
  group?: string;
};

type UiMessage = {
  type: "success" | "error";
  text: string;
};

// Component

export default function ProviderCrawlPanel() {
  const [providers, setProviders] = useState<string[]>([]);
  const [form, setForm] = useState<CrawlForm>({});
  const [message, setMessage] = useState<UiMessage | null>(null);

  const [loadingProviders, setLoadingProviders] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  //Fetch Providers

  useEffect(() => {
    let mounted = true;

    setLoadingProviders(true);
    fetchProviders()
      .then((data) => {
        if (mounted) setProviders(data);
      })
      .catch(() => {
        if (mounted) {
          setProviders([]);
          setMessage({
            type: "error",
            text: "Failed to load providers",
          });
        }
      })
      .finally(() => {
        if (mounted) setLoadingProviders(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  //Validation 

  const isValid =
    !!form.provider && !!form.entity && !!form.instance && !submitting;

  // Submit 

  const submit = async () => {
    setMessage(null);

    if (!form.provider || !form.entity || !form.instance) {
      setMessage({
        type: "error",
        text: "Provider, entity, and instance are required",
      });
      return;
    }

    const normalizedGroup =
      form.group?.trim() === "" ? undefined : form.group?.trim();

    setSubmitting(true);

    try {
      const result = await injectProvider({
        provider: form.provider,
        entity: form.entity,
        instance: form.instance,
        ...(normalizedGroup && { group: normalizedGroup }),
      });

      if (result.ok) {
        setMessage({
          type: "success",
          text: result.message ?? "Task triggered successfully",
        });
      } else {
        setMessage({
          type: "error",
          text: result.error ?? "Unknown server error",
        });
      }
    } catch (e: unknown) {
      if (e instanceof Error) {
        setMessage({ type: "error", text: e.message });
      } else {
        setMessage({ type: "error", text: "Request failed" });
      }
    } finally {
      setSubmitting(false);
    }
  };

  // UI 

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex gap-3 items-center">
          <div className="p-2 border rounded-xl">
            <BugPlay className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">
              Inject Provider Crawl Task
            </h3>
            <p className="text-xs text-muted-foreground">
              Force-run a provider crawling job
            </p>
          </div>
        </div>

        <div className="grid gap-3">
          {/* Provider */}
          <div className="grid gap-1">
            <Label>Provider</Label>
            <Select
              value={form.provider}
              disabled={loadingProviders || providers.length === 0}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, provider: v }))
              }
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    loadingProviders
                      ? "Loading providers..."
                      : providers.length === 0
                      ? "No providers available"
                      : "Select provider"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {providers.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Entity */}
          <div className="grid gap-1">
            <Label>Entity</Label>
            <Select
              value={form.entity}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, entity: v as EntityType }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select entity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TENDER">TENDER</SelectItem>
                <SelectItem value="BID_AWARD">BID_AWARD</SelectItem>
                <SelectItem value="CORRIGENDUM">CORRIGENDUM</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Group */}
          <div className="grid gap-1">
            <Label>Group (optional)</Label>
            <Input
              value={form.group ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, group: e.target.value }))
              }
              placeholder="e.g. 0"
            />
          </div>

          {/* Instance */}
          <div className="grid gap-1">
            <Label>Instance</Label>
            <Select
              value={form.instance}
              onValueChange={(v) => {
                if (INSTANCE_OPTIONS.includes(v as InstanceOpt)) {
                  setForm((f) => ({ ...f, instance: v as InstanceOpt }));
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select instance" />
              </SelectTrigger>
              <SelectContent>
                {INSTANCE_OPTIONS.map((i) => (
                  <SelectItem key={i} value={i}>
                    {i}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button onClick={submit} disabled={!isValid}>
              {submitting ? "Submitting..." : "Submit"}
            </Button>

            {message && (
              <div
                className={`text-sm border p-2 rounded ${
                  message.type === "error"
                    ? "border-red-500 text-red-600"
                    : "border-green-500 text-green-600"
                }`}
              >
                {message.text}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}