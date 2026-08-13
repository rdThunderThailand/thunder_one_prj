# 0001 — Step contract for Create Publication wizard navigation

## Context

`CLICKUP_FLOW_AUDIT_GAPS.md` P0.1: `Next` in `CreatePublicationPage.tsx` only does
`goNextAction(MAX_BUILT_STEP)` — no validation, no persistence. `usePublishDraft.ts`
already has a working `persistDraft(forPublish)` but it's only called from `saveDraft`
(the explicit "Save as Draft" button) and `publishNow`, never from `Next`.

Three independent, disagreeing validity notions already exist:
- `BasicInfoForm.tsx` — decorative `required` markers only, not enforced.
- `usePublishDraft.ts` `canPublish` — name + assets + channels only, ignores schedule/conflicts.
- `ReviewPublishStep.tsx` `checkStatus` — approval status + schedule + channels + conflicts, ignores name.

## Decision

A single pure function, not a per-step interface/class:

```ts
// src/features/publications/step-validation.ts
export type WizardStepId = 1 | 2 | 3 | 4; // 5 = Review, has no Next
export interface StepValidationResult { valid: boolean; errors: string[] }
export function validateStep(step: WizardStepId, state: DraftFields): StepValidationResult
```

`Next` becomes: `validateStep → persistDraft(false) → goNext`, guarded by a `savingNext`
flag (blocks double-click) and a `saveStatus: 'idle' | 'saving' | 'saved' | 'error'` shown
next to the button. On validation failure or a thrown persist error, `goNext` is never
called — step stays put, store fields are untouched (only written on success).

`Save as Draft` keeps working unvalidated — that's the point of a draft.

Rejected: a per-step controller interface/registry (`{validate, save, restore}` object
per component) — four steps don't justify a registry; a switch-based pure function is
the smaller diff and is trivially unit-testable without React.

Rejected: introducing a schema library (Zod etc.) for validation — no new dependency,
existing checks are plain boolean logic; consolidating what's already there is enough.

Restore is not rebuilt here — zustand `persist` already restores `step` + all draft
fields from localStorage on reload. The `?id=` resume path force-sets `step` to 1
(`CreatePublicationPage.tsx:82`); left as-is, out of scope for this ticket (flagging,
not fixing — avoid scope creep into resume-by-id behavior).

## Consequences

Unifying `canPublish` / review checklist / this `validateStep` into one eligibility
source of truth is P0.2, not this ticket — `validateStep` covers per-step Next gating
only. P0.2 should reuse `validateStep` for steps 1–4 rather than inventing a fourth check.
