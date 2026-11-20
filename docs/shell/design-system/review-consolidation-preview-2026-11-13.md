# Hosted consolidation preview review

PR: https://github.com/rdThunderThailand/thunder_one_prj/pull/387
Initial review head: b2ecfbf280303037d4f68e8f20d8e8706c634d75. Base:dev.
Owner-approved follow-up head:8ccf5bbfe85519b3d33a9634d5c4230ea11bab44, verified2026-11-14. PR remains Draft.
Preview: https://thunder-one-git-claude-blissf-e47403-thunders-projects-3dff0238.vercel.app
Date:2026-11-13 Asia/Bangkok. In-app Chromium, viewport emulation, not hardware.

Owner completed Vercel access and ThunderOne login handoffs. Hosted GET
`/api/proxy/__config` reports `https://thundercoredev.vercel.app/`, hasKey=true.
No key value was read. This identifies the configured host, not database isolation.
All tests were reads or local UI changes; no save/create/upload/publish/delete,
password change, account/tenant/language update or sign-out was performed.

## Observed results

| Page |320px|390px|768px|1440px|
|---|---|---|---|---|
| Media overview |doc/main320/320|390/390|768/544|1440/1216|
| People overview |320/320|390/390|768/544|1440/1216|
| Thunder Care landing |320/320|390/390|768/544|1440/1216|
| Asset Intelligence landing |320/330|390/390|768/544|1440/1216|

Heights844px on phones,1000px at768/1440. Main clientWidth equals main scrollWidth
except Asset Intelligence320px. These values are read from actual DOM, not inferred
from the requested viewport. Screenshots inspected at1440/390. Temporary viewport
settings were reset on temporary tabs; testing tabs closed and one normal1280×720
preview tab retained. A fresh320px Asset tab reconfirmed main330px and exact offender.

- Auth login at1280×720 and390×844: input32px/radius12px, submit32px/font14px,
  no document overflow; no submit. Owner's login itself is not an agent Auth-flow test.
- Thunder Care status labels compute10px.
- Mobile Media drawer opens, Shift+Tab stays within dialog to last navigation link,
  Escape closes and restores Open navigation focus.
- Channel Groups manual Tabs activate Ungrouped Channels with Enter.
- Channel scope Groups/search shows Nothing matches for a synthetic query. Cancel
  restores All Channels focus without applying. Settled mobile input32px, icon center
  offset0px. An earlier measurement during popup animation was discarded.
- Create Group→Add More Channels opens a nested Modal. At390px both outer dialogs
  fit16..374 horizontally and within viewport height. Escape closes only child and
  restores Add More Channels focus; parent Cancel closes and restores Create Group.
  No field submission or membership write. Child content overflow is noted below.
- Newly merged Player releases loads its list; search filters to no results and
  resets. New release compound Dialog opens atdesktop/mobile; Escape restores New
  release focus. No files selected/uploaded and no release action performed.

## Findings on the initial preview (fixed in the approved follow-up below)

**HP-01 · observed defect · medium:** Asset Intelligence header controls overflow at
320px. Main scrollWidth330px; exact controls row right330.156px. It uses native
settings button in `AssetAdminDashboardHeader.tsx:17` with `flex shrink-0 ... gap-3`,
no wrapping. Independent source review: whole dashboard subtree unchanged vs origin/dev,
and this button does not use the consolidated Button/Input. Smallest follow-up: wrap
that controls row and allow shrinking. At390px and wider tested widths it fits.

**HP-02 · observed defect · medium:** Manage Channels picker has inner content extending
right of its correctly sized390px dialog. `CreateGroupChannelsModal.tsx:118` has an
implicit auto grid track and sections without min-w-0; native search inputs and long
rows can widen it. Child layout is unchanged vs origin/dev, except Cancel tone migration;
Modal outer width calc(100%-2rem) and inner p-5 match the old native Modal. Independent
source review supports an existing intrinsic-width constraint, not a shared Modal width
regression. No baseline browser deployment comparison was run. Smallest proposed fix:
explicit grid-cols-1 with existing lg:grid-cols-2, min-w-0 on both sections, then recheck.

These defects are documented separately rather than silently expanded into source fixes.
No new consolidation regression was established in the sampled flows. This is not a
whole-page/mobile pass for Asset320px or Manage Channels inner content.

## Blocked and unchecked

`/asset-workspace` returns404 on this deployment. Source has a
NEXT_PUBLIC_ASSET_WORKSPACE_MVP gate; result is consistent with that gate being off,
but its deployed flag value was not independently read. No environment setting changed.
The reachable Asset Intelligence dashboard is an additional surface, not proof of
Asset Workspace workflow coverage.

No physical mobile, screen reader, all editors/importers, real Auth error/submit,
backend mutation/error/success, Player update/download operations or schedule editing
was exercised. Existing local checks and Vercel build are distinct from browser checks.
No merge into dev or readiness change performed; post-merge dev verification remains pending.

## Evidence

