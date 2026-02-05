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

// TYPES

type IrepsRow = {
  mobile: string;
  otp: string;
};

type UiMessage = {
  type: "success" | "error";
  text: string;
};

type OtpFormData = {
  mobile: string;
  otp: string;
};

// VALIDATION

function validateOtpForm(data: OtpFormData): string | null {
  if (!data.mobile.trim()) {
    return "Mobile number is required";
  }
  if (!data.otp.trim()) {
    return "OTP is required";
  }
  return null;
}

// DATA TRANSFORMATION

function transformOtpResponse(data: Record<string, string>): IrepsRow[] {
  return Object.entries(data || {}).map(([mobile, otp]) => ({
    mobile,
    otp,
  }));
}

// API

async function fetchOtps(): Promise<IrepsRow[]> {
  const response = await fetch("/bff/ireps/otp");

  if (!response.ok) {
    throw new Error(`Failed to fetch OTPs: ${response.status}`);
  }

  const data: Record<string, string> = await response.json();
  return transformOtpResponse(data);
}

async function updateOtp(mobile: string, otp: string): Promise<void> {
  const params = new URLSearchParams({ mobile, otp });

  const response = await fetch(`/bff/ireps/otp?${params}`, {
    method: "PUT",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Update failed: ${response.status}`);
  }
}

// HOOKS

function useOtpList() {
  const [otps, setOtps] = useState<IrepsRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchOtps();
      setOtps(data);
    } catch (e) {
      console.error("Failed to load OTPs:", e);
      setOtps([]);
      setError("Failed to load OTP values");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return { otps, loading, error, reload: load };
}

// UI COMPONENTS

function PageHeader({ otpCount }: { otpCount: number }) {
  return (
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

      <div className="text-right">
        <div className="text-2xl font-bold text-slate-900">{otpCount}</div>
        <div className="text-xs text-slate-500 uppercase tracking-wide">
          Stored OTPs
        </div>
      </div>
    </div>
  );
}

function FormField({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
        {label}
      </Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 border-slate-300 focus:border-purple-500 focus:ring-purple-500/20"
      />
    </div>
  );
}

function OtpForm({
  formData,
  loading,
  onFormChange,
  onSubmit,
}: {
  formData: OtpFormData;
  loading: boolean;
  onFormChange: (data: Partial<OtpFormData>) => void;
  onSubmit: () => void;
}) {
  const isValid = formData.mobile.trim() && formData.otp.trim() && !loading;

  return (
    <div className="mb-6 p-4 bg-gradient-to-r from-slate-50 to-purple-50/30 rounded-xl border border-slate-200/60">
      <div className="grid grid-cols-1 md:grid-cols-[1fr,1fr,auto] gap-3">
        <FormField
          label="Mobile"
          value={formData.mobile}
          placeholder="9999999999"
          onChange={(mobile) => onFormChange({ mobile })}
        />

        <FormField
          label="OTP"
          value={formData.otp}
          placeholder="123456"
          onChange={(otp) => onFormChange({ otp })}
        />

        <div className="flex items-end">
          <Button
            onClick={onSubmit}
            disabled={!isValid}
            className="h-11 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg disabled:opacity-50"
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
  );
}

function MessageAlert({ message }: { message: UiMessage }) {
  const isError = message.type === "error";
  const Icon = isError ? AlertCircle : CheckCircle2;
  const bgColor = isError ? "bg-red-50" : "bg-emerald-50";
  const borderColor = isError ? "border-red-200" : "border-emerald-200";
  const iconColor = isError ? "text-red-600" : "text-emerald-600";

  return (
    <div
      className={`mb-4 p-4 rounded-lg border-2 flex items-start gap-3 animate-in slide-in-from-top-2 ${bgColor} ${borderColor}`}
    >
      <Icon className={`w-5 h-5 ${iconColor}`} />
      <div>
        <p className="text-sm font-semibold">
          {isError ? "Error" : "Success"}
        </p>
        <p className="text-sm">{message.text}</p>
      </div>
    </div>
  );
}

function OtpListItem({ otp }: { otp: IrepsRow }) {
  return (
    <div className="group bg-white border border-slate-200 rounded-lg p-3 hover:border-purple-300 hover:shadow-md transition-all">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-slate-900">{otp.mobile}</span>
        <span className="text-xs font-mono text-slate-500">
          OTP: {otp.otp}
        </span>
      </div>
    </div>
  );
}

function OtpList({ otps }: { otps: IrepsRow[] }) {
  return (
    <div className="space-y-2">
      {otps.map((otp) => (
        <OtpListItem key={otp.mobile} otp={otp} />
      ))}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="text-center py-12">
      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-600" />
      <p className="text-sm text-slate-500">Loading OTPs...</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12 bg-slate-50/50 rounded-xl border-2 border-dashed border-slate-200">
      <Smartphone className="w-10 h-10 mx-auto text-slate-400 mb-3" />
      <p className="text-sm font-medium text-slate-600">No OTPs Stored</p>
      <p className="text-xs text-slate-500">
        Add an OTP to begin authentication
      </p>
    </div>
  );
}

// MAIN COMPONENT

export default function IrepsOtpPanel() {
  const [formData, setFormData] = useState<OtpFormData>({
    mobile: "",
    otp: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<UiMessage | null>(null);

  const { otps, loading, reload } = useOtpList();

  const updateFormData = (updates: Partial<OtpFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleSubmit = async () => {
    const validationError = validateOtpForm(formData);
    if (validationError) {
      setMessage({ type: "error", text: validationError });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      await updateOtp(formData.mobile, formData.otp);

      setFormData({ mobile: "", otp: "" });
      setMessage({ type: "success", text: "OTP updated successfully" });

      await reload();
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Failed to update OTP";
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setSubmitting(false);
    }
  };

  const isLoading = loading || submitting;

  return (
    <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-white to-purple-50/30">
      <CardContent className="p-6">
        <PageHeader otpCount={otps.length} />

        <OtpForm
          formData={formData}
          loading={isLoading}
          onFormChange={updateFormData}
          onSubmit={handleSubmit}
        />

        {message && <MessageAlert message={message} />}

        {loading ? (
          <LoadingState />
        ) : otps.length > 0 ? (
          <OtpList otps={otps} />
        ) : (
          <EmptyState />
        )}
      </CardContent>
    </Card>
  );
}