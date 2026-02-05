import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectValue,
  SelectItem,
} from "@/components/ui/select";
import {
  BugPlay,
  Rocket,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Zap,
} from "lucide-react";

import {
  fetchProviders,
  injectProvider,
  INSTANCE_OPTIONS,
  InstanceOpt,
  EntityType,
} from "@/lib/provider";

// TYPES

type CrawlForm = {
  provider?: string;
  entity?: EntityType;
  instance?: InstanceOpt;
  group?: string;
};

type UiMessage = {
  type: "success" | "error";
  text: string;
};

type FormFieldProps = {
  label: string;
  colorDot: string;
  optional?: boolean;
  children: React.ReactNode;
};

type SelectFieldProps = {
  label: string;
  colorDot: string;
  value: string | undefined;
  placeholder: string;
  options: Array<{ value: string; label: string; dotColor?: string }>;
  disabled?: boolean;
  onValueChange: (value: string) => void;
};

// VALIDATION

function validateForm(form: CrawlForm): string | null {
  if (!form.provider || !form.entity || !form.instance) {
    return "Provider, entity, and instance are required";
  }
  return null;
}

function normalizeGroup(group?: string): string | undefined {
  const trimmed = group?.trim();
  return trimmed === "" ? undefined : trimmed;
}

// HOOKS

