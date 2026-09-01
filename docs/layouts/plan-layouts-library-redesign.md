# Layouts Library redesign plan

**Status:** implemented; develop database migration applied 2026-09-01
**Date:** 2026-08-31
**Source:** `Figjam - Media Workspace (7).png`
**Decisions:** ADR 0052, ADR 0054, ADR 0056, ADR 0058

Redesign `/media-workspace/layouts` as the operator-facing Layout library while preserving the established contract boundary: a UI **Layout** is `media_core.compositions`, and a UI **Template** is a reusable `media_core.layouts` row. The Figma frame supplies the visual hierarchy, not an instruction to invent unsupported data or collapse the two entities.

## Outcome

The finished page lets an operator organize, assess and act on Layouts without mixing library state with broadcast scheduling:

- nested Composition-scoped Folders, Uncategorized and Trash;
- server-backed search, filters, sorting and pagination with URL history;
- actionable summary counts;
- composite multi-Zone previews;
- explicit Template-based versus Custom geometry;
- content readiness, operational status and current Publication usage;
- Preview, Edit, Duplicate, Move, active/inactive and Trash actions;
- no business maximum on Zone count.

The page does not become a Programming dashboard. Schedule, Now & Next and delivery state remain on Publication/Programming surfaces.

## Settled product decisions

### Entity and page purpose

- `/media-workspace/layouts` lists Compositions under the UI label **Layouts**.
- `/media-workspace/layouts/templates` remains the shared geometry management surface.
- A Template-backed Layout references shared geometry; a Custom Layout owns inline geometry.
- The page is a library-management surface, not a broadcast-operations surface.
- Granular RBAC is out of scope. Core continues to enforce tenant membership; the frontend must not pretend that hiding a button is authorization.

### Header and summary

- Reuse the current shared application shell. Do not reproduce the mockup's page-local global search, date selector, notifications or profile controls.
- Header actions are `Manage Templates` and `+ New Layout`.
- `+ New Layout` opens the merged editor directly; Template choice stays inside the editor.
- Folder creation lives in the Folder rail only.
- Four summary cards: `Total Layouts`, `Template-based`, `Custom`, `Needs content`.
- `Needs content` means `bound_count < zone_count` and acts as a filter shortcut.
- Summary is scoped by collection only: All Layouts, the selected Folder including descendants, Uncategorized or Trash. Search and other filters do not make the cards jump.

### Filters and table

Always visible:

- Search;
- Status: Draft / Active / Inactive;
- Folder collection;
- Geometry: All / Template-based / Custom.

`More filters` contains:

- Content: Complete / Needs content;
- Usage: Used / Unused;
- Reference resolution.

All list state is URL-backed. `Clear all` clears search, filters, sort, page and per-page state. Back, Forward and refresh restore the same view.

Table order:

1. Preview
2. Layout name and Folder path
3. Content readiness (`bound_count/zone_count`)
4. Resolution
5. Status
6. Used in Publications
7. Last modified with creator avatar
8. Actions

`Used in Publications` counts distinct Publications whose effective state is Draft, Scheduled or Active. Ended and Cancelled do not make a Layout appear currently used; immutable historical dependencies are handled by permanent-delete guards. `Unused` means this count is zero.

The Last modified cell shows the persisted creator avatar from `created_by`; the date remains the actual `updated_at`. It does not claim that the creator was the last updater.

### Preview and actions

- A list preview composes every Zone in its real percentage geometry and shows the first Asset of the bound Playlist for that Zone. Missing content or a failed signed URL renders a Zone placeholder rather than failing the row.
- Do not generate or store a PNG. Return compact Zone preview facts and reuse the existing batch preview-URL path and rendering primitives.
- Row buttons are Preview and Edit; More contains Duplicate, Set active/inactive, Move and Move to Trash.
- Duplicate creates a Draft in the same Folder, copies Zone bindings and playback settings, and copies private inline geometry while retaining shared Template references. Publication usage never copies.
- Moving to Trash preserves operational status. Existing Publications and snapshots continue to resolve; the confirmation names the number of Draft, Scheduled and Active Publications.
- Restore returns to the previous Folder when it still exists, otherwise Uncategorized.
- Permanent delete is available only in Trash. It deletes owned `composition_zones`, safe unreferenced inline Playlists and private inline geometry atomically; shared Templates and shared Playlists remain. Publications, immutable snapshots or other external references block the transaction and return typed blocker categories.

