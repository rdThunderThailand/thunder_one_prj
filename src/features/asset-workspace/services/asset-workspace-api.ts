import { z } from "zod";
import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/api-error";

export class AssetWorkspaceRequestError extends ApiError {
  /** `details`: Core's error details, e.g. SERIAL_DUPLICATE's [{ id, assetTag, name }]. */
  constructor(message: string, public code: string, public uncertain = false, status = 0, public details?: unknown, public serverMessage?: string) { super(message, status); }
}
const envelope = z.object({ success: z.literal(true), data: z.unknown() });
// Proxy rejects stay flat; Core v2 always nests { error: { code, message, details? } }.
const failure = z.object({ code: z.string().optional(), uncertain: z.boolean().optional(), error: z.string().optional() });
const coreFailure = z.object({ error: z.object({ code: z.string(), message: z.string(), details: z.unknown().optional() }) });
// Core rejects these before any write, so a failed creation with them is never uncertain.
const notCommitted = new Set(["REGISTRATION_UNAVAILABLE"]);
const listReadFailure = z.object({ error: z.object({
  code: z.enum(["VALIDATION", "UNAUTHENTICATED", "PERMISSION_DENIED", "INTERNAL"]),
  message: z.string(),
}) });
const listReadErrorStatus = { VALIDATION: 400, UNAUTHENTICATED: 401, PERMISSION_DENIED: 403, INTERNAL: 500 };

function listReadErrorMessage(code: string, message: string, path: string) {
  if (code === "UNAUTHENTICATED") return "Your session has expired. Sign in again to load assets.";
  if (code === "PERMISSION_DENIED") return "You do not have permission to load this asset section.";
  if (code === "VALIDATION") {
    // Only this documented query limitation is displayed; arbitrary diagnostics stay off screen.
    const cap = path.startsWith("/list?") ? /^sort=status_since needs filters that match at most ([1-9]\d{0,8}) assets$/.exec(message) : null;
    return cap ? `Longest in current status supports at most ${Number(cap[1]).toLocaleString("en-GB")} matching assets. Narrow the filters or choose Newest registered.`
      : "The asset query is invalid. Review the search, filters and sorting.";
  }
  return "The asset service couldn't complete this request. Try again.";
}

/** Same shared proxy/axios transport as Media; retain Core codes for registration recovery. */
export async function requestAssetWorkspace(method: "GET" | "POST", path: string, data?: unknown, options: {
  context?: string; signal?: AbortSignal; timeout?: number; creation?: boolean;
} = {}): Promise<unknown> {
  try {
    const response = await apiClient.request<unknown>({
      url: `/api/proxy/v2/asset-workspace/assets${path}`, baseURL: "", method, data,
      headers: options.context ? { "x-registration-context": options.context } : undefined,
      signal: options.signal, timeout: options.timeout ?? 75000, validateStatus: () => true,
    });
    // Only list/summary use the teammate's nested error contract. Other flows keep their existing handling.
    if (method === "GET" && ["/list", "/summary"].includes(path.split("?")[0])) {
      const structured = listReadFailure.safeParse(response.data);
      if (structured.success) {
        const { code, message } = structured.data.error;
        throw new AssetWorkspaceRequestError(listReadErrorMessage(code, message, path), code, false,
          response.status >= 400 ? response.status : listReadErrorStatus[code]);
      }
    }
    const core = coreFailure.safeParse(response.data);
    const error = failure.safeParse(response.data);
    if (response.status < 200 || response.status >= 300 || core.success || (error.success && error.data.error)) {
      const code = core.success ? core.data.error.code : error.success ? error.data.code ?? "REQUEST_FAILED" : "INVALID_RESPONSE";
      const flagged = error.success ? error.data.uncertain : undefined;
      const uncertain = Boolean(options.creation && (core.success || error.success
        ? flagged ?? (response.status >= 500 && !notCommitted.has(code)) : response.status >= 500));
      const message = response.status === 401 ? "Sign in again to continue."
        : response.status === 403 ? "You do not have permission, or your account or organization changed. Return to the matching registration."
          : code === "SERIAL_DUPLICATE" ? "This Serial Number is already used. Correct it or use an authorized override."
            : code === "UPLOAD_EXPIRED" ? "A temporary upload expired. Reselect the affected file before confirming again."
              : code === "INVALID_STATE" ? "This registration conflicts with an existing record. Review the Asset Tag, references and files."
                : code === "UPLOAD_RETRY" ? "The upload could not be finished. Retry to resume confirmation."
                  : code === "REGISTRATION_UPLOAD_UNAVAILABLE" ? "File uploads are temporarily unavailable. Your selections have been kept."
                    : code === "REGISTRATION_UNAVAILABLE" ? "Asset creation is temporarily unavailable. Your registration remains in this tab."
                      : response.status === 404 ? "This reference or upload is no longer available in your organization."
                        : response.status === 400 ? "The service rejected the entered fields or file contents. Review your information."
                          : "The asset service is temporarily unavailable. Your information has been kept. Try again.";
      throw new AssetWorkspaceRequestError(message, code, uncertain, response.status, core.success ? core.data.error.details : undefined,
        path === "/labels" && core.success && response.status === 400 ? core.data.error.message : undefined);
    }
    const parsed = envelope.safeParse(response.data);
    if (!parsed.success) throw new AssetWorkspaceRequestError("The asset service returned an unexpected response. Retry the original request.", "INVALID_RESPONSE", Boolean(options.creation), 502);
    return parsed.data.data;
  } catch (error) {
    if (options.signal?.aborted || error instanceof AssetWorkspaceRequestError) throw error;
    throw new AssetWorkspaceRequestError("The asset service could not be reached. Your information has been kept. Try again.", "CONNECTION_FAILED", Boolean(options.creation));
  }
}