function useProviders() {
  const [providers, setProviders] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    setLoading(true);
    fetchProviders()
      .then((data) => {
        if (mounted) {
          const sorted = [...data].sort((a, b) => a.localeCompare(b));
          setProviders(sorted);
        }
      })
      .catch(() => {
        if (mounted) {
          setError("Failed to load providers");
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return { providers, loading, error };
}

// FORM SUBMISSION

async function submitCrawlTask(form: CrawlForm): Promise<UiMessage> {
  const validationError = validateForm(form);
  if (validationError) {
    return { type: "error", text: validationError };
  }

  const normalizedGroup = normalizeGroup(form.group);

  try {
    const result = await injectProvider({
      provider: form.provider!,
      entity: form.entity!,
      instance: form.instance!,
      ...(normalizedGroup && { group: normalizedGroup }),
    });

    if (result.ok) {
      return {
        type: "success",
        text: result.message ?? "Task triggered successfully",
      };
    } else {
      return {
        type: "error",
        text: result.error ?? "Unknown server error",
      };
    }
  } catch (e: unknown) {
    const errorText = e instanceof Error ? e.message : "Request failed";
    return { type: "error", text: errorText };
  }
}

// UI COMPONENTS

function PageHeader() {
  return (
    <div className="flex items-start gap-4 mb-6">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 blur-xl rounded-full" />
        <div className="relative p-3 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 shadow-lg">
          <BugPlay className="w-6 h-6 text-white" />
        </div>
      </div>
      <div className="flex-1">
        <h3 className="text-xl font-bold bg-gradient-to-r from-purple-900 to-pink-700 bg-clip-text text-transparent mb-1">
          Inject Provider Crawl Task
        </h3>
        <p className="text-sm text-slate-500 flex items-center gap-2">
          <Zap className="w-3.5 h-3.5" />
          Force-run a provider crawling job instantly
        </p>
      </div>
    </div>
  );
}

function FormField({ label, colorDot, optional = false, children }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-2">
        <div className={`w-1.5 h-1.5 rounded-full ${colorDot}`} />
        {label}
        {optional && (
          <span className="text-slate-400 font-normal normal-case">(Optional)</span>
        )}
      </Label>
      {children}
    </div>
  );
}

function SelectField({
  label,
  colorDot,
  value,
  placeholder,
  options,
  disabled = false,
  onValueChange,
}: SelectFieldProps) {
  const borderColorClass = colorDot.replace("bg-", "hover:border-").replace("bg-", "focus:border-");
  const ringColorClass = colorDot.replace("bg-", "focus:ring-").concat("/20");

  return (
    <FormField label={label} colorDot={colorDot}>
      <Select value={value} disabled={disabled} onValueChange={onValueChange}>
        <SelectTrigger
          className={`h-11 border-slate-300 bg-white ${borderColorClass} ${ringColorClass} transition-colors`}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="max-h-60 overflow-y-auto">
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value} className="cursor-pointer">
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${option.dotColor || colorDot}`} />
                <span className="font-medium">{option.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormField>
  );
}

function ProviderSelect({
  value,
  providers,
  loading,
  onChange,
}: {
  value: string | undefined;
  providers: string[];
  loading: boolean;
  onChange: (value: string) => void;
}) {
  const placeholder = loading
    ? "Loading providers..."
    : providers.length === 0
      ? "No providers available"
      : "Select provider";

  const options = providers.map((p) => ({ value: p, label: p }));

  return (
    <SelectField
      label="Provider"
      colorDot="bg-purple-500"
      value={value}
      placeholder={placeholder}
      options={options}
      disabled={loading || providers.length === 0}
      onValueChange={onChange}
    />
  );
}

function EntitySelect({
  value,
  onChange,
}: {
  value: EntityType | undefined;
  onChange: (value: EntityType) => void;
}) {
  const options = [
    { value: "TENDER", label: "TENDER", dotColor: "bg-emerald-500" },
    { value: "BID_AWARD", label: "BID_AWARD", dotColor: "bg-blue-500" },
    { value: "CORRIGENDUM", label: "CORRIGENDUM", dotColor: "bg-amber-500" },
  ];

  return (
    <SelectField
      label="Entity"
      colorDot="bg-blue-500"
      value={value}
      placeholder="Select entity"
      options={options}
      onValueChange={(v) => onChange(v as EntityType)}
    />
  );
}

function GroupInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <FormField label="Group" colorDot="bg-slate-400" optional>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. 0"
        className="h-11 border-slate-300 bg-white hover:border-slate-400 focus:border-purple-500 focus:ring-purple-500/20 transition-colors"
      />
    </FormField>
  );
}

function InstanceSelect({
  value,
  onChange,
}: {
  value: InstanceOpt | undefined;
  onChange: (value: InstanceOpt) => void;
}) {
  const options = INSTANCE_OPTIONS.map((i) => ({ value: i, label: i }));

  return (
    <SelectField
      label="Instance"
      colorDot="bg-indigo-500"
      value={value}
      placeholder="Select instance"
      options={options}
      onValueChange={(v) => onChange(v as InstanceOpt)}
    />
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
      <div className="flex-1">
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
  submitting,
  onClick,
}: {
  disabled: boolean;
  submitting: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/30 transition-all hover:shadow-xl hover:shadow-purple-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none font-semibold text-base"
    >
      {submitting ? (
        <>
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          Triggering Task...
        </>
      ) : (
        <>
          <Rocket className="w-5 h-5 mr-2" />
          Inject Crawl Task
        </>
      )}
    </Button>
  );
}

function InfoFooter() {
  return (
    <div className="pt-2 px-1">
      <p className="text-xs text-slate-500 leading-relaxed">
        💡 This will immediately trigger a crawl job for the selected provider.
        Make sure all parameters are correct before submission.
      </p>
    </div>
  );
}

//  MAIN COMPONENT

export default function ProviderCrawlPanel() {
  const [form, setForm] = useState<CrawlForm>({ group: "" });
  const [message, setMessage] = useState<UiMessage | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(false);

  const { providers, loading: loadingProviders, error: providerError } = useProviders();

  useEffect(() => {
    if (providerError) {
      setMessage({ type: "error", text: providerError });
    }
  }, [providerError]);

  const updateForm = (updates: Partial<CrawlForm>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  };

  const handleSubmit = async () => {
  if (cooldown) return;

  setMessage(null);
  setSubmitting(true);

  const result = await submitCrawlTask(form);
  setMessage(result);

  setSubmitting(false);

  if (result.type === "success") {
    setCooldown(true);

    setTimeout(() => {
      setCooldown(false);
      setMessage(null);
    }, 5000);
  }
};

  const isFormValid =
    !!form.provider && !!form.entity && !!form.instance && !submitting && !cooldown;

  return (
    <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-white to-purple-50/30">
      <CardContent className="p-6">
        <PageHeader />

        <div className="space-y-4">
          <ProviderSelect
            value={form.provider}
            providers={providers}
            loading={loadingProviders}
            onChange={(provider) => updateForm({ provider })}
          />

          <EntitySelect
            value={form.entity}
            onChange={(entity) => updateForm({ entity })}
          />

          <GroupInput
            value={form.group ?? ""}
            onChange={(group) => updateForm({ group })}
          />

          <InstanceSelect
            value={form.instance}
            onChange={(instance) => updateForm({ instance })}
          />

          {message && <MessageAlert message={message} />}
          

          <div className="pt-2">
            <SubmitButton
              disabled={!isFormValid}
              submitting={submitting || cooldown}
              onClick={handleSubmit}
            />
          </div>

          <InfoFooter />
        </div>
      </CardContent>
    </Card>
  );
}