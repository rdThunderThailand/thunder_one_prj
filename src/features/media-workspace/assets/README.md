# assets

Central Asset repository — upload, list, and manage reusable media files (images and video) to be used in Playlists and Publications. See `CONTEXT.md` at the repo root for the Asset definition. Plans live under `docs/media-workspace/media-library/` (library, upload queue, usage in `docs/media-workspace/plan-asset-usage-262.md`).

Real, backed by Thunder_Core through `@/lib/api/media-api` (there is no per-feature `services/` here). Routes: `/media-workspace/assets` (library), `/media-workspace/assets/[assetId]` (detail), `/media-workspace/assets/upload` (upload queue).

- `media-library-page.tsx` — the library: folders, search/filters, grid/list of Assets, trash/restore/move/delete, batch actions. Uses `components/` (`AssetCard`, `LibraryToolbar`) and `fetchMediaAssets`/`fetchContentFolders`/`moveMediaAsset`/`trashMediaAsset`/`restoreMediaAsset`
- `media-detail-page.tsx` — the Asset detail page (preview, rename, move-to-folder/trash/fullscreen dialogs in `media-detail-*.tsx`), with `components/UsagePanel` showing where the Asset is used
- Asset usage — `asset-usage.ts` (pure helpers for the "still used by Playlists/Layouts/Programs" warnings), `useAssetUsage.ts`, `components/AssetUsageDialogs` (trash/delete confirmations) and `components/UsageLists`
- `useAssetUpload.ts` — registers and uploads a file, then fetches the new Asset
- `upload/` — the upload queue page (`UploadQueuePage`, `RecentUploadsCard`) with its state in `upload-queue.ts` / `useUploadQueue.ts` (staged → uploading → completed/failed/canceled), plus `playback-readiness.ts` and `transcode-wait.ts`
- `use-transcode-status.ts` — polls Core for the transcode status of Assets still converting
- `*.check.mts` — `node:assert` checks for the pure logic (`asset-usage`, `folder-tree` for `content-library/folder-tree.ts`, and under `upload/`: queue, playback readiness, transcode wait, queue page); run with `node <file>.check.mts`
- `hooks/`, `services/`, `types/` — empty placeholders (`.gitkeep`)
