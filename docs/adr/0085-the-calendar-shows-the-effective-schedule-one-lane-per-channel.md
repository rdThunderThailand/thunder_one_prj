# 0085 — The Calendar shows the effective schedule, one lane per Channel

Status: accepted (2026-10-06, grilling session on the FigJam board "Now & Next → Calendar → Program Editor";
scrutiny round 1 applied). Rev.2 (2026-10-06, before release): overridden Programs can be shown in expandable
lanes (§1, §2, §10). Fills the "Schedule Preview/Calendar" slot ADR 0057 left open. Companion: ADR 0084.
Plan: `docs/program/plan-now-next-calendar.md`.

## Context

The sidebar has carried a disabled "Calendar" item since the nav was written; there is no route and no
read model behind it. The board draws a Day view: one row per Channel, hour columns, Program blocks, a
"Now" line, date navigation (prev/next, a month popover with "Go to date", Today), a Quick View panel
docked under the grid, and "Edit Program" into the existing editor with Go Back returning to the same
day, view and Channel filter.

Facts established before deciding:

- `media_now_next_get` resolves effective playout server-side (priority tiers, the Layout winner of
  ADR 0068, equal-tier merged loops) but only up to 180 minutes ahead, and it finds future boundaries from
  each Program's `next_opens_at` — one future occurrence per Program. It cannot answer a whole day.
- The resolution rules already exist three times: `media_job_poll` (the player), `media_now_next_get`, and
  `media_publication_airtime_explain`. The player and airtime-explain also require the snapshot to hold
  playable items before a Program can win; Now & Next does not.
- The player's own test for "this Program airs at instant t" is `starts_at ≤ t < ends_at` (open end when
  `ends_at` is null) and `media_core.recurrence_matches(recurrence, timezone, t)`, which treats a `00:00–23:59`
  window as the whole local day. Recurrence comes in four stored shapes — weekly `days`, `dates`, `monthly`
  `month_days`, and the one-off `{}`; `set_schedule` refuses `daily_start ≥ daily_end`, so no window crosses
  midnight, and `schedules.starts_at` is `NOT NULL`.
