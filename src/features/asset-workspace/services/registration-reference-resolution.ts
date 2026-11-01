import type { RegistrationDraft } from "../domain/registration-draft";
import { referenceId } from "../domain/registration-references";
import { fetchRegistrationReferences } from "./registration-selector-client";
import { RegistrationRequestError } from "./asset-registration-client";
import { selectorKinds, type ReferenceValidation, type SelectorKind } from "./registration-selector-contract";

export async function resolveReference(context: string, draft: RegistrationDraft, kind: SelectorKind, signal?: AbortSignal) {
  const id = referenceId(draft, kind);
  const page = await fetchRegistrationReferences(context, { kind, id }, signal);
  const item = page.items.find((item) => item.id === id);
  if (!item) throw new RegistrationRequestError("This selection is no longer available. Choose another reference.", "REFERENCE_NOT_FOUND", false, 404);
  return item;
}
export async function resolveSelectedReferences(context: string, draft: RegistrationDraft) {
  const selectedReferences = { ...draft.selectedReferences };
  const validation: ReferenceValidation = {};
  await Promise.all(selectorKinds.filter((kind) => referenceId(draft, kind)).map(async (kind) => {
    const id = referenceId(draft, kind);
    try {
      selectedReferences[kind] = await resolveReference(context, draft, kind);
      validation[kind] = { id, status: "valid" };
    } catch (error) {
      validation[kind] = { id, status: error instanceof RegistrationRequestError && error.status === 404 ? "unavailable" : "error",
        message: error instanceof Error ? error.message : "Could not validate this selection. Try again." };
    }
  }));
  return { draft: { ...draft, selectedReferences }, validation };
}
