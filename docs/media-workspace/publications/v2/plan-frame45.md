# Plan — ver02 Frames 4 and 5

## Scope

- Replace the shared `ReviewPublishStep` with separate `ReviewStep` and `PublishStep` surfaces.
- Make every Review checklist row read a named validator result; add the advisory geometry-fit row.
- Reuse the existing draft, preview, schedule, conflict, save, and publish contracts. No persisted fields or backend changes.

## Implementation

1. Give publish-eligibility checks stable ids and keep only content, targets, and schedule as publish gates.
2. Build Frame 4 from the approved design: four read-only summary cards, playback preview, schedule timeline, warnings, checklist, and review summary rail.
3. Build Frame 5 from the approved design: ready state, read-only schedule, disabled future options, publish summary, and Live View guidance.
4. Route steps 4 and 5 to their own components and leave the existing footer actions as the sole save/publish controls.

## Verification

- Run the focused eligibility assertion file.
- Run ESLint on changed files, TypeScript with the documented pre-existing-error allowance, and `git diff --check`.
- Ask the user before completion-level browser verification.