- `media_core.now_next_candidates(tenant, row_type, row_id, at)` already decides which active
  Publications target a Channel (direct target or the newest Job's frozen Group expansion) or a direct
  Media Device, with priority rank, `activated_at`, content name and cover.

## Decision

1. **Effective, not intent.** A block is what Now & Next's rules say that Channel plays at that time, after
   priority suppression, the Layout winner rule and equal-tier merging — so today's row and Now & Next's
   Up Next agree. One lane per row, as drawn. A Program that is scheduled but suppressed is not a block; it
   is counted on the block that hides it ("+N overridden"), named in the Quick View, and drawn in its own
   lane when the row is expanded (§10). Like Now & Next, the
   Calendar does not apply the player's playable-items check, so it is an approximation of the screen: a
   top-tier Program whose snapshot has no playable items is drawn as winning, although the player would
   skip it.
2. **Read model.** A new helper `media_core.effective_segments(tenant, row_type, row_id, from, to)` takes its
   candidates from `now_next_candidates`, cuts the range at every instant where a candidate's airing can
   change — its `starts_at` and `ends_at`, and in its Schedule's time zone each local daily start, daily end
   and midnight — and decides each cut with the player's instant test above. Winners per cut follow the
   Now & Next rules; neighbouring cuts with the same winners merge. `public.media_calendar_get(tenant, from,
   to, channel_id?, group_id?)` builds rows from it; each `suppressed` entry carries the `spans` in which that
   Program was scheduled but overridden (Rev.2); `GET /media/calendar` exposes it. A range is at most
   31 days. Day boundaries are Asia/Bangkok midnights.
3. **A fourth copy of the rules, guarded.** `effective_segments` is new and used by the Calendar only;
   `media_now_next_get` is not rewritten. A read-only parity check — Now & Next's next 3 hours against
   `effective_segments(as_of, as_of + 3 h)`, every row, comparing block starts and winner sets exactly —
   runs on develop before merge and whenever either function changes. Ends are compared exactly only when
   the next block or the horizon decides them: Now & Next writes no new entry when the same Programs carry
   on past their own window close (an all-day schedule across midnight), so there the Calendar's block may
   legitimately run longer. The upgrade path is to move Now &
   Next's upcoming list onto `effective_segments`, recorded as a `ponytail:` comment in the migration.
4. **Rows follow ADR 0084's scope rule.** Under All Channels: Channels with at least one block in the range,
   then direct Media Device rows. Scoped to a Group or a Channel: every active member Channel, empty ones
   included. Sorted by Channel name.
5. **Only stored-active Programs.** Drafts never air, so they are not drawn; cancelled (ended early)
   Programs are not drawn. Past days can be visited and show the schedule **as currently defined**, with
   the note "Past days show the current schedule, not what actually played — see Playback Proof".
   What actually aired is Playback Proof's question, not the Calendar's.
6. **"Now", not "Live".** The block containing the current time carries **Now** and the grid draws the
   now line; the Calendar reads no Job targets or heartbeats. Playback evidence stays on Now & Next.
   While the selected date is today the page refetches every 60 s, paused while the tab is hidden;
   other dates do not poll.
7. **Day only.** A 24 h × 7-day grid at ~1100 px gives ~6 px per hour, so Week and Month need their own
   design. v1 renders no Week/Month tabs (no disabled placeholders); the API already accepts 31 days.
8. **Toolbar and frame.** Title and subtitle in the Topbar (ADR 0084 §1). Prev / date button (month popover
   + a native `<input type="date">` "Go to date") / next, Today, the shared scope picker, "+ Create Program"
   → `/program/create` with nothing prefilled. "All Program Types" is dropped (crossed out on the board).
   The grid spans 00:00–24:00 and scrolls horizontally; it opens on the current time when the date is today,
   else on 08:00. Route `/media-workspace/calendar`; the date and scope live in the URL. Overview's "View
   full calendar →" points here.
9. **Quick View** (docked under the grid, as drawn). Cover, Program name → detail page, **Now** when it
   applies, a Priority chip, the block's time and duration, Channel · Location · resolution, and
   **Content: kind + name** linked as in ADR 0084 §7. The frame's File / Source / Playlist fields are
   replaced by that one Content line — they need the current item, which nothing reports, and are
   meaningless for a future block. A merged loop lists each member Program with its own Edit. A block that
   is part of a longer occurrence (cut by a higher tier or by the day edge) adds "part of 08:00–11:00"; a
   block that hides others adds "Overridden: <name>". **Edit Program** opens the
   editor with `returnTo` (ADR 0084 §9); for a Program whose Schedule has ended it reads **View Program**
   (the editor is read-only then, ADR 0080 §4). Next Program is the next block on the same row that day,
   else "Nothing else today". The crossed-out icon button is dropped.

10. **Overridden lanes (Rev.2).** A row that overrides anything in the range shows a ▸ toggle in its header
    (the rest of the header still opens the Quick View). Expanded, one thin lane per overridden Program sits
    under the effective lane, drawing only the spans where it was scheduled but not playing, hatched and muted;
    the spans where it does play are already in the effective lane. A span links to the Program's detail page
    with the tooltip "Overridden by <winner>". The expanded state is component state, not URL. The API adds
    `spans: [{opens_at, closes_at}]` to each `suppressed` entry of a block (per cut, clipped to the block); the
    page joins them by Program across blocks and merges touching spans. Why: operators asked "I scheduled it,
    why is it not on screen?" — a count answers *that* something is hidden, the lane answers *when*.

## Rejected

- **Intent view** — every active Program's occurrences, overlaps stacked in sub-lanes. Far simpler SQL,
  but it cannot say what plays at 14:00 and rows grow away from the frame whenever Programs overlap.
- **Hybrid** — intent blocks with the suppressed ones drawn faded in the same lane: overlapping blocks in
  one lane are unreadable. Rev.2 keeps this rejected: overridden Programs get their own lanes, on demand.
- **Overridden lanes: a row-level `overridden` list in `media_calendar_get`** (Rev.2) — answers the question
  directly but needs the cut logic a second time (a fifth copy of the rules); per-block `spans` reuse it.
- **Overridden lanes: draw the whole scheduled occurrence and highlight the overridden part** (Rev.2) —
  repeats what the effective lane already shows and makes the lane busier. **A global "Show overridden"
  switch** — expands rows that have nothing to show. **Quick View for an overridden span** — the Quick View
  describes what plays; the detail page describes the Program.
- **Find boundaries from `next_opens_at`** (Now & Next's method) — sees one future occurrence per Program,
  not a day.
- **Enumerate whole occurrences and clip them by hand** (this ADR's first draft) — re-implements the window,
  clipping and all-day rules that `recurrence_matches` already holds for the player, and can drift from it.
- **Apply the player's playable-items check** — truer to the screen, but the Calendar would then disagree
  with Now & Next on the same rows; both move together if it is ever added.
- **Rewrite Now & Next onto the new helper now** — one rule set fewer, but it reopens a verified
  production RPC inside a feature that does not need it.
- **Week / Month on the same grid; Drafts as ghost blocks; playback evidence on blocks; File / Source in
  Quick View** — see items 7, 5, 6 and 9.

## Consequences

- Rev.2: Program covers come from one helper, `media_core.publication_cover` (Core `20261006130000`), used by
  `now_next_candidates` and `media_publications_list`. A Layout Program's cover is its first zone's (by
  position) Playlist cover, a stand-in until a rendered Layout preview exists (issue #230).

- Four implementations of the resolution rules (`media_job_poll`, `media_now_next_get`,
  `media_publication_airtime_explain`, `effective_segments`); the parity check guards the pair the operator
  sees side by side.
- Editing a Program (targets, schedule, priority) redraws past days too. Operators are told so on screen.
- Cost is one instant test per candidate per cut; `EXPLAIN ANALYZE` on the largest develop tenant before merge.
- Week and Month wait for a design.
