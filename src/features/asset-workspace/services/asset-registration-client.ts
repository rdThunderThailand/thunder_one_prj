import { z } from "zod";
import { registrationOptionsSchema } from "./asset-registration-contract";
import { completedRegistrationUploadSchema, createdRegistrationSchema, reservedRegistrationUploadSchema, type RegistrationOperation } from "./asset-registration-write-contract";

export class RegistrationRequestError extends Error {
  constructor(message: string, public code: string, public uncertain = false, public status = 0) { super(message); }
}
const endpoint = "/api/asset-workspace/assets/registration";
async function request(context: string, operation?: RegistrationOperation) {
  const create = operation?.operation === "create";
  try {
    const response = await fetch(endpoint, {
      method: operation ? "POST" : "GET", cache: "no-store", credentials: "same-origin", redirect: "error",
      headers: { "x-registration-context": context, ...(operation ? { "Content-Type": "application/json" } : {}) },
      body: operation ? JSON.stringify(operation) : undefined, signal: AbortSignal.timeout(75000),
    });
    const body: unknown = await response.json();
    if (!response.ok) {
      const error = z.object({ code: z.string().optional(), error: z.string().optional(), uncertain: z.boolean().optional() }).safeParse(body);
      const code = error.success ? error.data.code ?? "REQUEST_FAILED" : "INVALID_RESPONSE";
      throw new RegistrationRequestError(error.success ? error.data.error ?? "Confirmation failed." : "Confirmation failed.", code,
        Boolean(create && (error.success ? error.data.uncertain ?? (response.status >= 500 && code !== "REGISTRATION_UNAVAILABLE") : true)), response.status);
    }
    return z.object({ success: z.literal(true), data: z.unknown() }).parse(body).data;
  } catch (error) {
    if (error instanceof RegistrationRequestError) throw error;
    throw new RegistrationRequestError("The confirmation result could not be received. Retry the original request.", "CONNECTION_FAILED", Boolean(create));
  }
}
export async function refreshRegistrationOptions(context: string) { return registrationOptionsSchema.parse(await request(context)); }
export async function reserveRegistrationUpload(context: string, payload: Extract<RegistrationOperation, { operation: "reserve" }>["payload"]) {
  return reservedRegistrationUploadSchema.parse(await request(context, { operation: "reserve", payload }));
}
export async function completeRegistrationUpload(context: string, uploadId: string) {
  return completedRegistrationUploadSchema.parse(await request(context, { operation: "complete", uploadId }));
}
export async function createRegisteredAsset(context: string, json: string) {
  const data = await request(context, { operation: "create", payload: JSON.parse(json) });
  const parsed = createdRegistrationSchema.safeParse(data);
  if (!parsed.success) throw new RegistrationRequestError("The creation response could not be verified. Retry the original request.", "INVALID_RESPONSE", true);
  return parsed.data;
}
