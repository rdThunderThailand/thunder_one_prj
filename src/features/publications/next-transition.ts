import type { DraftFields } from "./store/usePublicationDraftStore";
// Explicit .ts extension so the .check.mts beside this file can load it under
// Node's ESM resolver, which does no extension guessing.
import { validateStep, type WizardStepId, type Step1Context } from "./step-validation.ts";

/**
 * What a Next click resolved to. `saved` is the only outcome that may advance
 * the step — keeping that decision in one discriminated union is the point of
 * this file, since a save failure silently advancing loses the user's work.
 */
export type NextOutcome =
  | { kind: "invalid"; errors: string[] }
  | { kind: "saved" }
  | { kind: "failed"; message: string };

/**
 * Validate the current step, then persist. `persist` runs only when the step is
 * valid, so the caller can hang its "saving…" state flip inside that callback
 * and have it fire at exactly the right moment.
 */
export async function attemptNext(
  step: WizardStepId,
  state: DraftFields,
  persist: () => Promise<unknown>,
  ctx?: Step1Context
): Promise<NextOutcome> {
  const result = validateStep(step, state, ctx);
  if (!result.valid) return { kind: "invalid", errors: result.errors };

  try {
    await persist();
    return { kind: "saved" };
  } catch (err) {
    return { kind: "failed", message: err instanceof Error ? err.message : "Failed to save draft." };
  }
}

/**
 * True while a `?id=` draft is still being fetched, so the wizard can render
 * nothing instead of one frame of the previous draft's values.
 */
export function isResumePending(
  idParam: string | null,
  resumedId: string | null,
  publicationId: string | null
): boolean {
  return Boolean(idParam) && idParam !== resumedId && idParam !== publicationId;
}
