# Layouts Library redesign — 2026-08-31

## Completed in `thunder_one_prj`

- Extracted shared Content Folder tree helpers and `ContentFolderRail`; Media Library now uses them without changing its feature-specific upload/grid actions.
- Made `createContentFolder` require an explicit `scope`, with the existing Asset caller passing `asset`.
- Reworked `/media-workspace/layouts` around the approved Composition Library read-model contract: collection-scoped Folder rail, URL-backed filters/sort/pagination, four server-summary cards, and a compatibility notice for the legacy Core response.
- Added a composite list preview that renders every persisted preview Zone and requests first-asset preview URLs in one batch.
- Removed the frontend four-Zone business cap from geometry validation and both Split Zone controls; six Zones are covered by a focused assertion.

## Verification run

- `node src/features/media-workspace/assets/folder-tree.check.mts`
- `node src/features/media-workspace/compositions/list-url-state.check.mts`
- `node src/features/media-workspace/layouts/geometry.check.mts`
- `node src/features/media-workspace/layouts/split-zone.check.mts`
- `pnpm exec next typegen`
- `pnpm exec tsc --noEmit`
- `git diff --check`

All passed. Node emitted the existing module-type warning for standalone `.check.mts` imports; it did not fail a check.

## Blocked by `Thunder_Core`

- Backend A: the paginated Composition Library read model, summary/facets, collection filters, current Publication usage and ordered preview-zone facts.
- Backend B: Composition Folder mutations/counts, Trash/restore/permanent-delete lifecycle and removal of the server-side Zone cap from `media_layout_upsert`.

## Not verified

- Authenticated browser/operator-layer verification was not run. It must be requested immediately before the browser checkpoint, and real-record mutations require separate R0 approval.
- No migration, deployment, commit or push was performed.
