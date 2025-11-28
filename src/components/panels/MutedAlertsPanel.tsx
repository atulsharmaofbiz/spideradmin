import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";

async function http<T = any>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...init });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return (await res.json().catch(() => ({}))) as T;
}

export default function MutedPatternsPanel() {
  const [rows, setRows] = useState<string[]>([]);
  const [pattern, setPattern] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => { setLoading(true); try { const data = await http<string[]>('/bff/alerts/mute-patterns'); setRows(Array.isArray(data) ? data : []); } catch { setRows([]); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);

  const add = async () => { if (!pattern.trim()) return; const qs = new URLSearchParams({ pattern: pattern.trim() }); await fetch(`bff/alerts/mute-patterns?${qs}`, { method: 'POST' }); setPattern(''); await load(); };
  const remove = async (p: string) => { const qs = new URLSearchParams({ pattern: p }); await fetch(`/bff/alerts/mute-patterns?${qs}`, { method: 'DELETE' }); await load(); };

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-4"><div className="p-2 rounded-2xl shadow-sm border"><svg className="w-5 h-5"/></div><div><h3 className="text-lg font-semibold">Muted Alert Patterns</h3><p className="text-xs text-muted-foreground">Strings that will mute matching alerts</p></div></div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="grid gap-1"><Label className="text-xs text-muted-foreground">Pattern (substring)</Label><Input value={pattern} onChange={(e) => setPattern(e.target.value)} placeholder="timeout" /></div>
            <div className="flex items-end"><Button onClick={add}><Plus className="w-4 h-4 mr-1" /> Add</Button></div>
          </div>
        </div>
        {loading ? <div className="text-sm text-muted-foreground border rounded-xl p-6 text-center">Loading...</div> : rows.length ? (
          <div className="grid gap-2">{rows.map((p,i)=> <div key={i} className="flex items-center justify-between border rounded-xl px-3 py-2"><div className="text-sm font-medium">{p}</div><Button variant="ghost" size="icon" onClick={()=>remove(p)}><Trash2 className="w-4 h-4"/></Button></div>)}</div>
        ) : <div className="text-sm text-muted-foreground border rounded-xl p-6 text-center">No data yet.</div>}
      </CardContent>
    </Card>
  );
}