# Media asset rename — 2026-09-09

## Scope

- Add inline editing for the Asset display name on Media Detail.
- Keep `public.files.original_filename` and the Storage object unchanged.
- Add a tenant-scoped `media_asset_rename` RPC and extend `PATCH /media/videos/:id`.

## Files

- Thunder One: `src/features/media-workspace/assets/media-detail-page.tsx`, `src/lib/api/media-api.ts`
- Thunder Core: `src/app/api/core/v1/media/videos/[id]/route.ts`, `src/app/api/core/v1/media/videos/schema.ts`, `src/app/api/core/v1/media/videos/schema.check.mts`, `supabase/migrations/20260909075113_media_asset_rename.sql`

## Verification

- PASS: Thunder One targeted ESLint and `tsc --noEmit`.
- PASS: Thunder Core schema check, targeted ESLint, and `git diff --check`.
- BLOCKED: Thunder Core whole-project TypeScript has unrelated existing errors and cannot write `tsconfig.tsbuildinfo` from the sandbox.
- PASS: Browser shows the accessible Rename control, focused input, Save/Cancel controls, and returns to view mode after Cancel without a data write.
- NOT RUN: Rename save against develop because the migration/API change is not deployed.

## Upload queue follow-up

- Added a per-row Asset display-name input before upload; registration uses the edited title while the physical filename remains unchanged.
- Made Folder optional with `Uncategorized` as the explicit default.
- Removed the UI-only queue-count ceiling; concurrency remains two uploads.
- PASS: queue state-machine check, targeted ESLint, TypeScript, and `git diff --check`.
- PASS: Browser renders `Uncategorized` as the default Folder and accurately states there is no queue limit with two concurrent uploads.
- NOT RUN: File-picker row interaction; the browser automation surface could not programmatically populate the native file input. Upload was intentionally not started.

## Local queue preview

- Replaced the extension-only queue placeholder with an object-URL preview for staged images and videos.
- Object URLs are revoked when rows unmount; the preview is decorative and keeps an empty accessible name.
- PASS: preview regression check, queue check, targeted ESLint, TypeScript, and `git diff --check`.
- Approval policy changed: new registrations default to `approval_status = approved`, so they are immediately selectable by Playlist, Layout, and Publication flows. Existing draft/pending Assets are not bulk-approved.
