# channels

Channel registry for business-facing publishing destinations. A Channel represents one or more equal Physical Devices that receive the same media and schedule; it is not a Device or a substitute for `/media/screens` data. Planning docs: `docs/media-workspace/channels/` (start with `plan-channel-management-ui.md`).

## Implemented routes

- `/media-workspace/channels` — Channel list, operational summary, filters, row actions, and a detail rail. Creating a Channel is the `components/create-wizard/` modal (`CreateChannelModal`: info → setup → review, with player picker and output mapping), opened from this page; there is no separate create route.
- `/media-workspace/channels/[channelId]/edit` — edit editor for an existing Channel (`ChannelEditorPage`), including Groups membership, display structure/config, and Deactivate / Delete-draft actions (`ChannelLifecycleActions`; there is no Activate button by design, per `docs/adr/0037-channel-status-derived-from-publications.md`).
- Channel Groups have their own route and feature: `/media-workspace/channel-groups` (`features/media-workspace/channel-groups`); this feature only reads and sets a Channel's group membership.

## API modules (`services/`)

All calls go through `requestApi` in `@/lib/api/media-api` against Thunder_Core's Media API:

- `channels-api.ts` — `fetchChannels` (`GET /media/channels`), `fetchChannel`, `fetchChannelReferenceData` (`/media/channels/reference-data`), `deleteChannel`, `deactivateChannel`, `fetchChannelGroupOptions` (`GET /media/channel-groups`), `setChannelGroups` (`PUT /media/channels/{id}/groups`), plus the response parsers
- `channel-write-api.ts` — `createChannelV2` (`POST /media/channels`) and `updateChannelV2` (`PATCH /media/channels/{id}`)
- `channel-groups-api.ts` — the Channel Groups count (`GET /media/channel-groups`)
- `player-candidates-api.ts` — Player candidates for the create/edit pickers (`GET /media/channels/player-candidates`)

`channels-api`, `channel-groups-api` and `player-candidates-api` each have a `*-contract.check.mts` that pins the request shape and parsing; `channel-write-api` has none.

## Structure

- `components/` — list, detail rail, editor, lifecycle, groups picker and `create-wizard/` UI.
- `channel-logic.ts` — pure validation, filtering, health, and compatibility logic; `channel-scope.ts`, `list-filtering.ts`, `list-url-state.ts`, `now-playing.ts` and `player-candidates.ts` hold the other pure list/scope helpers.
- `display-config.ts` and `display-structure.ts` — Display arrangement options and the player → screens structure tree; `create-wizard-state.ts` — wizard state.
- `domain.ts`, `types/` — Channel domain types.
- `*.check.mts` — `node:assert` checks for the pure logic; run with `node <file>.check.mts`.
