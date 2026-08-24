# Plan: App Switcher implementation notes

Expands `docs/adr/0022-app-switcher-multi-app-shell.md` into concrete implementation notes. The ADR is the decision record; this file is where to look for "which file does what" without re-deriving it from the diff.

**Superseded 2026-08-20 by `docs/adr/0033-thunder-one-shell-launcher-not-dropdown.md`** — everything below describes the two-app dropdown shell as it stood before that ADR. `media-workspace.tsx` is now `communication.tsx`, `ai-mission-control`/`ai-work-orders`/`ai-service-ops` are now `mission-control`/`tc-work-orders`/`tc-service-ops`, the `AppSwitcher` dropdown is gone in favor of the `/work-space` launcher page, and Asset Intelligence's nav lost the CEO/Technician/Thunder Care personas described here. Left as-is for the historical file map of the original two-app shell rather than rewritten.

## Files

- `src/config/apps.tsx` — the `APPS` registry (`id`, `label`, `tagline`, `icon`, `basePath`) and `resolveActiveApp(pathname)`, which matches the longest non-root `basePath` first so `/asset-intelligence/**` doesn't fall through to the `/` (Media Workspace) entry.
- `src/config/nav/types.ts` — `NavConfig`/`NavSection`/`NavItem`/`PinnedNavItem` shared shapes.
- `src/config/nav/media-workspace.tsx` — Media Workspace's nav (one config for the whole app), extracted verbatim from the old hardcoded `Sidebar.tsx` (no behavior change).
- `src/config/nav/asset-intelligence.tsx` — **one `NavConfig` per persona** (CEO, Asset/IT Manager, Department Manager, Technician, Employee/User, Thunder Care — matching the requirement doc's "6 Core Personas" mockup, which gives each role a genuinely different sidebar, not shared data on one nav), plus `resolveAssetIntelligenceNav(pathname)` which picks the right one from the route's persona segment (`pathname.split("/")[2]`), defaulting to the CEO nav. Only each persona's own landing route has a real `href` — every other mockup item (Insights, Locations, My Team, Knowledge, SLA, ...) is an inert placeholder, same convention as `Calendar`/`Campaigns` in the Media Workspace nav, since only the landing pages exist so far (see `docs/asset-intelligence/plan-role-requirements.md`).
- `src/components/layout/Sidebar.tsx` — computes `activeApp = resolveActiveApp(pathname)`, then `resolveNavConfig(activeApp.id, pathname)` (Media Workspace's static nav, or Asset Intelligence's per-persona resolver), renders the tagline from `activeApp.tagline`, and renders `AppSwitcher` (a real dropdown, `useState`-driven, `router.push(app.basePath)` on selection — no `localStorage`).

**This is route-based, not role-based.** Nothing checks who's logged in — anyone can navigate to any persona's URL and see that persona's sidebar/page. No permission gates exist in this system (`docs/adr/0021-role-vocabulary-reconciliation.md`), so a real per-user role check is future work; this only makes each persona's *screen* match the mockup when you're looking at it.

## Route namespacing

Every Asset Intelligence page lives under `src/app/(dashboard)/asset-intelligence/**`:
- `asset-intelligence/page.tsx` — redirects to `mission-control` (the landing page).
- `asset-intelligence/mission-control/page.tsx` — wraps `@/features/ai-mission-control`'s `MissionControlPage`.
- `asset-intelligence/assets/page.tsx` — Asset/IT Manager's landing page; renders `AssetsListPage` from `@/features/ai-assets` (a plain table over the feature's mock data).
- `asset-intelligence/departments/page.tsx`, `work-orders/page.tsx`, `service-ops/page.tsx`, `my-assets/page.tsx` — the other four personas' landing pages. Each is a `PageHeader` (title/subtitle taken from the requirement doc's §4.x for that role) plus a plain "Not built yet" `Card`, same spirit as the original `channels/page.tsx` placeholder.

## Known gaps (not this sprint)

- The Sidebar's bottom "Quick Channel Status" panel is still Media-Workspace-specific and renders regardless of active app — it wasn't in scope for this ADR and nothing in the requirement doc asks for an Asset Intelligence equivalent yet.
- No RBAC/menu-map backend exists — the requirement doc's §2.2 acceptance criterion ("Sidebar config from a backend RBAC menu map") is not met; both `NavConfig`s are still static frontend config, same as Media Workspace's nav was before this change.
