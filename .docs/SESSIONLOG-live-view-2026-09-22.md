# Session: Live View Phase 1 — ticket 01 implementation

**Date:** 2026-09-22
**Branch:** `feat/live-view` (thunder_one_prj)
**Continues:** `/tmp/handoff-live-view-phase1-2026-09-22.md` (design session: ADR 0078, plan, ticket 01)

## What was asked

Execute ticket 01 — enable `Open Live View` in Channel detail and implement the frontend-only
Phase 1 modal that projects the existing `GET /media/now-next` read model, per ADR 0078 and
`docs/channels/live-view/plan-live-view.md`. No backend change.

## What was implemented

- `src/features/media-workspace/publications/now-next.ts`: `fetchNowNext` takes an optional 4th
  `channelId` argument, mapped to the `channel_id` query param. Existing 3-argument callers
  (`NowNextPage`) are unchanged.
- `src/features/media-workspace/channels/live-view-logic.ts` (new): pure helpers —
  `playbackLabel`, `occurrenceHeading` (single Publication vs `Merged loop · N Publications`),
  `relativeTimeLabel` (`as_of`-based "Xs/Xm ago"), `inMinutesLabel` ("in X min"). Covered by
  `live-view-logic.check.mts`, run with `node ...check.mts` — passes.
- `src/features/media-workspace/channels/hooks/use-channel-live.ts` (new): `useChannelLive`.
  `channelId === null` → no fetch, no timer. Polls every 60s while eligible, pauses while the tab
  is hidden (same pattern as `NowNextPage`), exposes `refresh()`. Read-time masking (`channelId ?
  row : null`, etc.) replaces a synchronous `setState` in the effect body for the ineligible
  branch — this repo's ESLint config (`react-hooks/set-state-in-effect`) forbids the latter.
- `src/features/media-workspace/channels/components/LiveViewModal.tsx` (new, 170 lines): the
  dialog. Ineligible (Draft/Inactive/Player-less) states render identity + the explanatory
  sentence and never call the hook with a Channel id. Eligible states render the playback badge,
  Now Playing / Next up (every `merged_loop` member rendered, never one representative), current
  suppression from `current.suppressed.length`, Player status from `channel.player` +
  the filtered Now & Next device row, and a footer link to
  `/media-workspace/publications?q=<channel.name>`. Uses `src/components/ui/lovable/` primitives
  (`Dialog`, `Badge`, `Button`, `Skeleton`) and `globals.css` tokens only; no new dependency.
- `src/features/media-workspace/channels/components/ChannelDetailPanel.tsx`: `Open Live View`
  button is enabled for every lifecycle and opens the modal; `LiveViewModal` is rendered
  unconditionally with `open`/`onClose` state.

## Verification

**Static — done and passing:**

- `node src/features/media-workspace/channels/live-view-logic.check.mts` — all assertions pass.
- `pnpm exec eslint` on all five touched/new files — clean (after fixing the
  `set-state-in-effect` violation above).
- `pnpm exec tsc --noEmit` — 0 errors repo-wide (no route file moved, so no stale
  `.next/dev/types` concern).
- `git diff --check` — clean.

**Browser — done in this session (owner signed in, self-check via browser tool), against local
dev pointed at `CORE_API_URL=http://localhost:3001` (Thunder_Core `develop`, whatever branch was
checked out there). Environment: 6 Channels, all Player health `offline`.**

Verified and passing:

- `channel_id` request shape: `GET /media/now-next?horizon_minutes=180&include_idle=true&channel_id=<id>`
  fired exactly once on modal open for an eligible Channel (Active + Player) — confirmed via
  network panel. Existing 3-argument `horizon_minutes=60` calls (from elsewhere in the app)
  unaffected.
- Manual Refresh — exactly one additional request per click, confirmed via network panel.
- Draft Channel (`zz-uitest-sync-on`, which does have a Player) — modal rendered identity +
  "Live View is available for active Channels with a Player" and made **zero** Now & Next
  requests, confirmed via network panel.
- `not_confirmed` playback badge, single-Publication Now Playing with working detail link,
  `remaining_seconds`-less occurrence, idle state ("Idle — nothing scheduled now"), "Nothing
  scheduled in the next 3h" — all rendered correctly on the two eligible Channels available.
- Nullable Player identity fallbacks: `Resolution: Not reported`, `Last heartbeat: Never connected`
  when the underlying fields are `null` — correct.
