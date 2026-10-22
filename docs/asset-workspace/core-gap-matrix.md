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

The first four rows come from the `CORE-GAP:` markers in the frontend adapter
(`src/features/asset-workspace/services/asset-core-mapping.ts`). Confirm each against Core.

| UC / field | Doc source | table.column | Route | Tenant filter | Audit | Status | Proposed fix |
|---|---|---|---|---|---|---|---|
| Asset Status (5 values) | 03 §2.4, §2.6 | ? | `/api/core/v1/assets` | ? | ? | mismatched (to confirm) | Core has 4 legacy values (Ready, In Use, In Progress, Retired-Cancelled), no Disposed |
| Asset Condition (4 values) | 03 §2.4, §2.6 | ? | — | ? | ? | missing (to confirm) | No condition column seen from FE |
| Custody target (person / org_unit) | 03 §2.5 Custody, 01 §6.5 | ? | `/api/core/v1/assets` | ? | ? | mismatched (to confirm) | Owner arrives as display text only: no id, no person/org-unit type |
| Asset Tag (required, unique) | 03 §2.4 | `assets.asset_code`? | detail only | ? | ? | mismatched (to confirm) | Nullable, and missing from list rows |

## Zeepher — categories, locations, inventory, import, label/export, settings, reports

UC-007, 010, 013, 014 · Category · Location · Settings · Reports ·
AC-014 – 019, AC-024 – 026, AC-031 – 034, G9-X04, X05, X07, X08, X10

| UC / field | Doc source | table.column | Route | Tenant filter | Audit | Status | Proposed fix |
|---|---|---|---|---|---|---|---|
