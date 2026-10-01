# Handoff — implement ADR 0045 (Publication snapshot materialization)

**Date:** 2026-08-25 · **Design phase is closed. This is an execution brief.**

## Intent

Implement `docs/adr/0045-publication-snapshot-materialization.md` by following
`docs/publications/plan-snapshot-materialization.md` phase by phase. Every design fork is settled
and recorded; nothing needs re-deciding, re-grilling, or re-planning. The work closes a live
production defect: Publications do not snapshot their content, so editing a Playlist changes what is
airing within one poll cycle (~60 s), today.

Project rules ask for Opus on design and Sonnet on execution. **Sonnet is appropriate for this
work.** The user switches models manually.

## Context and paths

**Design repo (plans, ADRs, glossary):** `/Users/arty/Desktop/Thunder/project/thunder_one_prj`,
branch `feat/layout`, commit `d362867`, working tree clean, **not pushed**. This handoff itself
lives in `.docs/`, which is gitignored, so it is not part of that commit.

| Read first | Why |
|---|---|
| `docs/publications/plan-snapshot-materialization.md` | The plan. Phases 0–7, with a "Confirmed facts — do not re-derive" table of the five authoritative function bodies |
| `docs/adr/0045-publication-snapshot-materialization.md` | The ten decisions the plan implements, each with its rejected alternatives |
| `CONTEXT.md` | Glossary. `Publication` carries the known-gap note; `Asset` carries the new deletion rule |

**Implementation repo:** `/Users/arty/Desktop/Thunder/project/Thunder_Core`. Migrations in
`supabase/migrations`. Read its `AGENTS.md` / `CLAUDE.md` before editing. It had an untracked
`docs/media/PAYLOAD-media-player-jobs-2026-08-25.md` at plan time — do not absorb or overwrite it.

Five RPCs change, none of them changing identity arguments:
`media_publication_activate`, `media_job_poll`, `media_playback_log`,
`media_publication_download_report`, `media_video_delete`. **Take each body from the plan's
"Confirmed facts" table, which names the exact migration and line**, and then re-dump the live
definition before implementing and again before apply. Do not pick a body by scanning for the
newest-looking migration: `070` and `099` have been superseded, while `20260821065750` **is** the
authoritative body for `media_publication_download_report` (line 288). Migration history has drifted;
the live body is the final authority.

Production discovery (2026-08-25, read-only): 97 Jobs → 97 snapshots / 97 Zones / 192 items, no
duplicate Schedules, no `file_versions` rows, 12 `playlist_items.file_version_no IS NULL`.
**Refresh these counts immediately before apply; they are evidence, not constants.**

## Constraints

- **Every `.env` points at production. There is no local stack.** Applying a migration, deploying
  Core, deleting a duplicate Schedule, activating a test Publication, uploading playback logs and
  cleaning test data are each **R0** — stop, show the exact rows and effects, and get approval at the
  moment of the action. Approval for one does not carry to the next.
- Apply only through the approved Supabase MCP migration workflow. Never `supabase db push` or
  `migration up` (history has drifted), never direct production SQL.
- **`CREATE OR REPLACE FUNCTION` for all five** — identities are unchanged, so dropping them buys
  nothing and costs dependency and ACL risk. `CREATE OR REPLACE` preserves the existing ACL, which
  for `media_publication_activate` in production is `PUBLIC`; reassert `REVOKE ... FROM PUBLIC, anon,
  authenticated` and `GRANT EXECUTE ... TO service_role` explicitly regardless.
- Tenant isolation lives in the RPCs, not RLS. New plpgsql filters `tenant_id` itself.
- **There is no unit-test runner and no `pnpm test`** — do not invent one and do not add one.
  Focused checks are standalone `*.check.mts` files run with `node`. Playwright **does** exist
  (`@playwright/test`, `tests/e2e/`, see `Thunder_Core/CLAUDE.md`), but do not casually run the
  existing suites against production: `player-api.spec.ts` writes heartbeat telemetry and several
  specs under `tests/api/` create and delete fixtures. `pnpm exec tsc --noEmit` is never clean in
  Thunder_Core (~127 pre-existing errors); gate on changed files, not the repo-wide count.
