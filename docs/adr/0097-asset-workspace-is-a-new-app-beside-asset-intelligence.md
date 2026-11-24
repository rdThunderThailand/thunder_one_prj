# Asset Workspace is a new App built beside Asset Intelligence

**Status:** accepted · 2026-10-16
**Supersedes:** the naming parts of ADR 0023 (app id, route, folder); updates the folder example in ADR 0034
**Source:** PO rename 2026-10-14 (Asset Workspace Decision Log); Product Specification v1.1.5 §6.3, §8.2–8.3 (PO sign-off 2026-10-15, G1–G9 PASS); plan `plan-asset-workspace-mvp.md` §1.1/§4.0; Phase 1 work package P1-01
**Related:** Pace #34 (P1-01), #35 (P1-02); FigJam Navigation & Terminology v1.1 `515:635`, G2 Architecture v1.1 `515:720`
**Reference note (2026-10-22):** the PO split Spec v1.1.5 into documents 01–05 on 2026-10-18 with no change to decisions. Section numbers below are from the old single file: §6.3 → 02 Product Specification §3.3; §8.2–8.3 → 02 §4.2 (the menu and Screen Inventory now live only in FigJam `515:635` / `515:720`).

## Context

The PO renamed the product Asset Intelligence → **Asset Workspace**. The repo carries the old name in
~109 files (`asset-intelligence` app id, `/asset-intelligence/*`, `src/features/asset-intelligence/`).
Those pages were a whole-picture prototype for every role; Spec v1.1.5 replaces their navigation,
status vocabulary and most flows, so most screens are rebuilt or adapted rather than renamed.

Spec v1.1.5 also removed Connected Devices (Devices / Device Groups / Provisioning, UC-015–018) from the
MVP — they are Phase 2. The Phase 1 work package was written against Spec v1.1.0 and still lists them.

Routes must be fixed now: Help `screenKey`s, nav config and every later screen hang off them.

## Decision

1. **Names.** App id `asset-workspace` in `src/config/apps.tsx`; base route `/asset-workspace`;
   route folder `src/app/(dashboard)/(application)/asset-workspace/`; feature folder
   `src/features/asset-workspace/` (ADR 0034 nesting); nav `src/config/nav/asset-workspace.tsx`;
   display and page title "Asset Workspace"; Help `workspace_key = asset`. Core API is unchanged.
   The `Asset` entity keeps its name (ADR 0023's subject still stands).
2. **Built beside the old App.** The new App is added next to `asset-intelligence`; reusable code moves
   into `features/asset-workspace/` screen by screen. The old App stays untouched and usable until
   release.
3. **Routes** (all under `/asset-workspace`, per Spec §8.3 Screen Inventory):

   | Route | Screen |
   |---|---|
   | `/` | Overview |
   | `/assets` | Assets List |
   | `/assets/[assetId]` | Asset Profile |
   | `/assets/register` | Register Asset |
   | `/assets/import` | Bulk Import |
   | `/assets/scan` | Scan Asset |
   | `/assignments` | Assignment List |
   | `/inventory` | Inventory Sessions |
   | `/inventory/[sessionId]` | Session Detail |
   | `/categories` | Category List |
   | `/categories/[categoryId]` | Category Detail (Spec §4.7.1, FigJam `520:88`) |
   | `/locations` | Location List |
   | `/locations/[locationId]` | Location Detail |
   | `/lifecycle-warranty` | Lifecycle & Warranty |
   | `/reports` | Reports |
   | `/settings` | Asset Workspace Settings |
   | `/my-assets` | Employee — My Assets |

   - **No Transfers route** — Transfer is a controlled action on the Asset and an entry in its
     history (Spec §8.2). Edit Asset, Assign, Return, Move Location and the other controlled actions
     are dialogs on their screens, not routes.
   - **No Devices / Device Groups / Provisioning routes** — Phase 2. They are added as new routes
     when Phase 2 opens; nothing is reserved for them now.
4. **One navigation, filtered by role** (Spec §8.2–8.3):
   - Asset Admin — Overview · Asset Management (Assets, Assignments, Inventory) · Asset Structure
     (Categories, Locations) · Management (Lifecycle & Warranty, Reports, Settings) — 9 items.
   - Manager — Overview, Assets, Assignments, Inventory, Reports — 5 items.
   - Employee — My Assets — 1 item; `/my-assets` is the Employee's entry point.
   - Hiding a nav item is never authorization (Spec §6.3): every page and action checks permission
     on the server. Phase 1 defaults the role to `asset_admin`; real role wiring is Phase 6.
5. **Feature flag** `NEXT_PUBLIC_ASSET_WORKSPACE_MVP`: `"1"` turns the App on; any other value or
   unset turns it off — every `/asset-workspace` route returns Not Found and the App is absent from
   the App Switcher and the Workspaces catalog. Set only in local and dev; production leaves it unset.
   It is build-time (`NEXT_PUBLIC_*`), so flipping it needs a redeploy. The flag stays until the
   release gate (QA + UAT + Release Owner Go), even though the Spec is Ready for Development.
6. **Release cut-over** (implemented at release, in `next.config.ts`, all `permanent: true`; specific
   rules before the catch-all, as with ADR 0081). Paths are relative to each base:

   | `/asset-intelligence…` | → `/asset-workspace…` |
   |---|---|
   | ` ` (root), `/assets` | `/` — replaces today's non-permanent `/asset-intelligence` → `/assets` rule |
   | `/assets/all` | `/assets` |
   | `/assets/all/:assetId` | `/assets/:assetId` |
   | `/assets/allocation`, `/assets/borrow-return`, `/assets/transfer` | `/assignments` |
   | `/assets/count` | `/inventory` |
   | `/assets/categories` | `/categories` |
   | `/assets/locations` | `/locations` |
   | `/assets/warranty` | `/lifecycle-warranty` |
   | `/assets/reports` | `/reports` |
   | `/my-assets/:path*` (incl. `scan-qr`, `my-requests`, `service-status`) | `/my-assets` |
   | anything else (`/assets/analytics`, `inspections`, `maintenance`, `work-orders`, `knowledge-base`, `/departments/:path*`) | `/` |

   Then the old App entry and catalog tile are removed, and the old route and feature folders are
   deleted in their own PR.

## Alternatives

- **Rename in place in one PR** (as Communication → Media Workspace, `17d5af9`). Rejected: the old
  pages are replaced, not renamed, so a mass rename moves code that is about to be rebuilt and leaves
  the App half-new on `dev` for weeks. Building beside it keeps the old App working and makes
  rollback a flag flip.
- **Keep `asset-intelligence` as the id/route, change only the display name.** Rejected: the old name
  would leak into every new `screenKey`, URL and import, and changing it later costs more than now.
- **Reserve Devices routes as inert placeholders.** Rejected: Phase 2 has no approved screens or
  contract yet; adding routes later is purely additive.
- **Old routes with no new counterpart return 404.** Rejected: they are prototype pages users may
  have bookmarked; landing on the Workspace Overview is less broken than a dead page.
- **`/my-assets/scan-qr` → `/assets/scan`.** Rejected: Employees do not see the Assets area; sending
  them there would end on an access-denied page.

## Consequences

- Two Asset Apps exist in dev until release; only one is visible in production (the old one).
- Phase 1 work package P1-02 AC changes: Asset Admin nav has **9** items in four groups (not 12 in
  five); FigJam references move to `515:635` / `515:720`.
- Every new route gets its Help `screenKey` from this table; adding or renaming a route needs an
  amendment here.
- `/categories/[categoryId]` is added to the work package route list.
