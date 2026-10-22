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
| Asset ID (immutable) | 03 §2.4 | ? | ? | ? | ? | ? | ? |
| Asset Name / Display Name | 03 §2.4 | ? | ? | ? | ? | ? | ? |
| Asset Category (reference on the asset) | 03 §2.4 · 05 §4.1 | ? | ? | ? | ? | ? | ? |
| Asset Tag / Asset Code (required, unique per org) | 03 §2.4 · 05 §4.12.1 | `assets.asset_code`? | detail only | ? | ? | mismatched (to confirm) | Nullable, and missing from list rows |
| Serial Number (duplicate = warning + override + reason) | 03 §2.4 | ? | ? | ? | ? | ? | ? |
| Organization | 03 §2.4, §2.2 | ? | ? | ? | ? | ? | ? |
| Current Location (reference on the asset) | 03 §2.4 · 01 §6.5 | ? | ? | ? | ? | ? | ? |
| Current Custody Target (person / org_unit) | 03 §2.4, §2.5 · 01 §6.5 | ? | `/api/core/v1/assets` | ? | ? | mismatched (to confirm) | Owner arrives as display text only: no id, no person/org-unit type |
| Lifecycle Status (5 values) | 03 §2.4, §2.6 | ? | `/api/core/v1/assets` | ? | ? | mismatched (to confirm) | Core has 4 legacy values (Ready, In Use, In Progress, Retired-Cancelled), no Disposed |
| Condition (4 values) | 03 §2.4, §2.6 · 05 §4.4 | ? | — | ? | ? | missing (to confirm) | No condition column seen from FE |
| Acquisition Date | 03 §2.4 | ? | ? | ? | ? | ? | ? |
| Registration Date | 03 §2.4 | ? | ? | ? | ? | ? | ? |
| Notes | 03 §2.4 | ? | ? | ? | ? | ? | ? |
| Attachments (Shared Files) | 03 §2.4, §2.2 | ? | ? | ? | ? | ? | ? |

### Custody and transfer (03 §2.5)

| UC / field | Doc source | table.column | Route | Tenant filter | Audit | Status | Proposed fix |
|---|---|---|---|---|---|---|---|
| Custody record: Target Type + Target ID | 03 §2.5 Custody | ? | ? | ? | ? | ? | ? |
| Custody: Assigned At / Assigned By | 03 §2.5 Custody | ? | ? | ? | ? | ? | ? |
| Custody: Returned / Ended At | 03 §2.5 Custody | ? | ? | ? | ? | ? | ? |
| Custody: Handover Evidence (optional) | 03 §2.5 Custody | ? | ? | ? | ? | ? | ? |
| Person reference (custody target source) | 03 §2.2 | ? | ? | ? | ? | ? | ? |
| Organizational Unit reference (Organization Structure) | 03 §2.2 | ? | ? | ? | ? | ? | ? |
| Transfer record: From / To / Date / By | 03 §2.5 Transfer | ? | ? | ? | ? | ? | ? |
| Transfer: Condition at time of transfer | 03 §2.5 Transfer | ? | ? | ? | ? | ? | ? |
| Transfer: New Location (optional) | 03 §2.5 Transfer · AC-012 | ? | ? | ? | ? | ? | ? |
| Transfer: Reason / Note / Evidence (optional) | 03 §2.5 Transfer | ? | ? | ? | ? | ? | ? |

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
