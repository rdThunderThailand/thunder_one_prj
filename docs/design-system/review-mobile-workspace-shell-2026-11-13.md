# Mobile workspace shell repair

Date:2026-11-13. Scope: owner continued with responsive shell repair for Media,
People,Thunder Care and Asset after the consolidation regression review. Browser
verification was explicitly selected for this round. All work remains local in
`.claude/worktrees/blissful-bell-79b0e6` on `claude/blissful-bell-79b0e6`, server3187.

## Cause and repair

The previous review reproduced224px sidebar persistence and wide default header
controls at390px (Media document410px; other workspace shells679px). The sidebar
had no mobile breakpoint. This was an existing shell issue, separately authorized now.

- `MobileNavigation` reuses canonical Dialog and Button with existing Sidebar content.
  Below768px the sidebar is a modal drawer with accessible trigger/title/close control,
  focus containment and restore; desktop keeps the original rail/collapse behavior.
- Drawer closes on route change, same-route links and desktop breakpoint transition.
  Guarded route-state reset prevents browser Back from reopening an old drawer.
  The media-query listener is removed on unmount. Desktop/mobile Sidebar instances
  retain existing domain menus and tenant permissions; the drawer mounts only while open.
- Header uses icon search and avatar account access on narrow screens. Full Media
  search/date appear at1280px; account details at1024px; language keeps its existing
 640px visibility threshold. Default search label truncates at tablet width.
  Help/notifications/account remain header utilities. No utility action was submitted.
- Mobile main padding16px, desktop24px retained. People action row wraps at320px.
  Media lower overview uses an explicit zero-minimum single grid track, preventing
  intrinsic content from widening the implicit column. Thunder Care job rows stack
  below640px so task titles do not collapse between fixed time/status/distance columns.
- Media editor routes retain the desktop focus shell; mobile adds only navigation
  access above the editor. Editor workflows were not exercised in this round.

## Browser evidence

In-app Chromium, authenticated super administrator in Thunder Enterprise Master.
Viewport emulation, not physical mobile hardware. Read-only app data and local UI state;
no save/create/upload/publish/delete/sign-out/language or tenant change occurred.

| Main route |320×844|390×844|768×1000|1440×1000|
|---|---|---|---|---|
| `/media-workspace` |doc/main320/320|390/390|768/544|1440/1216|
| `/people` |320/320|390/390|768/544|1440/1216|
| `/thunder-care/work-orders` |320/320|390/390|768/544|1440/1216|
| `/asset-workspace` |320/320|390/390|768/544|1440/1216|

Values are document scrollWidth / main scrollWidth. Main clientWidth equals its
scrollWidth for all16 samples: no horizontal document or main overflow. Sidebar is
absent from mobile layout and224px on desktop/tablet. After restoring the language
control's original threshold, the shared default header was rechecked on People768px,
and Media768px was rechecked visually and by document bounds. Desktop1440px screenshots
were inspected for Media,People,Care; Asset remains an unchanged placeholder body.

Interactions checked:

- Drawer open at390px and320px; Media/People/Care/Asset domain menus present.
- Media Shift+Tab from close wraps to last navigation link, then Tab returns to close.
  Escape and explicit close return focus to Open navigation. Visible focus captured.
- Same-route Overview link closes; Asset→Assets link navigates and closes.
  Browser Back while open followed by Forward leaves drawer closed.
- Open drawer→768px→390px leaves drawer closed; no modal overlay remains.
- Desktop Media sidebar collapses224→64px and expands; mobile remains full drawer.
- Both default and Media header search open the search dialog; Escape closes and
  restores trigger focus. Account menu opens and closes with Escape; no account action.
- Lower Media cards and stacked Thunder Care job titles were inspected after scrolling.
  Temporary viewport override reset after verification.

## Artifacts

- [media-390](/Users/arty/.codex/visualizations/2026/11/13/01a1d440-a52f-7740-8f8c-e2036924ec23/mobile-shell-media-390.jpg)
- [people-390](/Users/arty/.codex/visualizations/2026/11/13/01a1d440-a52f-7740-8f8c-e2036924ec23/mobile-shell-people-390.jpg)
- [care-390](/Users/arty/.codex/visualizations/2026/11/13/01a1d440-a52f-7740-8f8c-e2036924ec23/mobile-shell-care-390.jpg)
- [asset-390](/Users/arty/.codex/visualizations/2026/11/13/01a1d440-a52f-7740-8f8c-e2036924ec23/mobile-shell-asset-390.jpg)
- [drawer](/Users/arty/.codex/visualizations/2026/11/13/01a1d440-a52f-7740-8f8c-e2036924ec23/mobile-shell-drawer.jpg)
- [media-lower](/Users/arty/.codex/visualizations/2026/11/13/01a1d440-a52f-7740-8f8c-e2036924ec23/mobile-shell-media-lower.jpg)
- [care-jobs-320](/Users/arty/.codex/visualizations/2026/11/13/01a1d440-a52f-7740-8f8c-e2036924ec23/mobile-shell-care-jobs-320.jpg)
- [media-768](/Users/arty/.codex/visualizations/2026/11/13/01a1d440-a52f-7740-8f8c-e2036924ec23/mobile-shell-media-768.jpg)
- [media-1440](/Users/arty/.codex/visualizations/2026/11/13/01a1d440-a52f-7740-8f8c-e2036924ec23/mobile-shell-media-1440.jpg)
- [people-1440](/Users/arty/.codex/visualizations/2026/11/13/01a1d440-a52f-7740-8f8c-e2036924ec23/mobile-shell-people-1440.jpg)
- [care-1440](/Users/arty/.codex/visualizations/2026/11/13/01a1d440-a52f-7740-8f8c-e2036924ec23/mobile-shell-care-1440.jpg)
- [asset-1440](/Users/arty/.codex/visualizations/2026/11/13/01a1d440-a52f-7740-8f8c-e2036924ec23/mobile-shell-asset-1440.jpg)

- [Measured viewport matrix](/Users/arty/.codex/visualizations/2026/11/13/01a1d440-a52f-7740-8f8c-e2036924ec23/mobile-shell-measurements.json)

Before-state screenshots remain in the preceding component regression review.

## Checks and review

Passed: MobileNavigation.check.mts, shared-ui.check.mts, Tabs.check.mts,
Modal.check.mts, Badge.check.mts, Button.check.mts, design-system.check.mts,
`tsc --noEmit`, targeted ESLint of all changed shell/page/check files, `git diff --check`.
An initial concurrent typecheck saw a transient unsupported named registerHooks import
in the new check; the check uses createRequire like existing checks now, and final
root/reviewer typechecks passed. The new check runs actual component handlers through
hook/route seams; it does not simulate DOM focus or responsive CSS. A counterfactual
without route reset fails the route-away/back assertion. Independent review found no blocker.

House DS review: PASS for reused components/icons, theme-copy identity, existing domain
menus/status maps/brand and newly added accessible navigation controls. Existing card
metrics, full status/taxonomy compliance and all loading/error states were not restyled
or comprehensively audited. Thai font remains the local OD-05 arrangement from ADR0096;
Badge/Tag10px remains scoped by ADR0111. No vendored skill/theme edits or dependencies.

## Limits

Only these main pages and safe shell interactions were checked. Asset real list/form
flows remain blocked by placeholders. Real mobile Safari/Android, software keyboard,
zoom/safe areas, screen-reader operation, all other shared-shell consumers/editor routes,
backend mutation/error flows and production build remain unverified. No whole-site or
complete accessibility conformance claim. No commit,push,deploy or component sync.
