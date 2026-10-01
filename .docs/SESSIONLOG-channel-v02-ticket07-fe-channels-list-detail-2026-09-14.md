# Session Log — Channel v02 Ticket 07 (FE All Channels list + detail panel)

**Date:** 2026-09-14
**Branch:** `feat/channel` (base `dev`)
**Scope:** `thunder_one_prj` only — GitHub [#105](https://github.com/rdThunderThailand/thunder_one_prj/issues/105)
**Continues from:** `/tmp/HANDOFF-channel-v02-ticket07-list-detail-2026-09-14.md` (steps 1–4 done in a
prior session this same day); this session resumed at step 5 of
`docs/channels/v02/plan-ticket07-channels-list-detail.md`.

---

## 1. What this session shipped

Steps 5–8 of the plan: the detail panel rebuild, the Now & Next cross-feature edit, and full
browser verification against the deployed Core v2 backend (local `:3001`, confirmed on the right
branch — see §4).

### Step 5 — Detail panel

- **`display-structure.ts`** (new) + `.check.mts` — `structureNodes(channel)`: Player node → Screen
  node(s) from `display_config.screens`, or one synthetic Screen node from `expected_resolution`
  (falling back to the Player's own reported resolution) when `display_config` is `null`. Player-less
  Draft → `player: null`.
- **`ChannelStructureTree.tsx`** (new) — renders that tree: a Player card, a connector line, then a
  row of Screen cards. CSS flex/border, no SVG — matches D1's simple box-and-line diagram closely
  enough without a drawing library.
- **`ChannelDetailPanel.tsx`** (full rewrite, old version was still the pre-ADR-0074 category/devices
  shape) — cover (current-program thumbnail, falling back to an Output Kind icon), name, status pill,
  lifecycle badge, description, Open Live View (disabled + tooltip), Edit Channel, the "…" menu
  (reused `ChannelRowActionsMenu` as-is rather than forking its body — it was already a self-contained
  button+dropdown), Status (health + "Last updated"), Now Playing (all Publication names, window,
  remaining, "via <group>", "View Programs →"), Channel Structure, Groups (chips + disabled "Manage
  →"), Channel Information (Type/Location/Resolution/Created/Last Updated — no Channel ID/Tags/actor,
  per the ticket's deviation table).
  - `created_at` isn't on the list payload (`ChannelListItem`), so the panel fetches
    `fetchChannel(id)` (existing `ChannelDetail` read) on open, best-effort — degrades to "–" on
    failure, never blocks the rest of the panel.
  - "via <group>" reads `GET /media/publications/{id}`'s `targets[].via_groups`, matched by
    `device_id === channel.player.id` (ADR 0074 §6: `via_groups` lives on the job target, keyed by
    device, not on `publication_targets`). Added `via_groups?: string[]` to
    `PublicationDeliveryTarget` (`publications/types/index.ts`) — no backend change, the field was
    already live, just untyped on the frontend.
  - Both side-fetches are keyed by their own identity (`channel.id`; a `(deviceId, publicationId)`
    key compared against a stored `{key, groups}` result) rather than reset with a synchronous
    `setState` at the top of the effect — this repo's ESLint config (`react-hooks/set-state-in-effect`)
    forbids that, memory-noted in `CLAUDE.md` §6.
- **`now-playing.ts`** — added `nowPlayingAllNames` (every airing Publication name, vs. the table's
  collapsed "+N more") and `nowPlayingWindow(occurrence, timezone)` ("12:00 – 14:00", same
  `Intl.DateTimeFormat` shape as `NowNextPage`'s own `formatTime`). `ChannelsListPage` now threads
  `/media/now-next`'s `display_timezone` down to the panel instead of discarding it, so the window
  renders in the display's configured timezone rather than the viewer's browser timezone.
- **`ChannelsListPage.tsx`** — passes `occurrence`, `displayTimezone`, `onChanged` to the panel.

### Step 6 — Now & Next cross-feature edit

`NowNextPage.tsx`'s search box now initialises from `?q=`. First pass used a mount-time
`window.location.search` read; browser verification caught that Next.js does **not** remount the page
for a search-param-only client navigation (a "View Programs →" click stays on the same route
segment), so the mount-time read silently missed it — confirmed by testing the exact click path vs.
a hard reload of the same URL (hard reload worked, click-through didn't). Fixed with
`useSearchParams()` plus React's documented "adjust state during render when a prop changes"
pattern (not a `useEffect` — that trips the same `set-state-in-effect` rule as above).

### Steps 7–8 — Gates and verification

- `tsc --noEmit -p .` — clean (project-wide).
- `eslint` on every touched/new file — clean.
- Every touched `.check.mts` — passing (`now-playing`, new `display-structure`, `channel-logic`,
  `list-filtering`, `list-url-state`, `channels-api-contract`, `channel-groups-api-contract`,
  publications' `channels-logic` and `detail-mapping` — the last two construct `ChannelListItem`
  fixtures and still parse after the `via_groups` type addition).
- File sizes: `ChannelDetailPanel.tsx` 263, `ChannelStructureTree.tsx` 60, `display-structure.ts` 52,
  `ChannelsListPage.tsx` 225 — all ≤ 300.
- No `any`; no `Degraded` anywhere in code.
- **Browser verification, run by the agent (user chose this over a checklist)**, against
  `http://localhost:3001` (`.env.local`'s `CORE_API_URL`), confirmed via `/media/channels` to already
  be Core v2 (`player`, `health`, `groups`, `display_config` present) — not a stale branch, unlike a
  prior session's `:3001` scare (see `composition-tags-backend-missing` memory). Logged in via
  credentials the user supplied in chat.
  - List: totals/tiles correct (5 Channels, 0/0/5 online/warning/offline, 1 Channel Group).
  - Type filter (Screen) and Status filter (Offline) both narrow correctly; Sort by Location
    re-orders the table (Unassigned location sorts last).
  - Opened the panel for `Channel for Screen 1` (single Player, no Groups) and
    `Channel for Screen 3-4 – ThunderOne Screen 03` (single Player, one Group) — both single-node
    Channel Structure trees rendered correctly; Groups chip "Channel for Screen 3-4" renders; Created
    date came back from the `fetchChannel` side-fetch (`11 Aug 2026 10:39` / `21 Aug 2026 10:39`).
  - Disabled-button tooltips confirmed via DOM inspection (`title` attribute): "Open Live View — not
    available yet", "Manage Groups — not available yet", "Duplicate Channel — not available yet" (via
    the reused `ChannelRowActionsMenu`).
  - "View Programs →" link builds the correct `?q=<channel name>` URL and — after the fix above — the
    Now & Next search box picks it up on the real client-side navigation, not just a hard reload.
  - Now Playing correctly read "Nothing scheduled now" in the panel (all seeded Channels are
    Offline/idle right now) — distinct wording from the table's "–", per the deviation table.
  - Multi-screen tree rendering stays browser-unverified — no `display_config.mode = 'multi'`
    Channel exists on this data yet (matches the plan's known limitation, ticket 08).

## 2. Not done / explicitly deferred

- Multi-screen Channel Structure — browser-verified only when ticket 08 creates one; covered here by
  `display-structure.check.mts` alone.
- Duplicate Channel, Live View, Manage Groups / Add to Group — all intentionally disabled with
  tooltips per the ticket's deviation table; not this ticket's work.

## 3. Repo state at end of session

Nothing committed — all of steps 1–8 (this session's + the prior session's) sit as uncommitted
changes on `feat/channel`. Per the handoff and CLAUDE.md §4, commit/push/PR only on explicit
instruction; PR (when opened) stays Draft unless told otherwise, and the user picks Thai vs. English
for it at that time.