### Deliberate cuts from the Figma frame

| Figma element | Decision |
|---|---|
| `Scheduled` Layout status | Remove; it belongs to Publication effective status. |
| `Used in Programs` | Rename to `Used in Publications`; Program is not the domain term. |
| `Total Zones` card | Remove; it is not an operator action. Zone count remains per row. |
| Image / Video / Mixed type | Defer until a real cross-Playlist content taxonomy is required. |
| Tags tab/filter | Remove; there is no Tag model for Compositions. |
| Upload Layout | Remove until an import format, version, validation and conflict policy exist. |
| Storage Usage | Remove; Layouts store no media bytes and Core has no real tenant storage accounting. |
| Date selector | Remove; a library list has no selected-date semantic. |
| Three view modes | Ship list view only; add Grid only after a demonstrated browse-by-image need. |
| Creator avatar | Show the persisted creator beside Last modified; do not label it as the updater. |
| Five/six Zone examples | Valid after ADR 0058; Zone count has no business maximum. |

## Current state and reusable Media Library work

Reuse these existing contracts and primitives:

- `ContentFolder` and `/media/folders?scope=...`;
- Folder create/list/rename/move/delete routes and their depth, cycle, sibling-name and empty-delete guards;
- `Card`, `Modal`, `Button`, icons, `MediaThumb`, `usePreviewUrls`;
- `Pagination` and `useListUrlState`, which are more complete than Media Library's local Previous/Next state;
- `foldersByParent` and `folderPath` after moving them out of the Asset-only feature folder.

Do not copy `MediaLibraryPage` wholesale. Its current Folder tree, descendant check and Folder modals are local functions; its create helper hardcodes `scope: "asset"`; Uncategorized is filtered in the browser; errors can expose raw backend text; and its per-card preview flow and Grid toggle do not match this table-first page.

Extract the smallest shared seam:

- `src/features/media-workspace/content-library/folder-tree.ts` — `foldersByParent`, `folderPath`, `isDescendant`;
- `src/features/media-workspace/content-library/ContentFolderRail.tsx` — virtual collections, nested tree and accessible actions;
- `src/features/media-workspace/content-library/ContentFolderModals.tsx` only if keeping the rail under 300 lines requires it;
- generalize `createContentFolder` to accept `scope`; existing Asset callers pass `asset`, Layouts pass `composition`.

The extraction must leave Media Library behaviour unchanged and keep feature-specific labels/actions supplied as props. Do not create a generic library framework or a second state manager.

## Backend A — Composition Library read model

Owner repository: `Thunder_Core`.

Extend `GET /api/core/v1/media/compositions` and its validated query contract with:

- `search`;
- `status`;
- `kind=template|inline`;
- `folder_id`, `uncategorized`, `trash` as mutually exclusive collection selectors;
- `content=complete|incomplete`;
- `usage=used|unused`;
- `reference_resolution`;
- `sort`, `dir`, `page`, `page_size`.

Return an envelope that the frontend maps to:

```ts
type CompositionLibraryPage = {
  data: CompositionLibraryItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  summary: {
    total: number;
    templateBased: number;
    custom: number;
    needsContent: number;
  };
  facets: {
    referenceResolutions: string[];
  };
};

type CompositionLibraryItem = {
  id: string;
  name: string;
  layoutId: string;
  layoutName: string;
  layoutKind: "template" | "inline";
  referenceResolution: string | null;
  status: "draft" | "active" | "inactive";
  revision: number;
  zoneCount: number;
  boundCount: number;
  folderId: string | null;
  deletedAt: string | null;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
  previewZones: Array<{
    position: number;
    x: number;
    y: number;
    width: number;
    height: number;
    firstAssetId: string | null;
  }>;
};
```

Contract rules:

- tenant filtering lives inside the RPC;
- Folder selection includes descendants;
- normal list excludes `deleted_at IS NOT NULL`; Trash includes only those rows;
- pagination and row sorting are deterministic with `id` as the final tie-breaker;
- summary applies the collection selector but ignores search/status/kind/content/usage/resolution filters;
- usage derives Draft/Scheduled/Active through the same effective-status rules as Publication reads;
- preview data is one compact ordered row per Zone, not signed URLs and not rendered images;
- current no-query consumers remain compatible during rollout; do not silently truncate the old unpaginated list.

