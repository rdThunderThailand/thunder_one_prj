# Plan — Now & Next refresh, Calendar, Program Editor return-to-context

Status: draft (2026-10-06, after the grilling session; scrutiny round 1 applied). Source: FigJam board
"Now & Next → Calendar → Program Editor" (image only, no Figma node link yet). Decisions: ADR 0084
(Now & Next), ADR 0085 (Calendar). "Program" is the UI word; code, API and schema keep **Publication**.

## 0. Fixed rules for every ticket

- Layout from the Figma frames; colour, type, radius and components from `globals.css` tokens and
  `src/components/ui/lovable/` (ADR 0075/0076). No raw `zinc-*`/`indigo-*`/`orange-*`/`bg-white`, no `dark:`.
  Page titles go to the Topbar with `PageHeader titleInTopbar`.
- Files ≤ 300 lines, no `any`, no disabled placeholder controls, no dead code.
- Logic with branches leaves one `*.check.mts` (`node <file>.check.mts`); no test runner is added.
- Core migrations: start from the **live** definition (`pg_get_functiondef`), never an old migration file.
  A changed signature needs `DROP FUNCTION IF EXISTS <old signature>` first, then `CREATE`, then
  `REVOKE ALL … FROM PUBLIC, anon, authenticated` + `GRANT EXECUTE … TO service_role` — for new helpers too
  (`CREATE FUNCTION` grants `PUBLIC` by default). Every migration ships its rollback in `supabase/rollback/`.
- Core route errors: `apiHandler` maps a message containing `Invalid` → 400 and `not found` → 404; anything
  else is 500. Custom zod `refine` messages and RPC exceptions must use those words.
- Applying a migration (develop or prod) is R0: show the SQL and wait for approval. Dump the applied
  `prosrc` afterwards and diff it against the file.
- Core branches off `develop` (the local checkout is on `codex/core-142-mutation-guards` — switch first).
  FE branches off `dev`. Check the branch before every commit.
- Ask before each browser verification (run it / checklist / skip). Unverified → Draft PR.

## 1. Facts checked on 2026-10-06 — re-check at branch time

