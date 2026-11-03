import type { UploadCandidate } from "../domain/registration-confirmation";

const DATABASE = "thunderone.asset-registration-files";
export const FILE_CACHE_TTL = 24 * 60 * 60 * 1000;
interface CacheEntry { scope: string; lastActivity: number }
interface StoredFile extends Omit<UploadCandidate, "file"> {
  scope: string; blob: Blob; name: string; lastModified: number;
}

// Resolve on transaction completion, not request success: quota errors can abort a later write.
async function transact<T>(mode: IDBTransactionMode, work: (transaction: IDBTransaction, result: (value: T) => void) => void): Promise<T> {
  const database = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    let abandoned = false;
    const timeout = setTimeout(() => { abandoned = true; reject(new Error("File storage did not open.")); }, 5000);
    const fail = () => { abandoned = true; clearTimeout(timeout); reject(new Error("File storage is unavailable.")); };
    request.onerror = fail;
    request.onblocked = fail;
    request.onupgradeneeded = () => {
      const db = request.result;
      db.createObjectStore("drafts", { keyPath: "scope" });
      db.createObjectStore("files", { keyPath: ["scope", "localId"] }).createIndex("scope", "scope");
    };
    request.onsuccess = () => {
      clearTimeout(timeout);
      if (abandoned) request.result.close();
      else resolve(request.result);
    };
  });
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = database.transaction(["drafts", "files"], mode);
      let value: T;
      const timeout = setTimeout(() => {
        try { transaction.abort(); } catch { /* The completion event may already be queued. */ }
        reject(new Error("File storage did not respond."));
      }, 5000);
      transaction.oncomplete = () => { clearTimeout(timeout); resolve(value); };
      transaction.onabort = () => { clearTimeout(timeout); reject(new Error("File storage could not be updated.")); };
      transaction.onerror = () => { /* onabort handles failed requests, including quota errors. */ };
      try { work(transaction, (next) => { value = next; }); }
      catch (error) { transaction.abort(); reject(error); }
    });
  } finally { database.close(); }
}

function whenReady<T>(request: IDBRequest<T>, transaction: IDBTransaction, work: (value: T) => void) {
  request.onsuccess = () => {
    try { work(request.result); }
    catch { transaction.abort(); }
  };
}

function deleteScope(transaction: IDBTransaction, scope: string) {
  transaction.objectStore("drafts").delete(scope);
  const cursor = transaction.objectStore("files").index("scope").openCursor(scope);
  whenReady(cursor, transaction, (entry) => {
    if (!entry) return;
    entry.delete();
    entry.continue();
  });
}

export async function sweepRegistrationFiles(now = Date.now()): Promise<void> {
  await transact<void>("readwrite", (transaction, result) => {
    result(undefined);
    const cursor = transaction.objectStore("drafts").openCursor();
    whenReady(cursor, transaction, (item) => {
      if (!item) return;
      const entry = item.value as CacheEntry;
      if (!Number.isFinite(entry.lastActivity) || now - entry.lastActivity >= FILE_CACHE_TTL) deleteScope(transaction, entry.scope);
      item.continue();
    });
  });
}

export async function readRegistrationFiles(scope: string): Promise<UploadCandidate[]> {
  return transact<UploadCandidate[]>("readonly", (transaction, result) => {
    const request = transaction.objectStore("files").index("scope").getAll(scope);
    whenReady(request, transaction, (entries) => result((entries as StoredFile[]).flatMap((entry) => {
      if (!(entry.blob instanceof Blob) || typeof entry.name !== "string" || typeof entry.localId !== "string") return [];
      return [{ localId: entry.localId, purpose: entry.purpose, warrantyClientId: entry.warrantyClientId,
        file: new File([entry.blob], entry.name, { type: entry.blob.type, lastModified: entry.lastModified }) }];
    })));
  });
}

export async function syncRegistrationFiles(scope: string, files: UploadCandidate[], selectedIds: string[], now = Date.now()): Promise<void> {
  await transact<void>("readwrite", (transaction, result) => {
    result(undefined);
    transaction.objectStore("drafts").put({ scope, lastActivity: now } satisfies CacheEntry);
    const store = transaction.objectStore("files");
    const selected = new Set(selectedIds);
    const incoming = new Map(files.filter((file) => selected.has(file.localId)).map((file) => [file.localId, file]));
    const cursor = store.index("scope").openCursor(scope);
    whenReady(cursor, transaction, (item) => {
      if (item) {
        const entry = item.value as StoredFile;
        if (!selected.has(entry.localId)) item.delete();
        // File IDs are immutable. Avoid copying unchanged blobs on every draft edit.
        incoming.delete(entry.localId);
        item.continue();
      } else {
        for (const item of incoming.values()) {
          store.put({ scope, localId: item.localId, purpose: item.purpose, warrantyClientId: item.warrantyClientId,
            blob: item.file, name: item.file.name, lastModified: item.file.lastModified } satisfies StoredFile);
        }
      }
    });
  });
}

export async function clearRegistrationFiles(scope: string): Promise<void> {
  await transact<void>("readwrite", (transaction, result) => { deleteScope(transaction, scope); result(undefined); });
}
