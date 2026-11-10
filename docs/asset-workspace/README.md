# Asset Workspace, Assets feature — handoff overview

Read this first, then the Core API docs for contracts. Status as of 2026-11-06: built on branch
`feat/asset-workspace-asset-profile` (37 commits ahead of `origin/dev`, **not pushed, no PR**).
All 30 `.check.mts` logic scripts pass. **Browser acceptance of Bulk Import is still to be done** (ADR 0101).

| Document | Role |
| --- | --- |
| `docs/adr/0097-asset-workspace-is-a-new-app-beside-asset-intelligence.md` | why this is a new App; the feature flag |
| `docs/adr/0098-asset-workspace-uses-the-design-system-core-with-a-local-profile.md` | UI rules |
| `docs/adr/0101-bulk-import-reports-a-core-owned-batch.md` | Bulk Import rules; status is proposed |
| `docs/asset-workspace/core-gap-matrix.md` | screens against Core tables and routes |
| [Categories handoff](categories.md) | subsequent Categories batch, count links and contextual Single Registration; verification and Core prerequisites |
| `Thunder_Core/docs/api/asset-workspace-*.md` | API contracts: assets, single registration, bulk import, export, labels, scan, profile |

## The shape

```
Browser (src/features/asset-workspace)
  → /api/proxy/v2/asset-workspace/assets/*   same origin; checks session, tenant and user
  → Core /api/core/v2/tenants/{tenant}/asset-workspace/assets/*

/asset-workspace/assets
├─ Register Asset ── /assets/register ── Single Register | Bulk Assets
│                                        Bulk Assets ── /assets/import
├─ Scan Asset ───── dialog on the list; /assets/scan redirects to ?scan=1
├─ Export ───────── selected rows | current filters
├─ Generate Labels ─ selected rows
├─ Import History ── finished batches
└─ Row ──────────── /assets/{assetId} (view-only Asset Profile)

Printed QR ── /{tenantId}/assets/{assetId} ── login if needed ── Asset Profile
```

Core owns the data and rules. The browser parses files and draws labels, but never decides whether an
Asset was created.

## What is included

| Feature | Behavior | Code |
| --- | --- | --- |
| Assets list | Summary, filters, sort, pagination and row selection; filters live in the URL | `components/assets-list/` |
| Asset Profile | View-only details and list thumbnails | `components/asset-profile/` |
| Single Register | 5 steps: Basic Information, Category & Specification, Location & Ownership, Acquisition & Warranty, Review & Confirm | `components/register-asset/` |
| Bulk Import | 4 steps: Upload File, Map & Validate, Review & Confirm, Complete | `components/bulk-import/` |
| Import History | Finished batches and their files | `components/import-history/` |
| Export | CSV made by Core, up to 10,000 Assets | `hooks/use-asset-export.ts` |
| Labels | 50 × 30 mm PDF with QR and Code128, up to 500 Assets, made in the browser | `components/asset-labels/` |
| Scan | Camera or manual entry; QR and Code128 | `components/scan-asset/` |

This overview covers the Assets batch. Categories were implemented subsequently; see the
[Categories handoff](categories.md) for their scope and verification. Overview has its own owner;
Assignments, Inventory, Lifecycle, Locations, Reports and Settings were not built by the Assets batch.

## Single Register

The text draft is kept in `sessionStorage` per tenant and user. Photos and documents are kept in IndexedDB
for 24 hours, so a reload can recover them. File limits and types come from Core
(`/registration-options`).

## Bulk Import

- Files are `.xlsx` or `.csv`, up to 10 MB and 5,000 rows. These limits come from Core (`/imports/options`).
- The batch status picks the step, and `?batch=<id>` lets a reload land on the right one.
- The result comes from Core. A retry first reads the batch, so no Asset is created twice (ADR 0101).
- Rows with errors are fixed in the Error File, then imported as a new linked batch.
- In development, `?preview=upload` shows the upload step without a batch.

## Export and labels

- Export sends either `asset_ids` or the current filters. Page and sort are not part of the request.
- Label data comes from `POST /labels`. The QR value is a link, not the Asset Tag.
- Label text is drawn as an image so Thai shapes correctly. QR and barcode stay as vectors.

