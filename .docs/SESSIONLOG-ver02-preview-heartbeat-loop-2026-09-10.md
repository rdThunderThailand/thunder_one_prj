# SESSIONLOG — ver02 full-preview tab re-fetch/flicker loop (follow-up to #82)

## Symptom

Opening "เปิด preview เต็มจอ" from Frame 2 rendered the PreviewStage, but the tab
then fired `POST /api/proxy/media/videos/preview-urls` every ~2s and the screen
flickered continuously.

## Root cause

`usePublicationPreviewHandoff.ts` was ported from `use-playlist-preview-handoff.ts`
but dropped its `lastSent` fingerprint guard. On every `heartbeat` (~2s) the hook
re-posted a fresh `handoff` object with a new `zones` array. Downstream:
`PreviewStage` `assetIds` memo (`[assetsById, zones]`) recomputed to a new identity
→ the preview-url effect (`PreviewStage.tsx:133`, deps `[assetIds, active, previewUrls]`)
re-ran → `fetchPreviewUrls` + `setPreviewLoadState("loading"→"ready")` + `setUrls`
reset every heartbeat = the flicker + repeated POST.

The playlist file's own comment already documents this exact hazard.

## Fix

`src/features/media-workspace/publications/hooks/usePublicationPreviewHandoff.ts`
— added the `lastSent` fingerprint dedupe: `connect` always posts, `heartbeat`
posts only when `JSON.stringify(handoff)` changed. Straight mirror of the playlist hook.

## Verification

- `pnpm exec tsc` — changed file clean (pre-existing `furthestStep` error in
  `usePublishDraft.ts` unrelated).
- User re-checked in a real browser (dev `:3000`): flicker gone, `POST /preview-urls`
  no longer repeats, and editing a wizard field still updates the open preview tab.

## Status

Not committed. Belongs on `feat/pubflow-prepare-content` → Draft PR #90.
