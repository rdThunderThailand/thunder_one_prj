# Plan: Asset Admin screens — who owns what

Every Asset Admin route from ADR 0097 exists as a placeholder page (`ScreenPlaceholder`) with its nav
link and Help `screenKey` already registered, so the two owners never edit the same shared file to
add a screen. Manager and Employee screens are not scaffolded yet.

Spec references are the PO documents 01–05 (v1.1.5, split 2026-10-18).

## Ownership

| Route (`/asset-workspace…`) | Screen | Spec | Owner |
|---|---|---|---|
| `/` | Overview | 01 §4 (daily use) | A |
| `/assets` | Assets List | UC-002 · 05 §4.2 | A |
| `/assets/[assetId]` | Asset Profile | UC-002, UC-003 · 05 §4.2, §4.11 | A |
| `/assets/register` | Register Asset | UC-001 · 05 §4.1 | A |
| `/assets/scan` | Scan Asset | UC-011 · 05 §4.7 | A |
| `/assignments` | Assignments | UC-004 – UC-006 · 05 §4.3 | A |
| `/lifecycle-warranty` | Lifecycle & Warranty | UC-008, UC-009 · 05 §4.4, §4.13.5 | A |
| `/assets/import` | Bulk Import | UC-010 · 05 §4.6 | B |
| `/inventory` | Inventory Sessions | UC-007 · 05 §4.5, §4.9 | B |
| `/inventory/[sessionId]` | Inventory Session | UC-007 · 05 §4.9 | B |
| `/categories` | Categories | 05 §4.7.1 | B |
| `/categories/[categoryId]` | Category Detail | 05 §4.7.1 | B |
| `/locations` | Locations | 05 §4.8 | B |
| `/locations/[locationId]` | Location Detail | 05 §4.8 | B |
| `/reports` | Reports | 05 §4.13.5 | B |
| `/settings` | Settings | 05 §4.12 | B |

Label print / Export (UC-013, UC-014) are actions, not routes: B builds them, A places the buttons on
Assets List and Asset Profile.

## Shared files

| File | Rule |
|---|---|
| `src/features/asset-workspace/domain/**`, `components/controlled-action/**` | A owns; B asks A for a new rule |
| `src/features/asset-workspace/components/states/**`, `ScreenPlaceholder.tsx` | No changes without both owners |
| `src/config/nav/asset-workspace*.ts*`, `src/features/help/screens.ts` | Already complete for Admin; a new route needs an ADR 0097 amendment first |
| `src/components/ui/icons.tsx` | ADR 0098 §4 set is complete; add a glyph only for a concept not in that map |

## Feature folders

Each owner creates `src/features/asset-workspace/<area>/` (components, services) for their screens when
they start one; `<area>` follows the route (`assets`, `inventory`, `categories` …). Nothing is created
ahead of time.

## Before building

Each owner first fills their rows of the Core gap matrix (`docs/asset-workspace/core-gap-matrix.md`):
table, API route on Thunder_Core `develop`, tenant filter, audit — read-only, no migrations.
