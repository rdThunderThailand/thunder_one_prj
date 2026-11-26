import type { ProfileReadResult } from "./asset-profile-api";
import type { RegistrationOptions } from "./asset-registration-contract";
import { assetFilesFeedback } from "../domain/asset-files-edit";

export async function getProfileFileRules(context: string, signal: AbortSignal): Promise<ProfileReadResult<RegistrationOptions>> {
  const { refreshRegistrationOptions, RegistrationRequestError } = await import("./asset-registration-client");
  try { return { ok: true, data: await refreshRegistrationOptions(context, signal) }; }
  catch (error) {
    if (signal.aborted) throw error;
    const code = error instanceof RegistrationRequestError ? error.code : "UNREACHABLE";
    return { ok: false, status: error instanceof RegistrationRequestError ? error.status || 503 : 503,
      code, message: assetFilesFeedback(code).message };
  }
}
