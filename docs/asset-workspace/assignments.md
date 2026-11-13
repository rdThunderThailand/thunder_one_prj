# Asset Workspace, Assignments feature — handoff overview

Status as of 2026-11-13: the Assignment frontend (FE 01–09 plus the PO design pass) is merged into
`origin/feat/assetworkspace` through `93e184f`. The Assign step 1 redesign is committed as `69771a7` on
`feat/asset-ws-profile-tabs` (owner choice) and **is not pushed**. The backend (BE 01–03) is merged into Core
`develop` (#349, #350, #359). Source checks and read-only browser checks passed; **no save (Assign / Transfer /
Return / Move Location) has been run against a server**.

| Document | Role |
| --- | --- |
| [Assets handoff](README.md) | Assets list, Profile, registration and export |
| [Categories handoff](categories.md) | Categories feature; same proxy and conventions |
| [ADR 0097](../adr/0097-asset-workspace-is-a-new-app-beside-asset-intelligence.md) | App boundaries and routes |
| [ADR 0098](../adr/0098-asset-workspace-uses-the-design-system-core-with-a-local-profile.md) | Asset Workspace UI rules, status colours |
| PO docs 03 §2.5–2.7, 04 UC-004/005/006 (AC-008–013), 05 §4.3 and §4.11 | custody, transfer, history and actions by status |
| `Thunder_Core/docs/api/` (asset-workspace assignments) | owning backend contract; lives in Core |

## The shape

```text
Browser (src/features/asset-workspace)
  → /api/proxy/v2/asset-workspace/{assignments,assets}/*
  → Core /api/core/v2/tenants/{tenant}/asset-workspace/{assignments,assets}/*

/asset-workspace/assignments
├─ Current tab (default) → search, Category / Location / Custodian filters, table, row menu
├─ Assignment History tab → ?tab=history, filters, date range, Event Details panel
├─ + Assign Asset → /assignments/assign (step 1 picks the asset)
└─ Row → /assignments/{assetId} (the asset profile, kept inside Assignments)
   ├─ Assign   → /assignments/{assetId}/assign
   ├─ Transfer → /assignments/{assetId}/transfer
   └─ Return   → /assignments/{assetId}/return

/asset-workspace/assets/{assetId}  (profile reached from Assets)
├─ Overview → Current Assignment card; Assign / Transfer / Return buttons
├─ Assignments tab → current assignment + server-paged history
├─ Location tab → current location, location history; Edit Location opens Move Location
├─ History › Assignment History and History › Location History
└─ /assets/{assetId}/{assign,transfer,return} → the same flows, Back returns to the profile

Assets list, one asset selected → Assign / Transfer / Move Location / Update Status link here
```

Core owns custody rules, permissions, concurrency checks and history. The browser hides impossible actions so
that a rejection means someone else acted first, but it never decides the outcome itself.

## What is included

Feature paths below are relative to `src/features/asset-workspace/`.

