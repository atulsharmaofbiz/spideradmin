import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Smartphone } from "lucide-react";

type IrepsRow = {
  mobile: string;
  otp: string;
  lastUpdated?: string;
  failed?: boolean;
};

export default function IrepsOtpPanel() {
  const [rows, setRows] = useState<IrepsRow[]>([]);
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/bff/ireps/otp");
      if (!res.ok) throw new Error(`${res.status}`);
      const data: Record<string, any> = await res.json();

      const mapped: IrepsRow[] = Object.entries(data || {}).map(
        ([mobileKey, value]) => {
          if (typeof value === "string") {
            return { mobile: mobileKey, otp: value };
          }

          const otp = value?.otp ?? "";
          const failed = value?.failed ?? false;
          let lastUpdated: string | undefined;

          if (value?.lastUpdated) {
  const ts = Number(value.lastUpdated);
  if (!Number.isNaN(ts)) {
    lastUpdated = new Date(ts).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
}


          return {
            mobile: mobileKey,
            otp,
            failed,
            lastUpdated,
          };
        }
      );

      setRows(mapped);
    } catch (e) {
      setRows([]);
      console.error("Failed to load IREPS OTPs", e);
      setMsg("Error loading IREPS OTP info");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const update = async () => {
    if (!mobile || !otp) return setMsg("mobile and otp are required");
    setMsg(null);
    try {
      const qs = new URLSearchParams({ mobile, otp });
      const res = await fetch(`/bff/ireps/otp?${qs}`, { method: "PUT" });
      if (!res.ok) throw new Error(await res.text());
      setMobile("");
      setOtp("");
      await load();
      setMsg("OTP updated");
    } catch (e: any) {
      setMsg(typeof e === "string" ? e : e.message || "Error updating OTP");
    }
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 border rounded-xl">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">IREPS OTP</h3>
            <p className="text-xs text-muted-foreground">
              Manage OTP values used for IREPS interactions
            </p>
          </div>
        </div>

        <div className="flex gap-3 items-end">
          <div className="grid gap-1">
            <Label>Mobile</Label>
            <Input
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="9999999999"
            />
          </div>
          <div className="grid gap-1">
            <Label>OTP</Label>
            <Input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="123456"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={update} disabled={loading}>
              {loading ? "Updating..." : "Update"}
            </Button>
          </div>
        </div>

        {msg && (
          <div className="text-sm text-muted-foreground border rounded p-2">
            {msg}
          </div>
        )}

        {loading ? (
          <div className="text-sm text-muted-foreground border rounded-xl p-6 text-center">
            Loading...
          </div>
        ) : rows.length ? (
          <div className="grid gap-2">
            {rows.map((r, i) => (
              <div
  key={i}
  className="border rounded-xl p-2 text-sm flex justify-between items-center"
>
  <div>
    <div className="font-medium">{r.mobile}</div>
    {r.lastUpdated && (
      <div className="text-[11px] text-muted-foreground">
        Last updated: {r.lastUpdated}
      </div>
    )}
  </div>
  <div className="text-right">
    <div className="text-xs text-muted-foreground">
      OTP: {r.otp || "-"}
    </div>
  </div>
</div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground border rounded-xl p-6 text-center">
            No OTPs stored.
          </div>
        )}
      </CardContent>
    </Card>
  );
}