import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Smartphone,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Shield,
} from "lucide-react";

type IrepsRow = {
  mobile: string;
  otp: string;
};

type UiMessage = {
  type: "success" | "error";
  text: string;
};

export default function IrepsOtpPanel() {
  const [rows, setRows] = useState<IrepsRow[]>([]);
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<UiMessage | null>(null);

  // ------------------------
  // Load OTPs
  // ------------------------
  const load = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/bff/ireps/otp");
      if (!res.ok) throw new Error(`${res.status}`);

      const data: Record<string, string> = await res.json();

      const mapped: IrepsRow[] = Object.entries(data || {}).map(
        ([mobileKey, otpValue]) => ({
          mobile: mobileKey,
          otp: otpValue,
        })
      );

      setRows(mapped);
    } catch {
      setRows([]);
      setMessage({
        type: "error",
        text: "Failed to load OTP values",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // ------------------------
  // Update OTP
  // ------------------------
  const update = async () => {
    if (!mobile.trim() || !otp.trim()) {
      setMessage({
        type: "error",
        text: "Mobile and OTP are required",
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const qs = new URLSearchParams({ mobile, otp });

      const res = await fetch(`/bff/ireps/otp?${qs}`, {
        method: "PUT",
      });

      if (!res.ok) throw new Error(await res.text());

      setMobile("");
      setOtp("");
      await load();

      setMessage({
        type: "success",
        text: "OTP updated successfully",
      });
    } catch (e: any) {
      setMessage({
        type: "error",
        text: e?.message || "Failed to update OTP",
      });
    } finally {
      setLoading(false);
    }
  };

  const isValid = mobile.trim() && otp.trim() && !loading;

  // ------------------------
  // UI
  // ------------------------
  return (
    <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-white to-purple-50/30">
      <CardContent className="p-6">

        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 blur-xl rounded-full" />
            <div className="relative p-3 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
          </div>

          <div className="flex-1">
            <h3 className="text-xl font-bold bg-gradient-to-r from-purple-900 to-indigo-700 bg-clip-text text-transparent mb-1">
              IREPS OTP Manager
            </h3>
            <p className="text-sm text-slate-500 flex items-center gap-2">
              <Shield className="w-3.5 h-3.5" />
              Manage OTP values for IREPS authentication
            </p>
          </div>

          {/* Count */}
          <div className="text-right">
            <div className="text-2xl font-bold text-slate-900">
              {rows.length}
            </div>
            <div className="text-xs text-slate-500 uppercase tracking-wide">
              Stored OTPs
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="mb-6 p-4 bg-gradient-to-r from-slate-50 to-purple-50/30 rounded-xl border border-slate-200/60">
          <div className="grid grid-cols-1 md:grid-cols-[1fr,1fr,auto] gap-3">

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Mobile
              </Label>

              <Input
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="9999999999"
                className="h-11 border-slate-300 focus:border-purple-500 focus:ring-purple-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                OTP
              </Label>

              <Input
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                className="h-11 border-slate-300 focus:border-purple-500 focus:ring-purple-500/20"
              />
            </div>

            <div className="flex items-end">
              <Button
                onClick={update}
                disabled={!isValid}
                className="h-11 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update OTP"
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-4 p-4 rounded-lg border-2 flex items-start gap-3 animate-in slide-in-from-top-2 ${
              message.type === "error"
                ? "bg-red-50 border-red-200"
                : "bg-emerald-50 border-emerald-200"
            }`}
          >
            {message.type === "error" ? (
              <AlertCircle className="w-5 h-5 text-red-600" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            )}

            <div>
              <p className="text-sm font-semibold">
                {message.type === "error" ? "Error" : "Success"}
              </p>
              <p className="text-sm">{message.text}</p>
            </div>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-600" />
            <p className="text-sm text-slate-500">Loading OTPs...</p>
          </div>
        ) : rows.length ? (
          <div className="space-y-2">
            {rows.map((r, i) => (
              <div
                key={i}
                className="group bg-white border border-slate-200 rounded-lg p-3 hover:border-purple-300 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">
                    {r.mobile}
                  </span>

                  <span className="text-xs font-mono text-slate-500">
                    OTP: {r.otp}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-slate-50/50 rounded-xl border-2 border-dashed border-slate-200">
            <Smartphone className="w-10 h-10 mx-auto text-slate-400 mb-3" />
            <p className="text-sm font-medium text-slate-600">
              No OTPs Stored
            </p>
            <p className="text-xs text-slate-500">
              Add an OTP to begin authentication
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
