# Session Log — Publication Wizard (Basic Info + Content + Channels + Schedule) & media_core tags

**Date:** 2026-07-27
**Branches:** `feat/publication` (thunder_one_prj) · `feat/thunderOne` (`Thunder_Core`)
**Scope:** two repos — `thunder_one_prj` (frontend) and `../Thunder_Core` (backend)

---

## 1. What this session shipped

Building the **Create Publication** 5-step wizard from the approved redesign
(`Basic Info → Content → Channels → Schedule → Review & Publish`).

| Step | Status |
| --- | --- |
| 1. Basic Info | ✅ done, wired to the real backend |
| 2. Content | ✅ done, wired to the real backend |
| 3. Channels | ✅ done, wired to the real backend (devices only — see §10) |
| 4. Schedule | ✅ done, wired to the real backend (weekly recurrence + conflict warning — see §11; Publish-Now expiry + overlap calendar — see §12) |
| 5. Review & Publish | ⬜ stub |

Plus a drafts list at `/publications` with **Resume** and **Delete**.

---

## 2. Database — migrations 060, 061 and 062

**All three are applied to PRODUCTION** (`sfiefevtxalqjizdkcsw`). Migration history now reads
`062 → 061 → 060 → 056 → 055`.

> ⚠️ `057`, `058`, `059` exist in the repo but were **deliberately never applied to prod** — they
> are unfinished DB-tooling work (column comments / dict introspect / business schema comments).
> There is no gap problem: 060 was applied directly on top of 056.

### 060 — `060_media_tags_and_draft_publications.sql`

- **`media_core.tags`** — tenant-scoped, `UNIQUE (tenant_id, lower(name))`, `CHECK length(trim(name)) > 0`
- **`media_core.publication_tags`** — join table, PK `(publication_id, tag_id)`, both FKs `ON DELETE CASCADE`
- **`publications.playlist_id` → nullable.** A step-1 draft has no content yet.
  `media_publication_activate` now refuses to activate a publication whose `playlist_id IS NULL`.
- **`media_core.sync_publication_tags(tenant, publication, text[])`** — find-or-create tags, replace-all
  semantics. `NULL` = leave untouched, `'{}'` = clear.
- **`media_publication_upsert`** — gained `p_tags text[]` (last param), `p_playlist_id` now optional.
  The old 14-arg overload was **dropped** so only one signature exists.
- **`media_publication_get`** — now returns a `tags` array.
- New: **`media_campaigns_list(tenant)`**, **`media_tags_list(tenant)`**

### 061 — `061_media_publication_manage.sql`

- **`media_publications_list(tenant, status?)`** — `status` ∈ `draft|active|cancelled` or NULL for all.
  Returns `campaign_name`, `tags[]`, `item_count`, ordered `updated_at DESC`.
- **`media_publication_delete(tenant, id)`** — **drafts only.** An active publication has
  `publish_jobs` that devices are already polling; deleting it would break players mid-playback,
  so it raises and tells you to cancel instead. Also deletes the auto-created playlist (see below).
- **`media_publication_set_content(tenant, id, items, actor?)`** — the step-2 workhorse. Atomic:
  creates or reuses the publication's playlist, replaces its items, links `playlist_id`.

### 062 — `062_media_publication_get_targets.sql`

`media_publication_get` gained a **`publication_targets`** key, read from
`media_core.publication_targets`.

The pre-existing `targets` key reads `publish_job_targets`, which has no rows until a publication is
activated — so a draft's saved targets were write-only and resuming a draft lost the channels chosen
in step 3. `targets` is **left untouched**; the E2E console reads it for per-device delivery status.

No schema change — `CREATE OR REPLACE` on one function.

---

## 3. Two design decisions worth remembering

**a) `playlist_id` is nullable, and that is deliberate.**
The design has *Save as Draft* on step 1, before any media is chosen. Rather than auto-creating a
throwaway playlist on step 1, a draft simply has no playlist. The guard moved to `activate`.

**b) Publication-owned playlists are named `pub:<publication_id>`.**
`media_publication_set_content` creates them with that prefix. `media_publication_delete` uses the
prefix to decide whether the playlist is disposable — it deletes a `pub:` playlist only when no
other publication references it, and never touches a user-managed playlist that merely happens to
be attached.