| Item | Behavior | Main code |
| --- | --- | --- |
| FE 01 — Current tab | Search, Category / Location / Custodian filters, table, row menu, paging; row opens the profile | `components/assignments/AssignmentsCurrentView.tsx`, `AssignmentsTable.tsx`, `domain/assignment-current.ts` |
| FE 02 — Assign | Steps: select asset → custodian (person or org unit) and details → review → result. Evidence upload. No PO page frame; follows the Transfer layout (owner 2026-11-10) | `components/assignments/AssignFlowView.tsx`, `use-assign-flow.ts`, `domain/assignment-assign.ts` |
| FE 02 — step 1 redesign | Compact table (asset + serial, Asset ID, Category, Location, Condition), Category / Location filters, paging through every Available asset, preselected asset pinned on top; no "Available" chip | `components/assignments/AssignSelectAsset.tsx`, `services/asset-assignments-write.ts` |
| FE 03 — Transfer | Person or Team tab, To Location, optional Reason, condition Good / Fair; current holder left out of the picker; review and confirm | `components/assignments/TransferFlowView.tsx`, `use-transfer-flow.ts`, `domain/assignment-transfer.ts` |
| FE 04 — Return | Return details and condition check, next status shown (auto), review and confirm | `components/assignments/ReturnFlowView.tsx`, `use-return-flow.ts`, `domain/assignment-return.ts` |
| FE 05 — History tab | Event type / date range filters on the house date picker, table, Event Details card; condition shown on Return only | `components/assignments/AssignmentsHistoryView.tsx`, `domain/assignment-history.ts` |
| FE 06 — Profile parts | Overview Current Assignment card, Assignments tab, History › Assignment with server-side filters and periods; profile kept inside Assignments | `components/assignments/ProfileAssignmentHistory.tsx`, `ProfileAssignmentEvents.tsx`, `domain/assignment-profile.ts` |
| FE 07 — Move Location | Dialog from the profile Location tab; active location tree; also opened by `?tab=location&action=move-location` | `components/assignments/MoveLocationFlow.tsx`, `domain/assignment-move-location.ts` |
| FE 08 — Location tab | Current location and history on the profile; Location details and Photos disabled for phase 1 (owner) | `components/assignments/ProfileLocationView.tsx` |
| FE 09 — Location History | History › Location History table with a side panel | `components/assignments/ProfileLocationHistory.tsx`, `domain/assignment-location-history.ts` |
| Design pass | FE 01 / 05 / 06 / 08 / 09 aligned to the PO frames | commit `93e184f` |

## Custody rules the UI follows

- **Prevent, don't react:** Assign shows only on Available assets with no holder; Transfer and Return only on
  Assigned assets with a holder. Transfer offers condition Good / Fair only and is hidden for Damaged / Unusable.
  Move Location is allowed for Available, Assigned and In Maintenance.
- A transfer target is a person or an org unit. "Transfer to storage" is a Return, so the Location / Storage tab
  (frames 18–19) is never built.
- Dropped from the design because the database has no field: Transfer Date, Assignment Type, Remarks, Return Date,
  Return Location, reason dropdown, Condition Notes, accessories, Transaction ID, Export.
- Evidence uploads go through `assets/registration-uploads` (`asset_photo` / `asset_document`); up to 5 ids are
  sent as `evidenceFileIds` within 24 h.
- After any write the profile, the Current list and both histories are refreshed.
- Backfilled rows: `performedBy` null shows "System"; reason `backfill` is hidden.

## Errors

Decided from `code`, never from `message`.

| Code | Handling |
| --- | --- |
| `VALIDATION` | Form message; field errors from `details` |
| `NOT_FOUND` | Reload the asset; a missing target or location errors on its picker |
| `STALE` | Keep the user's input, say someone changed the asset, offer Reload; never retry |
| `INVALID_STATE` | "This asset's status changed", reload |
| `PERMISSION_DENIED` | Message on a write; access-denied state on a read |
| `INTERNAL` / 502 `UPSTREAM_FAILED` | The write may have happened: never auto-retry; reload and show what is there |

## APIs

Same-origin authenticated proxy; tenant selection happens on the server. Paths are under
`/api/proxy/v2/asset-workspace/`.

| Method | Path | Used for | Core |
| --- | --- | --- | --- |
| POST | `assets/{id}/assign` | Assign | #349 |
| POST | `assets/{id}/transfer` | Transfer | #349 |
| POST | `assets/{id}/return` | Return | #349 |
| POST | `assets/{id}/move-location` | Move Location | #359 |
| GET | `assignments` | Current tab | #350 |
| GET | `assignments/history` | History tab | #350 |
| GET | `assets/{id}/assignments` | profile history (`q`, dates, `custodyPeriod`, location at the time) | #350, #359 |
| GET | `assets/{id}/location-history` | Location tab and History › Location | #359 |
| GET | `assets/{id}` (+ `custody.note`) | Transfer, Return, profile | existing; `note` #350 |
| GET | `assets/list?status=Available` | Assign step 1 picker (with `page`, `category_id`, `location_id`) | existing |
| GET | `assets/filters` | Current tab filters, step 1 filters | existing |
| GET | `assets/registration-options/{persons,org-units,locations}` | custodian and location pickers | existing |

