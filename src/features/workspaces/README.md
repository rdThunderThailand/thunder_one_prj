# workspaces

The App launcher (`/work-space`), in three variants picked by `config/rbac.ts`'s `resolveShellVariant`: CEO/admin (`WorkspacesPage` — overview dashboard), manager (`ManagerWorkspacesPage` — pinnable directory + activity) and employee (`EmployeeWorkspacesPage` — directory + announcements).

**No mock data since 2026-09-25.**

- `catalog.ts` — `WORKSPACES`, the one list every variant renders (previously three hand-copied mock lists). `href` comes from `config/apps.tsx`; `dataStatus` is a fact about each App: `live` (reads Core), `sample` (exists, still on sample data — Thunder Care, Customer Workspace) or `coming-soon` (no App; inert tile).
- `services/workspace-stats-api.ts` — one real stat per live App (Media channels/online from `/media/channels`, asset total + in-maintenance from `/assets/summary`, member count, Lead Approval pending count — reviewers only) plus the tenant audit trail for the manager's Recent Activity. Any failed/403 read is `null` → the tile says "Not available".
- `src/lib/workspace-prefs.ts` — per-browser Recently Opened (the Sidebar records each App the viewer enters) and pins (star on a manager directory tile). Real usage but local to the browser; read via `useSyncExternalStore`, so SSR and first client render both see "nothing yet".
- `components/` —
  - `WorkspaceGrid` (CEO) / `WorkspaceDirectory` (manager + employee; real search, categories, grid/list, optional pinning) — tiles from `catalog.ts` with `WorkspaceStatusLine` (`workspace-ui.tsx`).
  - `WorkspaceOverviewCard` — workspaces by data status. `WorkspaceHealthCard` — each live App's stat, with its alert chip ("6 offline") or "OK".
  - `RecentlyOpenedRow`, `PinnedWorkspacesRow` — per-browser prefs; empty states until used.
  - `RecentActivityCard` — Core audit trail. `AnnouncementsCard` — empty state (no Core source).
  - `QuickActionsCard` / `QuickAccessCard` — shortcuts to real pages; the ones with no page stay inert.
  - `HeroBanner`, `NeedHelpCard` — static copy. Customize buttons are inert.
  - `WorkspacesSkeleton` — `app/(dashboard)/(shell)/work-space/loading.tsx`'s fallback.