- Poll and download report must contain **no** live Playlist join when done.
- Do not commit, push, deploy, open or ready a PR unless separately told. If verification is
  incomplete, any PR opens as **Draft**.
- **Ask before every browser verification point**, not just the first of the session.

## Acceptance criteria

Report evidence by layer, and say plainly which layers were not exercised.

- [ ] One transactional migration: snapshot tables, `UNIQUE (schedules.publication_id)`, backfill of
      all Jobs, five RPC replacements, `publish_jobs.snapshot_id NOT NULL` only after in-migration
      assertions pass.
- [ ] Activation writes a snapshot and stops writing `playlist_items.file_version_no`.
- [ ] Activation refuses an empty Playlist with `Invalid input:`. It checks only
      `playlist_id IS NOT NULL` today; a zero-item snapshot is a permanent empty broadcast record.
- [ ] Editing a source Playlist after activation changes neither an existing Job's poll output nor
      its download-report expected files/checksums.
- [ ] Republish `[A, B] → [A]` emits only `A`; stale `B` never appears — the defect the
      expanded-item `DISTINCT ON` removal exists to prevent. **Prove this as an isolated DB fixture**
      that inserts two Jobs with two snapshots against one Publication. There is no republish
      endpoint and building one is out of scope: activation accepts `draft` only.
- [ ] Jobs with equal `created_at` resolve deterministically by `pj.id DESC`.
- [ ] Proof of play, existing flat reporting still works: both IDs **omitted** accepted, both
      **`null`** accepted, a **valid pair** accepted, **only one of the two** rejected by the route
      schema before the RPC is called, malformed UUID likewise rejected.
- [ ] Proof of play, new invariants: each invalid invariant stores **zero rows for the whole batch**;
      a superseded snapshot previously targeted at the same Device is **accepted**.
- [ ] Proof of play, tenant guard — the **hostile** fixture, not a merely foreign one. Tenant B's Job,
      snapshot, Zone and Asset, all internally consistent, plus a `publish_job_targets` row
      deliberately pointing that Job at a Device of tenant A, so **all three association invariants
      pass**. Tenant A's Device reports the pair and must still be refused. Only an explicit
      `tenant_id` guard in the RPC can refuse it; a foreign snapshot that was never targeted is
      rejected by invariant 3 and proves nothing.
- [ ] Hard-deleting a snapshotted Asset returns the `Already in use:` domain error, not a raw FK
      violation.
- [ ] `POST /api/core/v1/media/player/jobs` returns every current flat slot field and a signed URL —
      verified over HTTP, not by calling the RPC directly.
- [ ] `playback/schema.check.mts` passes; ESLint clean on changed files; `git diff --check` clean.
- [ ] Post-apply catalog readback: zero `snapshot_id IS NULL`, one identity per RPC, ACLs
      `service_role` only. **Catalog checks prove deployment shape, not behaviour — do not call them
      "verified".**

## Out of scope

- Anything from ADR 0044 (Layout tables, wizard, `zones[]`, capability gate, geometry validation,
  nested URL signing) and ADR 0046 (content folders). Both are downstream; 0046 is independent and
  may proceed in parallel but is not this task.
- The known `playback_logs` defects (`duration_played_seconds` under-reports by 1.2–1.8 s; ~half the
  entries for one asset never arrive). Next in the work order, needs the device team for the
  player-side source, not this slice.
- Republish UI/API semantics; `media_publication_retry_targets` and `media_publication_get` Job
  selection; playback-log transport idempotency. All recorded as follow-ups in the plan.
- Any player change. The server keeps returning flat `slots[]` throughout.
- Opportunistic tightening of `played_at` or duration rules; no new dependencies; no new unit-test
  runner (see Constraints — Playwright already exists and is not to be run against production).

## Two things to tell people, not to build

- **`media_video_delete` changes user-visible behaviour.** A video whose only playlist is
  `kind = 'single'` is deletable today, and deleting it hard-deletes its Publications. After ADR 0045
  §10 any such video that was ever published becomes permanently undeletable. UI copy and sales need
  telling.
- Aurora video-wall customers still cannot migrate. That needs **A6** (multi-monitor), not A2.
