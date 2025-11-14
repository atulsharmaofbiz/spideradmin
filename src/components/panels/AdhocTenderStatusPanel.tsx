import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Database } from "lucide-react";

export default function AdhocTenderStatusPanel() {
  const [sourceTenderId, setSourceTenderId] = useState("");
  const [domain, setDomain] = useState("");
  const [group, setGroup] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const submit = async () => {
    if (!sourceTenderId || !domain) return;
    const qs = new URLSearchParams({ sourceTenderId, domain, group });
    const res = await fetch(`/api/public/add-adhoc-tender-status-task?${qs}`, { method: "POST" });
    setMsg(await res.text());
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex gap-3 items-center">
          <div className="p-2 border rounded-xl"><Database className="w-5 h-5"/></div>
          <div>
            <h3 className="text-lg font-semibold">Adhoc Tender Status Task</h3>
            <p className="text-xs text-muted-foreground">Manually trigger tender status pull</p>
          </div>
        </div>

        <div className="grid gap-3">
          <div className="grid gap-1">
            <Label>Source Tender ID</Label>
            <Input value={sourceTenderId} onChange={e=>setSourceTenderId(e.target.value)} />
          </div>
          <div className="grid gap-1">
            <Label>Domain</Label>
            <Input value={domain} onChange={e=>setDomain(e.target.value)} />
          </div>
          <div className="grid gap-1">
            <Label>Group (optional)</Label>
            <Input value={group} onChange={e=>setGroup(e.target.value)} />
          </div>

          <Button onClick={submit}>Submit</Button>
          {msg && <div className="text-sm text-muted-foreground border p-2 rounded">{msg}</div>}
        </div>
      </CardContent>
    </Card>
  );
}