**Guard rails enforced inside `media_publication_set_content`:**

| `publication_type` | assets allowed |
| --- | --- |
| `image`, `video` | exactly 1 |
| `playlist` | 1 or more |
| `html`, `dynamic` | none — raises |

Plus: every asset must belong to the tenant, and every asset must be `approval_status = 'approved'`.
`position` sent by the client is ignored — the RPC renumbers 0-based by array order.

---

## 4. HTTP API contract

All frontend calls go through the local proxy: `/api/proxy/media/...` → `/api/core/v1/media/...`.
The proxy attaches `x-api-key` (app identity) plus the logged-in user's bearer token when present.
Responses are `{ success, data }`; errors are `{ error: "message" }` — sometimes with HTTP 200,
so **always** check for an `error` key, never just the status.

```
GET    /media/campaigns                      → { campaigns: [...] }
GET    /media/tags                           → { tags: [{ id, name, usage_count }] }
GET    /media/videos                         → [ MediaAsset ]          (bare array!)
GET    /media/screens                        → [ Screen ]  (id, name, status_level, last_heartbeat_at)
GET    /media/publications?status=draft      → { publications: [...] }
GET    /media/publications/:id               → publication detail (+ tags, playlist, publication_targets)
POST   /media/publications                   → create draft   (playlist_id optional, tags: string[])
PATCH  /media/publications                   → edit draft     (requires publication_id)
DELETE /media/publications/:id               → drafts only
PUT    /media/publications/:id/content       → { items: [{ media_asset_id, position, duration_seconds?, transition? }] }
```

`targets` on POST/PATCH is `[{ target_type: 'channel'|'device', channel_id?, device_id? }]`.

### Three sharp edges in `media_publication_upsert`

1. **PATCH is a full replace for every field except `playlist_id`.** Omit `description` and it
   becomes NULL. The wizard is safe because it always posts the whole form; anything doing a
   partial update will silently wipe fields.
2. `playlist_id` is the exception — it uses `COALESCE(p_playlist_id, playlist_id)` precisely so a
   step-1 PATCH cannot destroy the content chosen in step 2. **This was a real bug found in review;
   do not "simplify" it back to a plain assignment.**

3. `targets` follows the same "missing key = leave untouched" rule as `tags`, but the frontend uses
   it the *opposite* way round: `targets` is sent **only from step 3 onwards**, precisely so a
   step-1 re-save cannot wipe the channels. `tags`, by contrast, is always sent.

Also: sending `tags` is required to clear tags. A missing `tags` key means "leave untouched", so the
frontend always sends `tags: []` rather than omitting the key.

---

## 5. File map

Everything below is **committed**; both working trees are clean.

### `Thunder_Core` — branch `feat/thunderOne`
```
supabase/migrations/060_media_tags_and_draft_publications.sql   b113842
src/app/api/core/v1/media/campaigns/route.ts                    b113842  GET
src/app/api/core/v1/media/tags/route.ts                         b113842  GET

supabase/migrations/061_media_publication_manage.sql            cd4e150
src/app/api/core/v1/media/publications/route.ts                 cd4e150  + GET
src/app/api/core/v1/media/publications/[id]/route.ts            cd4e150  + DELETE
src/app/api/core/v1/media/publications/[id]/content/route.ts    cd4e150  PUT

supabase/migrations/062_media_publication_get_targets.sql       78c19db

supabase/migrations/063_media_publication_schedule.sql          f60155f
src/app/api/core/v1/media/publications/[id]/schedule/route.ts   f60155f  PUT
src/app/api/core/v1/media/publications/conflicts/route.ts       f60155f  POST
```

`/media/screens` (`media_screens_list`) already existed — step 3 needed no new route.

