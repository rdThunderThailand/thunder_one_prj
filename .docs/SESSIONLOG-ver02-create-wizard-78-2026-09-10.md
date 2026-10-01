# SESSIONLOG — ver02 Create wizard #78 (pending seed/resume resolver)

**Date:** 2026-09-10 · **Branch:** `feat/pubflow` · **Risk:** R2 · **Commit:** `d06c60e`

## Ticket

#78 — the last of PR1. `?compositionId=` used to be applied to whatever draft was already
hydrated (deliberate per the old comment), while the resume prompt is computed much later.
Generalising that would mutate a draft the operator then chooses to *continue* — ADR 0072 §3
forbids it. Make the seed **pending** until the resume choice is made.

## Changes

- `src/features/media-workspace/publications/seed-resolver.ts` (new) — pure
  `resolveSeed({ seedPresent, isEditMode, draftHasContent, choice }) → "apply" | "discard" | "wait"`.
- `src/features/media-workspace/publications/seed-resolver.check.mts` (new) — `node:assert`,
  covers all four ticket rows + `wait` + no-seed. `node …/seed-resolver.check.mts` → `ok`.
- `components/CreatePublicationPage.tsx`:
  - Replaced the `seededCompositionRef` effect with a `resolveSeed`-driven one. `seedChoice`
    state (`"continue" | "fresh" | null`) is set by the resume modal buttons; a plain dismiss
    counts as `"continue"`.
  - On `"apply"`: set type `composition` + `compositionId`, `setStep(2)` (was `setStep(1)` —
    ver02 step 1 is Choose Content, and the content is now chosen).
  - After any resolution (`apply` or `discard`) with a seed present, `router.replace` strips
    the query so a refresh does not re-seed. `seedResolvedRef` guards against re-running.

`hasDraftContent` still doesn't look at `compositionId` (it checks `playlistId`) — left as-is,
out of scope; `step > 1` covers the realistic case anyway.

## Verification (browser, self-driven, localhost:3000, logged in)

Composition seed id: `af896984-b213-49a0-9218-2a3ae58ee667` (Active, 3/3 zones).

| row | steps | result |
|---|---|---|
| empty draft + seed | cleared draft, nav `?compositionId=…` | landed **step 2**, type Layout, `compositionId` set, URL stripped to `/create` |
| content + **Continue** | seeded a named draft, nav with seed, clicked "ทำต่อ" | draft untouched (name kept, type `image`, `compositionId: null`), URL stripped |
| content + **Start fresh** | seeded a named draft, nav with seed, clicked "เริ่มใหม่" | draft cleared (name `""`), seed applied (type `composition`, `compositionId` set, step 2), URL stripped |
| `?id=` edit mode | — | covered by `seed-resolver.check.mts` (`isEditMode: true → discard`); the `?id=` resume path itself is unchanged from #76 |

- No console errors.
- All 18 `publications/*.check.mts` pass.
- `tsc` (changed files) / `eslint` (changed files) clean.
- No backend rows created during the run; draft localStorage cleared after.

## PR

`feat/pubflow` → `dev`, PR #88. PR1 (#76 + #77 + #78) now complete and verified. Left as
**Draft** — the user marks it ready (CLAUDE.md §4).
