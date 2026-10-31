import { registrationStateSchema, type RegistrationState } from "../domain/registration-draft.ts";

export function registrationDraftKey(tenantId: string, userId: string): string {
  return `asset-registration:v1:${tenantId}:${userId}`;
}

export function readRegistrationDraft(key: string): { state: RegistrationState | null; unavailable: boolean } {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return { state: null, unavailable: false };
    let value: unknown;
    try { value = JSON.parse(raw); }
    catch {
      sessionStorage.removeItem(key);
      return { state: null, unavailable: false };
    }
    const parsed = registrationStateSchema.safeParse(value);
    if (parsed.success) return { state: parsed.data, unavailable: false };
    sessionStorage.removeItem(key);
    return { state: null, unavailable: false };
  } catch {
    return { state: null, unavailable: true };
  }
}

export function saveRegistrationDraft(key: string, state: RegistrationState): boolean {
  try { sessionStorage.setItem(key, JSON.stringify(state)); return true; }
  catch { return false; }
}

export function removeRegistrationDraft(key: string): boolean {
  try { sessionStorage.removeItem(key); return true; }
  catch { return false; }
}