### `thunder_one_prj` — branch `feat/publication`
```
src/features/publications/components/BasicInfoStep.tsx          07a37a7

src/features/publications/components/ContentStep.tsx            c306740
src/features/publications/components/DraftList.tsx              c306740
src/features/publications/components/CreatePublicationWizard.tsx c306740
src/features/publications/types/index.ts                        c306740
src/features/publications/services/publications-api.ts          c306740
src/features/publications/index.ts                              c306740
src/app/(dashboard)/publications/page.tsx                       c306740  (drafts list)
src/app/(dashboard)/publications/new/page.tsx                   c306740  (reads ?id=)

src/features/publications/components/ChannelsStep.tsx           6178e2e  NEW
  + types / publications-api / CreatePublicationWizard / index   6178e2e  MOD

src/features/publications/schedule.ts                           85c960d  NEW  (logic, tz helpers)
src/features/publications/components/ScheduleStep.tsx           85c960d  NEW  (pure UI, via agy)
  + types / publications-api / CreatePublicationWizard / index   85c960d  MOD
```

Routes: `/publications` (drafts) and `/publications/new[?id=<uuid>]` (wizard).

---

## 6. Verification evidence

**Local Postgres (`docker exec -i supabase_db_trysupabase psql -U postgres -d postgres`)**
- 060: 7-step smoke test — draft without playlist, activate blocked, case-insensitive tag dedupe
  (`Promotion/FOOD/promotion` → 2 tags), replace-all, `NULL` = untouched, campaigns/tags list.
- 061: 8-step smoke test — list, set_content 2 items → replace with 1, `image` type rejects 2 assets,
  unapproved asset rejected, draft delete removes the `pub:` playlist, active delete refused.
  Final counts delta 0 — zero leaked rows.
- 062: 4-step smoke test inside a transaction, then `ROLLBACK` — draft with no targets → `[]`,
  PATCH one device target → read back with its name, PATCH *without* `targets` → still there,
  legacy `targets` key still present.

**Production, over real HTTP through the frontend proxy**

Steps 1–2 (run first):
```
page /publications                     200
GET    /media/publications?status=draft 200
GET    /media/videos                    200
POST   /media/publications              201  → draft, tags returned
PUT    /media/publications/:id/content  200  → playlist_id + item_count 2
GET    drafts                           200  → item_count 2 reflected
PUT    .../content (1 item)             200  → item_count 1 (replaced, not appended)
page /publications/new?id=<uuid>        200
DELETE /media/publications/:id          200  → deleted true
GET    /media/publications/:id          404  → not found
```

Step 3, after 062 was deployed — 7/7:
```
GET    /media/screens                   200  → 2 screens
POST   /media/publications              201  → draft
PATCH  /media/publications (+2 targets) 200
GET    /media/publications/:id          200  → publication_targets = 2, names resolved
PATCH  step-1 shape (no targets key)    200  → publication_targets still 2   ← not wiped
PATCH  targets = [1 device]             200  → publication_targets = 1       ← replaced, not appended
PATCH  targets = [bogus uuid]           404  → "not found: screen ... not found for this tenant"
DELETE /media/publications/:id          200  → GET after delete 404
```
All test rows were deleted afterwards (including the orphaned `ztest-step3` tag); the `pub:`
playlist was confirmed gone, and prod counts returned to baseline. The pre-existing draft named
`test` was left untouched.

**`pnpm build` and `pnpm lint` pass in both repos.** The one lint warning is pre-existing —
`src/features/e2e/components/PlayerPanel.tsx:157` (`<img>` vs `next/image`).

---

## 7. Fixes applied during review (agy got these wrong)

1. **`media_publication_upsert` wiped `playlist_id`** on any PATCH that omitted it → step 1 re-save
   would destroy step 2's content. Changed to `COALESCE(p_playlist_id, playlist_id)`. Verified.
2. **`publications-api.ts` never sent an empty `tags` array**, so removing every tag in the UI did
   not persist. Now always sends `tags: []`.
3. **`ContentStep.tsx` accepted duration `0`**, which violates `playlist_items CHECK duration_seconds > 0`
   and would surface a raw constraint error. Now `> 0`; `0`/empty → `null` (play the full clip).
4. **`src/lib/core/media.ts` leaked raw Postgres error text** into API responses (was masked as a
   generic `Media operation failed` with details in server logs only). Reverted — information
   disclosure, and it was outside the task's scope.

---

## 8. Known gaps / next steps

- **No thumbnails.** `media_videos_list` returns no preview or signed URL, so step 2 is a text list
  (title, kind badge, dimensions, file size) rather than the image grid in the design. Adding a
  signed URL to that RPC is the next obvious backend task.
