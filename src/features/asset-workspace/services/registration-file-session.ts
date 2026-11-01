import { readRegistrationFiles, syncRegistrationFiles } from "./registration-file-storage";

const sessions = new Map<string, Promise<string>>();
const ownedScopes = new Set<string>();
const sessionKey = (key: string) => `${key}:file-cache`;
const cleanupKey = (key: string) => `${key}:file-cleanup`;

async function claim(scope: string): Promise<boolean> {
  if (ownedScopes.has(scope)) return true;
  if (!navigator.locks) throw new Error("Isolated file recovery is unavailable in this browser.");
  return new Promise<boolean>((resolve, reject) => {
    // Hold until this document closes, including while it visits other routes. A duplicated
    // tab must fork its cache before either tab can remove the other's selected files.
    void navigator.locks.request(scope, { ifAvailable: true }, (lock) => {
      if (!lock) { resolve(false); return; }
      ownedScopes.add(scope);
      resolve(true);
      return new Promise<void>(() => {});
    }).catch(reject);
  });
}

export function registrationFileSession(key: string): Promise<string> {
  const existing = sessions.get(key);
  if (existing) return existing;
  const initialize = async () => {
    const previous = sessionStorage.getItem(sessionKey(key));
    const validPrevious = previous !== null && previous.startsWith(`${key}:`) && /^[\da-f-]{36}$/i.test(previous.slice(key.length + 1));
    let scope: string = validPrevious ? previous! : `${key}:${crypto.randomUUID()}`;
    if (!await claim(scope)) {
      scope = `${key}:${crypto.randomUUID()}`;
      if (!await claim(scope)) throw new Error("Could not isolate this registration's files.");
      const files = await readRegistrationFiles(previous!);
      await syncRegistrationFiles(scope, files, files.map((file) => file.localId));
    }
    sessionStorage.setItem(sessionKey(key), scope);
    return scope;
  };
  const pending = initialize().catch((error) => { sessions.delete(key); throw error; });
  sessions.set(key, pending);
  return pending;
}

export function detachRegistrationFileSession(key: string, scope: string) {
  if (sessionStorage.getItem(sessionKey(key)) === scope) sessionStorage.removeItem(sessionKey(key));
  sessions.delete(key);
}

export function pendingFileCleanup(key: string): string[] {
  const raw: unknown = JSON.parse(sessionStorage.getItem(cleanupKey(key)) ?? "[]");
  if (!Array.isArray(raw)) throw new Error("Unreadable cleanup record.");
  return raw.filter((value): value is string => typeof value === "string" && value.startsWith(`${key}:`));
}

export function rememberFileCleanup(key: string, scopes: string[]) {
  const remaining = [...new Set(scopes)];
  if (remaining.length) sessionStorage.setItem(cleanupKey(key), JSON.stringify(remaining));
  else sessionStorage.removeItem(cleanupKey(key));
}
