# Asset Workspace, Categories feature — handoff overview

Status as of 2026-11-09: implemented on `feat/asset-ws-categories-frontend`, committed locally through
`314eecf`. This work has not been pushed or submitted as a PR in this session. Source checks passed;
**rendered and authenticated live-data acceptance remain pending**. Related Core validator fixes remain
uncommitted in the separate backend repository.

| Document | Role |
| --- | --- |
| [Assets handoff](README.md) | existing Assets list, Profile, registration and export |
| [ADR 0097](../adr/0097-asset-workspace-is-a-new-app-beside-asset-intelligence.md) | App boundaries and routes |
| [ADR 0098](../adr/0098-asset-workspace-uses-the-design-system-core-with-a-local-profile.md) | Asset Workspace UI rules |
| Functional Specification v1.1.5 §4.7.1 | frozen Category behavior and read-only Assets tab |
| `Thunder_Core/docs/api/asset-workspace-categories.md` | owning backend contract; lives in Core |

## The shape

```text
Browser (src/features/asset-workspace)
  → /api/proxy/v2/asset-workspace/categories/*
  → Core /api/core/v2/tenants/{tenant}/asset-workspace/categories/*

/asset-workspace/categories
├─ Add Category → /categories/new
└─ Category name → /categories/{categoryId}
   ├─ Overview → information, rules and direct children
   ├─ Assets → ?tab=assets, read-only assets including all descendants
   ├─ Edit Category → /categories/{categoryId}/edit
   ├─ Category actions → Activate / Deactivate
   ├─ Assets count → /assets?category_id={id}&include_child_categories=true
   └─ Register Asset → /assets/register?mode=single&category_id={id}

Asset name in the category table → /asset-workspace/assets/{assetId}
```

Core owns hierarchy, permissions, concurrency checks and counts. The browser does not recalculate
rolled-up totals or infer tenant access from a URL.

## What is included

Feature paths below are relative to `src/features/asset-workspace/`.

| Batch | Behavior | Main code |
| --- | --- | --- |
| 01 — List | Search, status/parent filters, hierarchy, sibling sorting and pagination; URL state | `components/categories/CategoriesListView.tsx`, `domain/category-list.ts` |
| 02 — Add | Name, optional creation-only code, active parent, description and serial rule | `components/categories/AddCategoryView.tsx`, `hooks/use-category-create.ts` |
| 03 — Detail | Information/rules cards, searchable/paged direct children and status actions | `components/categories/CategoryDetailView.tsx`, `hooks/use-category-detail.ts` |
| 04 — Edit | Changed-fields-only PATCH, safe parent choices and retained-input recovery | `components/categories/EditCategoryView.tsx`, `hooks/use-category-edit.ts` |
| 05 — Assets tab | Search, Status/Location/Condition filters, paging and Profile links; descendants included | `components/categories/CategoryAssetsTab.tsx`, `services/category-assets-query.ts` |
| 06 — Action scope | Reconciles action-heavy mock with read-only baseline; no separate route | existing category header and Assets tab |
| 07 — Count links | Descendant-aware Assets filtering, visible parent label and matching filtered export | `hooks/use-category-filter-label.ts`, `domain/asset-export.ts` |
| Registration entry | Contextual link to existing Single Registration with category defaults | `components/categories/CategoryRegistrationButton.tsx`, `components/register-asset/RegistrationCategoryEntry.tsx` |

## Category behavior

- List parent filtering selects direct children. Count links include every descendant level.
- Core returns rolled-up `assetCount` and this category's `ownAssetCount`. Deactivation confirmation
  uses **ownAssetCount**; deactivation never moves assets or changes children.
- Name is required, up to 255 characters after trimming; description allows 500. Create accepts an
  optional code or leaves generation to Core. Code is not editable; status has its own endpoint.
- Edit excludes self and descendants from parent choices. An existing inactive parent may be retained;
  an unchanged parent is omitted from PATCH.
- Edit/status send the exact loaded `updatedAt` as `expectedUpdatedAt`, including microseconds.
  STALE reloads Detail after status changes; Edit retains typed values and offers explicit replacement.
