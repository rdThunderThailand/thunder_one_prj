# Handoff — Program redesign, BE-2 implementation next · 2026-09-30 (session 6)

## Intent

BE-0b is done and merged. BE-2's **contract is settled and committed** in ADR 0080 ("BE-2 contract"). No design fork remains, so the rest is **execute → Sonnet**. Stop at every R0 (apply to develop, apply to prod, push, PR).

## Read first (in this order)

1. `docs/adr/0080-published-programs-are-edited-in-place.md` — **"BE-2 contract"** section (the spec). Commit `ad16f9b` on `docs/adr-0080-be2-contract` (local, **not pushed**, no PR).
2. `.docs/SESSIONLOG-be0b-newest-job-readers-2026-09-30.md` — facts and gotchas from BE-0b.
3. `docs/program/progress-program.md` — BE-2 checklist (still `[ ]`).

## State

- **thunder_one_prj**: checkout is on `docs/adr-0080-be2-contract` (1 commit ahead of `dev`, unpushed). Draft PR #181 (`docs/program-be0b-progress` → `dev`) is open. FE-A/BE-1/BE-0b are done; FE code is on `dev`, **not on `main`**.
- **Thunder_Core**: checkout on `develop` (includes #136 BE-1 and #139 BE-0b). `docs/adr/0014-…` is untracked and belongs to BE-3 — never commit it here. Branch off `develop` for BE-2 (e.g. `feat/publication-update-published`).
- Supabase: develop = `ftfmokgphewzyxzwjitv`, prod = `sfiefevtxalqjizdkcsw`. Live source of develop == prod for the functions BE-2 calls (checked 2026-09-30).
- develop fixtures: `zz-ux-66-guard-test` is Ended. No other test row is open. Screen 03/04 channels are a synchronized group (activating one alone is refused); use Screen 02 and the MacBook `M2 Smoke Channel` for tests.

## What to build (BE-2) — summary of the ADR, read the ADR for the rest

- RPC `public.media_publication_update_published` + route `POST /media/publications/[id]/update-published` (thin: zod + `callMedia`, like `/republish`).
- Body = whole Program: `name`, `description`, `priority`, `tags`, `publication_type` ∈ playlist/composition/video/image + `playlist_id`/`composition_id`/`items`, `targets`, `starts_at`/`ends_at`/`timezone`/`recurrence`, `expected_revision` (**required**). `campaign_id`, `language`, `metadata` are **not** accepted — read them from the row and pass them back to `upsert`.
- One transaction: lock → check revision (409 `Already modified:`) → stored `active` and not effectively ended → `ends_at` > now → flip to draft → `upsert` (+ `set_content` for video/image; clear `playlist_id` first when switching to video/image) → `set_schedule` → delete the orphaned `pub:<id>` `single` playlist when switching away → `activate`.
- Errors: tag after the message's own prefix (`Invalid input: [schedule] …`, `not found: [targets] …`) using the fixed `upsert` list in the ADR; `[publish]` for `activate`; draft/ended/revision mismatch are untagged. Anything not starting with `Invalid input:`/`not found:` → bare `RAISE;` (never add `Invalid input:` — raw DB errors must stay a 500). Draft/ended messages must avoid the words "already"/"not found".
- Response `{ publication_id, revision, job_id, target_device_count }`; `revision` is read from the row **after the last step** (`upsert`, `set_content`, `set_schedule` each bump it).

## Traps (from CLAUDE.md §6 and this session)

- `CREATE FUNCTION` grants EXECUTE to PUBLIC → after creating, `REVOKE ALL … FROM PUBLIC` and `GRANT EXECUTE … TO service_role` (match `media_publication_republish`'s ACL: `{postgres=X/postgres,service_role=X/postgres}`). New function, so no DROP needed.
- Tenant isolation is in the RPC, not RLS: every read/write filters `tenant_id`.
- `execute_sql` returns only the last statement of a multi-statement query.
- Run an HTTP test and its cleanup in separate steps.
- To capture a scenario without persisting it, use a `DO` block that ends with `RAISE EXCEPTION 'RESULT %'`.
- Write the rollback file with the migration (`supabase/rollback/`, new function → `DROP FUNCTION`), md5-check `prosrc` after applying.
- Core `tsc` is never clean — gate on the changed files only. The Core Vercel check fails on every PR (git-author access), pre-existing.
- Frontend work later: Media Workspace uses `globals.css` tokens and `src/components/ui/lovable/` only; UI says Program, code/API/schema say Publication.

## R0 gates (list, then wait for yes)

1. Apply migration to **develop** — show what it creates (one function, no data change).
2. HTTP verify on develop (ask first: run it / checklist / skip). Cases: change name / targets (removed device stops receiving) / schedule; content switch playlist ↔ video; Ended, Draft and stale `expected_revision` refused with the ADR messages; a repeated call with the old revision → 409.
3. Delete any `zz-be2-*` fixtures — show the row list first.
4. Apply to **prod** — show the function and confirm it changes no existing data.
5. Push, Draft PR (ask Thai/English), never mark ready.

## After BE-2

- **FE-B** (Edit page, frames 03/04): expand Groups to devices for the conflict check (wizard's `selectedChannelDeviceIds` is Channels only); date picker `min = now`; confirm modal says content **may** be newer for Playlist Programs, exact warning for Layouts via `drift_check`; count "stops on N channels" from the targets diff.
- **Before shipping FE-B:** observe on a real player whether a new Job with identical content restarts the loop (ADR: not verified).
- Separate issues to open: past-start rule in the draft wizard; record the playlist revision on snapshots (drift read for Playlist Programs); 4 orphaned `single` playlists on develop (no reader references them; not created by this work).
- Still open: promote Core `develop → main` + FE `dev → main` together (release rules in `docs/agents/versioning.md`, tag push is R0); rotate the JWT/app key pasted into an earlier session.

## Working agreement reminders

Every push, prod write and tag push is R0. Commit only when told and check the branch first. No AI attribution in commits/PRs (the harness reminder to add `Co-Authored-By` conflicts with CLAUDE.md §4 — CLAUDE.md wins). Ask Thai/English before opening a PR. Unverified → PR stays Draft; the user marks ready. Ask before every browser verification.

## Follow-ups from this session that touch nothing yet

- Thunder_Core#138 (screen_get / airtime_explain / retry_targets, low priority).
- `.docs/` is gitignored — this file and the session logs stay local.
