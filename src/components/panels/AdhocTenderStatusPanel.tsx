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

// TYPES

type UiMessage = {
  type: "success" | "error";
  text: string;
};

type TenderStatusFormData = {
  tenderIds: string;
  domain: string;
};

// TEXT PROCESSING

function parseIdsFromText(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

// VALIDATION

function validateTenderStatusForm(data: TenderStatusFormData): string | null {
  if (!data.tenderIds.trim()) {
    return "Enter at least one sourceTenderId";
  }

  const ids = parseIdsFromText(data.tenderIds);
  if (ids.length === 0) {
    return "Enter at least one valid sourceTenderId";
  }

  if (!data.domain.trim()) {
    return "Domain is required";
  }

  return null;
}

// API

async function injectTenderStatusTasks(
  domain: string,
  tenderIds: string[]
): Promise<string> {

  const params = new URLSearchParams();
  params.append("domain", domain.trim());

  tenderIds.forEach(id => {
    params.append("sourceTenderIds", id);
  });

  const response = await fetch("/bff/inject-adhoc-tender-status", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(responseText || `Request failed: ${response.status}`);
  }

  return responseText || "Tasks injected successfully";
}

// UI COMPONENTS

function PageHeader() {
  return (
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
  );
}

function TenderIdsTextarea({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
        Source Tender IDs
      </Label>

      <textarea
        rows={6}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="GEM/2024/12345&#10;T67899&#10;GEM/99999"
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-mono hover:border-indigo-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors resize-none"
      />

      <p className="text-xs text-slate-400">One tender ID per line</p>
    </div>
  );
}

function DomainInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
        Domain
      </Label>

      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="gem.gov.in"
        className="h-11 border-slate-300 bg-white hover:border-indigo-400 focus:border-indigo-500 focus:ring-indigo-500/20 transition-colors"
      />
    </div>
  );
}

function MessageAlert({ message }: { message: UiMessage }) {
  const isError = message.type === "error";
  const Icon = isError ? AlertCircle : CheckCircle2;
  const bgColor = isError ? "bg-red-50" : "bg-emerald-50";
  const borderColor = isError ? "border-red-200" : "border-emerald-200";
  const iconColor = isError ? "text-red-600" : "text-emerald-600";
  const titleColor = isError ? "text-red-900" : "text-emerald-900";
  const textColor = isError ? "text-red-700" : "text-emerald-700";

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-lg border-2 animate-in slide-in-from-top-2 ${bgColor} ${borderColor}`}
    >
      <Icon className={`w-5 h-5 ${iconColor} flex-shrink-0 mt-0.5`} />

      <div>
        <p className={`text-sm font-medium ${titleColor}`}>
          {isError ? "Error" : "Success"}
        </p>

        <p className={`text-sm mt-0.5 ${textColor}`}>{message.text}</p>
      </div>
    </div>
  );
}

function SubmitButton({
  disabled,
  loading,
  onClick,
}: {
  disabled: boolean;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
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
  );
}

function InfoFooter() {
  return (
    <div className="pt-2 px-1">
      <p className="text-xs text-slate-500 leading-relaxed">
        💡 This will enqueue tender-status crawl jobs for the supplied IDs
        immediately.
      </p>
    </div>
  );
}

function TenderStatusForm({
  formData,
  loading,
  message,
  onFormChange,
  onSubmit,
}: {
  formData: TenderStatusFormData;
  loading: boolean;
  message: UiMessage | null;
  onFormChange: (updates: Partial<TenderStatusFormData>) => void;
  onSubmit: () => void;
}) {
  const isValid =
    formData.tenderIds.trim().length > 0 &&
    formData.domain.trim().length > 0 &&
    !loading;

  return (
    <div className="space-y-4">
      <TenderIdsTextarea
        value={formData.tenderIds}
        onChange={(tenderIds) => onFormChange({ tenderIds })}
      />

      <DomainInput
        value={formData.domain}
        onChange={(domain) => onFormChange({ domain })}
      />

      {message && <MessageAlert message={message} />}

      <div className="pt-2">
        <SubmitButton disabled={!isValid} loading={loading} onClick={onSubmit} />
      </div>

      <InfoFooter />
    </div>
  );
}

// MAIN COMPONENT

export default function AdhocTenderStatusPanel() {
  const [formData, setFormData] = useState<TenderStatusFormData>({
    tenderIds: "",
    domain: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<UiMessage | null>(null);

  const updateFormData = (updates: Partial<TenderStatusFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleSubmit = async () => {
    setMessage(null);

    const validationError = validateTenderStatusForm(formData);
    if (validationError) {
      setMessage({ type: "error", text: validationError });
      return;
    }

    const tenderIds = parseIdsFromText(formData.tenderIds);

    setLoading(true);

    try {
      const responseMessage = await injectTenderStatusTasks(
        formData.domain,
        tenderIds
      );

      setMessage({ type: "success", text: responseMessage });
      setFormData((prev) => ({ ...prev, tenderIds: "" }));
    } catch (e) {
      const errorMessage =
        e instanceof Error ? e.message : "Server request failed";
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-white to-indigo-50/30">
      <CardContent className="p-6">
        <PageHeader />

        <TenderStatusForm
          formData={formData}
          loading={loading}
          message={message}
          onFormChange={updateFormData}
          onSubmit={handleSubmit}
        />
      </CardContent>
    </Card>
  );
}