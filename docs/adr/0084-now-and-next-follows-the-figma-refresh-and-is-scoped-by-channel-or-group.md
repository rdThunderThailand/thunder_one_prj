# 0084 — Now & Next follows the Figma refresh and is scoped by Channel or Group

Status: accepted (2026-10-06, grilling session on the FigJam board "Now & Next → Calendar → Program Editor";
scrutiny round 1 applied). Amends ADR 0057 (controls, vocabulary, summary labels, mock fallback) and the
"Program" UI-word rule in `CONTEXT.md`. Companion: ADR 0085 (Calendar). Plan: `docs/program/plan-now-next-calendar.md`.

## Context

A FigJam board (2026-10-06) redraws Now & Next and adds a Calendar and a flow into the Program Editor.
The Figma frames win on layout; this repo wins on data, behaviour and vocabulary (ADR 0075/0076). The
board conflicts with ADR 0057 in several places, and draws data the platform does not have.

Facts established before deciding:

- `NowNextPage.tsx` renders with the legacy `components/ui` kit (Badge/Button/Card), not
  `components/ui/lovable/`, and keeps its title in `main`, while eight sibling Media Workspace pages
  (Programs list, Program editor, Playlists, Layouts, Media Library…) publish their title to the Topbar
  with `PageHeader titleInTopbar` (ADR 0075 §4).
- `media_now_next_get(p_tenant_id, p_horizon_minutes, p_include_idle, p_channel_id, p_query)` can scope
  to one Channel, not to a Channel Group. Its rows carry no Location, Output Kind or resolution, and its
  publications carry `content_name` but no content id.
- There is no Channel Detail page: `ChannelDetailPanel` opens as a side panel on `/channels` and
  `/channel-groups` from local state, and `/channels/[id]/edit` is the editor. A Layout can open straight
  into its editor's preview overlay (`/layouts/[id]?preview=1`); a Playlist has no read-only mode at all —
  its library opens it in the single-page editor (ADR 0060).
- The Program Editor (`/program/[id]/edit`) already edits Content (Playlist or Layout), Target, Schedule
  and Priority, with Go Back · Preview · Save (Draft) · Publish / Publish changes · ⋮. Go Back always
  returns to `/media-workspace/program`.
- No player telemetry reports the current item, so "which file is playing now" is unknown (ADR 0057).

## Decision

1. **Layout from Figma, treatment from the design system.** The frame's body is kept: four KPI cards, a
   Now Playing table, an Up Next timeline. The title and subtitle go to the Topbar through
   `PageHeader titleInTopbar`, like the sibling pages; the frame's in-page title row becomes the page's
   action row (scope picker, auto-refresh indicator). Colour, type, radius and components come from
   `globals.css` tokens and `components/ui/lovable/`. The shell (sidebar sections, Topbar) is not
   restructured to match the frame (ADR 0075 §6).
2. **"Program" is the UI word here too; "Channel", never "Screen".** Now & Next and Calendar join the
   surfaces that say Program (ADR 0072/0081). The column header is "Channel".
3. **"Live" only with evidence.** Row status: `confirmed` → **Live**, `stale` → **Playback stale**,
   `not_confirmed` → **Scheduled**. The frame's "LIVE" pills (title, Now Playing heading) become a pulsing
   dot with "Auto-refresh · as of HH:MM".
4. **KPI cards report what exists.** Live now = `playback_confirmed_channels`; Next 60 minutes =
   `upcoming_60m_channels`; Next 3 hours = `upcoming_3h_channels`, still distinct Channels (ADR 0057),
   labelled "Channels with upcoming programs"; Current time = a ticking clock in the display time zone.
   No trend percentages or sparklines — there is no history to compute them from.
5. **Controls the frame removes are removed**, with no disabled placeholders: the search box, the 60 min /
   3 h toggle, Show idle channels, the disabled Filters and Live View buttons, and the Manage Publications
   link. The Up Next timeline is fixed at **3 hours** (the frame's ticks span ~3 h; its "60 minutes" title
   is corrected to "Next 3 hours") and the page always requests `horizon_minutes = 180`. Searching by
   Program name is lost; accepted, since the scope picker searches Channel names.
6. **One scope picker, shared with the Calendar.** "All Channels" opens a popover with **Channels | Groups**
   tabs, a search box, a radio list with member counts, Cancel / Apply. Exactly one of: All Channels, one
   Channel Group, one Channel. The filter runs **on the server**: `media_now_next_get` gains `p_group_id`
   (exclusive with `p_channel_id`), meaning "Channels that are currently members of this Group". Disabled
   Groups are selectable — their members still play (ADR 0074). When scoped to a Group or Channel, idle
   member Channels are included; under All they stay hidden. Direct Media Device rows appear only under All.
   The scope lives in the URL as `?group=<id>` or `?channel=<id>`; an id the server no longer knows falls
   back to All Channels with a notice instead of blanking the page.