| Fact | Where |
|---|---|
| Now & Next renders with legacy `components/ui` Badge/Button/Card and its title in `main`; eight sibling pages use `PageHeader titleInTopbar` (Overview, Playlists, Compositions, Programs list, Program editor, Layouts, Media Library, Media Detail). `PageHeader`'s in-`main` branch still has raw `zinc` classes | `NowNextPage.tsx`, `components/layout/PageHeader.tsx` |
| `media_now_next_get(p_tenant_id uuid, p_horizon_minutes int, p_include_idle bool, p_channel_id uuid, p_query text)` — latest body `20261001090000_newest_job_readers_rest.sql`; horizon 60 or 180; direct-device rows only when `p_channel_id IS NULL`; future boundaries from `next_opens_at`, capped at 180 min; a current entry's `closes_at` is the min of its winners' own window closes, not the next effective boundary | Thunder_Core |
| No DB function calls `media_now_next_get`; its only Core caller is `src/app/api/core/v1/media/now-next/route.ts` (zod: `horizon_minutes`, `include_idle`, `channel_id`, `q`); covers are signed by `now-next/cover-urls.ts` (has a `.check.mts`) | Thunder_Core |
| Rollback scripts `supabase/rollback/20260930140000_newest_job_readers.rollback.sql` (L95) and `20261001090000_newest_job_readers_rest.rollback.sql` (L237, grants L593/597) `CREATE OR REPLACE` the **five-argument** `media_now_next_get` — run after BE-A they would add an overload | Thunder_Core |
| Cover signing: shared `src/lib/core/media-cover-urls.ts` (`signCoverUrls`, `withCoverUrl`); `now-next/cover-urls.ts` rebuilds each row as `{…row, current, upcoming}` | Thunder_Core |
| `media_core.now_next_candidates(tenant, row_type, row_id, at)` returns stored-`active` Publications targeting the row (direct Channel target, or a member of the newest Job's `publication_snapshot_group_members`; direct-device rules) with `publication_type`, `content_name = COALESCE(pl.name, comp.name)`, `priority_rank` (urgent 4 … low 1), `activated_at`, `playback_window`, cover keys. No `playlist_id`/`composition_id`/playlist kind. It joins `schedules` with a plain `JOIN` | `20260918073925_overview_group_targets_read_models.sql` |
| Layout winner: if any top-tier Publication's newest-Job snapshot has `layout_id`, the most recently activated top-tier Publication (`activated_at DESC, publication_id DESC`) plays alone; else the whole top tier is one merged loop | `media_now_next_get` (ADR 0068) |
| Player instant test: `t >= starts_at AND (ends_at IS NULL OR t < ends_at) AND media_core.recurrence_matches(recurrence, timezone, t)`. `recurrence_matches` is true for `{}`; else `recurrence_airs_on(rec, local date)` and either the `00:00`/`23:59` whole-day sentinel or `daily_start <= local time < daily_end` | `media_job_poll` (`20260930100000…`), `20260930180000_recurrence_custom_dates.sql` |
| `media_publication_airtime_explain` is a third copy of the rules and adds the player's playable-items `EXISTS` join; Now & Next does not have it | `20261002084043_airtime_explain_layout_winner.sql` |
| `set_schedule` refuses `daily_start >= daily_end` (no cross-midnight windows); `schedules.starts_at` is `NOT NULL`; `timezone` `NOT NULL DEFAULT 'Asia/Bangkok'` | `20260930180000…:277`, `048_media_core_schema.sql` |
| Playlist `kind IN ('single','user','inline')`; image/video Programs point at a `single` Playlist | `055_media_redesign_schema.sql` and later |
| Channel columns: `location_id → public.locations`, `output_kind`, `expected_resolution` (canvas total), `display_config` | Core migrations |
| `ChannelGroup` (FE) carries `members[]`; `fetchChannelGroups()` exists | `channel-groups/services/channel-groups-api.ts` |
| Channels list selection is local state (`selectedId`), resolved from the filtered list; filters come only from the URL and default to "all"; `useListUrlState` rewrites the URL from list state, dropping unknown params | `ChannelsListPage.tsx:47,126`, `channels/list-url-state.ts`, `src/hooks/use-list-url-state.ts` |
| `ChannelDetailPanel` "View Programs →" links `/now-next?q=<name>` | `ChannelDetailPanel.tsx:206` |
| `fetchNowNext(horizon, includeIdle, query = "")` callers besides Now & Next: `ProgramStatusCards.tsx:122`, `ChannelsListPage.tsx:94`, `ProgramEditRail.tsx:83` (two arguments each) | FE |
| `now-next-demo.ts` feeds the dev fallback in `NowNextPage` and `DemoPublicationDetailPage`, which `program/[id]/page.tsx` renders for `demo-` ids in development | FE |
| Overview "View full calendar →" links `/now-next` | `overview/components/LowerOverview.tsx:119` |
| Program editor is 302 lines; `PROGRAM_HREF` used by Go Back (L90), Discard (L96), End **and Delete** (L98), Duplicate (L103), Draft publish → detail (L110); the ⋮ menu (Duplicate / View Published Version / Delete / End) is inline | `publications/components/PublicationEditPage.tsx` |
| `/layouts/[layoutId]?preview=1` opens the Composition editor with its preview overlay (`initialPreview`); no caller uses it yet. The Playlist editor has no such mode | `layouts/[layoutId]/page.tsx:9–15` |
| Tokens: `primary`, `success`, `warning`, `danger`, `info` (each with `-soft`) and `program`; no "high"/orange token | `src/app/globals.css` |
| Nav "Calendar" item has no `href` | `src/config/nav/media-workspace.tsx` |
| Installed Radix: alert-dialog, checkbox, dialog, dropdown-menu, label, select, slot, switch, tabs. **No popover.** `lovable/` has no `popover.tsx` | `package.json`, `src/components/ui/lovable/` |
| Latest Core migration on `origin/develop`: `20261006060719_membership_role_replace.sql` | Thunder_Core |

## 2. Sub-projects, tickets and order

S3 (return-to-context) moved forward into S1: the Now & Next ⋮ "Edit Program" (ADR 0084 §7) needs it.

| # | Repo | Scope | Depends on |
|---|---|---|---|
| **BE-A** | Core | `media_now_next_get`: `p_group_id`; row Channel fields; publication `content` (§3) | — |
| **FE-R** | FE | Program editor `returnTo` (ADR 0084 §9) + `return-to.ts` check | — |
| **FE-A1** | FE | `@radix-ui/react-popover` + copied `lovable/popover.tsx`; `channel-scope.ts` (+check); `ChannelScopePicker` | — |
| **FE-A2** | FE | Now & Next redraw (ADR 0084 §1–8, §10) | BE-A deployed, FE-A1, FE-R |
| **FE-A3** | FE | `/channels?channel=<id>` opens the panel; "View Programs →" uses `?channel=` | FE-A2 (same PR) |
| **BE-B** | Core | `effective_segments` + `media_calendar_get` + `GET /media/calendar` + parity check (§4) | BE-A merged |
| **FE-B1** | FE | Calendar route, nav `href`, toolbar, date picker, Day grid, URL state, polling | BE-B deployed, FE-A1 |
| **FE-B2** | FE | Quick View, Edit/View Program links with `returnTo`, Overview link repoint | FE-B1, FE-R |

PRs: S1 = Core PR (BE-A) + FE PR (FE-R, FE-A1–A3). S2 = Core PR (BE-B) + FE PR (FE-B1–B2).

**Deploy order** (a deployed FE calling an old Core would silently ignore `group_id`): migration on develop
(R0) → Core PR merged to `develop` (auto-deploys develop) → FE PR merged to `dev`. Prod: apply the migration
to prod (R0) and ship Core `main` before FE `main` in the release.

## 3. BE-A — Now & Next scope and row fields

**RPC** `public.media_now_next_get(p_tenant_id uuid, p_horizon_minutes int DEFAULT 60, p_include_idle bool DEFAULT false, p_channel_id uuid DEFAULT NULL, p_query text DEFAULT NULL, p_group_id uuid DEFAULT NULL)`
— `DROP FUNCTION IF EXISTS public.media_now_next_get(uuid, integer, boolean, uuid, text)` first; grants per §0.

- `p_channel_id` and `p_group_id` both set → `RAISE EXCEPTION 'Invalid input: channel_id and group_id are exclusive'`.
- `p_group_id` not a Group of the tenant → `'not found: channel group not found for this tenant'`.
- Group scope = rows whose `row_type = 'channel'` and the Channel is **currently** in
  `media_core.channel_group_members` for that Group. Direct-device rows are excluded (extend the existing
  `p_channel_id IS NULL` gate to `p_group_id IS NULL`). Idle rows: the existing `p_include_idle` branch,
  restricted the same way. `total_active_channels` follows the same scope.
- Row `channel` object gains `location_name` (`public.locations.name`, nullable), `output_kind`,
  `expected_resolution` (nullable). Direct-device rows keep `channel: null`.
- Every publication object (current and upcoming) gains
  `content: { kind: 'playlist' | 'layout' | 'image' | 'video' | 'other', id: uuid | null, name: text | null }`:
  `kind` from `publication_type` (`composition` → `layout`, `html`/`dynamic` → `other`); `id` =
  `composition_id` for a Layout, `playlist_id` only when that Playlist's `kind = 'user'`, else `null`;
  `name` = today's `content_name`. Get the ids by joining `media_core.publications` / `media_core.playlists`
  **inside `media_now_next_get`** — `now_next_candidates` is not changed. Keep `content_name` for the
  deployed FE until FE-A2 ships.

**Route** zod adds `group_id: z.string().uuid().optional()` and a refine against `channel_id` whose message
starts with `Invalid input:`.

**Rollback** `supabase/rollback/<ts>_now_next_group_scope.rollback.sql`: `DROP FUNCTION IF EXISTS` the
six-argument form, recreate the live five-argument definition, re-grant. Add a header line to the older
rollbacks that recreate the five-argument form: "superseded by `<ts>_now_next_group_scope` — run that one".

**Verify** at the HTTP layer (`GET /api/core/v1/media/now-next?horizon_minutes=180&group_id=…`) on develop:
group scope returns only members (idle included with `include_idle=true`), both params → 400, a foreign
Group → 404, unscoped response unchanged apart from the added fields.

## 4. BE-B — Calendar read model (ADR 0085)

**Helper** `media_core.effective_segments(p_tenant_id uuid, p_row_type text, p_row_id uuid, p_from timestamptz, p_to timestamptz)`
`RETURNS TABLE (opens_at timestamptz, closes_at timestamptz, priority text, output_kind text, publications jsonb, suppressed jsonb, occurrence jsonb)`,
`STABLE`, `SET search_path TO ''`, grants per §0 (`service_role` only):

1. **Candidates**: `now_next_candidates(p_tenant_id, p_row_type, p_row_id, p_from)` joined to
   `media_core.schedules` (same plain join) for `starts_at`, `ends_at`, `recurrence`, `timezone`, and to
   `media_core.publications` / `media_core.playlists` for the `content` ids (as BE-A); `has_layout` as in
   now-next.
2. **Boundaries** (a superset is fine — the merge removes extras): `p_from`, `p_to`, and for each candidate
   its `starts_at`, `ends_at`, and — unless `recurrence = '{}'` — for every local date `d` from
   `(p_from AT TIME ZONE timezone)::date - 1` to `(p_to AT TIME ZONE timezone)::date`:
   `(d + daily_start)`, `(d + daily_end)` and `(d + 1)::timestamp` (local midnight — the cast matters: a bare
   `date` would be read in the session time zone), each `AT TIME ZONE timezone`.
   Keep the distinct values inside `[p_from, p_to]`, sorted.
3. **Cuts** `[b_i, b_i+1)`: a candidate is active when the player's instant test holds at `b_i`:
   `b_i >= starts_at AND (ends_at IS NULL OR b_i < ends_at) AND media_core.recurrence_matches(recurrence, timezone, b_i)`.
   Winners = the top rank, then the Layout winner rule; suppressed = active minus winners. For a single
   winner, its occurrence = `publication_playback_window(starts_at, ends_at, recurrence, timezone, b_i)`
   `opened_at` / `closes_at`; otherwise (a merged loop) `occurrence` is SQL `NULL`.
4. **Merge** neighbouring cuts with the same winner set; `suppressed` = distinct union; `occurrence` is kept
   only when every merged cut has the same one, else SQL `NULL` — not JSON `null` (e.g. an all-day schedule
   crossing its own midnight). The parity check relies on this. Drop cuts with no winner.
5. **Output**: `publications` = winners with `id, name, publication_type, content{kind,id,name}, cover keys`
   (same shape as BE-A) plus `schedule_ends_at` (the Schedule's `ends_at`, so the Quick View can tell an
   ended Program without another request); `output_kind` = `merged_loop` when >1 winner; `occurrence`
   `{opens_at, closes_at}` or SQL `NULL` (never JSON `null`) — the FE prints "part of …" when it is wider
   than the block.
6. `-- ponytail: fourth copy of the resolution rules (media_job_poll, media_now_next_get,
   media_publication_airtime_explain); mirrors Now & Next, not the player's playable-items join. Move Now &
   Next's upcoming list onto this helper when either changes again.`

**RPC** `public.media_calendar_get(p_tenant_id uuid, p_from timestamptz, p_to timestamptz, p_channel_id uuid DEFAULT NULL, p_group_id uuid DEFAULT NULL) RETURNS jsonb`, `SECURITY DEFINER`, `SET search_path TO ''`, grants per §0:

- Validates tenant, `p_to > p_from`, `p_to - p_from <= interval '31 days'` (`Invalid input: …`), exclusive
  scope and scope ownership (same messages as BE-A).
- Rows: the now-next target-row union (Channels from direct targets and the newest Job's Group expansion,
  direct devices only when unscoped), plus — when scoped — every active member Channel. Unscoped rows with
  no segment are dropped. Order: Channels by name, then direct devices by name.
- Response: `{ from, to, as_of, display_timezone: 'Asia/Bangkok', rows: [{ row_type, channel{id,name,location_name,output_kind,expected_resolution} | null, device{id,name} | null, segments: [...] }] }`.

**Route** `GET /api/core/v1/media/calendar`: zod `from`, `to` as offset datetimes, `channel_id` / `group_id`
uuid optional, refine exclusive (`Invalid input: …`); thin like `now-next/route.ts`. Covers: a sibling
`calendar/cover-urls.ts` (+ `.check.mts`) that walks `rows[].segments[].publications[]` with the shared
`signCoverUrls` / `withCoverUrl` — not an extension of `now-next/cover-urls.ts`, which would add `upcoming`
to Calendar rows.

**Rollback** drops `media_calendar_get` and `effective_segments`.

**Parity check** (read-only, develop, before merge and whenever either function changes). Replace
`<tenant>` with a uuid literal; an empty result means parity. Starts and winner sets must match exactly.
Ends need care, because Now & Next's `closes_at` is the winner's own window close and it writes no new
entry when the same winners carry on (an all-day schedule across midnight returns `[22:00, 00:00)` with
nothing after, while the Calendar returns `[22:00, 01:00)`). So an end is compared exactly only when it is
decided by the next entry or the horizon; when it is the Program's own close, the Calendar end must be at
or after it. Every row is compared, idle ones included:

```sql
WITH nn AS (
    SELECT public.media_now_next_get('<tenant>'::uuid, 180, true) AS j
), nn_rows AS (
    SELECT r->>'row_type' AS row_type,
           COALESCE(r#>>'{channel,id}', r#>>'{device,id}')::uuid AS row_id,
           r, (nn.j->>'as_of')::timestamptz AS as_of
    FROM nn, jsonb_array_elements(nn.j->'rows') r
), nn_raw AS (
    SELECT row_type, row_id, as_of,
           GREATEST((e->>'opens_at')::timestamptz, as_of) AS starts_at,
           COALESCE((e->>'closes_at')::timestamptz, 'infinity') AS own_close,
           (SELECT array_agg(p->>'id' ORDER BY p->>'id') FROM jsonb_array_elements(e->'publications') p) AS winners
    FROM nn_rows
    CROSS JOIN LATERAL (
        SELECT r->'current' AS e WHERE jsonb_typeof(r->'current') = 'object'
        UNION ALL
        SELECT u FROM jsonb_array_elements(r->'upcoming') u
    ) entries
), nn_bounded AS (
    SELECT *,
           LEAST(COALESCE(lead(starts_at) OVER (PARTITION BY row_type, row_id ORDER BY starts_at), 'infinity'),
                 as_of + interval '180 minutes') AS cut_by_next_or_horizon
    FROM nn_raw
), nn_entries AS (
    SELECT row_type, row_id, starts_at,
           LEAST(own_close, cut_by_next_or_horizon) AS ends_at,
           own_close >= cut_by_next_or_horizon AS end_is_exact,
           winners
    FROM nn_bounded
    WHERE starts_at < LEAST(own_close, cut_by_next_or_horizon)
), es_entries AS (
    SELECT k.row_type, k.row_id, s.opens_at AS starts_at, s.closes_at AS ends_at, s.occurrence,
           (SELECT array_agg(p->>'id' ORDER BY p->>'id') FROM jsonb_array_elements(s.publications) p) AS winners
    FROM nn_rows k
    CROSS JOIN LATERAL media_core.effective_segments('<tenant>'::uuid, k.row_type, k.row_id, k.as_of, k.as_of + interval '180 minutes') s
)
SELECT row_type, row_id, starts_at,
       n.ends_at AS now_next_end, e.ends_at AS calendar_end,
       n.winners AS now_next_winners, e.winners AS calendar_winners
FROM nn_entries n
FULL JOIN es_entries e USING (row_type, row_id, starts_at)
WHERE n.winners IS DISTINCT FROM e.winners
   OR (n.end_is_exact AND n.ends_at IS DISTINCT FROM e.ends_at)
   OR (NOT n.end_is_exact AND e.ends_at < n.ends_at)
   -- An overrun is legitimate only when the block merged different occurrences (occurrence IS NULL);
   -- a single-occurrence block that outlives Now & Next's own close means a missed boundary.
   OR (NOT n.end_is_exact AND e.ends_at > n.ends_at AND e.occurrence IS NOT NULL);
```

A block that crosses the horizon is clipped to it on both sides; a zero-length Now & Next entry exactly at
the horizon is dropped. Not covered: overruns on merged loops (their `occurrence` is always null), and
direct-device rows that Now & Next leaves out but the helper fills (`include_idle` adds only idle Channels).

**Performance**: `EXPLAIN ANALYZE` of a one-day `media_calendar_get` on the largest develop tenant.

## 5. FE tickets

**FE-R — `returnTo`** (`publications/return-to.ts` + `return-to.check.mts`):
`safeReturnTo(raw: string | null): string | null` — resolve against a dummy origin, accept only a
same-origin path starting with `/media-workspace/`, return `pathname + search`; reject `//host`, schemes,
backslashes, empty. `PublicationEditPage`: Go Back → `returnTo ?? PROGRAM_HREF`; Discard →
`leaveTo ?? returnTo ?? PROGRAM_HREF`; End → `returnTo ?? PROGRAM_HREF`; Delete (Draft only) keeps
`PROGRAM_HREF`; successful Publish / Publish changes → `returnTo` when present, else today's behaviour.
Duplicate and the breadcrumb are unchanged. The page is already 302 lines: move the ⋮ menu (Duplicate /
View Published Version / Delete / End) into `publications/components/edit/ProgramEditMenu.tsx`.

**FE-A1 — scope picker.** Add `@radix-ui/react-popover`; copy Lovable's `popover.tsx` (confirm it exists in
the Lovable project first) into `components/ui/lovable/`. `channels/channel-scope.ts`: `type ChannelScope =
{ kind: 'all' } | { kind: 'group'; id } | { kind: 'channel'; id }`, `readChannelScope(params)`,
`writeChannelScope(scope, params)` (one of `group` / `channel`, never both; invalid → all) + check.
`channels/components/ChannelScopePicker.tsx`: trigger "All Channels ▾" (shows the chosen name), popover with
lovable `Tabs` Channels | Groups, search, radio list with counts (All = active Channels, Group = `members.length`),
Cancel / Apply; disabled Groups listed. Data: one channels list call + `fetchChannelGroups()` on first open.

