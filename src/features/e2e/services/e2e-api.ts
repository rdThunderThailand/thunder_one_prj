import { apiClient } from "@/lib/api/client";
import type { LogEntry } from "../types";

export async function callApi<T>(opts: {
  method: string;
  path: string;
  body?: unknown;
  deviceToken?: string;
}): Promise<{ entry: LogEntry; data: T | null }> {
  const fullUrl = `/api/proxy${opts.path}`;
  const method = opts.method.toUpperCase();
  const headers: Record<string, string> = {};

  if (opts.deviceToken) {
    headers["x-device-token"] = opts.deviceToken;
  }

  const startTime = performance.now();
  let status: number | null = null;
  let responseData: unknown = null;

  try {
    const res = await apiClient.request({
      url: fullUrl,
      method,
      data: opts.body,
      headers,
      validateStatus: () => true,
    });

    status = res.status;
    responseData = res.data;
  } catch (err) {
    responseData = { error: err instanceof Error ? err.message : String(err) };
  }

  const elapsed = Math.round(performance.now() - startTime);

  const hasErrorField =
    Boolean(responseData) &&
    typeof responseData === "object" &&
    "error" in (responseData as Record<string, unknown>);

  const isOk =
    status !== null && status >= 200 && status < 300 && !hasErrorField;

  let data: T | null = null;
  if (isOk && responseData !== null) {
    if (
      typeof responseData === "object" &&
      "success" in (responseData as Record<string, unknown>) &&
      "data" in (responseData as Record<string, unknown>)
    ) {
      data = (responseData as { data: T }).data;
    } else {
      data = responseData as T;
    }
  }

  const entry: LogEntry = {
    id: Math.random().toString(36).substring(2, 9),
    at: new Date().toISOString(),
    method,
    url: fullUrl,
    status,
    ms: elapsed,
    request: opts.body !== undefined ? opts.body : null,
    response: responseData,
    ok: isOk,
  };

  return { entry, data };
}

export async function uploadToStorage(
  uploadUrl: string,
  file: File,
  onProgress: (pct: number) => void
): Promise<void> {
  await apiClient.put(uploadUrl, file, {
    headers: {
      "Content-Type": file.type,
    },
    transformRequest: [(d) => d],
    onUploadProgress: (evt) => {
      if (evt.total) {
        onProgress(Math.round((evt.loaded * 100) / evt.total));
      }
    },
  });
}