## Dependencies

Added to `package.json`. All are loaded with dynamic `import()`, so they stay out of the first page load.

| Package | Version | Used for | Where |
| --- | --- | --- | --- |
| `xlsx` (SheetJS CE) | 0.20.3 | read uploads; write templates and the Error File | `services/asset-import-xlsx*.ts`, `asset-import-error-xlsx.ts` |
| `jsbarcode` | 3.12.3 | Code128 on labels | `services/asset-label-codes.ts`, `asset-label-preparation.ts` |
| `pdf-lib` | 1.17.1 | build the label PDF | `services/asset-label-pdf.ts` |
| `@zxing/browser` | ^0.2.1 | camera scanning | `hooks/use-asset-camera.ts` |
| `mapbox-gl` | 3.22.0 | Overview map (Overview work, not Assets) | `components/overview/AssetMap.tsx` |

Labels also use `qrcode`, which was already installed.

- **`xlsx` installs from `cdn.sheetjs.com`, not npm.** `pnpm install` needs access to that host. Do not run
  `pnpm add xlsx`: it would replace this version with the older npm release.
- **`mapbox-gl` is not open source.** Its licence is Mapbox's own, and use needs a Mapbox token.

## Environment variables

**Frontend**: copy `.env.example` to `.env.local`.

| Variable | Needed | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_ASSET_WORKSPACE_MVP` | yes | must be `1`, or every `/asset-workspace` and QR route is Not Found. Build-time, so restart after changing it. **Not in `.env.example` yet; add it by hand** |
| `CORE_API_URL` | yes | Core base URL. Server only |
| `CORE_API_KEY` | yes | Core app key. Server only, never `NEXT_PUBLIC_` |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Overview map only | public `pk.` token; when unset, the map shows "Map unavailable" |

**Core server**

| Variable | Needed | Notes |
| --- | --- | --- |
| `THUNDER_ONE_APP_URL` | labels and QR | the frontend origin with no path, e.g. `http://localhost:3000`. Production needs `https`. Without it, `POST /labels` returns 500 |

## Testing

```bash
pnpm install
pnpm dev
pnpm lint
pnpm exec tsc --noEmit
```

Run one logic check at a time. There are 30 under `src/features/asset-workspace/`:

```bash
node src/features/asset-workspace/services/asset-import-xlsx.check.mts
```

For browser testing:

- Sign in as **manager or above**. Core refuses import, export, labels and registration uploads below that.
- Core needs the merged routes from `develop` (rdThunderThailand/Thunder_Core#312 for labels and Import History).
- The camera needs HTTPS or `localhost`. Otherwise use manual entry.
- A phone cannot open a printed QR that points at `localhost`; set the origin to a host the phone can reach.
- Allow pop-ups for Print Labels, because it opens the PDF in a new tab.
- Test only on a safe database. Imports create real Assets.

## Shared code touched

Review these first; they reach beyond this feature.

| File | Change |
| --- | --- |
| `src/app/api/proxy/[...path]/route.ts` | adds the `v2/asset-workspace/assets` path and its session, context and origin checks. The subsequent Categories batch also permits `v2/asset-workspace/categories`; other `v2` paths return 404; `v1` still goes through |
| `src/proxy.ts` | flag-gates QR routes; sends a signed-out QR scan to login and back |
| `src/components/ui/StatTile.tsx`, `WizardSteps.tsx`, `charts/DonutChartImpl.tsx`, `lovable/progress.tsx` | adjusted for these screens |

## Known gaps

- Core adds `'` before Error File values starting with `=`, `+`, `-` or `@`, and nothing removes it on
  re-upload (ADR 0101).
- Clean-up of batches abandoned before confirm is not decided (ADR 0101).
- Real role behavior (manager, company admin, below manager) has not been tested with real users.
- The former 257-line `SingleAssetWizard.tsx` was split by the subsequent Categories entry work into a 31-line wrapper and 241-line form; see the [Categories handoff](categories.md#register-from-a-category). Source checks passed; browser acceptance remains pending.

## Out of scope

Editing an Asset, editing a row on screen during import (ADR 0101), choosing export columns, and the other
Asset Workspace screens listed above.
