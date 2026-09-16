# Plan: ticket 07 — All Channels list + detail panel (Core v2)

Executes `tickets/07-fe-channels-list-and-detail.md` incl. its "Deviations … 2026-09-14" table.
Branch: `feat/channel` (base `dev`). Risk: R1 (multi-file reshape, all reversible). One PR at the end.

## Steps

1. **Types + parser** (`types/index.ts`, `services/channels-api.ts`, `services/channels-api-contract.check.mts`)
   - Add `output_kind: 'screen'|'tv'|'kiosk'`, `player: ChannelDevice | null`, `health: 'online'|'warning'|'offline'`,
     `display_config: DisplayConfig | null` (`{mode, arrangement, screens:[{index, resolution, output}]}`).
   - Keep `devices[]` parsed and tolerated; `player` falls back to `devices[0] ?? null` when absent.
   - Extend the contract check with a v2 payload and a legacy payload.
2. **Channel logic** (`channel-logic.ts` + `.check.mts`, `list-filtering.ts` + `.check.mts`, `list-url-state.ts` + `.check.mts`)
   - `summarizeChannels` → `{ total, online, warning, offline }` from `health` (draft without player counts nowhere but total).
   - `channelStatus(channel)` → `'online'|'warning'|'offline'|'no_player'`.
   - `channelTypeLabel(channel)` → Screen / TV / Kiosk / Multi-screen.
   - Filters: `search`, `type`, `status`, `lifecycle` (category removed). Sort keys: name, location, status.
   - URL state keys: `type`, `status`, `lifecycle`, `sort`, `page`.
3. **Now Playing join** (new `now-playing.ts` + `.check.mts` in `channels/`)
   - `indexNowNextByChannel(rows)` → `Map<channelId, NowNextOccurrence | null>`; `nowPlayingLabel(occ)` (first + "+N more", remaining "1h 20m left").
   - `fetchNowNext(60, true)` runs alongside `fetchChannels` and `fetchChannelGroups` in the list page.
4. **List page** (`ChannelsListPage.tsx`, `ChannelSummaryTiles.tsx`, `ChannelFiltersBar.tsx`, `ChannelTable.tsx`, `ChannelsListStates.tsx`)
   - Title "All Channels", subtitle and button "Create Channel" (mockup wording; button still routes to `/channels/create` until ticket 08 replaces it with the wizard modal).
   - Tiles: Total Channels / Online / Warning / Offline / Channel Groups (`StatTile` gains an optional `hint` for the "(86%)" line).
   - Table columns: Channel (thumbnail + name + description) · Type (icon + label) · Status (health dot; "No player") · Location · Groups (chips, "+N") · Now Playing (thumbnail + name + remaining) · Actions ("…" menu: Duplicate disabled, Disable Channel).
   - Sort by dropdown next to search; no category grouping; keep pagination.
5. **Detail panel** (`ChannelDetailPanel.tsx` + new `ChannelStructureTree.tsx`, `display-structure.ts` + `.check.mts`)
   - Cover (current program thumbnail / kind icon), name, lifecycle badge, status pill, description.
   - Buttons: Open Live View (disabled + tooltip), Edit Channel (existing edit route), "…" (Disable).
   - Status: health + "Last updated <updated_at>".
   - Now Playing: names, window (`opens_at – closes_at`, remaining), "via <group>" from `GET /media/publications/{id}` on open, "View Programs →" to `/media-workspace/publications?q=<name>`.
   - Channel Structure: `structureNodes(channel)` → Player node (name, model unknown → code, health) → screens from `display_config.screens` or one node from `expected_resolution` / Player resolution.
   - Groups (N): chips + "Add to Group" / "Manage →" disabled + tooltip.
   - Channel Information: Type, Location, Resolution (canvas + "(N × WxH)" for multi), Created, Last Updated.
6. **Now & Next** (`publications/components/NowNextPage.tsx`): initialise `query` from `?q=`.
7. **Gates**: `tsc`, `eslint`, `node <file>.check.mts` for every touched check, files ≤ 300 lines, no `any`, no `Degraded` anywhere.
8. **Verify** (ask the 3-option question first): list, Type/Status/Lifecycle filters, sort dropdown, open panel for Screen 03 (single node, groups chips "Channel for Screen 3-4"), Now Playing "–" (develop has nothing live), disabled buttons show tooltips. Screenshot per mockup.
9. `.docs/SESSIONLOG-channel-v02-ticket07-fe-channels-list-detail-<date>.md`; commit when told; PR Draft if any verify point is skipped.

## Not in this ticket

Create wizard modal (08), Edit page reshape (09), Channel Groups pages (10), D9 modal (11), Publication group targeting (12), Live View (14), any backend change.