- [media-1440](/Users/arty/.codex/visualizations/2026/11/13/01a1d440-a52f-7740-8f8c-e2036924ec23/pr387-media-1440.jpg)
- [media-390](/Users/arty/.codex/visualizations/2026/11/13/01a1d440-a52f-7740-8f8c-e2036924ec23/pr387-media-390.jpg)
- [people-1440](/Users/arty/.codex/visualizations/2026/11/13/01a1d440-a52f-7740-8f8c-e2036924ec23/pr387-people-1440.jpg)
- [people-390](/Users/arty/.codex/visualizations/2026/11/13/01a1d440-a52f-7740-8f8c-e2036924ec23/pr387-people-390.jpg)
- [care-1440](/Users/arty/.codex/visualizations/2026/11/13/01a1d440-a52f-7740-8f8c-e2036924ec23/pr387-care-1440.jpg)
- [care-390](/Users/arty/.codex/visualizations/2026/11/13/01a1d440-a52f-7740-8f8c-e2036924ec23/pr387-care-390.jpg)
- [asset-intelligence-1440](/Users/arty/.codex/visualizations/2026/11/13/01a1d440-a52f-7740-8f8c-e2036924ec23/pr387-asset-intelligence-1440.jpg)
- [asset-intelligence-390](/Users/arty/.codex/visualizations/2026/11/13/01a1d440-a52f-7740-8f8c-e2036924ec23/pr387-asset-intelligence-390.jpg)
- [asset-intelligence-320](/Users/arty/.codex/visualizations/2026/11/13/01a1d440-a52f-7740-8f8c-e2036924ec23/pr387-asset-intelligence-320.jpg)
- [asset-workspace-404](/Users/arty/.codex/visualizations/2026/11/13/01a1d440-a52f-7740-8f8c-e2036924ec23/pr387-asset-workspace-404.jpg)
- [auth-hosted-desktop](/Users/arty/.codex/visualizations/2026/11/13/01a1d440-a52f-7740-8f8c-e2036924ec23/pr387-auth-hosted-desktop.jpg)
- [auth-hosted-mobile](/Users/arty/.codex/visualizations/2026/11/13/01a1d440-a52f-7740-8f8c-e2036924ec23/pr387-auth-hosted-mobile.jpg)
- [modal-nested-mobile](/Users/arty/.codex/visualizations/2026/11/13/01a1d440-a52f-7740-8f8c-e2036924ec23/pr387-modal-nested-mobile.jpg)
- [new-release-mobile](/Users/arty/.codex/visualizations/2026/11/13/01a1d440-a52f-7740-8f8c-e2036924ec23/pr387-new-release-mobile.jpg)

- [Raw hosted viewport measurements](/Users/arty/.codex/visualizations/2026/11/13/01a1d440-a52f-7740-8f8c-e2036924ec23/pr387-hosted-measurements.json)

## Owner-approved follow-up —2026-11-14

Owner explicitly approved both existing responsive fixes in PR387. Commit8ccf5bbf
changes four CSS class lines across two files, with no state/handler/data changes.
Typecheck, targeted ESLint and whitespace checks pass; independent diff review:ship.
Vercel build and Preview Comments pass for8ccf5bbf, deployment7771256577.

Hosted DOM confirms new Asset flex-wrap controls. Asset main/document now fit320/390/
768/1440px; at320px the prior330px main scrollWidth is320px. Desktop header appearance
retained in screenshot inspection.

Manage Channels checked at1440/390/320/768px. Dialog client/scrollWidth pairs are
1152/1152,358/358,288/288,736/736; both section scrollWidths equal their clientWidths.
Grid remains two547px columns on1440px desktop and one track atphone/tablet widths.
Search returns No available channels and resets. One channel was checked only in the
local draft: available7/selected1; sections remain314/314px at390px. Escape discards
unsaved child draft and returnsfocus to Add More Channels; parent Cancel returnsfocus
to Create Group. Save Selection/Create Group were never submitted. No server write.
Viewport override reset after tests. Physical devices/Asset Workspace gate remain limits.

- [asset-320](/Users/arty/.codex/visualizations/2026/11/13/01a1d440-a52f-7740-8f8c-e2036924ec23/pr387-fixed-asset-320.jpg)
- [asset-1440](/Users/arty/.codex/visualizations/2026/11/13/01a1d440-a52f-7740-8f8c-e2036924ec23/pr387-fixed-asset-1440.jpg)
- [manage-channels-390](/Users/arty/.codex/visualizations/2026/11/13/01a1d440-a52f-7740-8f8c-e2036924ec23/pr387-fixed-manage-channels-390.jpg)
- [manage-channels-1440](/Users/arty/.codex/visualizations/2026/11/13/01a1d440-a52f-7740-8f8c-e2036924ec23/pr387-fixed-manage-channels-1440.jpg)

- [Follow-up measurements](/Users/arty/.codex/visualizations/2026/11/13/01a1d440-a52f-7740-8f8c-e2036924ec23/pr387-mobile-fix-measurements.json)
