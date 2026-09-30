# SESSIONLOG — BE-0: poll follows the newest Job · 2026-09-30

## What was done
- **Poll fix** (Thunder_Core#132 → PR #133): `media_job_poll` picks the newest Publish Job per Publication first, then checks the device is one of its targets (same rule as `media_asset_on_air`). Before, a device dropped from the newest Job kept playing an older Job's snapshot.
- **Companion guard** (Thunder_Core#134 → PR #135): `media_publication_activate` refuses Targets that resolve to 0 devices. Needed because the fixed poll would otherwise take a Program off every screen after an empty Job. Decision recorded in ADR 0080 ("Companion guard"); rejected: warn-and-confirm, leave as is.
- **FE copy** (thunder_one_prj#179): `classifyApiError` and `describePublishChangesError` name the refusal instead of the generic line.
- Rollback files: `Thunder_Core/supabase/rollback/*.rollback.sql` (outside `migrations/`, exact pre-fix definitions, md5-checked, never executed).
- All three PRs merged (Core into `develop`, FE into `dev`). Migrations applied to **develop and prod** via MCP, guard first, then poll.

## Facts worth keeping
- Migration files on disk did **not** match the live functions (poll live md5 `560c5204…`, activate `bb0ffb1c…`, develop = prod). Both migrations were written from `pg_get_functiondef`, then `prosrc` compared after apply (poll `042084e5…`, activate `3e562f00…`).
- Every Job is created by `media_publication_activate` with the full current device set (Publish Changes and republish go through it), so the newest Job is never a delta.
- republish/Publish Changes run activate in one transaction: a RAISE rolls the draft flip back, poll never sees a draft.
- Players (Windows, Android; local copies may be stale): `slots: []` puts the screen in the same state as an expired Program ("Ready to play" / "No active schedule right now").
- `api-utils` maps "not found"/"already" to 404/409, so the new error text avoids those words (400).
- Impact queries before apply: devices matching only an older Job, Programs resolving to 0 devices, active Programs with an empty newest Job → 0 on develop and prod.

## Verification — which layer
- SQL: prosrc md5, ACL, single function (develop, prod); rolled-back transaction covering control / empty channel / republish.
- HTTP (Core local :3001 → develop DB): player jobs route 1 → 0 → 1 slot; `/activate` 400; `/republish` 400 with status `active` and Job/snapshot counts unchanged.
- UI (localhost:3000): wizard Publish Now message; Publish Changes control and refusal dialog.
- **Not tested:** deployed backend, a real device poll on prod, Layout (composition) Publish Changes through the UI, `check` for `describePublishChangesError` (none exists).

## Gotchas hit
- Batching an HTTP test with its cleanup in one call ran the delete before the classifier-denied curl; the row had to be re-created. Run test and cleanup as separate steps.
- `execute_sql` returns only the last statement of a multi-statement query.
- Core Vercel check fails on every PR ("Git author … must have access to the project on Vercel"), pre-existing, not code.

## Open
- The five read functions that still use "any Job" (see `progress-program.md`); `media_now_next_get` first.
- Rotate the app key / revoke the JWT that was pasted into this session.
- Test rows `zz-134-*` all deleted; `zz-ux-66-guard-test` and its test device (`test-unit`) untouched.