**FE-A2 — Now & Next redraw** (split under `publications/components/now-next/`: page, KPI cards, Now Playing
table, Up Next timeline).
- `fetchNowNext(horizon, includeIdle, scope?: ChannelScope)` replaces the unused `query` argument; the three
  other callers pass two arguments and must keep working (regression-check Overview Program cards, the
  Channels list "Now playing", the editor rail).
- Always `horizon_minutes=180`; `include_idle = scope.kind !== 'all'`; scope in the URL via `useListUrlState`.
  A 404 for the scope id → reset to All and show an inline notice.
- `PageHeader title="Now & Next" … titleInTopbar`; action row = scope picker + "Auto-refresh · as of HH:MM" dot.
- KPI: Live now / Next 60 minutes / Next 3 hours / Current time (ticking clock isolated in its own component).
- Table: Channel (Output Kind icon tile, name, "<Output Kind> · <Location>") · Status (Live / Playback stale /
  Scheduled + resolution) · Program (cover + name → detail; "+N in loop") · Content (kind icon + kind + name,
  linked per ADR 0084 §7) · Time remaining (mm:ss + progress; "—" with no end) · Next Program (cover, name →
  detail, "Starts HH:MM"; "Continues" ↻ when nothing follows an open-ended current) · ⋮ per ADR 0084 §7
  (Edit Program with `returnTo` = current Now & Next URL only for exactly one current Program; Open in
  Calendar `?channel=<id>` only on Channel rows; no ⋮ when neither applies).