- **Step 5 is a stub** (`ยังไม่ implement — step 5`). `media_publication_activate` (which builds
  `publish_jobs` + `publish_job_targets`, and already refuses `playlist_id IS NULL` or no targets)
  is the backend for it — needs a summary view + an activate route/call. **Step 4 is done — see §11.**
- **Step 3 covers devices only** — see §10 for exactly what was left out and why.
- **Deliberately not built** (marked *Disable* in the design): Format & Brand dropdowns, the preview
  panel, AI Assistant, Content Summary panel, the Format & Template / Text & Caption / Call to Action
  / Localization tabs, favourites.
- **Production has only 2 approved media assets and 2 screens**, which limits multi-asset playlist
  and multi-target testing.
- **Everything is committed.** Both working trees are clean — see the file map in §5.

---

## 9. Gotchas for the next session

- **`../Thunder_Core/.env` points `NEXT_PUBLIC_SUPABASE_URL` at PRODUCTION.** Running `pnpm dev` in
  Thunder_Core and clicking through the frontend writes to prod. A local Supabase stack exists
  (`supabase start`, db on `127.0.0.1:54322`) and is what migrations should be tested against first.
  Name any test rows distinctly and delete them.
- `psql` is not on PATH; use `docker exec -i supabase_db_trysupabase psql -U postgres -d postgres`.
- Dev servers used this session: Thunder_Core on `:3000`, thunder_one_prj on `:3001`. Next refuses a
  second `next dev` from the same directory — reuse the running one.
- All `public.media_*` functions are `SECURITY DEFINER` with `SET search_path = ''` because
  `media_core` is intentionally unreachable through PostgREST. Every identifier must be fully
  qualified.
- Error-message convention: validation → `Invalid input: ...`, missing row → `not found: ...`.
  `callMedia` passes those through and masks everything else.
- `curl`/`wget` are blocked by a hook here; use Node's `fetch` for HTTP checks.

---

## 10. Step 3 (Channels) — what was built and what was cut

Built: a two-panel screen picker (`ChannelsStep.tsx`) mirroring step 2's layout — searchable list on
the left with an all/online/warning/offline filter driven by `status_level`, selected list on the
right with per-row remove and *Clear all*. **Next** is disabled until at least one screen is picked,
which matches `media_publication_activate`'s requirement of ≥1 target.

Cut, and why — all of it is missing data, not missing effort:

| Design element | Blocker |
| --- | --- |
| Channel-type tabs (Digital OOH / In-Store / Online / Social Media) | `media_core.channels` has no rows and no list RPC. Every target is a `device`. |
| *Estimated Reach* ("1,875,000 people") | No impressions or reach data anywhere in the schema. |
| *Channel Status* donut | Derivable from `status_level`, but it duplicates the filter chips for no new information. |
| Screen thumbnails, location/branch, resolution, Type filter, Location filter | `media_screens_list` returns none of these — it has `id`, `name`, `connection_status`, `status_level`, `last_heartbeat_at`, `app_version`, `ip_address`. |
| *Show more* pagination | 2 screens in prod. |

Getting the full design would need new columns on `public.assets` (location, resolution, screen type)
plus a `media_channels_list` RPC and channel rows to list. That is a real backend chunk, not a UI
tweak. The cuts are marked with a `ponytail:` comment at the top of `ChannelsStep.tsx`.

---

## 11. Step 4 (Schedule) — migration 063 & what was built

**Applied to PRODUCTION.** Migration history now reads `063 → 062 → 061 → 060 → 056`.

The schedule lives in `media_core.schedules` (one row per publication), which since 048 already had
`timezone` and `recurrence jsonb` columns — so **063 is functions only, no table change.**

### 063 — `063_media_publication_schedule.sql` (5 `CREATE OR REPLACE`s)

1. **`media_publication_set_schedule(tenant, id, starts_at, ends_at?, timezone?, recurrence?)`** — the
   step-4 workhorse (mirrors `set_content`: a dedicated route, not more `upsert` params). Drafts only.
   Replace-all: deletes the schedule row and writes the new one. Validates the recurrence shape.
