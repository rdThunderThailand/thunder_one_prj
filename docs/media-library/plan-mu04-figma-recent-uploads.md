# MU-04 — Figma-guided Upload page and Recent Uploads

## Scope

- Reshape `UploadQueuePage` to follow the supplied FigJam hierarchy: upload header, primary drop zone, queue, summary, and a narrow settings/help rail.
- Preserve the existing queue state machine and destructive-action confirmations.
- Add a Recent Uploads card backed by the tenant-scoped media list endpoint, limited to the newest three Assets and refreshed after successful registration.
- Lock the Phase 1 control matrix: Folder enabled; Tags and Add from Source disabled with `Coming in Phase 2`; Pause All and Storage Usage absent; Start Upload has no dropdown.

## Implementation

1. Recompose the existing page with current `Button`, `Card`, icons, queue hook, and media API patterns; add no dependency or page-level design system.
2. Keep queue controls and row actions connected to the existing hook, add visible progress and a summary derived only from queue items.
3. Isolate the fetched Recent Uploads surface so the main page remains within the repository file-size convention; reuse `MediaThumb`, `usePreviewUrls`, and Media Detail routes.
4. Render loading, empty, and failure states without blocking upload work.

## Verification

- Run the existing queue check, Next type generation, TypeScript, targeted ESLint, and `git diff --check`.
- At the browser verification point, compare the rendered desktop page with the supplied FigJam and exercise staging, Folder selection, Start Upload state, aggregate actions, responsive layout, keyboard focus, and Recent Uploads refresh.

## Deliberately deferred

- Tag assignment, external-source ingestion, Pause/Resume controls, Storage Usage, audio, and documents remain outside MU-04.
