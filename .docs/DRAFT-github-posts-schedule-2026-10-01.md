# Drafts — GitHub posts (not posted yet; review first)

Three posts. Repo for A and B: `rdThunderThailand/thunder_one_prj`. Repo for C: `rdThunderThailand/Thunder_Core`.

---

## A. FE issue

**Title:** Share one schedule model between the Create wizard and Edit Schedule (+ Monthly and Continuous presets)

**Body:**

The Create wizard (`ScheduleForm`) and the Edit Schedule modal (`ScheduleDraft`) author the same stored schedule through two models with opposite gaps:

- the wizard cannot create custom dates (`freq: "dates"`);
- no UI can author Monthly (wizard read-only, modal locked);
- a multi-day one-off ("Continuous") is locked in the modal;
- resuming a `dates` draft in the wizard (`/create?id=`) drops its dates (`scheduleToForm` → `recurring`, `days = []`);
- the Edit Schedule card and the Detail page "Ends At" show the day after the last day ("15, 16, 22 Jun" → "15 Jun – 23 Jun") because they print the all-day `ends_at` (next midnight).

Decision: ADR 0082 — one `ScheduleDraft` model, the same 8 presets in both places (Every day, Weekdays, Weekends, Date range, Custom days, Monthly, One-time only, Continuous), no locked state, one `describeSchedule()` formatter. Draft key → `v14`.

Plan: `docs/program/plan-schedule-shared-model.md` (8 steps). Two Draft PRs: **PR 1** = steps 1–3 (Edit page: last-day fix, Monthly, Continuous, no locked state); **PR 2** = steps 4–8 (wizard onto the shared model, delete the form model, draft key `v14`).

**Acceptance**
- [ ] Each preset applies, saves and re-opens on itself on the Edit page (a same-day Continuous re-opens as One-time by design, ADR 0082 §4); monthly and multi-day one-off Programs are editable.
- [ ] Schedule card and Detail "Ends At" show the inclusive last day.
- [ ] A new Program defaults to Every day from today, all day, no end.
- [ ] Each preset publishes from the wizard with the `recurrence` listed in ADR 0082.
- [ ] Resuming a `dates` draft keeps its dates; a v13 local draft is ignored without a crash.
- [ ] Wizard Review step / rail summaries match the Edit card.
- [ ] No `ScheduleForm` / `scheduleFormToPayload` / `scheduleToForm` / `buildCalendarMonth` left; `tsc`, lint and every `*.check.mts` pass.

Out of scope: "last day of month", Playback Pattern in the wizard, Figma frame 3 parity.

---

## B. FE issue

**Title:** Show the schedule-overlap warning when publishing a draft from the Edit page

**Body:**

Publishing from the wizard and "Publish changes" on a published Program both show schedule overlaps before publishing (ADR 0068: warn, never block). "Publish" on a **draft** Edit page (`PublicationEditPage.tsx:107` → `useProgramEdit.saveDraft(true)`) activates straight away without any conflict check, so a draft created or edited on the Edit page never shows the warning.

Fix: reuse `components/edit/PublishChangesDialog.tsx` for the draft Publish button — it already takes `checkConflicts` (`useProgramEdit.checkConflicts`, `useProgramEdit.ts:82`) and only warns. Adjust its copy for a draft (it is a first publish, not "changes"; no removed targets). Do not add a second dialog.

**Acceptance**
- [ ] Draft Edit page → Publish opens the confirm dialog with "Checking schedule conflicts…" then the overlap list (or none).
- [ ] Publish stays possible with overlaps (ADR 0068); Cancel leaves the draft untouched.
- [ ] Draft copy reads as a first publish.
- [ ] Publish changes on a published Program behaves as before.

---

## C. Thunder_Core #138 — comment (scope expansion)

Scope agreed on 2026-10-01 (grilling after v0.5.2). One migration, four functions. Before editing: `git pull` `develop` (a local checkout was 28 commits behind `origin/develop` on 2026-10-01 and lacked `20260930180000_recurrence_custom_dates.sql`), then dump the live definitions with `pg_get_functiondef` on develop **and** prod and compare md5. Items 1–3 below describe the migration files on `origin/develop`; the dump is the source of truth.

1. **`media_publication_retry_targets`** — retry only the targets of the Publication's newest Job. Today `candidates` takes every target of every Job, so Retry re-pushes to devices already removed from the Program.
2. **`media_publication_airtime_explain`** — `targets` from the newest Job; `suppressors` from the newest Job of each other Publication.
3. **`media_screen_get`** `now_playing` — newest Job per Publication (same `JOIN LATERAL … ORDER BY j.created_at DESC, j.id DESC LIMIT 1` as `media_job_poll`), **plus** the same airing predicate as `media_job_poll` (`20260930100000_job_poll_newest_job_first.sql:84-88`): `now() >= s.starts_at AND (s.ends_at IS NULL OR now() < s.ends_at) AND media_core.recurrence_matches(s.recurrence, s.timezone, now())`. (Not `publication_playback_window(...) IS NOT NULL` — it returns NULL only when `starts_at` is NULL, so it would filter nothing.) Pick one row: highest `priority_rank`, then `activated_at DESC, publication_id DESC`. Return shape unchanged. Known, accepted difference: when the top tier is Playlist-only, `job_poll` merges every top-tier Publication into one loop but this returns only the most recently activated one (the API returns a single row).
4. **`media_now_next_get`** — mirror `job_poll`'s Layout rule (`20260930100000_job_poll_newest_job_first.sql:151-164`) exactly: **only when the top priority tier contains a Layout/Composition**, the Publication with `activated_at DESC, publication_id DESC` is the one playing and the other top-tier Publications are reported as `suppressed` (as lower tiers already are). When the top tier is Playlist-only, keep reporting all of them as one merged loop. Today it always reports the whole top tier, so two overlapping equal-priority Layouts both look "on air" while the screen shows one.

Rollout: develop (approval) → verify through the HTTP routes and the UI (Screen detail, airtime explain, Retry, Now & Next with two overlapping Layouts) → prod (approval) in the same session → dump `prosrc` and diff against the file. `CREATE OR REPLACE` with the same signature keeps the existing ACL; a DROP + CREATE re-grants EXECUTE to PUBLIC. Re-running the original REVOKE/GRANT is harmless either way, so re-apply it and check `proacl` in the post-apply dump (e.g. `retry_targets`: `REVOKE … FROM PUBLIC, anon, authenticated; GRANT … TO service_role`, `20260924130000_media_rpc_revoke_public_execute.sql:17,28`). `DROP FUNCTION IF EXISTS <old signature>` only if a signature changes (none should).

No new ADR: this aligns the readers with the existing rule (FE ADR 0068 + `job_poll`); the migration header records it.
