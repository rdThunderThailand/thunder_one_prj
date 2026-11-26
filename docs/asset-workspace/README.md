# Asset Workspace — handoff overview

Read this first, then the feature handoffs below and the Core API docs for contracts. Status as of 2026-11-26:
every Asset Workspace feature is merged into `feat/assetworkspace` and pushed; no pull request to `dev` yet.
There are 94 `.check.mts` logic scripts under `src/features/asset-workspace/`. **Browser acceptance of Bulk Import
is still to be done** (ADR 0131), and most saves have not been run against a server (see Known gaps).

| Document | Role |
| --- | --- |
| `docs/adr/0097-asset-workspace-is-a-new-app-beside-asset-intelligence.md` | why this is a new App; the feature flag |
| `docs/adr/0098-asset-workspace-uses-the-design-system-core-with-a-local-profile.md` | UI rules |
| `docs/adr/0131-bulk-import-reports-a-core-owned-batch.md` | Bulk Import rules; status is proposed |
| `docs/asset-workspace/core-gap-matrix.md` | screens against Core tables and routes |
| [Categories handoff](categories.md) | Categories, count links and Single Registration from a category |
| [Assignments handoff](assignments.md) | Assign, Transfer, Return, Move Location and assignment history |
| [Employee portal handoff](employee-portal.md) | Home, My Assets, My Tasks and Scan Asset for employees |
| `Thunder_Core/docs/api/asset-workspace-*.md` | API contracts for every Core route the screens call |

## The shape

```
Browser (src/features/asset-workspace)
  → /api/proxy/v2/asset-workspace/{assets,categories,locations}/*   same origin; checks session, tenant and user
  → Core /api/core/v2/tenants/{tenant}/asset-workspace/*

Server pages and Server Actions (services/*-api.ts, *-actions.ts, *-first-data.ts)
  → Core /api/core/v2/tenants/{tenant}/asset-workspace/*   directly, with the server-only app key

/asset-workspace/assets
├─ Register Asset ── /assets/register ── Single Register | Bulk Assets
│                                        Bulk Assets ── /assets/import
├─ Scan Asset ───── dialog on the list; /assets/scan redirects to ?scan=1
├─ Export ───────── selected rows | current filters
├─ Generate Labels ─ selected rows
├─ Import History ── finished batches
└─ Row ──────────── /assets/{assetId} (Asset Profile, its tabs and actions)

Printed QR ── /{tenantId}/assets/{assetId} ── login if needed ── Asset Profile
```

Core owns the data and rules. The browser parses files and draws labels, but never decides whether an
Asset was created.

## What is included

| Feature | Behavior | Code |
| --- | --- | --- |
| Assets list | Summary, filters, sort, pagination and row selection; filters live in the URL | `components/assets-list/` |
| Asset Profile | Details, tabs (Overview, Assignments, Location, Files, Lifecycle & Warranty, History; each kept once opened), photos; Set as Current for a warranty; the server starts the first reads with the page | `components/asset-profile/`, `services/asset-profile-first-data.ts` |
| Edit Asset | Edit form; the server starts detail and options with the page | `components/asset-edit/`, `services/asset-edit-first-data.ts` |
| Asset actions | Assign, Transfer, Return (see [Assignments](assignments.md)), Change Status, Retire, Dispose, Label, Add / Edit Warranty | `components/assignments/`, `components/lifecycle/`, `components/lifecycle-warranty/` |
| Single Register | 5 steps: Basic Information, Category & Specification, Location & Ownership, Acquisition & Warranty, Review & Confirm | `components/register-asset/` |
| Bulk Import | 4 steps: Upload File, Map & Validate, Review & Confirm, Complete | `components/bulk-import/` |
| Import History | Finished batches and their files | `components/import-history/` |
| Export | CSV made by Core, up to 10,000 Assets | `hooks/use-asset-export.ts` |
| Labels | 50 × 30 mm PDF with QR and Code128, up to 500 Assets, made in the browser | `components/asset-labels/` |
| Scan | Camera or manual entry; QR and Code128 | `components/scan-asset/` |

The other screens of the App:

| Screen | Route under `/asset-workspace` | Code |
| --- | --- | --- |
| Overview | `/` | `components/overview/` |
| Assignments | `/assignments` | `components/assignments/`; see the [Assignments handoff](assignments.md) |
| Categories | `/categories` | `components/categories/`; see the [Categories handoff](categories.md) |
| Locations | `/locations` | `components/locations/` |
| Inventory | `/inventory` | `components/inventory/` |
| Lifecycle & Warranty | `/lifecycle-warranty` | `components/lifecycle-warranty/` |
| Reports | `/reports` | `components/reports/` |
| Settings (Asset Admin only) | `/settings` | `components/settings/` |
| Employee portal | `/home`, `/my-assets`, `/my-tasks`, `/scan-asset` | see the [Employee portal handoff](employee-portal.md) |
| Controlled action demo | `/controlled-action-demo` | `components/controlled-action/`; not in the nav, to be removed |

## Single Register

The text draft is kept in `sessionStorage` per tenant and user. Photos and documents are kept in IndexedDB
for 24 hours, so a reload can recover them. File limits and types come from Core
(`/registration-options`).

## Bulk Import

- Files are `.xlsx` or `.csv`, up to 10 MB and 5,000 rows. These limits come from Core (`/imports/options`).
- The batch status picks the step, and `?batch=<id>` lets a reload land on the right one.
- The result comes from Core. A retry first reads the batch, so no Asset is created twice (ADR 0131).
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

Run one logic check at a time. There are 94 under `src/features/asset-workspace/`:

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
| `src/app/api/proxy/[...path]/route.ts` | adds the `v2/asset-workspace/{assets,categories}` paths and the read-only `v2/asset-workspace/locations` list, with session, context and origin checks; other `v2` paths return 404; `v1` still goes through |
| `src/proxy.ts` | flag-gates QR routes; sends a signed-out QR scan to login and back |
| `src/components/ui/StatTile.tsx`, `WizardSteps.tsx`, `charts/DonutChartImpl.tsx` | adjusted for these screens |
| `src/components/layout/Sidebar.tsx`, `asset-workspace-sidebar.tsx` (new), `PageHeader.tsx` | Asset Workspace nav by role; header actions wrap on narrow screens |
| `src/config/asset-workspace-access.ts`, `asset-workspace-guard.ts`, `nav/asset-workspace*.ts(x)`, `env.ts` | role resolver, route-group guard, nav per role, Mapbox token |
| `src/lib/core/core-get.ts` | a 403 from Core is logged as a warning, not an error |

## Known gaps

- Core adds `'` before Error File values starting with `=`, `+`, `-` or `@`, and nothing removes it on
  re-upload (ADR 0131).
- Clean-up of batches abandoned before confirm is not decided (ADR 0131).
- Real role behavior (manager, company admin, below manager) has not been tested with real users.
- Not run against a server: Edit Asset save, Move Location save, Set as Current save, and the Assignment saves.
- The former 257-line `SingleAssetWizard.tsx` was split by the subsequent Categories entry work into a 31-line wrapper and 241-line form; see the [Categories handoff](categories.md#register-from-a-category). Source checks passed; browser acceptance remains pending.

## Out of scope

Editing a row on screen during import (ADR 0131) and choosing export columns.
