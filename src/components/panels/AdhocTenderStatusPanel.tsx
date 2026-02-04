import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Database,
  Loader2,
  Rocket,
  CheckCircle2,
  AlertCircle,
  Zap,
} from "lucide-react";

type UiMessage = {
  type: "success" | "error";
  text: string;
};

export default function AdhocTenderStatusPanel() {
  const [idsText, setIdsText] = useState("");
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<UiMessage | null>(null);

  // -----------------------------
  // Submit Handler
  // -----------------------------
  const submit = async () => {
    setMessage(null);

    const list = idsText
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean);

    if (!list.length) {
      setMessage({
        type: "error",
        text: "Enter at least one sourceTenderId",
      });
      return;
    }

    if (!domain.trim()) {
      setMessage({
        type: "error",
        text: "Domain is required",
      });
      return;
    }

    setLoading(true);

    try {
      const qs = new URLSearchParams();
      qs.append("domain", domain.trim());
      list.forEach((id) => qs.append("sourceTenderIds", id));

      const res = await fetch(`/bff/inject-adhoc-tender-status?${qs}`, {
        method: "POST",
        credentials: "include",
      });

      const text = await res.text();

      if (!res.ok) throw new Error(text);

      setMessage({
        type: "success",
        text: text || "Tasks injected successfully",
      });

      setIdsText("");
    } catch (e: any) {
      setMessage({
        type: "error",
        text: e?.message || "Server request failed",
      });
    } finally {
      setLoading(false);
    }
  };

  const isValid =
    idsText.trim().length > 0 && domain.trim().length > 0 && !loading;

  return (
    <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-white to-indigo-50/30">
      <CardContent className="p-6">

        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-blue-500/20 blur-xl rounded-full" />
            <div className="relative p-3 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-600 shadow-lg">
              <Database className="w-6 h-6 text-white" />
            </div>
          </div>

          <div className="flex-1">
            <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-900 to-blue-700 bg-clip-text text-transparent mb-1">
              Inject Adhoc Tender Status Tasks
            </h3>

            <p className="text-sm text-slate-500 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5" />
              Enqueue multiple tender-status crawl jobs instantly
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-4">

          {/* Tender IDs */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              Source Tender IDs
            </Label>

            <textarea
              rows={6}
              value={idsText}
              onChange={(e) => setIdsText(e.target.value)}
              placeholder="GEM/2024/12345&#10;T67899&#10;GEM/99999"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-mono hover:border-indigo-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors resize-none"
            />

            <p className="text-xs text-slate-400">
              One tender ID per line
            </p>
          </div>

          {/* Domain */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Domain
            </Label>

            <Input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="gem.gov.in"
              className="h-11 border-slate-300 bg-white hover:border-indigo-400 focus:border-indigo-500 focus:ring-indigo-500/20 transition-colors"
            />
          </div>

          {/* Message */}
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

              <div>
                <p
                  className={`text-sm font-medium ${
                    message.type === "error"
                      ? "text-red-900"
                      : "text-emerald-900"
                  }`}
                >
                  {message.type === "error" ? "Error" : "Success"}
                </p>

                <p
                  className={`text-sm mt-0.5 ${
                    message.type === "error"
                      ? "text-red-700"
                      : "text-emerald-700"
                  }`}
                >
                  {message.text}
                </p>
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="pt-2">
            <Button
              onClick={submit}
              disabled={!isValid}
              className="w-full h-12 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-lg shadow-indigo-500/30 transition-all hover:shadow-xl hover:shadow-indigo-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none font-semibold text-base"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Injecting Tasks...
                </>
              ) : (
                <>
                  <Rocket className="w-5 h-5 mr-2" />
                  Inject Tasks
                </>
              )}
            </Button>
          </div>

          {/* Footer Tip */}
          <div className="pt-2 px-1">
            <p className="text-xs text-slate-500 leading-relaxed">
              💡 This will enqueue tender-status crawl jobs for the supplied IDs
              immediately.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
