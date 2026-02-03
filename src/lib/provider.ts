// api/provider.ts

export const INSTANCE_OPTIONS = ["INDIAN", "GLOBAL"] as const;
export type InstanceOpt = (typeof INSTANCE_OPTIONS)[number];

export type EntityType = "TENDER" | "BID_AWARD" | "CORRIGENDUM";

export async function fetchProviders(): Promise<string[]> {
  const res = await fetch("/bff/providers");

  if (!res.ok) {
    throw new Error("Failed to fetch providers");
  }

  const data: unknown = await res.json();

  if (!Array.isArray(data) || !data.every((v) => typeof v === "string")) {
    throw new Error("Invalid providers response");
  }

  return data;
}

export async function injectProvider(params: {
  provider: string;
  entity: EntityType;
  instance: InstanceOpt;
  group?: string;
}): Promise<{ ok: boolean; message?: string; error?: string }> {
  const qs = new URLSearchParams(params);

  const res = await fetch(`/bff/inject-provider?${qs.toString()}`, {
    method: "POST",
  });

  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`);
  }

  const data: unknown = await res.json();

  if (typeof data !== "object" || data === null) {
    throw new Error("Invalid response from server");
  }

  return data as {
    ok: boolean;
    message?: string;
    error?: string;
  };
}
