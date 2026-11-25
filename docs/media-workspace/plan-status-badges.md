# Plan — Media status badges (ADR 0125)

Implements [ADR 0125](../adr/0125-media-status-badges-use-one-vocabulary-and-one-colour-map.md).
Closes #462, the status half of #457, and ClickUp 1009. Frontend only; no Core change, no migration.
Branch `fix/462-media-status-badges` from `dev` @ d8736869.

Read ADR 0125 first. It is the spec; this plan only lists where to apply it.

## 1. One module

Create `src/features/media-workspace/media-status.ts` and `media-status.check.mts` next to it.

- `MEDIA_STATUS`: a record keyed by state, with `{ label, color: BadgeColor }` for each, taken from the
  ADR 0125 table. The states are `active`, `live`, `online`, `ready`, `scheduled`, `publishing`,
  `processing`, `warning`, `failed`, `offline`, `draft`, `inactive`, `ended`, `archived`, `expired` and
  `no_player`. The labels are Title Case English (`No player` for `no_player`).
- `mediaStatus(state: string)`: the entry for that state. An unknown state falls back to neutral
  `zinc`, with the raw value as its label. Backend values are not under our control, so this must
  never throw.
- The check asserts the tone of every state against the ADR table, plus the unknown-state fallback.
  Run it with `node <file>.check.mts`, in the same style as the other `*.check.mts` files (plain
  `node:assert`, no test runner).

## 2. Callers (ADR 0125 decision 7)

Each caller takes its label and colour from `mediaStatus()`. Keep each page's badge **shape**
(dot / pill / size classes) as it is now; change only the label and colour. `BadgeColor` and the
`Badge` props are in `src/components/ui/Badge.tsx`. Read them before editing.

| Area | Files |
|---|---|
| Playlist | `playlists/status-display.ts` (`playlistDisplayStatus` returns only `draft` or `active`; a non-draft status is always `active`; `statusBadge` delegates), `PlaylistsTable.tsx`, `PlaylistsGrid.tsx`, `PlaylistSidePanel.tsx`, `PlaylistEditorHeader.tsx` (stop using `StatusBadge`), `publications/components/PlaylistPickerModal.tsx` |
| Playlist editor state | `playlists/components/usePlaylistEditorRow.ts:114-115`: after activate, the state becomes `active`. Fix the comment that cites ADR 0028 so it cites ADR 0125. |
| Playlist filters | Remove the Inactive option from `PlaylistsFilters.tsx` and `PlaylistPickerModal.tsx`. Then fix the URL-state and filtering helpers and their checks (`list-url-state`, `list-filtering`, `publications/playlist-picker-filter.ts`), so that an old `?status=inactive` URL falls back to "all" and does not match nothing. |
| In-use tag | Wherever the playlist badge shows (table, grid, side panel, editor header, picker), add the neutral `Tag` from `src/components/ui/Tag.tsx` reading `ใช้ใน {n} Program`, only when `in_use_count > 0`. Show no tag when the count is 0 or missing. |
| Layout | `compositions/status-display.ts` (`statusBadge` delegates), `CompositionsTable.tsx`, `CompositionEditorHeader.tsx` (its local `statusVariant`) |
| Template | `layouts/status-display.ts` (`statusBadge` delegates) |
| Program | `publications/components/PublicationsTable.tsx` (`BADGE_VARIANT`), `edit/ProgramEditRail.tsx` (`STATUS_VARIANT`), `edit/ProgramBreadcrumb.tsx`, `PublicationDetailPage.tsx:181-198,346-349` (badge and subtitle show `display_status`; behaviour gates keep reading stored `detail.status`), `playlists/components/PlaylistPanelTabs.tsx:170-191` |
| Program helper | `publications/publication-status.ts`: remove `publicationStatusColor` and `publicationDisplayStatus` once nothing calls them. Keep `isPastPublication`. Update `publication-status.check.mts`. |
| Asset | `assets/media-detail-rename.tsx:43`; `publications/components/MediaPickerModal.tsx:44` (`ready` → "Ready"; colour from the module; the status filter option label at line 19 also becomes "Ready") |
| Channel / Group | `channels/components/ChannelTable.tsx`, `EditChannelSidebar.tsx`, `ChannelDetailPanel.tsx` (`STATUS_BADGE`), `ChannelStructureTree.tsx` (`HEALTH_COLOR`), `channel-groups/components/ChannelGroupsTable.tsx`, `ChannelGroupInspector.tsx`, `UngroupedChannelsTable.tsx`. Channel Group `disabled` maps to `inactive`. |

## 3. Delete (ADR 0125 decision 8)

- Remove `StatusBadge` and `statusMap` from `src/components/ui/Badge.tsx`.
- Remove the `StatusBadge` re-export from `components/ui/lovable/core.tsx`.
- Remove the `StatusBadge` cases from `Badge.check.mts`, and keep its other assertions.
- Run `grep -rn StatusBadge src`. The only remaining hits may be Asset Workspace's own component
  (`asset-workspace/components/StatusBadges.tsx`), which is not the shared one. Do not touch it.

## Stop and report instead of deciding

- A Program surface whose data has no `display_status`, for example a `PlaylistPanelTabs` row type
  without the field. That needs a Core change.
- A state on screen that is not in the ADR table. `ChannelDetailPanel`'s `LIFECYCLE_BADGE` is the
  likely case: report its values, and leave it unchanged.
- Any file that would pass 300 lines.

## Checks to run

1. `npx tsc --noEmit` (if it is suspiciously clean, run `rm -rf .next/dev/types` first)
2. `npx eslint` on every changed file
3. `node` on every touched or new `*.check.mts`, plus `node src/design-system/design-system.check.mts`

Never commit, push or touch the database. Rules: no raw palette classes, hex literals or new `dark:`
variants; no `any`; no dead code; match the surrounding JSX style (AGENTS.md).
