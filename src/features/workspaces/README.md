# workspaces

The App launcher (landing page at `/work-space`) — previously a plain grid over `config/apps.tsx`'s `APPS`, now a fuller dashboard: hero banner, workspace tiles, recently-opened, and a health/quick-actions rail.

Only Communication, Asset Intelligence, and Thunder Care are real Apps with a route behind them (`config/apps.tsx`). Every other tile here (Media Library, CRM, Projects, Analytics, "More Workspaces") is a "coming soon" placeholder — same convention `mission-control`'s `WorkspacesRow` uses: full visual treatment (icon, description, status text), but the "Open Workspace" affordance is inert rather than a dead link.

- `components/` —
  - `WorkspacesPage` — the landing page, composing everything below
  - `WorkspacesHeader` — title only, no Customize button (unlike Mission Control/My Work/Intelligence)
  - `HeroBanner` — "One Platform. Many Workspaces." banner; the stacked-window illustration is decorative CSS, not a real preview
  - `WorkspaceGrid` — the 8 workspace tiles (`Your Workspaces`)
  - `RecentlyOpenedRow` — a short recently-opened strip
  - `WorkspaceOverviewCard` — a `DonutChart` breakdown of the 8 tiles by status
  - `WorkspaceHealthCard` — a per-workspace health list
  - `QuickActionsCard` — decorative admin actions (no access-management backend exists yet)
  - `NeedHelpCard` — a static help-center pointer
- `mock-data.ts` — `workspaceTiles`, `recentlyOpened`, `workspaceOverview`, `workspaceHealth`, `quickActions` — all placeholder, no backend yet
