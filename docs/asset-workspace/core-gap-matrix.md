# Asset Workspace MVP — Core gap matrix

**Status:** in progress (stage 0) · started 2026-10-22 · due 2026-10-27
**Scope:** PO documents 01–05 (v1.1.5), UC-001 – UC-014, G9 AC-001 – AC-034 and G9-X01 – X10.
**Source of truth:** Thunder_Core `develop` (code + migrations) and the develop DB (SELECT only).

One row per UC or canonical field (03 §2.4–2.5). Each owner edits only their own section.
The `assets` table belongs to Copper: Zeepher writes "needs → see Copper row" and tells Copper.

| Column | Meaning |
|---|---|
| UC / field | The use case or field being checked |
| Doc source | Section in the PO documents, e.g. `03 §2.4` |
| table.column | Where Core stores it, or `—` |
| Route | Core route that reads/writes it, or `—` |
| Tenant filter | The RPC/route that filters by tenant (isolation lives in RPCs, not RLS) |
| Audit | Where the change is recorded (history table, audit log), or `—` |
| Status | `exists` / `mismatched` / `missing` |
| Proposed fix | What Core needs; empty only when status is `exists` |

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
