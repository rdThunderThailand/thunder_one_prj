import "server-only";
import { z } from "zod";
import { env } from "@/config/env";
import { completedRegistrationUploadSchema, createdRegistrationSchema, reservedRegistrationUploadSchema, type RegistrationOperation } from "./asset-registration-write-contract";

export interface RegistrationApiFailure { success: false; code: string; error: string; uncertain: boolean }
const publicCodes = new Set(["VALIDATION", "PERMISSION_DENIED", "NOT_FOUND", "CONFLICT", "SERIAL_DUPLICATE", "UPLOAD_NOT_FOUND", "UPLOAD_EXPIRED", "UPLOAD_RETRY", "REGISTRATION_UNAVAILABLE", "REGISTRATION_UPLOAD_UNAVAILABLE"]);

export async function forwardRegistrationOperation(context: { token: string; tenantId: string }, operation: RegistrationOperation) {
  const create = operation.operation === "create";
  const failure = (status: number, code: string, error: string, uncertain = false) => ({ status, body: { success: false, code, error, uncertain } as RegistrationApiFailure });
  if (!env.coreApiUrl || !env.coreApiKey) return failure(503, "REGISTRATION_UNAVAILABLE", "The asset service is not configured.");
  const suffix = operation.operation === "reserve" ? "/registration-uploads"
    : operation.operation === "complete" ? `/registration-uploads/${encodeURIComponent(operation.uploadId)}/complete` : "";
  try {
    const response = await fetch(`${env.coreApiUrl}/api/core/v2/tenants/${encodeURIComponent(context.tenantId)}/asset-workspace/assets${suffix}`, {
      method: "POST", cache: "no-store", redirect: "error", signal: AbortSignal.timeout(60000),
      headers: { "x-api-key": env.coreApiKey, Authorization: `Bearer ${context.token}`, ...(operation.operation === "complete" ? {} : { "Content-Type": "application/json" }) },
      body: operation.operation === "complete" ? undefined : JSON.stringify(operation.payload),
    });
    const body: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const parsed = z.object({ code: z.string().optional(), error: z.string().optional() }).safeParse(body);
      const code = parsed.success && parsed.data.code && publicCodes.has(parsed.data.code) ? parsed.data.code : "REQUEST_FAILED";
      const uncertain = create && response.status >= 500 && code !== "REGISTRATION_UNAVAILABLE";
      const message = response.status === 401 ? "Sign in again to continue this registration."
        : response.status === 403 ? "You do not have permission to perform this registration action."
          : code === "SERIAL_DUPLICATE" ? "This Serial Number is already used. Correct it or use an authorized override."
            : code === "UPLOAD_EXPIRED" ? "A temporary upload has expired. Reselect the affected file before confirming again."
              : response.status >= 500 ? "The registration service is temporarily unavailable. Retry this confirmation."
                : code === "CONFLICT" ? "This registration conflicts with an existing record. Review the Asset Tag, selected references and files."
                  : response.status === 400 ? "The service rejected the registration fields or file contents. Review your information and selected files."
                    : response.status === 404 ? "A selected reference or upload is no longer available. Review this registration."
                      : "The request was rejected. Review the entered information.";
      return failure(response.status, code, message, uncertain);
    }
    const schema = create ? createdRegistrationSchema : operation.operation === "reserve" ? reservedRegistrationUploadSchema : completedRegistrationUploadSchema;
    const parsed = z.object({ success: z.literal(true), data: schema }).safeParse(body);
    if (!parsed.success) return failure(502, "INVALID_RESPONSE", "The service returned an unexpected confirmation response. Retry the original request.", create);
    return { status: response.status, body: { success: true as const, data: parsed.data.data } };
  } catch {
    return failure(504, "CONNECTION_FAILED", "The confirmation result could not be received. Retry the same confirmation.", create);
  }
}
