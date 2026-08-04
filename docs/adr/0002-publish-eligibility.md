# 0002 — Unify Publish eligibility into one source of truth

## Context

`CLICKUP_FLOW_AUDIT_GAPS.md` P0.2. Three independent, disagreeing validity checks exist
(confirmed by reading the code, not guessing):

- `usePublishDraft.ts` `canPublish` (gates the actual Publish button) —
  `name.trim() && assetItems.length>0 && channelIds.length>0`. Ignores schedule validity,
  content approval status, conflicts, and loading state entirely.
- `ReviewPublishStep.tsx` `checkStatus` (drives the Pre-Publish Checklist UI only, does not
  gate the button) — content approval, schedule validity, channel count, a permanently
  neutral policy placeholder, conflicts. Ignores the publication name.
- Neither reads `loadingRefs` / `checkingConflicts` — a Publish click during an in-flight
  conflict check currently reads `conflicts.length === 0` as "no conflicts" rather than
  "unknown yet".

## Decision

One pure function, colocated with [[0001-wizard-step-contract]]'s `validateStep`:

```ts
// src/features/publications/publish-eligibility.ts
export interface EligibilityCheck { status: "pass" | "fail" | "unknown" }
export interface EligibilityResult { checks: EligibilityCheck[]; canPublish: boolean }

export function computeEligibility(params: {
  draft: DraftFields;
  assets: MediaAsset[];
  conflicts: ScheduleConflict[];
  loadingRefs: boolean;
  checkingConflicts: boolean;
}): EligibilityResult
```

`checks` is a 5-element array aligned to `prePublishChecklist` in `mock-data.ts` (same order
the Review UI already renders), so `ReviewPublishStep.tsx` can render it directly instead of
computing its own `checkStatus`:

- `[0]` content ready: every selected asset has `approval_status === "approved"` — `"unknown"`
  while `assets` hasn't loaded (asset not found by id yet), not a silent pass.
- `[1]` schedule: reuses `validateStep(4, draft).valid` from ADR 0001 — not reimplemented.
- `[2]` channels: reuses `validateStep(3, draft).valid`.
- `[3]` publishing policy: stays `"unknown"` unconditionally — Phase 1 has no Approval
  Workflow (explicit scope note in the audit doc), this is intentionally manual-only.
- `[4]` conflicts: `"unknown"` while `checkingConflicts`, else pass iff `conflicts.length === 0`.

`canPublish = validateStep(1, draft).valid && checks[0,1,2,4] all "pass" && !loadingRefs`.
Index `[3]` is excluded from the gate on purpose (see above) — same as today's `neutral`
handling, just made explicit instead of hardcoded per-callsite.

`usePublishDraft.ts`'s `canPublish` boolean is deleted and replaced by
`computeEligibility(...).canPublish`. `ReviewPublishStep.tsx`'s local `checkStatus`/`allPassed`
are deleted and replaced by rendering `computeEligibility(...).checks`.

Server-side re-validation (audit's "ตรวจ validation ซ้ำฝั่ง server ก่อน activate"): the
existing `activatePublication` call already round-trips to the backend and its rejection
already surfaces through `publishNow`'s catch → `setError`. No new backend call is added by
this ticket — making that round trip *idempotent* is P0.3, a separate ticket ([[0001-wizard-step-contract]]
covers navigation, this covers the gate, P0.3 covers retry safety). Scoping it there instead
of here avoids solving idempotency and eligibility in the same diff.

Rejected: adding a 6th checklist row for Basic Info (name/campaign) validity — the audit only
asks that Basic Info block Publish, not that it get new UI. Folding it into `canPublish`
without a dedicated checklist bullet is the smaller diff; the existing 5-item array in
`mock-data.ts` stays untouched.

## Consequences

Any future flow that needs "is this publication publishable" must call `computeEligibility`,
not read `assetItems.length > 0` inline again — that's exactly the drift this ADR removes.
