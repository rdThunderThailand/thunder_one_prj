# Media Detail — 2026-08-29

## Delivered

- Added the tenant-scoped `GET /media/videos/[id]` contract backed by `public.media_asset_get(uuid, uuid)`.
- Added the Media Detail route at `/media-workspace/assets/[assetId]` and linked each Media Library preview/title to it without intercepting Move or Trash controls.
- Rendered persisted Asset/File facts, signed preview/download, folder path, native video controls, Move to Folder and Move to Trash.
- Kept Usage, Asset Tags, Metadata, Versions, Activity History, rename, replace, duplicate, publish and archive unavailable until their dedicated contracts exist. Archive remains excluded by the Trash decision.
- Updated `CONTEXT.md` and ADR-0056 with the accepted Media Detail boundary.

## Verification

- Supabase develop branch `ftfmokgphewzyxzwjitv` migration `20260829053128_media_asset_detail` applied successfully.
- SQL verification confirmed tenant guard, `service_role` execute permission, and no `anon`/`authenticated` execute permission. A real develop Asset returned a JSON object with a matching ID.
- Browser verification on authenticated `http://localhost:3000`: Media Library loaded 17 assets; clicking `30951-383991408.mp4` opened its detail route; the page rendered a video preview, persisted dimensions/duration/file data, signed Download URL, disabled unsupported tabs/actions, and no console errors.
- Browser verification on `KFC-small.jpg` rendered the image preview path with no console errors. Move/Trash were not clicked to avoid changing develop data.
- `pnpm exec next typegen`, `pnpm exec tsc --noEmit`, folder-tree assertions, targeted ESLint and `git diff --check` passed in ThunderOne. Targeted Core ESLint passed; full Core typecheck remains blocked by existing repository errors and an unwritable `tsconfig.tsbuildinfo`.

## Remaining

- Usage aggregates, Asset Tags, Versions, Activity History and write actions remain intentionally disabled pending separate backend contracts.
- No commit or deploy was performed for this slice.
