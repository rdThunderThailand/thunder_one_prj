# Asset Workspace MVP — Core gap matrix

**Status:** in progress (stage 0) · started 2026-10-22 · due 2026-10-27
**Scope:** PO documents 01–05 (v1.1.5), UC-001 – UC-014, G9 AC-001 – AC-034 and G9-X01 – X10.
**Source of truth:** Thunder_Core `develop` (code + migrations) and the develop DB (SELECT only).

One row per UC or canonical field (03 §2.4–2.5). Each owner edits only their own section.
The `assets` table belongs to Copper: Zeepher writes "needs → see Copper row" and tells Copper.

Submission rules, examples and the PR template: Pace note "07 — การส่งงาน & PR Template".

**`—` and `?` are different:** `—` = checked, does not exist · `?` = not checked yet / not found.
A PR may still contain `?`, but its Verification section must list those rows and why.

| Column | Meaning | How to fill | Example | Common mistake |
|---|---|---|---|---|
| UC / field | One thing being checked per row | Data field: name from 03 §2.4–2.5 · Action: UC number + name | `Asset Tag` · `UC-005 Return` | Several fields in one row ("Name/Serial/Tag") — split them, each can get a different status |
| Doc source | The PO document section that **requires** it | `doc §section`, line optional; several allowed | `03 §2.4` · `04 UC-005 line 88` | Citing an ADR or FE code — PO documents 01–05 only. No PO source means the row should not exist |
| table.column | Where Core stores it | `table.column`, several allowed; confirm with SELECT on `information_schema.columns` | `assets.asset_code` | Trusting a migration name — columns get renamed or dropped later; check the real DB |
| Route | The Core API that reads or writes it | `METHOD path` from `src/app/api/core/v1/` · actions need a write route (POST/PATCH) · read-only data needs GET | `GET /api/core/v1/assets/{id}` | A DB column is not enough — no route returning it means `mismatched` |
| Tenant filter | Where one organization is kept from seeing another's data | `path:line` of the code that filters by tenant (route or RPC/SQL function) | `src/app/api/core/v1/assets/route.ts:42` | Assuming Supabase RLS does it — in Thunder_Core tenant isolation lives in RPCs/routes, not RLS |
| Audit | Where the change is recorded | History table or trigger name · data that needs no audit: `n/a` | `asset_status_history` · `n/a` | `—` everywhere — the actions that **must** be audited are listed in 03 §2.7 line 266; listed but unaudited = `mismatched` |
| Status | The result for this row | One of three, by the rule below | `mismatched` | `exists` because the column was found, without checking route, tenant filter and audit |
| Proposed fix | What Core must add or change to make the row `exists` | Short and specific, Core only · `exists` → `—` · waiting on the PO → say so | `add POST /assets/{id}/return` · `waiting on PO Q2 (Note 06)` | "needs fixing", or a frontend fix — this column is for Core |

| Status | When |
|---|---|
| `exists` | **All four:** storage + route + tenant filter + audit (when required) **and** values/rules match the documents |
| `mismatched` | Present but different: missing values (4 statuses vs 5), nullable vs required, in detail but not in list, no tenant filter, no audit, or no route returning it |
| `missing` | Neither storage nor route |

Unsure between `exists` and `mismatched` → pick `mismatched` and explain in Proposed fix. A reviewer can catch
that error; the other one nobody sees.

## Copper — assets, custody, status/condition, warranty, scan, move location

UC-001 – 006, 008, 009, 011, 012 · Warranty · AC-001 – 013, AC-020 – 023, AC-027 – 030, G9-X06, G9-X09

Rows are pre-filled from PO documents 01–05: one row per field or action, every other column `?`.
Fill each `?`. **Add a row** for anything the documents require that is missing here; **do not delete** a row —
if it does not apply, write why in Proposed fix. Rows marked "to confirm" come from the frontend
`CORE-GAP:` markers (`src/features/asset-workspace/services/asset-core-mapping.ts`).

### Asset fields (03 §2.4)

