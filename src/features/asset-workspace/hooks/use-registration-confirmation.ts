import { useEffect, useRef, useState } from "react";
import { confirmationPayload, missingRegistrationFiles, type ConfirmationRecord, type UploadCandidate } from "../domain/registration-confirmation";
import type { RegistrationDraft } from "../domain/registration-draft";
import { firstInvalidRegistrationStep } from "../domain/registration-validation";
import { readConfirmation, removeConfirmation, saveConfirmation } from "../services/asset-registration-recovery";
import { createRegisteredAsset, refreshRegistrationOptions, RegistrationRequestError } from "../services/asset-registration-client";
import { uploadRegistrationFiles } from "../services/asset-registration-uploads";
import type { RegistrationOptions } from "../services/asset-registration-contract";
import { resolveSelectedReferences } from "../services/registration-reference-resolution";
import { beginRegistrationRun } from "../services/asset-registration-run";
import { registrationCreationBlocker } from "../domain/registration-readiness";

export function useRegistrationConfirmation(key: string, context: string, initialOptions: RegistrationOptions | null) {
  const [initial] = useState(() => readConfirmation(key));
  const [record, setRecord] = useState(initial.record);
  const current = useRef(record);
  const active = useRef(false);
  const operation = useRef<AbortController | null>(null);
  useEffect(() => () => operation.current?.abort(), []);
  const [storageBlocked, setStorageBlocked] = useState(initial.blocked);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [errorStatus, setErrorStatus] = useState<number>();
  const [options, setOptions] = useState(initialOptions);
  const uncertain = record?.phase === "uncertain" || record?.phase === "submitting";
  const locked = busy || uncertain || storageBlocked;

  useEffect(() => {
    if (!locked || record?.phase === "succeeded") return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [locked, record?.phase]);

  function persist(next: ConfirmationRecord) {
    if (!saveConfirmation(key, next)) {
      setStorageBlocked(true);
      throw new Error("Browser recovery storage is unavailable. No further requests will be sent until it works again.");
    }
    current.current = next;
    setRecord(next);
  }
  function retryStorage() {
    const read = readConfirmation(key);
    if (read.blocked) return;
    const recovered = current.current ?? read.record;
    if (recovered && !saveConfirmation(key, recovered)) return;
    current.current = recovered;
    setRecord(recovered);
    setStorageBlocked(false);
    setError("");
  }
  async function refresh() {
    if (active.current) return;
    active.current = true;
    setBusy(true);
    try { setOptions(await refreshRegistrationOptions(context)); setError(""); setErrorStatus(undefined); }
    catch (failure) {
      setError(failure instanceof Error ? failure.message : "Couldn't refresh registration options.");
      setErrorStatus(failure instanceof RegistrationRequestError ? failure.status : undefined);
    }
    finally { active.current = false; setBusy(false); }
  }

  async function start(draft: RegistrationDraft, candidates: UploadCandidate[], edit: (draft: RegistrationDraft, options: RegistrationOptions, step: number | null) => void, overrideReason?: string) {
    if (active.current || storageBlocked || current.current?.phase === "succeeded") return;
    active.current = true;
    setBusy(true);
    setError("");
    setErrorStatus(undefined);
    let submitting = false;
    let recovery = false;
    let run: ReturnType<typeof beginRegistrationRun> | undefined;
    try {
      run = beginRegistrationRun(key);
      operation.current = run.controller;
      let next = current.current;
      recovery = next?.phase === "uncertain" || next?.phase === "submitting";
      if (recovery) {
        if (!next?.requestJson) throw new Error("The original request is unavailable. Keep this tab and contact support.");
      } else {
        setMessage("Checking current registration options");
        const fresh = await refreshRegistrationOptions(context);
        run.check();
        setOptions(fresh);
        const resolved = await resolveSelectedReferences(context, draft);
        run.check();
        draft = resolved.draft;
        const validatedOptions = { ...fresh, referenceValidation: resolved.validation };
        const invalid = firstInvalidRegistrationStep(draft, validatedOptions);
        edit(draft, validatedOptions, invalid);
        if (invalid !== null) { throw new Error("Check the highlighted registration step before confirming."); }
        const blocker = registrationCreationBlocker(draft, fresh, next?.uploads ?? []);
        if (blocker) throw new Error(blocker);
        if (overrideReason && (overrideReason.length > fresh.serialOverride.maxLength || next?.rejectedSerial !== draft.serialNumber.trim())) {
          throw new Error("Serial override is no longer available for this registration.");
        }
        if (missingRegistrationFiles(draft, candidates, next?.uploads ?? [])) throw new Error("Reselect missing files in Step 1 or Step 4, or explicitly remove those selections.");
        next = {
          version: 1, submissionId: next?.submissionId ?? crypto.randomUUID(), phase: "uploading",
          draft, uploads: next?.uploads ?? [], requestJson: null,
        };
        persist(next);
        next = await uploadRegistrationFiles(context, next, candidates, fresh, persist, setMessage, run.check);
        next = { ...next, requestJson: confirmationPayload(draft, next, overrideReason) };
      }
      if (!next?.requestJson) throw new Error("The confirmation request is unavailable.");
      run.check();
      next = { ...next, phase: "submitting" };
      persist(next);
      submitting = true;
      setMessage(recovery ? "Recovering the original creation result" : "Creating asset");
      const result = await createRegisteredAsset(context, next.requestJson!);
      const succeeded: ConfirmationRecord = { ...next, phase: "succeeded", result };
      // A confirmed receipt always wins, even if saving it fails. Persisted original request recovers it on refresh.
      current.current = succeeded;
      setRecord(succeeded);
      if (!saveConfirmation(key, succeeded)) setStorageBlocked(true);
      setMessage("Asset created");
    } catch (failure) {
      if (!submitting && run?.controller.signal.aborted) return;
      const requestError = failure instanceof RegistrationRequestError ? failure : null;
      setErrorStatus(requestError?.status);
      // A failed recovery (including expired authentication) cannot disprove the original commit.
      const unknown = submitting && (recovery || !requestError || requestError.uncertain);
      const previous = current.current;
      if (submitting && previous) {
        const next: ConfirmationRecord = {
          ...previous, phase: unknown ? "uncertain" : "rejected",
          rejectedSerial: requestError?.code === "SERIAL_DUPLICATE" ? previous.draft.serialNumber.trim() : undefined,
          uploads: !unknown && requestError?.code === "UPLOAD_EXPIRED" ? previous.uploads.map((upload) => ({ ...upload, unusable: true })) : previous.uploads,
        };
        current.current = next;
        setRecord(next);
        if (!saveConfirmation(key, next)) setStorageBlocked(true);
      }
      setError(unknown ? "The asset may have been created. Retry the original request to recover its result. Editing is locked to prevent a second creation."
        : failure instanceof Error ? failure.message : "Confirmation failed. Your registration has been kept.");
    } finally { run?.finish(); operation.current = null; active.current = false; setBusy(false); }
  }

  function discard() {
    if (active.current || uncertain) return false;
    return removeConfirmation(key);
  }
  return { record, options, busy, locked, uncertain, storageBlocked, message, error, errorStatus, start, refresh, retryStorage, discard };
}
