# Session log — Program redesign BE-1 (list read) · 2026-09-30 (session 3)

## Done

- **Design fork settled** (grilling, 12 questions) and written to `docs/adr/0080-…` (Display status, precise rules) and `docs/program/plan-program-redesign.md` (§1 "BE-1 list contract"). Commit `3133ca9`.
- **Review round changed one rule:** Publishing is gated on the playback window (`open`), because prod players send no download report (targets go `pending` → `playing`; prod had 29 `playing`, 7 `pending`, zero `delivered`/`downloading`). A delivery-only rule would hold every pre-activated Program on Publishing until it airs. `delivered` still counts as waiting while the window is open.
- **Thunder_Core** (branch `feat/program-list-read`, PR #136, **merged into `develop` 2026-09-30**):
  - migration `20260930120000_publications_list_filters_paging.sql` + rollback in `supabase/rollback/`
  - helper `media_core.publication_display_status(status, window, waiting)`
  - `media_publications_list` now 11 params; old `(uuid, varchar)` overload dropped
  - `GET /media/publications` validates the new query params with `zod`, signs thumbnails; signing extracted to `src/lib/core/media-cover-urls.ts` (shared with now-next, `cover-urls.check.mts` still passes)
- **Applied to develop and prod** (both approved). `prosrc` md5 `cae7d0fe…` (list) and `b0cd6d96…` (helper) match the migration file on both. Pre-change md5 on both was `1513d18c…`.

## Verified

- **develop, via HTTP on :3001:** no-param call returns all 124 rows; `limit/page/sort`, `display_status`, `status`, `search`, `created_by`, `group_id`, `channel_id`, `tag_id` return counts equal to direct table counts; 8 bad inputs → 400; thumbnails are signed `thumbnail_url`, no `thumbnail_storage_key` leaks.
- **develop, rolled-back transaction** (`DO` block ending in `RAISE EXCEPTION`, then confirmed the row was unchanged): before start → scheduled with `next_airing_at`; between daily airings → scheduled; `pending`/`downloading`/`delivered` on an online device → publishing; same but offline, `playing`, `failed` → live; Composition content → `thumbnail_*` null.
- `channel_id` via Group: both members of Group `3eb6b3d7…` get all 13 of its Programs.
- **prod, read-only:** largest tenant (34 rows) — no-param call 34 rows, counts live 5 / draft 10 / ended 19, paging works, `EXPLAIN` 18 ms (develop largest, 124 rows: 48 ms).

## Not verified

- Through the FE proxy / any UI (FE-A covers it).
- A Composition row on a real tenant (develop has none; only the rolled-back test).
- The new route on prod: `main` has not been promoted, so prod still serves the old route. The prod DB function is backward compatible (new params default NULL).

## Gotchas found

- `window` is a reserved word in Postgres — an alias `AS window` fails; the migration uses `play_window`.
- Multi-statement `execute_sql` returns only the last result; a `DO` block that ends in `RAISE EXCEPTION '…%'` both rolls everything back and carries the output in the error message. Good pattern for "test with writes, leave nothing behind".
- `media_core.channel_device_health(timestamptz)` already exists (5 min offline / 2 min warning); the literal `interval '5 minutes'` is written by hand in ~18 migration files. Use the helper.
- `media_core.compositions` has no cover/thumbnail column, so Layout rows get `thumbnail_*` = null and the FE must show a placeholder.
- Stored `publications.status` also allows `expired`; the helper maps every non-`draft`, non-`active` status to `ended`.
- The auto-mode classifier returned "no verdict" for Bash / ctx tools for a stretch; it recovered on its own. `ctx_execute_file` refuses paths outside the project root (Thunder_Core).
- First BE-1 doc commit carried a `Co-Authored-By` trailer against the user's rule; amended before any push. The PR and commits since have none.

## Open

- Rotate the develop JWT and app key pasted in chat in sessions 2 and 3 (user chose to skip for now).
- `feat/program-redesign` has 7 unpushed commits and is 3 behind `origin/dev` (FE #179, docs only overlap none). Merge or rebase `origin/dev`, then push (R0).
- The existing schedule `LATERAL` (`ORDER BY created_at DESC LIMIT 1`, no tie-breaker) is untouched.
- BE-0b (`now_next_get`, `schedule_conflicts` to the newest-Job rule) still goes after BE-1 and before BE-2 / FE-B.
- `docs/adr/0014-…` is untracked in Thunder_Core; it belongs to BE-3.