Prefer one new read-model RPC behind the existing HTTP route if widening `media_compositions_list(uuid)` would create an unsafe overload or a deployment-order break. If the existing signature changes, drop its exact signature before recreation; never use `CREATE OR REPLACE` to add parameters.

Acceptance:

- more than four Zones round-trip and list correctly;
- Folder subtree, Uncategorized and Trash totals are correct;
- summary stays stable while search/filter changes;
- effective Publication boundary cases classify Draft, Scheduled, Active, Ended and Cancelled correctly;
- one request returns the rows and counts needed by the page; no per-row Composition/Playlist fetch remains.

## Backend B — Composition organization and unbounded Zones

Owner repository: `Thunder_Core`.

The ADR 0056 migration already supplies `content_folders`, Composition `folder_id`, `deleted_at` and `trashed_folder_id`, and Folder routes accept `scope=composition`. Do not rebuild those pieces.

Add the missing Composition-specific operations:

- move a non-trashed Composition to a Composition-scoped Folder or Uncategorized;
- move to Trash while preserving status and former Folder;
- restore with former-Folder fallback;
- permanently delete from Trash with typed external-dependency blockers and atomic owned-resource cleanup;
- return direct and subtree Composition counts from the Folder list so the rail does not issue one request per Folder.

Remove the Zone-count business cap from the latest `media_layout_upsert` body while keeping at least one Zone, positive dimensions, bounds, stable IDs and non-overlap. Replace comments and checks that rely on “at most six comparisons.” Use set-based overlap validation under the platform's normal request-size/timeout protection; do not introduce a hidden Zone-count cap.

Update the Core HTTP schemas and their focused `*.check.mts` assertions. More than four Zones is a required green case; zero Zones, overlap, zero area, out-of-bounds geometry and malformed payloads remain red cases.

Permanent delete transaction:

1. lock and verify the Composition is tenant-owned and trashed;
2. detect Publication/snapshot/external Playlist dependencies and return typed blockers;
3. delete owned `composition_zones`;
4. delete unreferenced owned inline Playlists and private inline Layout/Zone rows;
5. delete the Composition;
6. commit all or none.

Do not apply any migration in this plan. Writing a migration file is R2; rehearsal on `develop` and every production apply are separate R0 actions requiring explicit approval and action-time schema checks.

## Frontend C — Layouts Library redesign

Owner repository: `thunder_one_prj`.

### Shared extraction

- Extract the Media Library Folder seam described above and migrate Media Library to it without changing visible behaviour.
- Generalize folder API calls by scope; never default a Composition mutation to `asset`.
- Leave Asset Grid/Card, upload and media-specific actions in the Asset feature.

### Data and state

- Replace `fetchCompositions()` plus client-side filter/sort/paginate and the current per-row preview waterfall with the library envelope.
- Preserve the existing legacy response adapter only for rollout compatibility; new UI never fabricates missing summary or usage fields.
- Extend URL-state parsing/writing and its Node assertion check for collection, filters, sort, page and per-page.
- Changing collection/filter/sort/per-page returns to page 1; Back/Forward restores the exact state; `Clear all` returns to a clean URL.
- Fetch Folder rail and Composition page independently so each can show its own skeleton/error state.

### Presentation

- Build the approved header, four summary cards, shared Folder rail, filter row, More filters and table.
- Reuse a single composite preview component for list rows and playback-preview entry points where shapes match; it accepts persisted Zone geometry and signed asset URLs, not Composition fetch functions.
- Keep list-only view. Do not retain inactive Grid/Compact controls.
- In Trash, replace normal actions with Restore and Delete forever; hide active/inactive and Move.
- Use Modal-based confirmations, focus restoration and text labels. Do not copy Media Library's raw `window.confirm` calls.
- Preserve stale rows on refresh failure and show a classified error banner; do not expose raw Core/Postgres errors.

### Remove the four-Zone assumption

- delete `MAX_ZONES` and `too-many-zones` from `geometry.ts` and error display;
- remove the Split Zone and editor button guards at four;
- keep at least-one, bounds, positive-area and overlap validation;
- update templates, split, geometry and status checks so a five/six-Zone fixture is accepted;
- ensure canvas, Zone Overview, editor selection and list preview scroll/render without assuming four items.

