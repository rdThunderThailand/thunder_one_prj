import { useEffect, useRef, useState } from "react";
import type { RegistrationDraft } from "../domain/registration-draft";
import { referenceId } from "../domain/registration-references";
import { resolveReference } from "../services/registration-reference-resolution";
import { RegistrationRequestError } from "../services/asset-registration-client";
import { selectorKinds, type ReferenceItem, type ReferenceValidation, type SelectorKind } from "../services/registration-selector-contract";

export function useRegistrationReferences(context: string, draft: RegistrationDraft, step: number,
  patch: (changes: Partial<RegistrationDraft> | ((draft: RegistrationDraft) => Partial<RegistrationDraft>)) => void) {
  const [validation, setValidation] = useState<ReferenceValidation>({});
  const [attempt, setAttempt] = useState(0);
  const requests = useRef(new Map<SelectorKind, { key: string; controller?: AbortController }>());
  const latest = useRef({ draft, patch });
  useEffect(() => { latest.current = { draft, patch }; });
  const ids = selectorKinds.map((kind) => referenceId(draft, kind)).join(":");

  useEffect(() => {
    const current = latest.current.draft;
    for (const kind of selectorKinds) {
      const id = referenceId(current, kind);
      const key = `${context}:${id}:${attempt}`;
      const previous = requests.current.get(kind);
      if (!id || step < 0 || previous && previous.key !== key) {
        previous?.controller?.abort();
        requests.current.delete(kind);
      }
      if (!id || step < (kind === "categories" ? 1 : 2) || requests.current.get(kind)?.key === key) continue;
      const controller = new AbortController();
      requests.current.set(kind, { key, controller });
      setValidation((previous) => ({ ...previous, [kind]: { id, status: "pending" } }));
      void resolveReference(context, current, kind, controller.signal).then((item) => {
        if (controller.signal.aborted || requests.current.get(kind)?.key !== key || referenceId(latest.current.draft, kind) !== id) return;
        latest.current.patch((draft) => ({ selectedReferences: { ...draft.selectedReferences, [kind]: item } }));
        setValidation((previous) => ({ ...previous, [kind]: { id, status: "valid" } }));
      }).catch((error) => {
        if (controller.signal.aborted || requests.current.get(kind)?.key !== key) return;
        setValidation((previous) => ({ ...previous, [kind]: { id, status: error instanceof RegistrationRequestError && error.status === 404 ? "unavailable" : "error",
          message: error instanceof Error ? error.message : "Could not validate this selection. Try again." } }));
      });
    }
  }, [context, ids, step, attempt]);

  useEffect(() => {
    const pending = requests.current;
    return () => {
      pending.forEach((request) => request.controller?.abort());
      pending.clear();
    };
  }, []);

  function select(kind: SelectorKind, item: ReferenceItem) {
    requests.current.get(kind)?.controller?.abort();
    requests.current.set(kind, { key: `${context}:${item.id}:${attempt}` });
    const changes = kind === "categories" ? { categoryId: item.id } : kind === "locations" ? { locationId: item.id } : { custodyId: item.id };
    patch((draft) => ({ ...changes, selectedReferences: { ...draft.selectedReferences, [kind]: item } }));
    setValidation((previous) => ({ ...previous, [kind]: { id: item.id, status: "valid" } }));
  }
  return { validation, select, accept: setValidation, retry: () => setAttempt((value) => value + 1) };
}
