# Plan: App Switcher implementation notes

Expands `docs/adr/0016-app-switcher-multi-app-shell.md` into concrete implementation notes. The ADR is the decision record; this file is where to look for "which file does what" without re-deriving it from the diff.

## Files

- `src/config/apps.tsx` — the `APPS` registry (`id`, `label`, `tagline`, `icon`, `basePath`) and `resolveActiveApp(pathname)`, which matches the longest non-root `basePath` first so `/asset-intelligence/**` doesn't fall through to the `/` (Media Workspace) entry.
- `src/config/nav/types.ts` — `NavConfig`/`NavSection`/`NavItem`/`PinnedNavItem` shared shapes.
- `src/config/nav/media-workspace.tsx` — Media Workspace's nav, extracted verbatim from the old hardcoded `Sidebar.tsx` (no behavior change).
- `src/config/nav/asset-intelligence.tsx` — Asset Intelligence's nav. Only "All Assets" has a real `href` this sprint; every other item (Locations, Maintenance, Inspections, Departments, Work Orders, Service Ops) is an inert placeholder (no `href`), same convention as `Calendar`/`Campaigns` in the Media Workspace nav.
- `src/components/layout/Sidebar.tsx` — computes `activeApp = resolveActiveApp(pathname)`, picks the matching `NavConfig` from a `NAV_BY_APP_ID` map, renders the tagline from `activeApp.tagline`, and renders `AppSwitcher` (a real dropdown, `useState`-driven, `router.push(app.basePath)` on selection — no `localStorage`).

## Route namespacing

Every Asset Intelligence page lives under `src/app/(dashboard)/asset-intelligence/**`:
- `asset-intelligence/page.tsx` — redirects to `mission-control` (the landing page).
- `asset-intelligence/mission-control/page.tsx` — wraps `@/features/ai-mission-control`'s `MissionControlPage`.
- `asset-intelligence/assets/page.tsx` — placeholder (`<h1>Assets</h1>`), same pattern as the original `channels/page.tsx` placeholder, until `ai-assets` grows a real list page.

## Known gaps (not this sprint)

- The Sidebar's bottom "Quick Channel Status" panel is still Media-Workspace-specific and renders regardless of active app — it wasn't in scope for this ADR and nothing in the requirement doc asks for an Asset Intelligence equivalent yet.
- No RBAC/menu-map backend exists — the requirement doc's §2.2 acceptance criterion ("Sidebar config from a backend RBAC menu map") is not met; both `NavConfig`s are still static frontend config, same as Media Workspace's nav was before this change.
