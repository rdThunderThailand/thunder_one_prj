import { confirmationSchema, type ConfirmationRecord } from "../domain/registration-confirmation";

export function readConfirmation(key: string): { record: ConfirmationRecord | null; blocked: boolean } {
  try {
    const raw = sessionStorage.getItem(key);
    return { record: raw ? confirmationSchema.parse(JSON.parse(raw)) : null, blocked: false };
  } catch { return { record: null, blocked: true }; }
}
export function saveConfirmation(key: string, record: ConfirmationRecord) {
  try {
    const json = JSON.stringify(confirmationSchema.parse(record));
    sessionStorage.setItem(key, json);
    return sessionStorage.getItem(key) === json;
  } catch { return false; }
}
export function removeConfirmation(key: string) {
  try { sessionStorage.removeItem(key); return sessionStorage.getItem(key) === null; }
  catch { return false; }
}
