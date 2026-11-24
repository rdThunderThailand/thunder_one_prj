# Media Workspace page headers

Owner request: align the Channels heading with Media Library and the other Media pages; use English page subtitles.

## Scope

- Follow ADR 0075: full-shell pages publish title and subtitle through the existing PageHeader into the Topbar. Keep actions and breadcrumbs in the content area.
- Align Channels, Channel Groups, Player release pages, upload, channel edit and program create/detail with the existing library/list pages. Preserve the focus-shell editors in ADR 0077.
- Translate the two remaining static Thai page subtitles (Programs and Create Publication) into English. Leave user content and section/body copy unchanged.
- Remove the vacated Channel Groups header grid row so summary and detail columns retain their layout.

## Verification

Run TypeScript, targeted lint, theme and editor route checks. Inspect desktop/mobile page titles, subtitle styling, single-H1 placement, page actions and navigation on the preview. Browser verification is owner-approved for this round.