## Delivery order and ticket boundaries

1. **Documentation:** ADR 0058 and this plan — complete; no runtime effect.
2. **Backend A:** read model and contract checks.
3. **Backend B:** organization mutations, unbounded-Zone migration and contract checks.
4. **Frontend C1:** extract/genericize the Media Library Folder seam and verify Media Library regression.
5. **Frontend C2:** integrate the Layouts read model, page shell and URL state.
6. **Frontend C3:** actions, Trash, composite preview and more-than-four-Zone UI regression.
7. **Operator-layer verification:** authenticated browser checklist only after asking the user at that verification point.

Backend work stays out of the frontend ticket. Frontend may build presentational components early, but it must not merge mock Folder counts, usage, previews or modifier identities.

## Verification

### Static and contract checks

- Core: focused route/schema assertions, migration contract assertions, changed-file type/lint checks and `git diff --check`.
- Frontend: `node` checks for geometry, Split Zone, URL state, payload mapping, Folder tree/descendant logic and typed error mapping.
- Run `pnpm exec next typegen` before frontend `pnpm exec tsc --noEmit` after any App Router change.
- Verify no new dependency and no file exceeds the repository's 300-line rule.

### Browser checklist

After explicit approval at the verification point:

- [x] All Layouts, Folder, Uncategorized and Trash collections; create/rename/move/delete Folder persistence verified on develop.
- [x] Summary cards and Needs content shortcut; develop returned `3` total, `2` template-based, `1` custom and `0` needs content.
- [x] Search, Status, Geometry, Content, sort, per-page URL state and Clear all; Back/Forward and narrow viewport verified.
- [x] Five- and six-Zone rendering verified with no max-Zone validation or message.
- [x] Preview/Edit/Duplicate/active/inactive/Move/Trash/Restore verified on develop, including persistence after refresh.
- [ ] Permanent-delete success verified for an unreferenced Layout; each typed blocker still requires a dedicated referenced fixture.
- [x] Initial loading skeleton and classified error state were observed; the first run exposed a Core RPC CTE-scope defect, fixed in `509a9d7`, then reload returned the real library rows with no browser console errors.
- [x] Empty no-match state, Folder and Trash states verified.
- [x] Keyboard activation, blur close, responsive narrow viewport and table overflow verified.

#### Local verification evidence — 2026-09-01

- ThunderOne `http://localhost:3000` → Layouts loaded from ThunderCore `http://localhost:3001` after the develop RPC correction.
- `/api/proxy/__config` reported the Core URL as localhost:3001 with an API key configured; the authenticated page rendered `3` rows and the four summary values above.
- Direct develop RPC probe returned HTTP 200 with keys `data`, `pagination`, `summary`, `facets`; `dataCount=3`, `total=3`, `totalPages=1`, resolutions `1080x1920` and `1920x1080`.
- A temporary retry-label issue and stale `playlists` pagination copy were fixed in frontend commit `c6429bd`.
- User Browser Verification Report recorded 21/21 read-only checks and 9/9 approved write checks as passing before the final UX corrections.
- Creator metadata migration `20260901043600` was applied to develop on 2026-09-01. Post-restart Browser regression returned three creator initials (`P`); those users have no `avatar_url`, so the Avatar correctly used its initials fallback.
- Post-UX Browser regression confirmed six video Zone previews at `1920x1080`, a table width equal to its container (`1229px`), no body overflow at a `1769px` viewport, visible row-action menus, and Enter/Space menu toggling.

Browser verification proves the ThunderOne/Core flow only. It does not prove production deployment or physical-player capacity. ADR 0054's accepted risk remains: no current path checks whether a Device can decode every video Zone concurrently.

### R0 gates

- Any `develop` or production migration apply;
- any Core deployment, frontend deployment, commit or push;
- browser actions that create, duplicate, change status, move, trash, restore or permanently delete real records.

At each gate, recheck the exact tenant/project, current migration history and affected records, then ask immediately before acting.

## Deferred

- Tags;
- Layout import/upload;
- Grid/Compact views;
- `updated_by` and activity history;
- granular Media Workspace RBAC;
- storage accounting;
- player-reported capacity and `max_video_zones` enforcement;
- bulk Trash operations and automatic retention cleanup.

No item above is represented by mock data or a disabled control on the redesigned page unless a later requirement explicitly asks for that affordance.
