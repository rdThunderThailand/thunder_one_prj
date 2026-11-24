# Platform components

Shared by every Workspace. Sizes in px. Colors come from `tokens.json`, never inline.
Source: Figma "Rev.2 - Media Workspace", approved screen "1920w light" (node 2019:3868), the first screen built on this system.
Workspace-specific components (e.g. Media's alert row, channel tiles) live in `workspaces/<key>.md`.

## Buttons
| Variant | Spec |
|---|---|
| Primary | height 32–35, padding-x 12–13, icon 14 at left + 8 gap, optional 12px chevron for a dropdown ("Create ▾"). Figma instance: `Default Button`. |
| Secondary / Ghost | height 32, same padding, subtle border. Figma instance: `Button`. |
| Icon button | 36×36, icon 16 centered, `aria-label` required. Notification variant has an 8px dot at top-right (x22, y6). |
| Link button | text 12, trailing 12px arrow icon, 4px gap. Used as "View all … →" in card headers. |
| Action tile | full-width button, height 58, padding 13, 32px icon container (icon 16) + label 12 at 12px gap. 2-column grid, gap 8. |

## Segmented control (filter tabs)
Container height 35, padding 4, track `bg.primary-strong`. Active segment height 27, padding-x 12, surface bg + shadow. Inactive = text only.

## Search
Header search: 448×36, 16px search icon at x12, placeholder at x37 ("Search anything…"), keyboard hint pill `⌘ K` (h 19.5) right-aligned 8px inset.
In-page search uses the same input style at `h-control` (32).

## Stat card
Label (H2 style) top-left; value (`kpi-value` type) below; 32×32 icon container top-right (icon 16, tinted by status only when the stat *is* a status); caption bottom-left. Optional sparkline bottom-right.
Workspaces set the exact size and row layout in their profile.

## Status badge / pill
- Status pill: height 16, padding-x 6, 6px dot + text 9–10, `status.*` + `status.*-bg`.
- Count badge (nav): height ~15, padding-x 6.

## Tag (taxonomy)
Bordered pill, height 18, padding-x 9, text 9, `surface.default` + `border.default` + `text.secondary`.
Use for categories and types (channel type, content type, workspace). Never tint a tag with a status color (DS-04).

## List row
Height 43–57, 1px bottom border. Optional 24–28px tinted icon container (icon 14) → title 12 + subtitle 11 muted → right-aligned meta (time, tag, action).

## User block
32 avatar with initials → name 12 + role 10 muted.

## Side panel / drawer
Desktop: right-side drawer that keeps the page behind it usable. Tablet: overlay. Mobile: full-screen surface with a clear close/back.
Header: title + close icon button. Body padding 20.

## Loading, empty, error (DS-11)
| State | Spec |
|---|---|
| Loading | Skeleton blocks in the shape of the final content. No spinner-only pages, no "No results" text while loading. |
| Empty / no results | Icon + one line of text + one primary next step (create, search again, browse). |
| Error / unavailable | One line saying what failed + Retry. Add Back or an escape route where the user could be stuck. Never block the rest of the page. |

## Icons
`@ant-design/icons` only. See `icons.md`. Sizes: 12 link arrows, 14 inline rows, 16 nav/buttons/header, 20 tiles.
