import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, AlertCircle, BellOff } from "lucide-react";

async function http<T = any>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

  return (await res.json().catch(() => ({}))) as T;
}

export default function MutedPatternsPanel() {
  const [rows, setRows] = useState<string[]>([]);
  const [pattern, setPattern] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // -------------------------
  // Load Patterns
  // -------------------------
  const load = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await http<string[]>("/bff/alerts/mute-patterns");
      setRows(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError("Failed to load patterns");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // -------------------------
  // Add Pattern
  // -------------------------
  const add = async () => {
    if (!pattern.trim()) return;

    try {
      const qs = new URLSearchParams({ pattern: pattern.trim() });

      await fetch(`/bff/alerts/mute-patterns?${qs}`, {
        method: "POST",
      });

      setPattern("");
      await load();
    } catch (e: any) {
      setError("Failed to add pattern");
    }
  };

  // -------------------------
  // Remove Pattern
  // -------------------------
  const remove = async (p: string) => {
    try {
      const qs = new URLSearchParams({ pattern: p });

      await fetch(`/bff/alerts/mute-patterns?${qs}`, {
        method: "DELETE",
      });

      await load();
    } catch (e: any) {
      setError("Failed to remove pattern");
    }
  };

  return (
    <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-white to-slate-50/50">
      <CardContent className="p-6">

        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-rose-500/20 to-orange-500/20 blur-xl rounded-full" />
            <div className="relative p-3 rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 shadow-lg">
              <BellOff className="w-6 h-6 text-white" />
            </div>
          </div>

          <div className="flex-1">
            <h3 className="text-xl font-bold text-slate-900 mb-1">
              Muted Alert Patterns
            </h3>
            <p className="text-sm text-slate-500">
              Strings that will mute matching alerts
            </p>
          </div>

          <div className="text-right">
            <div className="text-2xl font-bold text-slate-900">
              {rows.length}
            </div>
            <div className="text-xs text-slate-500 uppercase tracking-wide">
              Patterns
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 animate-in slide-in-from-top-2">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Add Form */}
        <div className="mb-6 p-4 bg-gradient-to-r from-slate-50 to-rose-50/30 rounded-xl border border-slate-200/60">
          <div className="grid grid-cols-1 md:grid-cols-[2fr,auto] gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Pattern (substring)
              </Label>

              <Input
                placeholder="timeout"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && add()}
                className="h-10 border-slate-300 focus:border-rose-500 focus:ring-rose-500/20"
              />
            </div>

            <div className="flex items-end">
              <Button
                onClick={add}
                disabled={!pattern.trim()}
                className="h-10 px-6 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white shadow-lg shadow-rose-500/30"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </div>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-3 border-rose-200 border-t-rose-600 rounded-full animate-spin" />
            <p className="mt-3 text-sm text-slate-500">
              Loading patterns...
            </p>
          </div>
        ) : rows.length ? (
          <div className="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
            {rows.map((p, i) => (
              <div
                key={`${p}-${i}`}
                className="group bg-white border border-slate-200 rounded-lg hover:border-rose-300 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between p-3">
                  <span className="font-medium text-slate-900">
                    {p}
                  </span>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(p)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-slate-50/50 rounded-xl border-2 border-dashed border-slate-200">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
              <BellOff className="w-8 h-8 text-slate-400" />
            </div>

            <p className="text-sm font-medium text-slate-600 mb-1">
              No muted patterns configured
            </p>

            <p className="text-xs text-slate-500">
              Add patterns to suppress unwanted alerts
            </p>
          </div>
        )}
      </CardContent>

      {/* Scrollbar Styling */}
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
