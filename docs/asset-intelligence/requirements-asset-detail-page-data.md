# Requirements: Asset Detail Page (`/asset-intelligence/assets/all/[assetId]`) Data

> Written 2026-08-26 · Requested by: Thunder One frontend team · Status: **open — nothing below is built yet**
>
> Scope: the single-asset drill-down page reached by clicking a row in the Asset List. List + Create + Edit + single-asset read are already a complete, tested CRUD surface (see `asset-list-page-api-gap-analysis.md` and its follow-up-fixes section) — this doc only covers what that page's UI still can't show because Core has no backing data for it.

## TL;DR

The page has 8 cards. 3 already render real data from the existing `GET .../assets/{assetId}` endpoint (Asset Identity, Status & Allocation, Additional Info) — those are covered below only where they're missing a handful of fields. The other 5 cards (Lifecycle, Warranty & Support, Related Documents, Latest Count, Activity History) have **no backing concept in Core's schema at all today** and currently render an explicit "ยังไม่มีข้อมูลนี้ในระบบ" (no data available) placeholder rather than fake content.

Priority order below is ours (frontend), based on apparent implementation cost — Core should correct it based on what actually already exists in the schema, the way the List page gap analysis did (e.g. `locations` hierarchy existed and just needed data, not a migration).

## P1 — Field additions to the existing asset row

No new concepts, just more columns on whatever Core already reads for `GET .../assets/{assetId}` / `.../assets/list`.

**Asset Identity card:**

| Field | Type | Notes |
|---|---|---|
| `assetTag` | string, nullable | Internal asset tag — distinct from `id` |
| `barcode` | string, nullable | For barcode scanners — distinct from the QR code (which already encodes `id`) |
| `color` | string, nullable | |

**Additional Info card:**

| Field | Type | Notes |
|---|---|---|
| `productGroup` | string, nullable | |
| `assetCode` | string, nullable | Confirm with Core whether this is a duplicate of `assetTag` above before adding both |
| `dimensions` | string, nullable | Free text (e.g. `"30x20x5 cm"`) unless Core prefers structured L/W/H |
| `weight` | number, nullable | |
| `accessories` | string[], nullable | |
| `notes` | string, nullable | |

## P2 — Status & Allocation event data

The card already shows status/location/current holder from the List row. Missing is the *event* of the current allocation:

| Field | Type | Notes |
|---|---|---|
| `allocatedAt` | date, nullable | When the current holder received it |
| `allocatedBy` | string, nullable | Who assigned it |
| `purpose` / `note` | string, nullable | Why it was allocated |

Open question for Core: is this a field on the asset row (only the *current* allocation matters), or does the business want allocation history (a small `asset_allocations` table)? We only need the former for this card; flagging the latter in case Core already has a table like this from elsewhere.

## P3 — Lifecycle (minimum viable)

No lifecycle-stage concept exists today per the asset schema exposed to us so far. Requesting the smallest version that unblocks the card:

| Field | Type | Notes |
|---|---|---|
| `currentStage` | string (enum TBD) | e.g. Procurement / Received / Deployed / Maintenance / Retired |
| `stageChangedAt` | date, nullable | |

A full stage-history timeline (multiple past transitions with dates/actors) would be nicer but is explicitly *not* required to close this card — the above two fields are enough for a first version.

## P4 — Warranty & Support

New sub-resource, still just structured fields (no file storage needed):

| Field | Type | Notes |
|---|---|---|
| `vendor` | string, nullable | |
| `warrantyStart` | date, nullable | |
| `warrantyEnd` | date, nullable | |
| `supportContact` | string, nullable | Name/phone/email, free text is fine |
| `contractRef` | string, nullable | |

## P5 — Latest Count

| Field | Type | Notes |
|---|---|---|
| `lastCountedAt` | date, nullable | |
| `countedBy` | string, nullable | |
| `result` | string (enum: matched / discrepancy), nullable | |
| `note` | string, nullable | |

**Flag for Core:** the Asset Count page (`/asset-intelligence/assets/count`) is a separate, still-fully-mock feature on our side that will eventually own this exact data. Before building a standalone version of this for the Detail page, worth deciding whether this card should just read from whatever table backs that future feature, to avoid building the same concept twice.

## P6 — Related Documents

| Field | Type | Notes |
|---|---|---|
| `fileName` | string | |
| `fileUrl` | string | |
| `uploadedAt` | date | |
| `uploadedBy` | string | |
| `docType` | string, nullable | e.g. invoice / warranty card / manual |

**Blocked on a question, not just a build:** does Core have file storage at all today? If not, this is a much bigger lift than everything above (storage + upload endpoint + this read), and should probably move behind P7 in practice regardless of how it's numbered here.

## P7 — Activity History

| Field | Type | Notes |
|---|---|---|
| `actor` | string | |
| `action` | string | |
| `timestamp` | date | |
| `detail` | string, nullable | |

This is an audit feed, not an asset-specific feature — a real implementation likely touches every mutation across Core, not just assets. Lowest priority on our side; flagging that this may deserve to be scoped as its own project rather than squeezed into this page's ticket.

## Suggested path

Ask Core to scope **P1 → P2 → P3 → P4** first — all four are additive fields with no unresolved architectural question attached. Re-evaluate P5–P7 based on what Core reports already exists (an Asset Count backing table, file storage, any existing audit log) rather than us assuming greenfield for any of the three.

## Open questions for Core

1. Does `assetCode` (Additional Info) duplicate `assetTag` (Asset Identity) as a concept? We don't want to add both if they're the same thing under two names.
2. For Status & Allocation (P2): current-allocation fields on the asset row, or a real allocation-history table? We only need the former to close this card.
3. For Latest Count (P5): should this read from the same backing store the (currently mock, not yet built) Asset Count feature will eventually use, once that exists?
4. For Related Documents (P6): does Core have any file storage today, or would this be greenfield?
5. For Activity History (P7): does any audit/event log already exist anywhere in Core that this could read from, even a partial one scoped to a different feature?
