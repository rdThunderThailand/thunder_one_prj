# SESSIONLOG — Channel v02 ticket 11: FE — Manage Groups from a Channel (D9)

Date: 2026-09-15
Branch: `feat/channel` (uncommitted — part of the running tickets 07-12 batch, commit deferred)

## Ticket

`docs/channels/v02/tickets/11-fe-manage-groups-from-channel.md`, GitHub #109. Blocked by
ticket 10 (done). D9 mockup: `docs/channels/v02/design/00.4 - Mange Group Channel Modal.png`.
ADR: `docs/adr/0074-channel-one-player-and-channel-group.md` §5.

## What was built

- `src/features/media-workspace/channels/components/ChannelGroupsPickerModal.tsx` (new) — D9
  modal: search box, checklist of every Channel Group (name + playback mode), Cancel/Save,
  replace-the-whole-set semantics. Modeled on ticket 10's `ManageChannelsModal.tsx` (D16, the
  mirror side of this many-to-many).
- `src/features/media-workspace/channels/services/channels-api.ts`:
  - `fetchChannelGroupOptions()` — `GET /media/channel-groups`, parsed down to
    `ChannelGroupSummary[]` (id/name/playback_mode; the type ticket 07 already put on
    `ChannelListItem.groups`).
  - `setChannelGroups(id, groupIds)` — `PUT /media/channels/[id]/groups`
    (`media_channel_set_groups`), parsed with the existing `parseChannelDetail` since the RPC
    returns a full `channel_rows(...)[0]` (includes `created_at`).
  - `isChannelGroupSyncConflict(message)` — matches the RPC's two conflict-error phrasings
    ("already in another synchronized group" pre-check violation, "only one synchronized group"
    unique-index race) the same way ticket 10's `isSyncConflict` does for the other side.
  - `ChannelRequestMethod` gained `"PUT"`.
- Wired the modal into both places the ticket named:
  - `ChannelDetailPanel.tsx` (D1's detail panel) — "Manage →" next to the Groups section, was
    `disabled title="Manage Groups — not available yet"`.
  - `EditChannelSidebar.tsx` (the Edit Channel page's right rail) — same button, same pattern.
  Both reuse the page's existing `onChanged(updated)` callback, so the Channel list state (and
  therefore the table's Groups column) update from the same round trip — no extra fetch, no
  reload.

## Verified in browser (asked first, per CLAUDE.md §3 — user chose "run it yourself")

Against the live dev server (`:3000` → Core v2 at `:3001`, `develop` Supabase branch), logged in
as `piyapat@thunder.co.th`:

1. Opened "Channel for Screen 1" (no groups) from All Channels, clicked Manage → in the detail
   panel. Modal showed search box, one existing Group ("Channel for Screen 3-4", Synchronized),
   Cancel/Save.
2. Checked it, Save → modal closed, detail panel's "GROUPS (1)" chip and the table's GROUPS
   column both updated immediately, no reload.
3. Created a second Synchronized test group (`zz-uitest-sync-group-2`) via the Channel Groups
   page to exercise the conflict path.
4. Reopened Manage Groups on the same channel, checked the second synchronized group too, Save
   → inline error rendered verbatim: "A channel can only belong to one synchronized Group at a
   time. Remove it from the other Group first." Groups stayed at the pre-save state (no partial
   write visible in the UI).
5. Confirmed the same modal opens and works from the Edit Channel page's `EditChannelSidebar`.
6. Cleanup: unchecked the group again (Save → "GROUPS (0)"), deleted the test group. Dev data
   back to its pre-session state (1 group, "Channel for Screen 1" ungrouped).

`tsc --noEmit` and `eslint` clean on every touched/new file (see below); repo-wide `tsc` still
carries its pre-existing baseline count, untouched by this ticket.

## Deviations from the mockup (ponytail — not asked for, so not built)

- No "All Groups" filter dropdown next to search (mockup has one) — ticket's closing conditions
  only ask for "search, checklist, save."
- No "+ Create Channel Group" shortcut inside the modal — Channel Groups already has its own
  Create flow (ticket 10); duplicating the entry point wasn't requested.

## Files touched

- `src/features/media-workspace/channels/components/ChannelGroupsPickerModal.tsx` (new)
- `src/features/media-workspace/channels/components/ChannelDetailPanel.tsx`
- `src/features/media-workspace/channels/components/EditChannelSidebar.tsx`
- `src/features/media-workspace/channels/services/channels-api.ts`

## Next

Ticket 12, per the standing instruction for this batch (no per-ticket commit/PR pause).
