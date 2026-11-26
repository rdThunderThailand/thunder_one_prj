import { z } from "zod";
import { assetExportFilename, EXPORT_COLUMNS, type AssetExportRequest } from "../domain/asset-export.ts";

export class AssetExportError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = "AssetExportError";
    this.status = status;
    this.code = code;
  }
}

export type AssetExportRequester = (input: {
  url: string;
  method: "POST";
  data: AssetExportRequest;
  headers: Record<string, string>;
  responseType: "blob";
  signal: AbortSignal;
}) => Promise<{ status: number; data: unknown }>;

const defaultRequester: AssetExportRequester = async (input) => {
  const { apiClient } = await import("@/lib/api/client");
  return apiClient.request<Blob>({
    ...input, baseURL: "", timeout: 60_000, validateStatus: () => true,
  });
};

const coreErrorSchema = z.object({ error: z.object({ code: z.string(), message: z.string() }) });
const proxyErrorSchema = z.object({ code: z.string().optional(), error: z.string() });
const csvHeaders = [
  EXPORT_COLUMNS.map((column) => `"${column}"`).join(","),
  EXPORT_COLUMNS.join(","),
];

async function exportFailure(status: number, body: unknown): Promise<AssetExportError> {
  let value = body;
  const text = body instanceof Blob ? await body.text() : typeof body === "string" ? body : null;
  if (text !== null) {
    try { value = JSON.parse(text); } catch { value = null; }
  }
  const core = coreErrorSchema.safeParse(value);
  const proxy = proxyErrorSchema.safeParse(value);
  const code = core.success ? core.data.error.code : proxy.success ? proxy.data.code ?? "REQUEST_FAILED" : "INVALID_RESPONSE";
  let message = "The export could not be prepared. Try again.";
  if (status === 400) message = core.success ? core.data.error.message : "The export scope was not accepted. Review your filters or selection.";
  else if (status === 401) message = "Your session has expired. Sign in again to export assets.";
  else if (status === 403) message = "You do not have permission, or your account or organization changed. Reload the page to check your access.";
  else if (status === 404) message = code === "NOT_FOUND"
    ? "No eligible assets were found for this export. Refresh the list and check your selection."
    : "Asset export is not available on this server yet.";
  else if (status === 503) message = "The asset export service is unavailable. Try again later.";
  return new AssetExportError(message, status, code);
}

/** Use the server CSV unchanged, apart from restoring the BOM removed by the proxy. */
export async function requestAssetExport(
  context: string,
  request: AssetExportRequest,
  signal: AbortSignal,
  requester: AssetExportRequester = defaultRequester,
): Promise<{ blob: Blob; filename: string }> {
  let response: Awaited<ReturnType<AssetExportRequester>>;
  try {
    response = await requester({
      url: "/api/proxy/v2/asset-workspace/assets/export",
      method: "POST",
      data: request,
      headers: { "x-registration-context": context },
      responseType: "blob",
      signal,
    });
  } catch (error) {
    if (signal.aborted) throw error;
    throw new AssetExportError("Could not reach the asset service. Try again.", 0, "CONNECTION_FAILED");
  }
  signal.throwIfAborted();
  if (response.status < 200 || response.status >= 300) {
    throw await exportFailure(response.status, response.data);
  }
  const text = response.data instanceof Blob ? await response.data.text() : response.data;
  signal.throwIfAborted();
  // Content-Type cannot identify CSV here: the existing proxy labels all responses as JSON.
  if (typeof text !== "string" || !csvHeaders.includes(text.replace(/^\uFEFF/, "").split(/\r?\n/, 1)[0])) {
    throw new AssetExportError("The asset service returned an unexpected export file. Try again.", 502, "INVALID_RESPONSE");
  }
  return {
    blob: new Blob(["\uFEFF", text.replace(/^\uFEFF/, "")], { type: "text/csv;charset=utf-8" }),
    filename: assetExportFilename(),
  };
}
