import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectValue, SelectItem } from "@/components/ui/select";
import { BugPlay } from "lucide-react";

const INSTANCE_OPTIONS = ["INDIAN", "GLOBAL"] as const;

type InstanceOpt = (typeof INSTANCE_OPTIONS)[number];

export default function ProviderCrawlPanel() {
  const [provider, setProvider] = useState("");
  const [entity, setEntity] = useState<string>("");
  const [group, setGroup] = useState("");
  const [instance, setInstance] = useState<InstanceOpt | undefined>(undefined);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setMsg(null);
    if (!provider.trim() || !entity || !instance) {
      return setMsg("provider, entity and instance are required");
    }

    setLoading(true);
    try {
      const qs = new URLSearchParams({ provider: provider.trim(), entity, group: group || "", instance });
      const res = await fetch(`/bff/inject-provider?${qs.toString()}`, { method: "POST" });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const data = await res.json();
      if (data && typeof data === "object") {
        if (data.ok) setMsg(`Success: ${data.message || JSON.stringify(data)}`);
        else setMsg(`Error: ${data.error || JSON.stringify(data)}`);
      } else {
        setMsg("Unexpected response from server");
      }
    } catch (e: any) {
      setMsg(e?.message || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex gap-3 items-center">
          <div className="p-2 border rounded-xl"><BugPlay className="w-5 h-5"/></div>
          <div>
            <h3 className="text-lg font-semibold">Inject Provider Crawl Task</h3>
            <p className="text-xs text-muted-foreground">Force-run a provider crawling job (calls /inject-provider)</p>
          </div>
        </div>

        <div className="grid gap-3">
          <div className="grid gap-1">
            <Label>Provider</Label>
            <Input value={provider} onChange={e=>setProvider(e.target.value)} placeholder="gem" />
          </div>

          <div className="grid gap-1">
            <Label>Entity</Label>
            <Select value={entity} onValueChange={setEntity}>
              <SelectTrigger><SelectValue placeholder="Select entity" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="TENDER">TENDER</SelectItem>
                <SelectItem value="BID_AWARD">BID_AWARD</SelectItem>
                <SelectItem value="CORRIGENDUM">CORRIGENDUM</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1">
            <Label>Group (optional)</Label>
            <Input value={group} onChange={e=>setGroup(e.target.value)} placeholder="0" />
          </div>

          <div className="grid gap-1">
            <Label>Instance</Label>
            <Select value={instance ?? undefined} onValueChange={(v)=> setInstance(v as InstanceOpt)}>
              <SelectTrigger><SelectValue placeholder="Select instance" /></SelectTrigger>
              <SelectContent>
                {INSTANCE_OPTIONS.map(i => (<SelectItem key={i} value={i}>{i}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={submit} disabled={loading}>{loading ? 'Submitting...' : 'Submit'}</Button>
            {msg && <div className="text-sm text-muted-foreground border p-2 rounded">{msg}</div>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}