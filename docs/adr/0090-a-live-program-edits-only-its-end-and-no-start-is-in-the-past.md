# A Live Program edits only its end, and no editable start is in the past

**Status:** accepted · 2026-10-08
**Amends:** the #222 fix (`80f968f`) — "a recurring start may already be in the past" no longer holds for any start the operator can edit.
**Source:** QA batch 2026-10-08, items 1 and 6; `docs/media-workspace/plan-qa-batch-2026-10-08.md`

## Decision

- On the Edit page of a **Live** (or Publishing) Program the schedule is read-only except its **end date/time**: preset, days, start date and daily window are locked. Changing the pattern means a new Program.
- A **Scheduled** Program (not yet started) and the Create wizard may edit everything, but no start date may be before today.
- Every editable start and end therefore gets `min = today`, and `validateDraft` rejects a past start for a Draft or Scheduled Program. An end on a Live Program must not be before now.

## Why

#222 left start dates without `min` only because a Live Program's stored start is legitimately in the past and the same fields rendered it. Locking the start on Live removes that case, so the past-start guard can apply everywhere a start is editable — which is what operators expected (item 1).

## Considered options

- **Lock only the start on Live; days and window stay editable.** Rejected by the owner (2026-10-08): on a Live Program only the end should move; a different pattern is a new Program.
- **Keep #222's rule (no `min` on start).** Rejected: a new Program could still be scheduled to start yesterday.

## Consequences

- UI-only for now; `media_publication_set_schedule` still accepts any start. A backend guard is a separate change.
- Ended Programs stay fully read-only (unchanged).
