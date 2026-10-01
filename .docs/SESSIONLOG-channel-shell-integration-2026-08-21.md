# Session Log — Channel shell integration (2026-08-21)

## Goal

Integrate `origin/dev`'s Thunder One shell route and feature-folder structure into `feat/channel` without losing the Channel management and related Playlist/Publication work.

## Changes

- Renumbered Channel ADRs from `0033`/`0034` to `0038`/`0039`, avoiding the numbers now used by the merged shell ADRs on `dev`.
- Moved the Communication feature modules under `src/features/communication/` and updated direct imports.
- Merged `origin/dev` into `feat/channel`.
- Moved Channel list/create/edit routes under `src/app/(dashboard)/(application)/communication/channels/`.
- Retained the branch's full Channel, Playlist, and Publication implementations where `dev` supplied placeholders or older versions.
- Updated Communication navigation targets from the old root routes to `/communication/...`.
- Corrected relative imports made one level deeper by the feature-folder move.

## Verification

- `pnpm exec next typegen` — passed.
- `pnpm exec tsc --noEmit` — passed after type generation.
- `pnpm lint` — passed.
- `git diff --cached --check` — passed before the final import fixes; those fixes are type-checked and will be included in the merge commit.

## Not verified

- Browser verification was not run. The project agreement requires the user to choose browser verification, a manual checklist, or an explicit skip before this is claimed as UI-verified.
- The existing local handoff transcript remains untracked and was intentionally not included in Git.
