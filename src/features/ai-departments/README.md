# ai-departments

Department Manager's dashboard for Asset Intelligence (requirement doc §4.3) — assets and requests scoped to the manager's own department. Namespaced `ai-` per `docs/adr/0023-asset-intelligence-feature-namespacing.md`.

> R&D placeholder — mock data, no backend yet. A real version scopes `features/ai-assets` by `department_id` server-side rather than filtering client-side like `mock-data.ts` does.

- `components/` —
  - `DepartmentPage` — the overview (stat tiles, Needs Attention, Requests summary, "View all department assets")
  - `DepartmentAssetsPage` — every asset in the department (table)
  - `TeamPage` — department team members and how many assets each is holding
  - `RequestsPage` — the Approve/Reject queue for asset requests (DM-03), reading `ai-requests`'s mock data. Real, working Approve/Reject buttons, local state only — see the component's own comment for why nothing persists.
  - `ApprovalsPage` — assets transferred from Asset Manager awaiting the department's acknowledgement (DM-01, `Asset.lifecycleStatus === "pending_department_ack"`), one step earlier in the onboarding flow than Employee's own Scan QR acknowledgement (EMP-01). Real, working Acknowledge button, same local-state-only discipline.
  - `ReportsPage` — a read-only department summary (asset count/value by category) — no export, same as every other role's un-exportable Reports page this sprint (DM-04's "export report" isn't built)
- `mock-data.ts` — `getDepartmentAssets()` filters `ai-assets`'s real registry by `CURRENT_DEPARTMENT_ID` (`src/config/current-department.ts`) rather than holding a separate hardcoded list — `needsAttention` is derived from it too, so it can't drift from what `DepartmentAssetsPage` actually shows. `mockTeamMembers` is this feature's own small list (not shared elsewhere yet).

**Routing note**: all four detail pages route under `/asset-intelligence/departments/**` (not top-level siblings) — see `src/config/nav/asset-intelligence.tsx`'s comment on why any page beyond a persona's landing route must nest under that persona's own segment.
