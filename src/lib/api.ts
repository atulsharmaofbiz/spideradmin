const API_BASE = "/bff";

export function apiUrl(path: string) {
  if (path.startsWith("/")) return `${API_BASE}${path}`;
  return `${API_BASE}/${path}`;
}

export async function apiGet<T = any>(path: string): Promise<T> {
  const url = apiUrl(path);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

export async function apiPost<T = any>(
  path: string,
  body?: any,
  init?: RequestInit
): Promise<T> {
  const url = apiUrl(path);
  const res = await fetch(url, {
    method: init?.method || "POST",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    body: body !== undefined ? JSON.stringify(body) : init?.body,
    ...init,
  });
  if (!res.ok) throw new Error(`POST ${path} → ${res.status}`);

  try {
    return await res.json() as T;
  } catch {
    return "" as T;
  }
}

export async function apiDelete<T = any>(path: string): Promise<T> {
  const url = apiUrl(path);
  const res = await fetch(url, { method: "DELETE" });
  if (!res.ok) throw new Error(`DELETE ${path} → ${res.status}`);

  try {
    return await res.json() as T;
  } catch {
    return "" as T;
  }
}