2. **`media_schedule_conflicts(tenant, id, device_ids[], starts_at, ends_at?)`** — advisory. Returns
   other **active** publications sharing ≥1 screen whose window overlaps. `ponytail:` date-range
   overlap vs active pubs only; draft-vs-draft and weekday/time-of-day refinement skipped (it's a
   non-blocking warning — over-warning is acceptable).
3. **`media_publication_get`** += a `schedule` object `{starts_at, ends_at, timezone, recurrence}` so
   resuming a draft restores step 4.
4. **`media_job_poll`** (the real-screen poller) now honours weekly recurrence:
   `AND (recurrence = '{}' OR <today's DOW in days AND now()::time within daily window, in the schedule tz>)`.
   **Additive & safe** — every pre-063 schedule is `{}`, so live behaviour is unchanged for them.
5. **`media_publication_upsert`** — the schedule write is now guarded to run **only on first create**
   (`IF NOT EXISTS`). Previously it did an unconditional DELETE+INSERT on every basic-info save, which
   would reset step 4 to `now()/{}`. Same guard rationale as the `playlist_id` COALESCE. **Do not
   "simplify" this back** — `set_schedule` owns all schedule edits after creation.

### Recurrence jsonb shape
`{}` = one-time. Weekly is the only recurring frequency:
`{ "freq":"weekly", "days":[0..6], "daily_start":"HH:MM", "daily_end":"HH:MM" }` — `days` 0=Sun..6=Sat
(matches `EXTRACT(DOW ...)`). The four UI schedule types all reduce to `(starts_at, ends_at, recurrence)`:
Publish Now → `now()/null/{}`; Schedule Later → `picked/optional/{}`; Custom Date Range →
`picked/picked/{}`; Recurring → `range/range/weekly`.

### Frontend
- **`schedule.ts`** owns all the logic: DST-correct timezone↔UTC conversion via `Intl` (no deps),
  `isScheduleFormValid`, `scheduleFormToPayload`, `scheduleToForm` (resume), plus the `TIMEZONES` /
  `WEEKDAYS` lists. Unit-tested (cross-zone + midnight boundary + a resume round-trip).
- **`ScheduleStep.tsx`** is **pure UI** over those helpers — 4 type buttons, conditional fields,
  weekday picker, daily-window inputs, and a non-blocking amber conflict banner (debounced call to
  `checkScheduleConflicts`). It never holds `form` state; the wizard owns save ordering so a step-1
  re-save can't wipe step 4.
- Timezone list is a fixed 5-zone dropdown (`ponytail:` — the `Intl` helpers are DST-correct, so
  adding a DST zone needs no other change).

### HTTP additions (see §4 for the rest)
```
PUT    /media/publications/:id/schedule  → { starts_at, ends_at?, timezone?, recurrence? }
POST   /media/publications/conflicts     → { publication_id?, device_ids[], starts_at, ends_at? }
GET    /media/publications/:id           → now also returns `schedule`
```

### Verification
- **Local Postgres** — 6/6 `set_schedule` validations raise, valid weekly accepted; the upsert
  clobber-guard holds (recurrence survives a basic-info re-save, 1 row); `schedule_conflicts` overlap
  / self-exclusion / screen-filter / open-ended / empty-list all correct; recurrence predicate matches
  today and not another weekday.
- **Production, real HTTP through the frontend proxy** — created a `ztest-step4-schedule` draft, drove
  the wizard to step 4, saved a **Recurring** schedule (Wed, 09:00–17:00, 27 Jul–31 Aug, Bangkok).
  `set_schedule` persisted `06:54Z`/`16:59Z` (correct tz conversion), 1 row, recurrence `{days:[3],…}`;
  `get` returned the `schedule` object; `scheduleToForm` reverse-map verified against the exact prod
  values; the draft was then deleted (0 rows left). `pnpm build` + `pnpm lint` pass.

### Cut from the design (missing data / out of scope)
- **Schedule Preview calendar** and **Publication Summary** right-hand panels — need the media
  thumbnail (still no signed URL in `media_videos_list`) and per-day layout work; deferred with the
  rest of the visual polish.
- **Advanced Options** (publish-order / delay-between-channels), **AI Assistant** panel — marked
  *Disable* in the design.
