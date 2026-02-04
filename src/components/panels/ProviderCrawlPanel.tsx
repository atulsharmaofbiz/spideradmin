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
import {
  BugPlay,
  Rocket,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Zap,
} from "lucide-react";

import {
  fetchProviders,
  injectProvider,
  INSTANCE_OPTIONS,
  InstanceOpt,
  EntityType,
} from "@/lib/provider";

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

export default function ProviderCrawlPanel() {
  const [providers, setProviders] = useState<string[]>([]);
  const [form, setForm] = useState<CrawlForm>({});
  const [message, setMessage] = useState<UiMessage | null>(null);

  const [loadingProviders, setLoadingProviders] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;

    setLoadingProviders(true);
    fetchProviders()
      .then((data) => {
        if (mounted) {
          const sorted = [...data].sort((a, b) => a.localeCompare(b));
          setProviders(sorted);
        }
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

  const isValid =
    !!form.provider && !!form.entity && !!form.instance && !submitting;

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
        // Reset form on success
        setForm({ group: "" });
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

  return (
    <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-white to-purple-50/30">
      <CardContent className="p-6">
        {/* Header Section */}
        <div className="flex items-start gap-4 mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 blur-xl rounded-full" />
            <div className="relative p-3 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 shadow-lg">
              <BugPlay className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold bg-gradient-to-r from-purple-900 to-pink-700 bg-clip-text text-transparent mb-1">
              Inject Provider Crawl Task
            </h3>
            <p className="text-sm text-slate-500 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5" />
              Force-run a provider crawling job instantly
            </p>
          </div>
        </div>

        {/* Form Section */}
        <div className="space-y-4">
          {/* Provider Selection */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
              Provider
            </Label>
            <Select
              value={form.provider}
              disabled={loadingProviders || providers.length === 0}
              onValueChange={(v) => setForm((f) => ({ ...f, provider: v }))}
            >
              <SelectTrigger className="h-11 border-slate-300 bg-white hover:border-purple-400 focus:border-purple-500 focus:ring-purple-500/20 transition-colors">
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
              <SelectContent className="max-h-60 overflow-y-auto">
                {providers.map((p) => (
                  <SelectItem key={p} value={p} className="cursor-pointer">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                      <span className="font-medium">{p}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Entity Selection */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Entity
            </Label>
            <Select
              value={form.entity}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, entity: v as EntityType }))
              }
            >
              <SelectTrigger className="h-11 border-slate-300 bg-white hover:border-blue-400 focus:border-blue-500 focus:ring-blue-500/20 transition-colors">
                <SelectValue placeholder="Select entity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TENDER">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="font-medium">TENDER</span>
                  </div>
                </SelectItem>
                <SelectItem value="BID_AWARD">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="font-medium">BID_AWARD</span>
                  </div>
                </SelectItem>
                <SelectItem value="CORRIGENDUM">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="font-medium">CORRIGENDUM</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Group Input */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              Group
              <span className="text-slate-400 font-normal normal-case">(Optional)</span>
            </Label>
            <Input
              value={form.group ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, group: e.target.value }))}
              placeholder="e.g. 0"
              className="h-11 border-slate-300 bg-white hover:border-slate-400 focus:border-purple-500 focus:ring-purple-500/20 transition-colors"
            />
          </div>

          {/* Instance Selection */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              Instance
            </Label>
            <Select
              value={form.instance}
              onValueChange={(v) => {
                if (INSTANCE_OPTIONS.includes(v as InstanceOpt)) {
                  setForm((f) => ({ ...f, instance: v as InstanceOpt }));
                }
              }}
            >
              <SelectTrigger className="h-11 border-slate-300 bg-white hover:border-indigo-400 focus:border-indigo-500 focus:ring-indigo-500/20 transition-colors">
                <SelectValue placeholder="Select instance" />
              </SelectTrigger>
              <SelectContent>
                {INSTANCE_OPTIONS.map((i) => (
                  <SelectItem key={i} value={i}>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      <span className="font-medium">{i}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Message Display */}
          {message && (
            <div
              className={`flex items-start gap-3 p-4 rounded-lg border-2 animate-in slide-in-from-top-2 ${
                message.type === "error"
                  ? "bg-red-50 border-red-200"
                  : "bg-emerald-50 border-emerald-200"
              }`}
            >
              {message.type === "error" ? (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p
                  className={`text-sm font-medium ${
                    message.type === "error" ? "text-red-900" : "text-emerald-900"
                  }`}
                >
                  {message.type === "error" ? "Error" : "Success"}
                </p>
                <p
                  className={`text-sm mt-0.5 ${
                    message.type === "error" ? "text-red-700" : "text-emerald-700"
                  }`}
                >
                  {message.text}
                </p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <Button
              onClick={submit}
              disabled={!isValid}
              className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/30 transition-all hover:shadow-xl hover:shadow-purple-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none font-semibold text-base"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Triggering Task...
                </>
              ) : (
                <>
                  <Rocket className="w-5 h-5 mr-2" />
                  Inject Crawl Task
                </>
              )}
            </Button>
          </div>

          {/* Info Footer */}
          <div className="pt-2 px-1">
            <p className="text-xs text-slate-500 leading-relaxed">
              💡 This will immediately trigger a crawl job for the selected provider.
              Make sure all parameters are correct before submission.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}