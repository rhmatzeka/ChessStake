export class ApiError extends Error {
  code: string;
  status: number;
  constructor(code: string, status: number, message: string) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

/** Calls a JSON API that answers `{ ok, data | error }`; throws ApiError on failure. */
export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { cache: "no-store", credentials: "same-origin", ...init });
  let body: { ok?: boolean; data?: T; error?: { code?: string; message?: string } } | null = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  if (!res.ok || !body || body.ok === false) {
    throw new ApiError(body?.error?.code ?? "NETWORK", res.status, body?.error?.message ?? "Request failed");
  }
  return body.data as T;
}