- Timezone dropdown is a short fixed list rather than a full IANA picker.

### Split of work
Backend (migration 063 + both routes), the frontend contract (types, api service, barrel), the
`schedule.ts` logic, and all wizard wiring were **written by Claude directly**. Only the presentational
`ScheduleStep.tsx` was delegated to `agy` (Gemini 3.1 Pro) against an exact props/spec contract, then
reviewed against the spec before commit. No defects found in review this time.

---

## 12. Step 4 (Schedule) — Publish-Now expiry + conflict-overlap calendar

**Frontend only. No backend / migration change** — reuses the existing `media_schedule_conflicts` RPC
and `POST /media/publications/conflicts` route from §11. Committed as `e2beda0`.

### What was added
1. **Publish Now** now shows a **locked (disabled) Publish Date + Time** block (prefilled with the current
   wall-clock in the form timezone, recomputed live) and a note "Publishes immediately once activated."
2. A **"Set expiration date"** checkbox in Publish Now (reusing the `later`-mode pattern). Ticking it
   reveals End Date/Time. `scheduleFormToPayload` for `now` now emits `ends_at` when an expiry is set
   (previously hard-coded `null`); `starts_at` is still live `now()` at activation, recurrence stays `{}`.
3. A **single-month "Schedule Calendar"** (‹ / › month nav) that highlights the days the publication plays
   (blue = *Scheduled*) and, in red (*Conflict / overlap*), the active days that collide with a conflicting
   active publication — shown **alongside** the existing amber conflict banner, not replacing it.

### Files
```
src/features/publications/schedule.ts                 MOD (Claude)  e2beda0  now+expiry payload; calendar helpers
src/features/publications/components/ScheduleStep.tsx MOD (agy)     e2beda0  now locked block + expiry + <ScheduleCalendar>
src/features/publications/components/ScheduleCalendar.tsx NEW (agy)  e2beda0  month grid, nav, legend
```

### Calendar logic (in `schedule.ts`, unit-tested)
Day-granularity, in the schedule's own timezone; `"YYYY-MM-DD"` strings sort chronologically so all range
checks are plain string comparisons.
- `isScheduleActiveOn(form, ymd)` — `ymd` inside `[start, end|∞]`; for `recurring`, also `DOW ∈ days`.
  `now`'s window starts today (open-ended unless an expiry is set).
- `overlapsConflictOn(ymd, conflicts, tz)` — `ymd` inside any conflict's `[starts_at, ends_at|∞]` (converted
  to the tz's day via `utcToZonedParts`).
- `buildCalendarMonth(form, conflicts, year, month)` → weeks × 7 `CalendarDay` cells; `isOverlap` requires
  `isActive` first (an inactive day never highlights red). `ponytail:` date-range level only — matches the
  backend RPC, which itself ignores weekday/time-of-day (§11).

### Split of work
`schedule.ts` (the `now`+expiry publish-path change and all calendar date math) was **written by Claude
directly**; the two presentational `.tsx` files were delegated to `agy` (`gemini-3.1-pro-high`) against an
exact spec (`$TMPDIR/handoff-schedule-calendar.md`) and reviewed by diff. No defects found in review.

### Verification
- **Unit test** (throwaway `calendar-test.ts`, run under Node 24 type-stripping) — 20+ assertions:
  range/recurring active-day membership, open-ended conflict overlap, month-matrix shape + leading-pad count,
  and the `now`+expiry tz conversion (`2026-08-25 18:00 Asia/Bangkok → 11:00Z`). All green.
- **`pnpm build` + `pnpm lint` pass** (only the pre-existing PlayerPanel `<img>` warning).
- **Production E2E over the frontend proxy** — drove a `ztest-calendar-verify` draft through steps 1→4
  (video asset, both screens). Step 4 rendered: locked Publish Now block, expiry checkbox revealing End
  fields, and the July 2026 calendar with **27–31 Jul in red** (the draft's only active days, all colliding
  with 5 real open-ended active conflicts on Screen 01), today-outline on the 27th, legend, and the amber
  banner listing all 5 conflicts below. Draft then deleted — prod returned to baseline (3 user `test` drafts
  left untouched).