- Uncertain writes are never automatically repeated. Create offers a list check, Edit offers latest
  Detail, and status changes reload the category. Tenant/user context and abort guards apply.

## Assets tab and count links

Columns are **Asset | Asset Tag | Location | Custody | Status | Condition**. Names open Profile. On narrow
tables, Location/Custody/Condition move beneath Asset rather than disappear. No table selection, row
menu, bulk mutation, Export, Model column or unsupported column-sort arrows.

The tab forces the route category and `include_child_categories=true`. Search, filters and pagination
are URL state; filter changes reset page. Switching tabs keeps filters, but category reads receive none
of those asset-filter arguments. No implicit lifecycle filter excludes Disposed.

The existing Assets list retains descendant scope on count navigation and filtered export. Changing its
Category dropdown removes the flag; Clear filters removes both keys. Missing parents are resolved by
category ID; failures keep “Selected category” visible rather than silently clearing scope. Summary
tiles stay organization-wide. Reports retain exact-category scope and reject the descendant flag;
this batch does not redefine reports.

## Register from a category

The frozen baseline excludes primary asset actions here. The owner approved one local exception on
2026-11-09: **Register Asset in the category header**, opening existing Single Registration. This is
navigation, not creation from the table. Other action-heavy mock controls remain excluded.

- Active category required; the entry is disabled during category loading/status updates or inactivity.
- Optional `category_id` is resolved through the existing tenant-scoped, active registration selector.
  Invalid, duplicate, missing, inactive or inaccessible references show safe recovery choices.
- Fresh drafts receive the category and its rule metadata. Steps are not skipped, category stays
  editable, and existing serial validation/submission availability still apply.
- Normal Single Registration without the parameter retains its existing path. Restored drafts win over
  defaults; a different-category draft offers Resume or explicit Discard and start new.
- Locked/uncertain recovery cannot be discarded through the new choice. Existing draft keys, receipt
  handling and cached-file cleanup are reused. Unreadable storage blocks the category-prefilled path
  rather than overwriting unknown saved work.

`SingleAssetWizard.tsx` now owns hydration/session mounting. Its existing form moved to
`SingleAssetRegistrationForm.tsx`; existing header/status markup moved to `RegistrationSessionHeader.tsx`.
The wrapper/form are 31/241 lines at this checkpoint, resolving the earlier 257-line wizard gap.

## APIs and dependencies

These frontend URLs use the authenticated same-origin proxy; tenant selection happens on the server.

| Method | Path | Used for |
| --- | --- | --- |
| GET | `/api/proxy/v2/asset-workspace/categories/list` | list and parent options |
| GET | `/api/proxy/v2/asset-workspace/categories/{id}` | Detail, Edit and missing filter labels |
| POST | `/api/proxy/v2/asset-workspace/categories` | create |
| PATCH | `/api/proxy/v2/asset-workspace/categories/{id}` | changed fields and concurrency token |
| POST | `/api/proxy/v2/asset-workspace/categories/{id}/status` | activate/deactivate and concurrency token |
| GET | `/api/proxy/v2/asset-workspace/assets/list` | descendant-inclusive drill-down |
| GET | `/api/proxy/v2/asset-workspace/assets/filters` | organization filter options |
| GET | `/api/proxy/v2/asset-workspace/assets/registration-options/categories?id={id}` | registration preselection validation |