- Dialog: Escape closes it; X close button works; focus trap holds (5x Tab stayed inside the
  dialog); `aria-labelledby` resolves to the Channel name.
- Sidebar `Live View` nav item stays disabled, confirming ADR 0078 decision 6 untouched.
- Live 60-second poll: watched the network panel across a real ~68s wait (no manual Refresh) —
  exactly one additional `channel_id` request fired, matching the coded cadence, not just inferred
  from reading `use-channel-live.ts`.
- Closing stops polling: waited 10s past close with no further `channel_id` request.
- Compared both `00.5.1` mockups directly against the implementation: Phase 1 correctly omits the
  `LIVE` badge, per-output status cards, progress bar and uptime, matching plan §0's decision
  table — no new deltas found beyond what the plan already recorded.

**Two real bugs found and fixed during this pass (not present in the static checks):**

1. **Unreadable long-form "Last heartbeat".** `relativeTimeLabel` (built for the *response* `as_of`,
   which is always seconds old) was reused for `device.last_heartbeat_at`, which can be weeks old
   on an offline Player — rendered `38011m ago`. Fixed by reusing the existing
   `formatChannelLastSeen` helper (`channel-logic.ts`, already rolls over to h/d and has a "Never
   connected" null case) instead of inventing parallel logic — this repo already owns that seam.
2. **Focus did not return to the trigger on close.** The `Open Live View` button lives in
   `ChannelDetailPanel`, outside the `Dialog` tree, so it is not a Radix `DialogTrigger` and Radix
   had nothing to restore focus to — `Escape` left focus on `<body>`. Fixed by capturing
   `document.activeElement` when the modal opens and restoring it in `DialogContent`'s
   `onCloseAutoFocus`. Re-verified after the fix: focus lands back on `Open Live View`.

**Still not verified — no fixture / not exercised this pass, reported honestly rather than
claimed:**

- `confirmed` and `stale` playback badges — every eligible Channel in this environment currently
  reads `not_confirmed`; no fixture for the other two states.
- `merged_loop` rendering — queried the raw `now-next` response directly; **no `merged_loop`
  occurrence exists in this environment's data**, exactly the gap the plan anticipated. Per plan
  §4, reported as unverified rather than claimed.
- `current.suppressed.length > 0` — no fixture with a non-empty `suppressed` array was found.
- Player-less (Active, no Player) Channel state specifically — Draft and Inactive were both tested
  (see incident note below), but no Player-less Active Channel existed to test; it shares the same
  `eligible` boolean/code path as Draft/Inactive, so risk is low but it was not individually
  observed.
- Hidden-tab pause (`document.hidden`) specifically — the poll cadence itself was confirmed live
  (above), but backgrounding the tab to confirm the pause was not exercised this pass.

**Inactive state — tested, with an incident.** Used the Edit Channel page's "Deactivate" action on
"Channel for Screen 2" (a Player-attached Channel) to reach a real Inactive state. Confirmed: same
ineligible message as Draft, zero Now & Next requests for that `channel_id` (network panel).

While reverting, discovered `channels-api.ts` has `deactivateChannel` but **no reactivate/activate
client method or button anywhere in the frontend** — Deactivate is a one-way door in this UI.
Reverting required a direct SQL `UPDATE media_core.channels SET status = 'active' WHERE id =
'257b33d9-9936-4791-9dc9-0d017f6ae605'` against the `develop` branch project
(`ftfmokgphewzyxzwjitv`), run via Supabase MCP after showing the exact statement and getting the
owner's explicit go-ahead. Confirmed reverted both in SQL (`RETURNING status = 'active'`) and in
the UI (Channel shows Active again). This was a process mistake on my part — I treated "Deactivate"
as casually reversible without checking for an inverse control first; flagging it here rather than
glossing over it. Whether the missing reactivate path is worth its own ticket is the user's call,
not mine to decide unilaterally.

## Not done in this session

- No commit, no push, no PR — not requested.

## Next steps

1. If/when a `confirmed`/`stale`/merged-loop/suppressed fixture becomes available (e.g. on a
   later `develop` sync), re-open this modal against it — nothing here is expected to fail, but it
   hasn't been seen.
2. Ask Thai vs. English before opening a PR. Given the gaps above are fixture-availability gaps
   (not skipped checks), a PR could reasonably go up as ready rather than Draft — but that call is
   the user's, not mine to make unilaterally.
