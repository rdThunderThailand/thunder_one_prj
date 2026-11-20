# Shared UI consolidation regression review

Date: 2026-11-13. Scope: owner-approved Badge/Tag10px default and regression-only
review of Media, People, Thunder Care, Asset and Auth main pages, desktop/mobile.

Follow-up: the owner separately authorized mobile shell repair; see [the later review](review-mobile-workspace-shell-2026-11-13.md). Existing-defect findings below describe the before-state.

## Environment and method

Target: `.claude/worktrees/blissful-bell-79b0e6`, local branch `claude/blissful-bell-79b0e6`.
Port3187 process/cwd was mapped to this worktree before review. Browser: in-app Chromium,
existing super-administrator session, Thunder Enterprise Master. Desktop1440×1000 and
mobile viewport390×844; viewport override reset afterward. Mobile is emulation, not hardware.

Used the house thunderone-ui core and Media profile; Asset retains ADR0098. People,
Thunder Care and Auth use core rules without borrowing Media domain mappings. Guidance:
ux-audit, targeted UIUX keyboard/focus query and the current
[Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md).
The review sampled layout, text, controls and safe navigation; no broad accessibility conformance claim.

Backend data may be production. All actions were reads or local UI state. No sign-in submission,
save, create, upload, publish, delete, sign-out, tenant change or permission change occurred.

## Fixed and verified

**RG-01 · observed defect · low severity:** Channel scope search icon was2px below input
center after consolidated Input changed36px (`h-9` at HEAD) to32px. The wrapper kept
`top-2.5` with a16px icon. Source: `src/features/media-workspace/channels/components/ChannelScopePicker.tsx:107`.
Use `top-1/2 -translate-y-1/2` so positioning follows the input height. This preserves
search, scope selection and Apply/Cancel semantics. All three consumers were identified:
CalendarToolbar, PlaybackProofToolbar and NowNextPage.

Live `/media-workspace/now-next`: icon center offset2px before,0px after at1440px,
and0px after at390px; input stays32px. Opened scope, activated Groups with Enter,
searched a synthetic nonmatching string, observed Nothing matches, then Cancel; focus
returned to All Channels and no scope was applied. Reopened/cancelled at390px.
Calendar and Playback Proof hosts were not individually revisited this round.

**Approved change, not a regression:** ADR0111 sets Badge dot/pill/legacy tone defaults,
Tag and StatusBadge to existing `text-2xs`10px. Explicit caller sizes remain authoritative.
Thunder Care main-page status labels compute to10px. No status colors/maps or other typography changed.
Badge check failed against the old12px default, then passed after implementation.

## Page coverage and existing defects

| Page/state | Desktop1440×1000 | Mobile390×844 |
|---|---|---|
| `/media-workspace` overview, populated/empty cards and actions | Visually inspected, no new regression identified | Fixed224px sidebar constrains content; document width410px |
| `/people` overview, stats/activity/chart/action areas | Visually inspected, no new regression identified | Sidebar and header constrain content; document width679px |
| `/thunder-care/work-orders` landing, next job/statuses/disabled actions | Visually inspected;10px statuses confirmed | Sidebar/content overflow; document width679px |
| `/asset-workspace` overview | Placeholder renders | Placeholder constrained by shell; document width679px |
| `/asset-workspace/assets` | Not built yet placeholder observed | No real table/form available to exercise |
| `/login` empty form | Inputs32px/radius12px; labels/button visible | Fits390px with no horizontal document overflow |

**RG-02 · observed defect · high impact on mobile · pre-existing, unchanged:**
The224px sidebar remains visible below768px, squeezing main content. People/Care/Asset
also retain the default header's intrinsic search/user-menu width. Source review compared
owning shell/header files with HEAD: no differences in dashboard layout, Sidebar,
Topbar, GlobalSearch, UserMenu or Media sidebar. Sidebar `shrink-0 w-56` lacks a mobile
breakpoint; default header native controls do not inherit the consolidated Button/Badge.
These are existing responsive limitations, not grounds for a consolidation regression fix.
The exact document widths above are live measurements, not baseline-render comparisons.
Recommended separate task: responsive shell/drawer and header adaptation, after owner approval.
No mobile whole-page pass is claimed for the four workspace shells.

## Evidence

Screenshots are local artifacts, not repository source:
- [media-desktop](/Users/arty/.codex/visualizations/2026/11/13/01a1d440-a52f-7740-8f8c-e2036924ec23/regression-media-desktop.jpg)
- [media-mobile](/Users/arty/.codex/visualizations/2026/11/13/01a1d440-a52f-7740-8f8c-e2036924ec23/regression-media-mobile.jpg)
- [people-desktop](/Users/arty/.codex/visualizations/2026/11/13/01a1d440-a52f-7740-8f8c-e2036924ec23/regression-people-desktop.jpg)
- [people-mobile](/Users/arty/.codex/visualizations/2026/11/13/01a1d440-a52f-7740-8f8c-e2036924ec23/regression-people-mobile.jpg)
- [care-desktop](/Users/arty/.codex/visualizations/2026/11/13/01a1d440-a52f-7740-8f8c-e2036924ec23/regression-care-desktop.jpg)
- [care-mobile](/Users/arty/.codex/visualizations/2026/11/13/01a1d440-a52f-7740-8f8c-e2036924ec23/regression-care-mobile.jpg)
- [asset-desktop](/Users/arty/.codex/visualizations/2026/11/13/01a1d440-a52f-7740-8f8c-e2036924ec23/regression-asset-desktop.jpg)
- [asset-mobile](/Users/arty/.codex/visualizations/2026/11/13/01a1d440-a52f-7740-8f8c-e2036924ec23/regression-asset-mobile.jpg)
- [auth-desktop](/Users/arty/.codex/visualizations/2026/11/13/01a1d440-a52f-7740-8f8c-e2036924ec23/regression-auth-desktop.jpg)
- [auth-mobile](/Users/arty/.codex/visualizations/2026/11/13/01a1d440-a52f-7740-8f8c-e2036924ec23/regression-auth-mobile.jpg)
- [scope-before](/Users/arty/.codex/visualizations/2026/11/13/01a1d440-a52f-7740-8f8c-e2036924ec23/regression-scope-before.jpg)
- [scope-after-desktop](/Users/arty/.codex/visualizations/2026/11/13/01a1d440-a52f-7740-8f8c-e2036924ec23/regression-scope-after-desktop.jpg)
- [scope-after-mobile](/Users/arty/.codex/visualizations/2026/11/13/01a1d440-a52f-7740-8f8c-e2036924ec23/regression-scope-after-mobile.jpg)

## Checks and remaining coverage

Passed: shared-ui.check.mts, Tabs.check.mts, Modal.check.mts, Badge.check.mts,
Button.check.mts, design-system.check.mts, tsc --noEmit, and ESLint of Badge.tsx,
Badge.check.mts and ChannelScopePicker.tsx. No dependency/theme/vendored skill changes.

No changed item is awaiting verification. Existing mobile shell repair is outside this
regression-only authorization. Asset list/form workflows are blocked by placeholder routes
in this worktree. Real Auth submit, backend mutation/error/success paths, every importer,
all breakpoints, real mobile keyboard/touch behavior, screen-reader operation and production
build were not checked. Earlier family evidence remains historical, not new coverage here.
No commit, push, deploy or component sync was performed.