No dependency, environment-variable or migration change on the frontend. Core added its functions and migration
`20261111024538` with BE 03.

## Shared code touched

| File | Change |
| --- | --- |
| `src/app/api/proxy/[...path]/route.ts` | `assignments` branch with the same checks as `assets` and `categories` |
| `components/asset-profile/*` | Current Assignment card, Assignments / Location tabs, history sub-tabs (Assignment, Location) |
| `components/assets-list/*` (Profile Tabs FE 06) | one selected asset links to Assign / Transfer / Move Location / Update Status; blocked actions explain why |
| `domain/status-tone.ts` | status and condition colours stay in the one map |

## Verification status

Passed: TypeScript (6144 MB), changed-file ESLint, 68/68 Asset Workspace checks, design-system and line-limit
checks; read-only browser scroll checks at 1920 / 1440 / 1366. Assign step 1 redesign: checks and 1366×768 browser
pass (by the Assignment session; not rerun for this note). Run focused checks from the frontend root:

```bash
node node_modules/typescript/bin/tsc --noEmit --incremental false
node src/features/asset-workspace/domain/assignment-assign.check.mts
node src/features/asset-workspace/domain/assignment-transfer.check.mts
node src/features/asset-workspace/domain/assignment-return.check.mts
node src/features/asset-workspace/domain/assignment-current.check.mts
node src/features/asset-workspace/domain/assignment-history.check.mts
node src/features/asset-workspace/domain/assignment-profile.check.mts
node src/features/asset-workspace/domain/assignment-move-location.check.mts
node src/features/asset-workspace/domain/assignment-location-history.check.mts
node src/features/asset-workspace/services/asset-assignments-api.check.mts
node src/features/asset-workspace/services/asset-assignments-write.check.mts
node src/features/asset-workspace/services/asset-assignments-profile-api.check.mts
node src/features/asset-workspace/services/asset-assignments-location-history.check.mts
node src/design-system/design-system.check.mts
```

**Not verified:** any save (Assign / Transfer / Return / Move Location) against a server — writes need an
approved local Core, never develop; 390px width (known app-shell overflow); error states, paging past page 2 and
evidence upload in the browser; real role and tenant permissions.

## Commit checkpoints

| Commit | Delivered |
| --- | --- |
| `8b3ea67` | Current assignments page |
| `1167db4` | Assign flow (mock-up UI, no PO design) |
| `0ce11f2` | Transfer flow |
| `2ee0079` | Return flow; action pages aligned to PO frames |
| `3d42ee3` | Assignment History tab |
| `d50e646` | Return-only condition, house date range picker |
| `d7b6852` | Profile Assignments tab with server-side history |
| `f03c5d4` | Profile kept inside Assignments |
| `c870589` | Profile rail on Overview only; history sub-tabs on one row |
| `8b62a65` | History › Location History |
| `a6eee33` | Profile Location tab |
| `d1317c8` | Move Location dialog |
| `93e184f` | Assignment and profile pages aligned to the PO design |
| `69771a7` | Assign step 1 table, filters and paging (on `feat/asset-ws-profile-tabs`, not pushed) |

## Remaining / out of scope

- Run the save flows on an approved local Core before calling the feature fully verified.
- Push `69771a7` with the Profile Tabs branch, or move it to the Assignment branch, before review.
- Open: All History per-event read (BE 04 + FE 10), To Location star on the shared picker, 390px app-shell
  overflow, broader QA of FE 01 / 05.
- Not built: Transfer to storage (it is a Return), bulk assign / transfer, Assignment Export, Transaction ID.