Filtered CSV export stays on Assets through its existing service. No dependency, environment-variable
or migration changes were added for Categories. Existing feature flag, Core URL/key and session
requirements in the [Assets handoff](README.md#environment-variables) still apply.

## Shared code touched

| File | Change / review concern |
| --- | --- |
| `src/app/api/proxy/[...path]/route.ts` | category v2 routing with session/context/origin, timeout and no-store guards; preserves Assets/v1 handling |
| `services/assets-list-query.ts`, `hooks/use-assets-list-url.ts` | descendant scope and clear behavior; optional default-sort omission preserves existing caller defaults |
| `components/assets-list/AssetsFilters.tsx`, `AssetsListView.tsx` | missing parent labels, visible descendant scope and category changes clearing the flag |
| `domain/asset-export.ts` | filtered export includes descendant scope, not paging/sort |
| `hooks/use-assets-list-data.ts`, `services/assets-list-api.ts` | export existing section-read hook and accept optional serialization settings |
| `domain/status-tone.ts` | Category Active = success, Inactive = neutral; existing asset/condition mapping retained |
| registration route, entry, recovery, wizard and `hooks/use-asset-registration.ts` | optional defaults/draft choice; existing normal initialization and write/validation handlers retained |

Feature paths omit `src/features/asset-workspace/` unless a full repository path is shown. Shared UI
primitives, theme copies, main header/sidebar and shell implementations were not changed. Cards retain
stationary hover/focus feedback. Feature `…Loading` components and route `loading.tsx` wrappers cover
route/client loading; Assets-tab loading follows the tab URL.

## Core compatibility work — not in these commits

The local Core checkout is on `develop`. Three approved validator edits remain **uncommitted**:

| Core file | Field |
| --- | --- |
| `src/lib/core/v2/categories.ts` | create `parentId`: `z.uuid()` → `z.guid()` |
| `src/lib/core/v2/categories.ts` | update `parentId`: `z.uuid()` → `z.guid()` |
| `src/lib/core/v2/assets.ts` | shared filter `category_id`: `z.uuid()` → `z.guid()` |

They accept existing PostgreSQL UUID-shaped seed IDs with non-RFC version/variant bits. ID generation,
stored data, permissions and tenant rules are unchanged. Review/ship this work separately; backend
deployment is not established by frontend commits. No database writes or migrations ran here.

## Verification status

Passed during implementation: full frontend/Core TypeScript, affected-file ESLint, design-system
integrity, authored-file sizes and diff whitespace checks. Run focused checks from the frontend root:

```bash
node node_modules/typescript/bin/tsc --noEmit --incremental false
node src/features/asset-workspace/domain/category-list.check.mts
node src/features/asset-workspace/domain/category-edit.check.mts
node src/features/asset-workspace/domain/category-detail.check.mts
node src/features/asset-workspace/services/asset-categories-api.check.mts
node src/features/asset-workspace/services/asset-category-create.check.mts
node src/features/asset-workspace/services/asset-category-status.check.mts
node src/features/asset-workspace/services/asset-category-edit.check.mts
node src/features/asset-workspace/services/category-list-query.check.mts
node src/features/asset-workspace/services/category-assets-query.check.mts
node src/features/asset-workspace/domain/registration-category-prefill.check.mts
node src/features/asset-workspace/services/registration-category-prefill.check.mts
node src/features/asset-workspace/domain/registration.check.mts
node src/features/asset-workspace/domain/registration-outcome.check.mts
node src/design-system/design-system.check.mts
```

Existing export checks also passed. New request fixtures use injected requesters; Core schema/traversal
fixtures use extracted source and a mock client. A source comparison confirmed the moved wizard
form/submit/review/cancel markup and existing draft write/validation handlers were retained.

**Not verified:** rendered scrolling/zoom/focus/loading transitions; real role/tenant permissions;
live parent/child count equality and CSV scope; real stale/uncertain recovery; both registration paths
with draft/file/recovery persistence. Browser automation was blocked by the native bridge trust error.
Test writes require an explicitly approved safe environment, not the shared development database.

## Commit checkpoints

| Commit | Delivered |
| --- | --- |
| `7e4c303` | Categories list and initial count-link support |
| `b7e2a1e` | Add Category; list card/heading refinements |
| `247fafd` | Detail Overview and category status actions |
| `b2f96ac` | Edit Category and page-shaped loading states |
| `2dd8b37` | read-only Assets tab and Edit Category button styling |
| `314eecf` | category-prefilled registration, wizard split and remaining p6 refinements |

## Remaining / out of scope

- Complete rendered/live acceptance before calling the batch fully verified.
- Review the separate uncommitted Core fixes before release.
- No Category Delete, row/bulk asset mutations, Categories Export, extra tabs or action-explanation rail.
- Missing Assign/Transfer/Move Location/Update Status/Edit Asset flows belong in their owning Assets
  modules under separate scope; existing buttons/placeholders do not establish those flows are ready.
