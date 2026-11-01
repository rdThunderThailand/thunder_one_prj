import { useEffect, useRef, useState } from "react";
import type { UploadCandidate } from "../domain/registration-confirmation";
import type { RegistrationDraft } from "../domain/registration-draft";
import { restorableRegistrationFiles, selectedLocalFiles } from "../domain/registration-local-files";
import type { RegistrationOptions } from "../services/asset-registration-contract";
import { clearRegistrationFiles, readRegistrationFiles, sweepRegistrationFiles, syncRegistrationFiles } from "../services/registration-file-storage";
import { detachRegistrationFileSession, pendingFileCleanup, registrationFileSession, rememberFileCleanup } from "../services/registration-file-session";

interface CacheInput {
  key: string; draft: RegistrationDraft; options: RegistrationOptions | null;
  files: UploadCandidate[]; restore: (files: UploadCandidate[]) => void; succeeded?: boolean;
}

export function useRegistrationFileCache(input: CacheInput) {
  const [restoring, setRestoring] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [cleanupError, setCleanupError] = useState("");
  const latest = useRef(input);
  const scope = useRef<string | null>(null);
  const stopped = useRef(false);
  const alive = useRef(false);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const lastTouch = useRef(0);
  const sequence = useRef(0);
  const restoration = useRef(0);
  const enabled = input.options !== null || Boolean(input.succeeded);
  useEffect(() => { latest.current = input; });

  function enqueue<T>(work: () => Promise<T>): Promise<T> {
    const task = queue.current.catch(() => {}).then(work);
    queue.current = task;
    return task;
  }

  async function retryCleanup() {
    const key = latest.current.key;
    const pending = pendingFileCleanup(key);
    for (const previous of pending) {
      await clearRegistrationFiles(previous);
      rememberFileCleanup(key, pendingFileCleanup(key).filter((value) => value !== previous));
    }
    if (alive.current) setCleanupError("");
  }

  async function restore() {
    const attempt = ++restoration.current;
    try {
      await enqueue(async () => {
        await sweepRegistrationFiles();
        scope.current = await registrationFileSession(latest.current.key);
        try { await retryCleanup(); }
        catch { if (alive.current) setCleanupError("Some cached files could not be removed. Retry cleanup."); }
        const saved = await readRegistrationFiles(scope.current);
        if (!alive.current || stopped.current || attempt !== restoration.current) return;
        const current = latest.current;
        if (current.options) {
          // Prefer current selections over cached bytes when Retry follows an earlier failure.
          const files = [...current.files, ...saved.filter((item) => !current.files.some((file) => file.localId === item.localId))];
          const accepted = restorableRegistrationFiles(files, current.draft, current.options);
          current.restore(accepted);
          const selected = selectedLocalFiles(current.draft);
          const rejected = saved.some((file) => selected.some((item) => item.id === file.localId) && !accepted.some((item) => item.localId === file.localId));
          setError(rejected ? "Some saved files no longer meet the current file limits. Reselect or remove them in Step 1 or Step 4." : "");
        }
      });
    } catch {
      if (alive.current && attempt === restoration.current) setError("File recovery is unavailable. Current files remain usable, but may be lost on refresh. Retry file recovery.");
    } finally {
      if (alive.current && attempt === restoration.current) {
        setRestoring(false);
        setInitialized(true);
      }
    }
  }

  useEffect(() => {
    alive.current = true;
    if (enabled) void restore();
    else void Promise.resolve().then(() => {
      if (alive.current) { setRestoring(false); setInitialized(true); }
    });
    return () => { alive.current = false; };
    // A cache belongs to this mounted registration, not to the active wizard step.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input.key, enabled]);

  const selectionKey = JSON.stringify(selectedLocalFiles(input.draft));
  const candidateKey = input.files.map((file) => file.localId).join(",");
  function save() {
    if (!scope.current || stopped.current) return;
    const current = latest.current;
    const cacheScope = scope.current;
    const request = ++sequence.current;
    setSaving(true);
    lastTouch.current = Date.now();
    void enqueue(() => syncRegistrationFiles(cacheScope, current.files, selectedLocalFiles(current.draft).map((item) => item.id)))
      .then(() => { if (alive.current && request === sequence.current) setError(""); })
      .catch(() => {
        if (alive.current && request === sequence.current) setError("File changes could not be saved locally. Current files remain usable, but refresh may lose them and removed cached files may remain. Retry file recovery.");
      })
      .finally(() => { if (alive.current && request === sequence.current) setSaving(false); });
  }

  useEffect(() => {
    if (!restoring && input.options && !input.succeeded) void Promise.resolve().then(save);
    // Blob writes depend on immutable selection IDs; ordinary field edits only touch activity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restoring, selectionKey, candidateKey, input.succeeded]);

  async function clear(): Promise<boolean> {
    stopped.current = true;
    sequence.current++;
    try {
      await enqueue(async () => {
        if (alive.current) { setError(""); setSaving(false); }
        const key = latest.current.key;
        const currentScope = scope.current ?? await registrationFileSession(key);
        // Remember deletion before detaching so a new registration can retry a failed cleanup.
        rememberFileCleanup(key, [...pendingFileCleanup(key), currentScope]);
        detachRegistrationFileSession(key, currentScope);
        await retryCleanup();
      });
      return true;
    } catch {
      if (alive.current) setCleanupError("Some cached files could not be removed. Your action is complete. Retry cleanup.");
      return false;
    }
  }

  useEffect(() => {
    if (!restoring && input.succeeded) void clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restoring, input.succeeded]);

  function retry() {
    if (stopped.current) void clear();
    else { setRestoring(true); void restore(); }
  }

  function touch() {
    if (!restoring && !input.succeeded && Date.now() - lastTouch.current > 5000) save();
  }
  return { initializing: !initialized, hasFiles: selectedLocalFiles(input.draft).length > 0, restoring, saving, error, cleanupError, retry, clear, touch };
}
