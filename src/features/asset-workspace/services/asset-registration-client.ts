import { z } from "zod";
import { registrationOptionsSchema } from "./asset-registration-contract";
import { requestAssetWorkspace, AssetWorkspaceRequestError } from "./asset-workspace-api";
import { completedRegistrationUploadSchema, createdRegistrationSchema, reserveRegistrationSchema, reservedRegistrationUploadSchema } from "./asset-registration-write-contract";

export { AssetWorkspaceRequestError as RegistrationRequestError } from "./asset-workspace-api";
function parseResponse<T>(schema: z.ZodType<T>, data: unknown) {
  const parsed = schema.safeParse(data);
  if (!parsed.success) throw new AssetWorkspaceRequestError("The registration service returned an unexpected response. Try again.", "INVALID_RESPONSE", false, 502);
  return parsed.data;
}
export async function refreshRegistrationOptions(context: string, signal?: AbortSignal) {
  return parseResponse(registrationOptionsSchema, await requestAssetWorkspace("GET", "/registration-options", undefined, { context, signal }));
}
export async function reserveRegistrationUpload(context: string, payload: z.input<typeof reserveRegistrationSchema>) {
  const data = reserveRegistrationSchema.parse(payload);
  return parseResponse(reservedRegistrationUploadSchema, await requestAssetWorkspace("POST", "/registration-uploads", data, { context }));
}
export async function completeRegistrationUpload(context: string, uploadId: string) {
  const id = z.uuid().parse(uploadId);
  return parseResponse(completedRegistrationUploadSchema, await requestAssetWorkspace("POST", `/registration-uploads/${id}/complete`, undefined, { context }));
}
export async function createRegisteredAsset(context: string, json: string) {
  // Keep the durable snapshot as the request body, including on uncertain-outcome recovery.
  const result = await requestAssetWorkspace("POST", "", json, { context, creation: true });
  const parsed = createdRegistrationSchema.safeParse(result);
  if (!parsed.success) throw new AssetWorkspaceRequestError("The creation response could not be verified. Retry the original request.", "INVALID_RESPONSE", true);
  return parsed.data;
}
