import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Database } from "lucide-react";

export default function AdhocTenderStatusPanel() {
  const [idsText, setIdsText] = useState("");
  const [domain, setDomain] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setMsg(null);

    const list = idsText
      .split("\n")
      .map((x) => x.trim())
      .filter((x) => x.length > 0);

    if (!list.length) {
      setMsg("Enter at least one sourceTenderId");
      return;
    }
    if (!domain.trim()) {
      setMsg("Domain is required");
      return;
    }

    setLoading(true);
    try {
      const qs = new URLSearchParams({ domain: domain.trim() });
      const res = await fetch(`/bff/inject-adhoc-tender-status?${qs}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(list)
      });

      const text = await res.text();

      if (!res.ok) throw new Error(text);

      setMsg(text);
    } catch (e: any) {
      setMsg(e?.message || "Error calling server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex gap-3 items-center mb-2">
          <div className="p-2 border rounded-xl">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Inject Adhoc Tender Status Tasks</h3>
            <p className="text-xs text-muted-foreground">
              Enqueue multiple tender-status jobs (POST /inject-adhoc-tender-status)
            </p>
          </div>
        </div>

        <div className="grid gap-3">
          <div className="grid gap-1">
            <Label>Source Tender IDs (one per line)</Label>
            <textarea
              className="border rounded-xl p-2 text-sm bg-white text-black"
              rows={6}
              placeholder="T12345&#10;T67899&#10;GEM/12345"
              value={idsText}
              onChange={(e) => setIdsText(e.target.value)}
            />
          </div>

          <div className="grid gap-1">
            <Label>Domain</Label>
            <Input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="gem.gov.in"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={submit} disabled={loading}>
              {loading ? "Submitting..." : "Submit"}
            </Button>
            {msg && (
              <div className="text-sm text-muted-foreground border p-2 rounded">
                {msg}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
