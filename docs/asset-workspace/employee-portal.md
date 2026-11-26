# Asset Workspace, Employee portal — handoff overview

Status as of 2026-11-26: the employee portal frontend (Shell, Home, My Assets, My Tasks, Scan Asset) is merged into
`feat/assetworkspace` (through `2b94c21`) and pushed. The backend `/me` routes are merged into Core `develop` (#393),
and so is the fix that makes Home count only the caller's tasks (Core #397). Read-only browser checks and the `/me`
API test passed; task writes were checked in the browser on develop with owner approval (≤5 assets).

| Document | Role |
| --- | --- |
| [Assets handoff](README.md) | Admin Assets list, Profile, registration and export |
| [Assignments handoff](assignments.md) | Custody writes the employee never sees |
| [ADR 0097](../adr/0097-asset-workspace-is-a-new-app-beside-asset-intelligence.md) | App boundaries and routes; employee URLs amended by the Shell batch |
| [ADR 0098](../adr/0098-asset-workspace-uses-the-design-system-core-with-a-local-profile.md) | Asset Workspace UI rules, status colours |
| PO Employee Persona Experience Map v0.2 §1–§8 | Scope, access, menu, screens, states, flows |
| PO docs 02 §3.1–3.6, 04 UC-002 / 007 / 011 (AC-004, 005, 016, 019, 027, 028, 032, 034) | Personas, roles, acceptance |
| `Thunder_Core/docs/api/` (asset-workspace `/me`) | owning backend contract; lives in Core |

The PO FigJam employee mock (`612:1561`) is an example only (owner 2026-11-16): content comes from the PO docs, the look
from the admin portal.

## The shape

```text
Server components and server actions (src/features/asset-workspace/employee)
  → Core /api/core/v2/tenants/{tenant}/asset-workspace/me/*
  (no browser proxy route; the proxy is not edited)

/asset-workspace (route groups)
├─ (admin)/…     → every existing admin page; an employee is sent to My Assets
└─ (employee)/…  → an admin is sent to Overview
   ├─ /my-assets            → list: search, tabs All / Assigned / In Maintenance, Condition filter, paging
   │  └─ /my-assets/{id}    → read-only asset view; another person's asset = "Asset not found"
   ├─ /my-tasks             → inventory tasks assigned to me, due date, Overdue
   │  └─ /my-tasks/{taskId} → checklist: Verified / Mismatch / Not Found, Report unexpected, My Findings
   ├─ /scan-asset           → camera or typed code → Found card (held asset) or Not Found
   └─ /home                 → my asset counts, tasks to do (reads /me/assets and /me/inventory-tasks)
```

Employee landing page is My Assets (ADR 0097 entry); whether Home replaces it is a PO question.

Core owns the "only mine" rule: every `/me` route checks tenant membership and forces the caller (custody = caller,
`assignedTo` = caller) on the server, ignoring any id the client sends. The frontend never filters for security.

## What is included

Feature paths below are relative to `src/features/asset-workspace/employee/`.

| Item | Behavior | Main code |
| --- | --- | --- |
| Shell | Role resolver (role_type, else role code), route-group guards, employee nav (My Assets, My Tasks, Scan Asset, Home) | `src/config/asset-workspace-access.ts`, `asset-workspace-guard.ts`, `config/nav/asset-workspace*.ts(x)`, `app/(dashboard)/(application)/asset-workspace/{(admin),(employee)}/layout.tsx` |
| My Assets | List with search, tabs, Condition filter, paging; asset view with an allow-listed field set; safe Back link (`?from=` stays under `/my-assets`) | `my-assets/MyAssetsView.tsx`, `MyAssetView.tsx`, `my-assets-api.ts`, `my-assets-query.ts` |
| My Tasks | Task list; task page with the checklist, Mismatch (condition + note), Change, Report unexpected, My Findings. No Submit or Close (each verify marks the task Submitted) | `my-tasks/MyTasksView.tsx`, `MyTaskView.tsx`, `MyTaskDialogs.tsx`, `my-tasks-actions.ts`, `my-tasks-api.ts` |
| Scan Asset | Camera via `hooks/use-asset-camera.ts` plus typed-code fallback; Found / Not Found / scan failure | `scan-asset/MyScanView.tsx`, `MyScanResult.tsx`, `my-scan-actions.ts` |
| Home | Asset counts by status, tasks to do with progress; no new route | `home/MyHomeView.tsx` |
| Shared | List page frame, loading skeletons for every route | `shared/EmployeeListPage.tsx`, `shared/EmployeeLoading.tsx` |

## Rules the UI follows

- **View only.** No employee action beyond viewing, verifying and reporting (persona map §2): no ⋯ menu, no Register,
  Edit, Assign, Transfer, Return, Move Location, Label, Export, Reconcile, Close or Settings.
- Never import or edit admin components; build an employee version when the admin one carries admin actions.
- Mock adjustments (owner): M1 tabs All / Assigned / In Maintenance, no Retired; M2 keep due date and Overdue;
  M3 drop Requests and Issues tiles; M4 drop the ⋯ menu; M5 results Verified / Mismatch / Not Found plus Report
  unexpected; M6 employee field list per batch.
- Findings never change the Asset Master (AC-016): a Mismatch is recorded on the task only.
- Desktop first; My Assets, Scan and task verification work at 375px (one column, no horizontal scroll).
- Out of scope: My Requests (PO: use case, permission and acceptance criteria missing), the Manager view.

## Roles

| Persona | Role code (develop data) | role_type | Portal |
| --- | --- | --- | --- |
| Employee / Asset Custodian | `employee_asset` | employee | Employee |
| Asset Admin | `department_asset_admin` | department_admin | Admin |
| Manager | `manager_assets` | manager | Admin |
| company_admin, super_admin | — | — | Admin |
| operator | — | operator | None by default |

PO personas are not IAM roles; this mapping is the owner's. The session drops `employee` and `manager` from
`roleType`, so the resolver falls back to `roleCode`.

## Errors

| Case | Handling |
| --- | --- |
| Asset or task not mine, unknown, or bad id | "Asset not found" / not-found state; no name or data shown |
| Core read fails | "Couldn't load this" state with retry; never an empty list pretending to be data |
| Verify / unexpected rejected | Message in the dialog; the user's input is kept |
| Bad URL params (`page=-5`, huge `pageSize`, unknown tab or condition) | Normalised or error state; no crash |

## APIs

Called server-side with the session token; tenant comes from the server session. Paths are under
`/api/core/v2/tenants/{tenant}/asset-workspace/`.

| Method | Path | Used for | Core calls (existing) |
| --- | --- | --- | --- |
| GET | `me/assets` | My Assets list, Home counts | `listAssets`, custody forced |
| GET | `me/assets/{assetId}` | asset view | custody check, then `getAsset` |
| GET | `me/inventory-tasks` | My Tasks list, Home | `listInventorySessions` |
| GET | `me/inventory-tasks/{sessionId}` | task page | `getInventorySession` |
| GET | `me/inventory-tasks/{sessionId}/assets` | checklist | `listInventorySessionAssets` |
| GET | `me/inventory-tasks/{sessionId}/findings` | My Findings | `listInventoryFindings` |
| POST | `me/inventory-tasks/{sessionId}/verifications` | Verified / Mismatch / Not Found | `verifyInventoryAsset` |
| POST | `me/inventory-tasks/{sessionId}/unexpected` | Report unexpected | `reportUnexpectedAsset` |
| GET | `me/scan?code=&type=` | Scan Asset | `lookupAsset`, limited to held assets |

All merged in Core #393. No migration, no dependency or environment-variable change on either side.

## Shared code touched

| File | Change |
| --- | --- |
| `app/(dashboard)/(application)/asset-workspace/*` | existing admin pages moved into `(admin)/` unchanged (rename only); new `(employee)/` group |
| `src/app/(dashboard)/layout.tsx` | resolves `assetWorkspaceRole` from the session ("none" → admin nav; the route gate redirects) |
| `src/components/layout/Sidebar.tsx` | new optional `assetWorkspaceRole` prop (default `asset_admin`) picks the Asset Workspace nav; hiding items is not authorization |
| `src/config/nav/asset-workspace-roles.ts`, `asset-workspace.tsx` | employee nav items and role mapping |

## Verification status

Passed (2026-11-17, full test report kept in the owner's workspace docs, outside this repo): TypeScript, ESLint on employee, config, route-group and nav files, 5 `.check.mts`
self-checks; `/me` API test 29/29 against local Core (30/30 with the Home task-count check); browser as `employee_asset` at 1366
and 375px: AC-004, 005, 016, 019 (UI), 027, 028, 032, 034, 13 admin URLs redirect to My Assets; XSS and open-redirect
probes. Run focused checks from the frontend root:

```bash
node node_modules/typescript/bin/tsc --noEmit --incremental false
node src/config/asset-workspace-access.check.mts
node src/config/nav/asset-workspace-nav.check.mts
node src/features/asset-workspace/employee/my-assets/my-assets-query.check.mts
node src/features/asset-workspace/employee/my-tasks/my-tasks.check.mts
node src/features/asset-workspace/employee/scan-asset/my-scan.check.mts
```

**Not verified:** Not Found result on a task in the browser; camera scan (blocked in the browser pane); error state
with Core down; Home "Tasks to do" with rows; `/me` write checks (`ME_WRITES=1`, leaves a test tenant behind).

## Bugs found and fixed

| # | Bug | Fix |
| --- | --- | --- |
| 1 | My Findings identifier wrapped one letter per line at 375px | `MyTaskView.tsx` `min-w-40 flex-1`; in `2b94c21` |
| 2 | Home progress counted the whole session (others' assets) | Core `listInventorySessions` counts only the caller's tasks for non-admins; `5a74eff`, merged in Core #397. The "N specific assets" label still shows the session size |

## Known risks

- **An employee can still read every tenant asset through the admin read routes** (they check membership only;
  the browser proxy `assets/list` returned all 249 assets). Admin detail, label and export answer 403. Fix belongs to
  the planned "Asset access policy" batch (Core route guard, senior sign-off). Conflicts with AC-004 "only permitted
  scope" until then.
- Core write guard refuses `department_admin`, so `department_asset_admin` gets 403 on admin writes; test admin writes
  with a manager or company_admin.
- Left on develop: test session `[TEST] Employee portal check` (In Progress, 2 assets), one Verified result, one
  Unexpected finding. An admin can cancel or close it.

## Commit checkpoints

| Commit | Delivered |
| --- | --- |
| `af0e108` | Employee portal shell, `(admin)` / `(employee)` route groups |
| `0458951` | Shared guard in both route groups |
| `61679a1` | My Assets list and asset view |
| `865b92a` | My Tasks list and task verification |
| `7603c92` | Scan Asset |
| `4e9f575` | Home |
| `2b94c21` | Lists, asset view and loading screens improved; My Findings wrapping fix |

## Remaining / out of scope

- Run `/me` write checks on a local database; see a task Not Found result, the camera scan and the Core-down state.
- PO: should Home replace My Assets as the landing page; My Requests needs a use case, permission and acceptance criteria.
- Minor, no fix yet: Change on a Mismatch reopens empty; Mismatch offers the expected condition; "Choose what is
  different" stays red until Save; Scan "Try again" keeps the old code; Format shows "Valid" for any text.
- Not built: My Requests, Manager view, any admin action.
