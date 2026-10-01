# Session log — Publish Changes design + default Program name (2026-09-29)

Branch: `feat/default-program-name` (from `dev`).

## Decided (grilling → ADR)

- ADR 0078 `docs/adr/0078-publish-changes-republishes-every-affected-program.md`: Publish Changes =
  bulk re-publish of every active/scheduled Program that uses the edited Playlist or Layout, all-or-nothing,
  built on `media_publication_republish` (ADR 0053). Reviewed twice against Thunder_Core `origin/develop`;
  both rounds of fixes applied (distinct set, split by `publication_type`, single helper, error contract,
  `ORDER BY id` locking, distinct-channel count).
- Plan `docs/media-workspace/plan-publish-changes.md`: slices B (FE only), BE-A (RPCs, R0 apply), FE-A.

## Done (Slice B, FE only)

- Default Program name at Prepare Content: `default-program-name.ts` (+ `.check.mts`), `applyAutoName` and
  `lastAutoName` in `usePublicationDraftStore` (key bumped to `v13`), `contentName` on `StagePreview`
  (set by `loadCompositionPreview` and the playlist branch of `usePublicationStagePreview`).
- Extra, asked in-session: `AssetLibraryStep.tsx` no longer uses `window.confirm` / `window.alert`;
  both are Lovable `AlertDialog`s (change-content-type confirm, "cannot add this file" notice).

## Verification

- `tsc --noEmit` clean, ESLint clean on changed files, all `publications/*.check.mts` pass.
- Browser: A (type-change dialog) passed, tested by the owner; A5 also seen by Claude. C (default name:
  playlist / layout / media, typed name kept, emptied name refilled) passed, typed-name case seen by Claude,
  the rest by the owner.
- **Not tested: B** — the "cannot add this file" dialog. It only appears after a real upload of a
  different media kind succeeds, and no test asset was created. Skipped by the owner; PR must be Draft.

## Left

- BE-A then FE-A per the plan; every migration apply to develop/prod is R0.
- Unrelated working-tree changes left unstaged: `FullPreviewPage.tsx`, `PublicationDetailPage.tsx`,
  `publication-preview-target.*`.

## Update — BE-A / FE-A / fix (later 2026-09-29)

- BE-A: Thunder_Core PR #122 merged to `develop` (`77ea6c8`): migration `20260929130000_publish_changes.sql`
  (296 lines) + 4 routes. Applied to the **develop DB only**; prod (`sfiefevtxalqjizdkcsw`) untouched.
- FE-A: PR #170 merged to `dev` (split button, dialog, `publish-changes/`); #169 was a mis-based stacked PR.
- Fix: PR #171 merged to `dev` (refresh affected list on every open; "no target" reason text).
- Verified on develop: SQL via rolled-back `DO` block (distinct set, direct vs via-Layout, all-or-nothing
  rollback); browser (FE → local Thunder_Core :3001): split button, confirm → Updated with DB proof,
  Layout modal, rollback on failure.
- #171 re-check (Claude, browser, FE from worktree `thunder_one_prj-fix` on :3004): opening the modal
  fires a fresh `GET .../affected-programs` each time (page load 2, open 1, open 2 = 4 requests).
- **Not verified:** the "at least one target" reason text in the UI (needs a Program with no target, none
  created); save-fails-stops-publish; quarantined-asset failure; concurrent-call deadlock; deployed
  (Vercel) backend; anything on prod.
- Left (all R0): apply migration to prod, release Thunder_Core `develop → main` then FE `dev → main`
  (open Draft #167 v0.3.1 patch may overlap), delete test file row `f47e02d0-…` + storage object.

## Prod migration applied (2026-09-29)

- `publish_changes` applied to prod `sfiefevtxalqjizdkcsw` via Supabase MCP (6 new functions, no DROP, no data touched).
- Diff vs file: `prosrc` md5 identical for 4 functions; `publish_changes_targets` and `publish_changes_apply`
  were sent with in-body `--` comment lines stripped — md5 matches the file with comment-only lines removed.
  Prod prosrc therefore lacks those comments; behaviour is identical.
- ACL: 3 public RPCs = `postgres` + `service_role` only; 3 `media_core` helpers = `postgres` only; anon/authenticated
  cannot execute.
- Smoke: a do-block calling the read RPC and targets helper with random ids ran without error.
- Still R0: release Thunder_Core `develop → main`, then FE `dev → main`; test-row cleanup on develop.

## Release v0.4.0 prep (2026-09-29)

- Tree audit (FE/Core/Aurora): nothing of the owner's left unmerged that belongs in this release; stale/parked: FE `feat/publication`, `feat/live-view`; Core #107 tax_id (Nie-ent) left out.
- Core: #124 prep merged (develop = 0.4.0); Draft release PR Thunder_Core#125 `develop → main`.
- FE: #167 closed (version clash with hotfix 0.3.1); Draft #176 `release/v0.4.0 → dev` (back-merge main, CONTEXT.md glossary from #167, bump 0.4.0). install/tsc/build/eslint/82 checks exit 0.
- Next: owner merges #125 → verify Core deploy → owner merges #176 → Draft FE release PR `dev → main` → tags (R0).

## Released v0.4.0 + prod UI check (2026-09-29)

- Core #125 → main `3faa7bb`, FE #177 → main `63f27ee`; both Vercel prod deploys succeeded; tags `v0.4.0` pushed in both repos. Release-table PRs: Thunder_Core#126, thunder_one_prj#178 (Draft).
- `775f611` (#169, mis-based) = same patch-id as #170, already on main; nothing lost.
- Prod UI (app.thunderone.asia → thundercore.vercel.app), read-only, no writes sent (network log checked):
  - Playlist `boe_55`: "Used by 1 program" + Publish Changes modal lists Program boe_55 (1 channel); affected-programs 200; cancelled.
  - Layout `dfdf` (draft): Publish Changes disabled, "Not used by any program".
  - Channel `androidminibox` editor: mismatch warning (expects 1920x1080, Player reports 1920x1008); Save disabled until checkbox; left via Cancel, not saved.
  - Create wizard: no free Players on prod, so the mismatch path there could not be reached; closed without creating.
  - Full Preview of Program boe_55: first frame + 111s timeline render; on play the `<video>` element advances (readyState 4, 960px, on top) but screenshots show black — likely capture limitation, not confirmed visually.
- Not tested on prod: an actual Publish Changes run, NULL-geometry Player, #175 super-admin cross-tenant data, #174 beyond seeing the Topbar.

## Cleanup (2026-09-29, approved by owner)

- Removed worktrees: scratchpad `fe-rel`, `core-rel`, `../thunder_one_prj-fix`, `../Thunder_Core-publish-changes` (all clean). Deleted merged local branches (`git branch -d`): FE `fix/publish-changes-refresh`, `feat/publish-changes`, `feat/default-program-name`, `docs/record-v0.4.0`, `release/v0.4.0`; Core `feat/publish-changes`, `release/v0.4.0`, `docs/record-v0.4.0`. Remote branches and other sessions' worktrees untouched.
- develop DB (`ftfmokgphewzyxzwjitv`), one transaction with exact-count guard: Channel `zz-geo-verify` (+1 channel_devices, +1 channel_device_reservations) and file row `f47e02d0-…` deleted; storage object `media/videos/THUNDER_001/78f7f368-….mp4` deleted via Storage API (HTTP 200, `storage.objects` count 0). Prod untouched.