- "View all channels →" and "Open Calendar →" (carries the scope). Up Next: 3-hour timeline, blocks
  coloured urgent `danger` / high `warning` / normal `primary` / low `success` (`-soft` fills).
- Extend `now-next.ts` types with the BE-A fields. Delete `now-next-demo.ts`, `DemoPublicationDetailPage.tsx`,
  its export in `publications/index.ts` and the `demo-` branch in `program/[id]/page.tsx` (ADR 0084 §10).

**FE-A3 — Channel deep link.** `ChannelsListPage` reads `?channel=<id>` into the initial `selectedId`
(filters default to "all", so the row is present). The list-state hook then rewrites the URL without
`?channel=`; a reload loses the panel — accepted (ADR 0084). `ChannelDetailPanel` "View Programs →" →
`/now-next?channel=<id>`.

**FE-B1 — Calendar page.** Route `src/app/(dashboard)/(application)/media-workspace/calendar/page.tsx`; nav
`href`. Feature folder `src/features/media-workspace/calendar/`:
- `calendar-api.ts` — types + `fetchCalendar(from, to, scope)`.
- `calendar-day.ts` + check — `dayRange(date)` → `from = <date>T00:00:00+07:00`, `to` = next day
  (`ponytail: fixed +07:00, Asia/Bangkok has no DST — derive from display_timezone if another zone is offered`),
  today in Bangkok, prev/next date, block position/width over 24 h, "Now" membership, next block on a row,
  "part of" when `occurrence` is wider than the block.