| UC / field | Doc source | table.column | Route | Tenant filter | Audit | Status | Proposed fix |
|---|---|---|---|---|---|---|---|
| Asset ID (immutable) | 03 §2.4 · 05 §4.1 | `assets.id` (uuid PK, `gen_random_uuid()`) | `GET /api/core/v1/tenants/{id}/assets/list` · `GET /api/core/v1/tenants/{id}/assets/{assetId}` | `src/lib/core/asset-list-view.ts:99` · `src/app/api/core/v1/tenants/[id]/assets/[assetId]/route.ts:26` | n/a | exists | — (PATCH schema has no `id`, so it cannot change: `src/lib/core/asset-view.ts:257`) |
| Asset Name / Display Name | 03 §2.4 | `assets.name` (text, NOT NULL) | `GET …/assets/list` · `GET …/assets/{assetId}` · `POST …/assets` (as `device_name`) · `PATCH …/assets/{assetId}` | `src/lib/core/asset-list-view.ts:99` · `src/lib/core/asset-view.ts:339` | n/a (normal edit, 05 §4.2) | exists | — |
| Asset Category (reference on the asset) | 03 §2.4 · 05 §4.1 | `assets.asset_category_id` (FK `asset_categories`, set on 6/509) · `assets.asset_category` (free text, default `'OTHER'`) | `GET …/assets/list` (joined name, else free text: `asset-list-view.ts:64`) · `POST`/`PATCH` write the free text only (`asset-view.ts:213`, `:302`) | read: `asset-list-view.ts:99` · write: no check that the category exists in this tenant | — | mismatched | POST/PATCH take `asset_category_id`, validate it is an active category in the tenant (05 §4.7.1), re-check the category serial rule; backfill the FK from the free text; return the id in list/detail |
| Asset Tag / Asset Code (required, unique per org) | 03 §2.4 · 05 §4.12.1 | `assets.asset_code` (varchar, **nullable**; 472/509 set; **no unique index**, `pg_indexes` 2026-10-22) | `GET …/assets/{assetId}` only (`src/lib/core/asset-detail-view.ts:19`); not in the list select (`asset-list-view.ts:45`); not settable on POST or PATCH (`asset-view.ts:266`) | `src/app/api/core/v1/tenants/[id]/assets/[assetId]/route.ts:26` | — (Asset Tag Change is on the 03 §2.7 audit list; no change path exists) | mismatched | Backfill the 37 empty tags, then `NOT NULL` + unique `(tenant_id, asset_code)`; return it in list rows; accept it on POST (manual, or generated `PREFIX-NNNNNN` per 05 §4.12.1); controlled tag-change route with reason + `audit_events` |
| Serial Number (duplicate = warning + override + reason) | 03 §2.4 · 05 §4.1 · AC-003 | `assets.serial_number` (text, nullable; no unique index) | `GET …/assets/list` · `GET …/assets/{assetId}` · `POST …/assets` · `PATCH …/assets/{assetId}` | `src/lib/core/asset-view.ts:135` (dup check) · `:339` (update) | — | mismatched | POST hard-blocks a duplicate with 409 (`asset-view.ts:143`) and PATCH skips the check (`:301`). Return a duplicate warning; allow authorized override with reason, recorded in `audit_events`, on both POST and PATCH; enforce the category "Serial required" rule |
| Organization | 03 §2.4, §2.2 | `assets.tenant_id` (uuid, NOT NULL, FK `tenants`) | every route is scoped by `/tenants/{id}/…` | `src/app/api/core/v1/tenants/[id]/assets/list/route.ts:20` (`requireTenantMember`) + `.eq('tenant_id', …)` in each query (`asset-list-view.ts:99`) | n/a | exists | — (Organization is read as Core's tenant) |
| Current Location (reference on the asset) | 03 §2.4 · 01 §6.5 | `assets.location_id` (FK `locations`, set on 6/509) · legacy free text `assets.site`, `assets.zone` | `GET …/assets/list` returns only `building`/`floor`/`room` when `location_type` matches (`asset-list-view.ts:69`); no id or name; POST/PATCH never write `location_id` | read: `asset-list-view.ts:99` · write: — | — (Move Location is on the 03 §2.7 audit list) | mismatched | Return location id + name in list/detail; set `location_id` on POST, checked active and in the tenant; change it only through Move Location (see UC-012 row) |
| Current Custody Target (person / org_unit) | 03 §2.4, §2.5 · 01 §6.5 | `assets.custodian_org_unit_id` (FK `departments`, set on 229/509) · `assets.responsible_user_id` (FK `users`, set on 0/509) · legacy `assets.owner_name` (text) | `GET …/assets/list` returns `owner` = `owner_name` text (`asset-list-view.ts:67`); neither custody column is returned; POST/PATCH write `owner_name` directly (`asset-view.ts:214`, `:303`) | `asset-list-view.ts:99` | — (Assign/Return/Transfer are on the 03 §2.7 audit list) | mismatched | Return `{ type: person \| org_unit, id, name }` from the two custody columns, at most one set; drop `owner_name` from POST/PATCH (05 §4.2: custody is not a form field); change only via Assign/Return/Transfer |
| Lifecycle Status (5 values) | 03 §2.4, §2.6 · 05 §4.4 | `assets.status` (text, no constraint; live: `active`, `critical`, `Active`, `ต้องซ่อม`, `maintenance`) · `assets.lifecycle_status` (live: `ACTIVE`, `MAINTENANCE`, `INSTALLING`) · `assets.lifecycle_stage` (varchar, null on 509/509) | `GET …/assets/list` returns a 4-value status derived from those columns plus `owner_name` (`asset-list-view.ts:26`, `:29`); `PATCH` writes `lifecycle_stage` as free text (`asset-view.ts:312`) | `asset-list-view.ts:99` · `asset-view.ts:339` | partial: trigger `trg_log_asset_status` logs `status`/`lifecycle_status` changes to `asset_status_history` with no actor or reason, never `audit_events`; PATCH logs `lifecycle_stage` changes (`asset-view.ts:360`) without `from_status`/`to_status`, so `v_asset_activity_log` shows an empty description | mismatched | One status column with a check constraint for Available / Assigned / In Maintenance / Retired / Disposed; map the legacy values (needs a Lead/PO decision); return it in list/detail; remove free `currentStage` from PATCH; change only through controlled actions that record actor + reason in `audit_events` |
| Condition (4 values) | 03 §2.4, §2.6 · 05 §4.4 | `assets.condition_grade` (varchar(10), null on 509/509) · `asset_status_history.old_condition_grade`/`new_condition_grade` · `asset_condition_assessments` | — (not in the list or detail select, not in the PATCH schema) | — | — (trigger ignores this column) | mismatched | Earlier marker said `missing`: the column exists, unused. Add a check constraint for Good / Fair / Damaged / Unusable; return it in list/detail; change via UC-008 with reason + audit |
| Acquisition Date | 03 §2.4 · 05 §4.1 | `assets.purchase_date` (date, nullable) | `GET …/assets/list` as `receivedDate` (`asset-list-view.ts:72`) · `POST` · `PATCH` | `asset-list-view.ts:99` · `asset-view.ts:339` | n/a (normal edit, 05 §4.2) | mismatched | `receivedDate` falls back to `created_at` when empty (`asset-list-view.ts:72`), merging two fields 05 §4.1 keeps apart. Return `purchase_date` unchanged as its own field |
| Registration Date | 03 §2.4 · 05 §4.1 | `assets.created_at` (timestamptz, nullable, default `now()`) | — (only as the `receivedDate` fallback, `asset-list-view.ts:72`) | `asset-list-view.ts:99` | n/a | mismatched | Return `created_at` as its own registration date in list/detail; make the column NOT NULL |
| Notes | 03 §2.4 | `assets.notes` (text, nullable) | `GET …/assets/{assetId}` (`asset-detail-view.ts:19`) · `PATCH …/assets/{assetId}` (`asset-view.ts:311`); not accepted on POST | `src/app/api/core/v1/tenants/[id]/assets/[assetId]/route.ts:26` · `asset-view.ts:339` | n/a (normal edit, 05 §4.2) | mismatched | Accept `notes` on POST so Register can set it (today only a later PATCH can) |
| Attachments (Shared Files) | 03 §2.4, §2.2 | `asset_attachments` (`tenant_id` NOT NULL; two overlapping column sets: `storage_path`/`file_type`/`size_bytes`/`created_by` and `file_url`/`file_size`/`mime_type`/`uploaded_by`) · storage bucket `asset-attachments` | `GET`/`POST …/assets/{assetId}/attachments` · `DELETE …/attachments/{attachmentId}` | `src/app/api/core/v1/tenants/[id]/assets/[assetId]/attachments/route.ts:11` · `…/attachments/[attachmentId]/route.ts:24` | — (Attachment Add/Remove is on the 03 §2.7 audit list) | mismatched | Record add/remove in `audit_events`; DELETE removes the file and row outright (`src/lib/core/asset-attachments-view.ts:128`, `:131`), so keep a trace instead; choose one column set; confirm with Lead whether the `asset-attachments` bucket counts as Shared Files (03 §2.2) |

### Custody and transfer (03 §2.5)

| UC / field | Doc source | table.column | Route | Tenant filter | Audit | Status | Proposed fix |
|---|---|---|---|---|---|---|---|
| Custody record: Target Type + Target ID | 03 §2.5 Custody · 03 §2.3 (Asset 1 → N Custody History) | current target only, on the asset: `assets.custodian_org_unit_id` (229/509) · `assets.responsible_user_id` (0/509); no type column, no constraint that only one is set; no custody record table (`information_schema.tables` 2026-10-22) | — (neither column is returned or written by any route; see Current Custody Target row) | — | — | mismatched | New table `asset_custody_assignments` (`tenant_id`, `asset_id`, `target_type` person \| org_unit, `target_user_id` / `target_org_unit_id` with a check that exactly one matches the type), partial unique index on `asset_id` where `ended_at is null` (one active custody); keep `assets.*` columns as the current-target cache or drop them |
| Custody: Assigned At / Assigned By | 03 §2.5 Custody | — | — | — | — | missing | `assigned_at` + `assigned_by` (user id) on `asset_custody_assignments`, set by the Assign/Transfer route from the caller, never from the request body |
| Custody: Returned / Ended At | 03 §2.5 Custody · 04 UC-005 | — | — | — | — | missing | `ended_at` + `ended_by` on `asset_custody_assignments`, set by Return/Transfer in the same transaction that opens the next record or changes status |
| Custody: Handover Evidence (optional) | 03 §2.5 Custody · 05 §4.3 | — | — | — | — | missing | Optional `evidence_attachment_id` (or note) on `asset_custody_assignments`, pointing at the same attachment store as the Attachments row |
| Person reference (custody target source) | 03 §2.2 | `memberships` (`tenant_id`, `user_id`) → `users` | `GET /api/core/v1/tenants/{id}/members` | `src/app/api/core/v1/tenants/[id]/members/route.ts:84` | n/a (read-only reference, owned by People & Access) | exists | — (Assign/Transfer must check the target user has an active membership in the tenant; `assets.responsible_user_id` points at `users`, not `memberships`, so the FK alone does not prove it) |
| Organizational Unit reference (Organization Structure) | 03 §2.2 | `departments` (`tenant_id`, `parent_department_id`, soft delete `deleted_at`) | `GET /api/core/v1/tenants/{id}/organizations` | `src/app/api/core/v1/tenants/[id]/organizations/route.ts:20` (+ `deleted_at is null`, `:21`) | n/a (read-only reference, owned by Organization Structure) | exists | — (assumes `departments` is ThunderOne Organization Structure, 03 §2.8; Assign/Transfer must reject a deleted or inactive unit) |
| Transfer record: From / To / Date / By | 03 §2.5 Transfer · 04 UC-006 | — (no transfer table) | — | — | — (Transfer is on the 03 §2.7 audit list) | missing | Record a transfer as one transaction: close the old `asset_custody_assignments` row and open the new one, plus an `asset_custody_transfers` row (`from_assignment_id`, `to_assignment_id`, `transferred_at`, `transferred_by`) and an `audit_events` row |
| Transfer: Condition at time of transfer | 03 §2.5 Transfer · 05 §4.3 | — (`assets.condition_grade` exists but is never set; see Condition row) | — | — | — | missing | `condition_at_transfer` on `asset_custody_transfers`; the route blocks Damaged / Unusable (05 §4.3, AC-013) |
| Transfer: New Location (optional) | 03 §2.5 Transfer · AC-012 | — | — | — | — | missing | Optional `new_location_id` on `asset_custody_transfers`; when set, update `assets.location_id` and write the same location history as Move Location, in the same transaction |
| Transfer: Reason / Note / Evidence (optional) | 03 §2.5 Transfer | — | — | — | — | missing | Optional `reason`, `note`, `evidence_attachment_id` on `asset_custody_transfers`; copy the reason into the `audit_events` row |

### History, audit and warranty (03 §2.6 – 2.7)

| UC / field | Doc source | table.column | Route | Tenant filter | Audit | Status | Proposed fix |
|---|---|---|---|---|---|---|---|
| Asset History (business timeline) | 03 §2.7 | ? | ? | ? | ? | ? | ? |
| Audit Event (immutable, append-only) | 03 §2.7 line 266 | ? | ? | ? | ? | ? | ? |
| Status / Condition change Reason | 03 §2.6 · 05 §4.4 | ? | ? | ? | ? | ? | ? |
| Maintenance History | 03 §2.1 | ? | ? | ? | ? | ? | ? |
| Location History (moves) | 04 UC-012 · 05 §4.3 | ? | ? | ? | ? | ? | ? |
| Warranty Record: Provider / Type / Start / End / Reference No. / Coverage Note / Status | 03 §2.7 | ? | ? | ? | ? | ? | ? |
| Warranty: Attachment | 03 §2.7 | ? | ? | ? | ? | ? | ? |
| Warranty: many per asset, one Current/Primary chosen by user | 05 §4.13.5 · G9-X09 | ? | ? | ? | ? | ? | ? |
| Warranty: change history | 05 §4.13.5 | ? | ? | ? | ? | ? | ? |

### Actions (04 §3.2)

| UC / field | Doc source | table.column | Route | Tenant filter | Audit | Status | Proposed fix |
|---|---|---|---|---|---|---|---|
| UC-001 Register (incl. optional initial custody, no partial write) | 04 UC-001 · 05 §4.1 · AC-001–003 | ? | ? | ? | ? | ? | ? |
| UC-002 Search / filter (Tag, Name, Serial, Category, Location, Status, Condition, Custody) | 04 UC-002 · 05 §4.2 · AC-004 | ? | ? | ? | ? | ? | ? |
| UC-002 View Asset Profile | 04 UC-002 · 05 §4.2 · AC-005 | ? | ? | ? | ? | ? | ? |
| UC-003 Edit (normal fields) | 04 UC-003 · 05 §4.2 · AC-006 | ? | ? | ? | ? | ? | ? |
| UC-003 Controlled Asset Tag edit + concurrent-update guard | 04 UC-003 · AC-007 | ? | ? | ? | ? | ? | ? |
| UC-004 Assign / Handover | 04 UC-004 · 05 §4.3 · AC-008, 009 | ? | ? | ? | ? | ? | ? |
| UC-005 Return | 04 UC-005 · 05 §4.3 · AC-010, 011 | ? | ? | ? | ? | ? | ? |
| UC-006 Transfer | 04 UC-006 · 05 §4.3 · AC-012, 013 | ? | ? | ? | ? | ? | ? |
| UC-008 Change Status / Condition (transition rules) | 04 UC-008 · 05 §4.4 · AC-020, 021 | ? | ? | ? | ? | ? | ? |
| UC-009 Retire | 04 UC-009 · 05 §4.4 · AC-022, 023 | ? | ? | ? | ? | ? | ? |
| UC-009 Dispose + Disposal Method | 04 UC-009 · 05 §4.4 · AC-022, 023 | ? | ? | ? | ? | ? | ? |
| UC-011 Scan / Identify (lookup in current org only) | 04 UC-011 · 05 §4.7 · AC-027, 028 | ? | ? | ? | ? | ? | ? |
| UC-012 Move Location (custody unchanged) | 04 UC-012 · 05 §4.3 · AC-029, 030 | ? | ? | ? | ? | ? | ? |
| Controlled action errors: validation / stale state / permission | 04 §7.2 · G9-X06 | ? | ? | ? | ? | ? | ? |
| Organization switch shows only the current org | 04 §7.2 · G9-X01 | ? | ? | ? | ? | ? | ? |

## Zeepher — categories, locations, inventory, import, label/export, settings, reports

UC-007, 010, 013, 014 · Category · Location · Settings · Reports ·
AC-014 – 019, AC-024 – 026, AC-031 – 034, G9-X04, X05, X07, X08, X10

Same rules as above. A column you need on `assets` → add a row "needs `assets.<column>` → see Copper row" and tell Copper.

### Categories and locations (05 §4.7.1, §4.8)

| UC / field | Doc source | table.column | Route | Tenant filter | Audit | Status | Proposed fix |
|---|---|---|---|---|---|---|---|
| Category: Name / Description | 05 §4.7.1 | ? | ? | ? | ? | ? | ? |
| Category: Parent (hierarchy, no loop) | 05 §4.7.1 | ? | ? | ? | ? | ? | ? |
| Category: Active / Inactive (activate/deactivate, no hard delete) | 05 §4.7.1 | ? | ? | ? | ? | ? | ? |
| Category rule: Serial Number Optional / Required | 05 §4.7.1 · 03 §2.4 | ? | ? | ? | ? | ? | ? |
| Category: asset count + child count | 05 §4.7.1 | ? | ? | ? | ? | ? | ? |
| Categories List: search name + filter status / parent | 05 §4.7.1 | ? | ? | ? | ? | ? | ? |
| Location: Name / Address / Map | 05 §4.8 | ? | ? | ? | ? | ? | ? |
| Location: Parent (Site / Building / Floor / Room, no loop) | 05 §4.8 · 03 §2.1 | ? | ? | ? | ? | ? | ? |
| Location: Active / Inactive (no hard delete) | 05 §4.8 | ? | ? | ? | ? | ? | ? |
| Location: block deactivate with active assets or child locations | 05 §4.8 · G9-X07 | ? | ? | ? | ? | ? | ? |
| Location: Attachments | 05 §4.8 | ? | ? | ? | ? | ? | ? |
| Location: History | 05 §4.8 | ? | ? | ? | ? | ? | ? |
| Location: asset count | 05 §4.8 | ? | ? | ? | ? | ? | ? |

### Inventory (03 §2.5 – 2.5.1)

| UC / field | Doc source | table.column | Route | Tenant filter | Audit | Status | Proposed fix |
|---|---|---|---|---|---|---|---|
| Inventory Session: Name / Description / Due Date / Owner | 03 §2.5.1 | ? | ? | ? | ? | ? | ? |
| Session lifecycle: DRAFT → IN PROGRESS → COMPLETED → CLOSED, CANCELLED + Reason | 03 §2.5.1 · 05 §4.9 | ? | ? | ? | ? | ? | ? |
| Session Scope: Locations / OUs / Categories / Custodian, or Specific Assets | 03 §2.5.1 | ? | ? | ? | ? | ? | ? |
| Expected Asset Snapshot (frozen at Start) | 03 §2.5, §2.5.1 | ? | ? | ? | ? | ? | ? |
| Verification Assignment (Person / Manager / OU, never changes custody) | 03 §2.5 | ? | ? | ? | ? | ? | ? |
| Inventory Verification result: Verified / Mismatch / Not Found / Unexpected | 03 §2.5 | ? | ? | ? | ? | ? | ? |
| Inventory Finding / Discrepancy | 03 §2.5 | ? | ? | ? | ? | ? | ? |
| Reconciliation Decision (no auto-update of Asset Master) | 03 §2.5, §2.5.1 | ? | ? | ? | ? | ? | ? |
| Start Inventory: create, freeze snapshot, derive assignments, notify | 03 §2.5.1 · 05 §4.9 | ? | ? | ? | ? | ? | ? |
| Notify assignees (Shared Notification) | 03 §2.2, §2.5.1 | ? | ? | ? | ? | ? | ? |
| UC-007 Inventory Verification end to end | 04 UC-007 · 05 §4.5, §4.9 · AC-014–019 | ? | ? | ? | ? | ? | ? |

### Import, label and export

| UC / field | Doc source | table.column | Route | Tenant filter | Audit | Status | Proposed fix |
|---|---|---|---|---|---|---|---|
| Import Batch: ID / Org / Source File / By / At / row counts / Status | 03 §2.5 Import | ? | ? | ? | ? | ? | ? |
| Import Row: Severity (Valid / Warning / Error) + Result | 03 §2.5 Import | ? | ? | ? | ? | ? | ? |
| Re-import links the Original Import ID | 03 §2.5 Import | ? | ? | ? | ? | ? | ? |
| UC-010 Bulk Import: upload → map → review → complete, error file | 04 UC-010 · 05 §4.6 · AC-024–026 | ? | ? | ? | ? | ? | ? |
| UC-013 Label data: Tag / Name / QR / Code128, PDF 50×30 mm | 04 UC-013 · 05 §4.7, §4.12.2 · AC-031, 032 | ? | ? | ? | ? | ? | ? |
| QR resolve respects org isolation + view permission | 05 §4.7 | ? | ? | ? | ? | ? | ? |
| UC-014 Export CSV (authorized scope + field permission) | 04 UC-014 · 05 §4.7 · AC-033, 034 | ? | ? | ? | ? | ? | ? |
| Manager-scoped Export / Label; Employee blocked | 04 §7.2 · G9-X02, X03 | ? | ? | ? | ? | ? | ? |

### Settings and reports (05 §4.12, §4.13.5)

| UC / field | Doc source | table.column | Route | Tenant filter | Audit | Status | Proposed fix |
|---|---|---|---|---|---|---|---|
| Settings: Asset Tag format (prefix 2–8, 6-digit counter, no reset) | 05 §4.12.1 · G9-X08 | ? | ? | ? | ? | ? | ? |
| Settings: Manual Tag override + unique check | 05 §4.12.1 | ? | ? | ? | ? | ? | ? |
| Settings: Label defaults | 05 §4.12.2 | ? | ? | ? | ? | ? | ? |
| Settings: Inventory defaults | 05 §4.12.3 | ? | ? | ? | ? | ? | ? |
| Settings: Workspace preferences | 05 §4.12.4 | ? | ? | ? | ? | ? | ? |
| Settings: edit by Asset Admin only, enforced server-side | 05 §4.12 · 02 §3.6 · G9-X04, X05 | ? | ? | ? | ? | ? | ? |
| Report: Asset Summary | 05 §4.13.5 · G9-X10 | ? | ? | ? | ? | ? | ? |
| Report: Assets by Location | 05 §4.13.5 · G9-X10 | ? | ? | ? | ? | ? | ? |
| Report: Assets by Custody | 05 §4.13.5 · G9-X10 | ? | ? | ? | ? | ? | ? |
| Report: Warranty Expiry | 05 §4.13.5 · G9-X10 | ? | ? | ? | ? | ? | ? |
| Report: Inventory Summary | 05 §4.13.5 · G9-X10 | ? | ? | ? | ? | ? | ? |
| Report: Lifecycle Summary | 05 §4.13.5 · G9-X10 | ? | ? | ? | ? | ? | ? |
| Report CSV export (read-only, authorized scope) | 05 §4.13.5 | ? | ? | ? | ? | ? | ? |