7. **Row links.** Channel → `/media-workspace/channels?channel=<id>`, which opens the existing
   `ChannelDetailPanel`. Program and Next Program → `/program/[id]`. Content → `/layouts/[id]?preview=1` for
   a Layout (opens on its preview); `/playlists/[id]` for a user Playlist — its editor is the only page a
   Playlist has, the same place its library opens it; an image/video Program shows its content name without
   a link. Open Calendar →
   `/calendar` with the same scope. View all channels → `/channels`. The row ⋮ holds **Edit Program**
   (with `returnTo`, item 9) only when exactly one Program is current, and **Open in Calendar** (scoped to
   that Channel) only on Channel rows; a row with neither shows no ⋮. Core adds to each row the Channel's
   Location name, Output Kind and canvas resolution, and to each publication a `content { kind, id, name }`.
8. **What the frame draws but does not exist.** Channel photos → an Output Kind icon tile. The PA / Audio
   row does not exist (audio is reserved, ADR 0074). Timeline blocks are coloured by Publication Priority
   tokens — urgent `danger`, high `warning`, normal `primary`, low `success` — with the existing legend, not
   the frame's palette. A current occurrence with no end shows Time Remaining "—" and Next "Continues" (not
   "Loop", which reads as merged loop). A merged loop shows its first Program plus "+N in loop". Time
   Remaining gets a progress bar for the elapsed share of the current occurrence.
9. **`returnTo` brings the operator back.** The Program Editor accepts `?returnTo=<path>`, honoured only
   when, resolved against the app origin, it is a same-origin path under `/media-workspace/`. It replaces
   the Programs-list destination of Go Back, Discard and End program, and after a successful Publish /
   Publish changes it returns there too, so the operator sees the result where they started. Delete (Draft
   only) and every destination without `returnTo` stay as today.
10. **No mock fallback.** The development-only demo data (`now-next-demo.ts`) and the page that renders its
   fake Programs (`DemoPublicationDetailPage`) are removed: ADR 0057 already forbids invented fallback
   data, and the redraw would otherwise have to keep a second, fake copy of the new response shape.

## Rejected

- **Keep ADR 0057's search / horizon toggle / idle toggle beside the new layout** — the frame drops them;
  keeping them as extras recreates the old page under a new skin.
- **Filter by Group in the browser** — the server's summary counts would then describe a different set of
  Channels than the rows below them.
- **Multi-select scope** — the frame draws radios; nothing asks for several Groups at once.
- **"Live" as drawn** — ADR 0057 already rejected an unconditional Live; an open Schedule is not playback.
- **Title in `main` as drawn** — every sibling page keeps it in the Topbar (ADR 0075 §4); two header
  conventions side by side is worse than one deviation from the frame.
- **A full Channel Detail page now** — the board shows one only as a thumbnail; it is its own
  sub-project. Linking a Channel to its edit page was rejected because a Channel has a read surface (the
  panel); so does a Layout (its preview). A Playlist has none, hence the one exception in item 7.
- **"Publish ▾" dropdown in the editor** — there is no second publish action to put in it, and a Live
  Program has no Save (ADR 0080 §2); secondary actions already live in ⋮.
- **`router.back()` for Go Back** — fails when the editor was opened in a new tab and after a publish.

## Consequences

- ADR 0057 is amended on: controls (§5 above), the summary labels (§4), the status vocabulary (§3), scope
  (§6) and the development fallback (§10). Its read model, evidence rules, priority resolution and "no
  date picker on this page" stand.
- `media_now_next_get` changes signature: the migration must `DROP FUNCTION IF EXISTS` the old five-argument
  form before `CREATE`, then `REVOKE … FROM PUBLIC, anon, authenticated` and `GRANT EXECUTE … TO service_role`.
  Older rollback scripts that `CREATE OR REPLACE` the five-argument form become unsafe and are superseded by
  this migration's own rollback. The FE must not ship before Core accepts `group_id`, or the scope would be
  silently ignored.
- `ChannelDetailPanel`'s "View Programs →" switches from `?q=<name>` to `?channel=<id>`. The Channels list
  drops `?channel=` from the URL once its list state is written, so a reload loses the open panel; accepted.
- New dependency `@radix-ui/react-popover` (with Lovable's `popover.tsx` copied into `components/ui/lovable/`)
  for the scope picker and the Calendar date picker; DropdownMenu was rejected because its typeahead takes
  over the search field and it closes on radio select before Apply.