- `calendar-url.ts` + check — `?date=YYYY-MM-DD` (default today, invalid → today) + `ChannelScope`.
- Components: page (`PageHeader title="Calendar" … titleInTopbar`, actions "+ Create Program" →
  `/program/create`), toolbar (prev · date button with popover month grid + `<input type="date">` "Go to
  date" · next · Today · scope picker), Day grid (sticky row header: icon tile, name, Location, resolution;
  00–24 h, horizontally scrollable, initial scroll to now on today else 08:00; now line; blocks with
  content-kind icon, name, time; "Now" chip; "+N hidden" marker), past-day note (ADR 0085 §5). Try
  `publications/components/edit/schedule/DatesCalendar.tsx` for the month grid before writing one.
- Poll every 60 s only when the date is today, paused while hidden (same pattern as Now & Next). A 404 for
  the scope id → reset to All with a notice.

**FE-B2 — Quick View** (ADR 0085 §9), docked under the grid; selection in component state (cleared on date or
scope change). Edit Program → `/program/<id>/edit?returnTo=<current calendar URL>`; **View Program**
(`/program/<id>`) instead when the publication's `schedule_ends_at` is in the past. Overview "View full
calendar →" → `/media-workspace/calendar`.

## 6. Open inputs (not blocking)

- **Figma frame link** for exact spacing via the Figma MCP. Until then the board image is the reference.
- **Lovable `popover.tsx`** must be confirmed in the Lovable project before FE-A1 copies it.

## 7. Verification (per PR)

- `node *.check.mts` for every new helper; `tsc --noEmit` (FE clean; Core: changed files only — its tsc is
  never clean); `pnpm lint` on changed files.
- Core: HTTP-layer checks above on develop; parity query; `EXPLAIN ANALYZE`; rollback reviewed (not run).
- FE (after asking): Now & Next — All / one Group / one Channel scopes, a stale scope id, URL round-trip and
  Back, each link target, ⋮ visibility per row kind, ⋮ Edit → editor → Go Back returns with scope,
  Live/stale/Scheduled rows, open-ended row, merged loop, the three other `fetchNowNext` consumers still
  render, 1440 px against the Figma frame. Calendar — prev/next/Today/date picker/Go to date, URL + Back,
  scope, a priority overlap (cut block + "part of" + hidden line), merged loop, past-day note, Quick View →
  Edit → Publish changes → returns to the same day and scope.
- Frontend talks to the **deployed** Core unless `CORE_API_URL` points at a local Core and the dev server is
  restarted — check `/api/proxy/__config` before blaming the backend.
