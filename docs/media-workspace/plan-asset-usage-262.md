# Plan — Asset Usage, Trash warning, Permanent delete blockers (#262)

**Decision:** `docs/adr/0091-asset-trash-warns-with-usage-and-permanent-delete-names-blockers.md` (read it first; this plan only orders the work).
**Follow-up:** #268 (tombstone) is out of scope.
**Repos:** Core = `Thunder_Core` (branch off `develop`), FE = `thunder_one_prj` (branch off `dev`).

## Rules that apply to every Core step

- `DROP FUNCTION IF EXISTS <old signature>` before any `CREATE OR REPLACE` that changes parameters or return type.
- `CREATE FUNCTION` grants EXECUTE to PUBLIC: `REVOKE ALL ... FROM PUBLIC, anon, authenticated; GRANT EXECUTE ... TO service_role`.
- Tenant isolation lives inside the RPC (`p_tenant_id`), not RLS.
- Writing the migration file is R2. **Applying it to develop or prod is R0**: stop, show the exact SQL and target, wait for approval. After applying, dump `prosrc` and compare to the file.
- Core `tsc` is never clean: gate on changed files only.
- Deploying Core is a separate R0; the FE talks to the deployed `develop` Core unless `CORE_API_URL` is set.

## Steps

### C1 — `media_asset_usage` read RPC + route (Core)
- Migration: `media_asset_usage(p_tenant_id uuid, p_asset_ids uuid[]) → jsonb` keyed by asset id: `playlists`, `layouts`, `programs`, `coverOf`, `history` (ADR 0091 Decision 1).
- First step intersects `p_asset_ids` with `media_assets WHERE tenant_id = p_tenant_id`.
- Reuse: `media_core.publish_changes_targets` (playlist → direct + composition Programs), `media_composition_programs_list` for status/date shape, `media_core.publication_display_status`, newest-Job rule from `media_asset_on_air`.
- Route `GET src/app/api/core/v1/media/videos/usage/route.ts`, `?ids=` ≤ 100, resolved with `requireMediaTenant`.
- Check: one `.check` or SQL fixture per rule — trashed Playlist/Layout excluded, Ended/Cancelled Program excluded, `inline`/`single` shown as Program only, Program counted once when both live source and snapshot match, foreign-tenant id dropped.

### C2 — Trashed Asset cannot enter new airtime (Core)
- Add a `trashed` group to the `not_ready` check in the activate / Publish Changes materialisation (latest definition: `20260930110000_activate_refuses_zero_devices.sql:296`, then any later override — find the newest with `grep -l "not_ready"`). Refuse and name the Asset.
- `media_playlist_set_items`: reject a trashed Asset id **only if it is not already in that Playlist** (the RPC replaces the whole list, so rejecting all trashed ids would freeze Playlists that already hold one).
- Check: activate with a trashed item → refused with the title; resave a Playlist that already holds a trashed item → succeeds; restore → activate passes.

### C3 — `media_asset_permanent_delete` returns blockers (Core)
- One shared helper computes blockers from the **same predicate** `media_video_delete` uses (`user`/`inline` Playlist items, snapshot items, `playback_logs`); `media_video_delete` calls it too.
- `media_asset_permanent_delete` → `{deleted:false, blockers:{playlists, layouts, programs, history}}` instead of raising; lock the Asset row `FOR UPDATE` first.
- Invariant: `deleted=false` ⇒ at least one blocker non-empty. Check it with an Asset held only by the `inline` Playlist of a Cancelled Draft Program.
- Update the route `videos/[id]/permanent/route.ts` response.

### F1 — API client + types (FE)
- `fetchAssetUsage(ids)` in `src/lib/api/media-api.ts`, types in `src/types/domain`; `permanentlyDeleteMediaAsset` returns the `{deleted, blockers}` result.
- Keep the check style: `node <file>.check.mts`, no test runner.

### F2 — Media Detail `UsagePanel` (FE)
- `assets/media-detail-page.tsx:39`: three linked groups, `On air` badge, cover footnote, `Not used anywhere`; drop the `Coming soon` badge. Tokens from `globals.css` and `src/components/ui/lovable/` only.

### F3 — Trash dialog, single and batch (FE)
- `media-detail-dialogs.tsx` `TrashDialog` and `media-library-page.tsx` `pendingBatch`: fetch Usage on open; in-use Assets only, summary counts, expandable; one confirm; copy per ADR Decision 3. No in-use Assets → existing confirm.

### F4 — Permanent delete (FE)
- Trash view: `Has broadcast history` badge, Permanent delete disabled when `history`.
- `runBatch` (`media-library-page.tsx:110`) reads `deleted` per result; one dialog lists blocked Assets with their blockers.

### D — Docs
- `.docs/SESSIONLOG-asset-usage-262-<date>.md` at the end of the session. Update `CONTEXT.md` only if the final wording drifts from the ADR.

## Order and gates

**C3 deploy order (hard rule):** the deployed Core route ignores the RPC result. Applying C3 before the new route is live makes a blocked delete answer `success:true` while the file stays. On prod, deploy the Core route with or before the migration; never migration first.

C1 → C2 → C3 (independent migrations, one Core PR) → apply to develop (R0) → F1–F4 against develop → verify → Core to prod (R0) and deploy → FE merges after Core main. Open both PRs as Draft.

## Verification (ask before each browser verify point)

1. SQL level for each Core step, then through the HTTP route.
2. UI: Media Detail Usage panel; single Trash with and without Usage; batch Trash mixed; Trash view with a broadcast-history Asset; Publish Changes on a Live Program holding a trashed Asset is refused.
3. Anything not run must be reported as unverified, with the layer.
