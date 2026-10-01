# Session log — ticket 04 backend + ADR 0052 (2026-08-26)

Branch `feat/layout`, both repos. **Nothing committed, nothing pushed, production untouched.**

## Part 1 — the mockups forced a new ADR before ticket 04 could start

The session opened on ticket 04 but the user asked whether the Layout and Composition create flows
could merge "like the mockup". Reading `docs/layouts/Figjam - Media Workspace*.png` (three frames)
showed the mockup and ADR 0049 use **inverted vocabulary**: the mockup's *Layout* is our
`compositions`, its *Template* is our `layouts`. Its `Total Layouts 89 = Templates 24 + Custom 65`
summary and its content-typed list columns are the giveaway.

Also found: `Compositions` was never added to the sidebar
(`src/config/nav/media-workspace.tsx:31`), so ticket 03's pages were unreachable without typing the
URL. Nobody had ever used them.

Settled through four grilling rounds. Written up as **`docs/adr/0052-merged-layout-authoring.md`**:

- UI vocabulary is remapped, the contract is not; the mapping now lives in `CONTEXT.md`
- **A Template is a shared reference, never a copy** — the per-branch reuse requirement
  (ADR 0049:51-54) forces this, so the entity split stays exactly where ADR 0049 §1 put it
- Editing shared geometry interrupts with *Change all* / *Make this Layout its own copy* (Figma
  component/instance model)
- `layouts.kind IN ('inline','template')`, mirroring `playlists.kind` from ADR 0049 §3/§13
- Routes move, nothing is deleted; today's Layout pages become Template management
- **No `Publish` button in the editor** — which is what keeps ticket 04 unaffected
- Seven things from the mockup deferred with reasons; `role` refused outright (ticket 01 removed it
  from production and it carries no behaviour)

New tickets **14** (`layouts.kind`, additive/R1) and **15** (merged editor, frontend only), phase B2
in `docs/layouts/plan-composition.md`. Ticket 03 marked done and superseded.

**Correction made mid-session:** I first told the user `layouts.kind` would be R1 because it was only
an `ADD COLUMN`. That was wrong — adding `p_kind` to `media_layout_upsert` (10 args today) changes
its signature and would need a `DROP FUNCTION`. ADR 0052 §4 routes around it with a separate
additive `media_layout_set_kind` RPC so ticket 14 really is R1.

## Part 2 — ticket 04 migration, applied to develop only

`Thunder_Core/supabase/migrations/20260826140000_publication_type_composition.sql`

### Live state verified before writing, not assumed

`md5(prosrc)` is **identical on develop and production** for all three functions, so one file serves
both:

| function | md5 | args |
|---|---|---|
| `media_publication_upsert` | `8732a7c43e18810a0d7f535497500076` | 17, one overload |
| `media_publication_set_content` | `e54642b448f91ba7699f534cbe6ea45f` | 4 |
| `media_publication_duplicate` | `8bf7e3208016ed1ad133bc7f60ef53fe` | 3 |

`publications` had no `composition_id` and no `layout_id`; `publication_zones` does not exist, so
nothing from the superseded ADR 0048 model needed unwinding. `compositions` + `media_composition_upsert`
are present on **both** environments — ticket 02 reached production.

### Migration 095 was folded in and is now superseded

`095_fix_schedule_wipe_and_playlist_guard.sql` (written 2026-08-18, never applied anywhere) changes
the same two functions. It could not survive ticket 04: its `CREATE OR REPLACE ...(17 args)` would
add a second overload beside the new 18-argument function and make every call ambiguous.

Before folding, every block of 095 was compared against the live bodies — they match exactly apart
from the two intended changes, so 095 was a faithful edit of what is live, not a rebuild from a stale
copy. The file now carries a `SUPERSEDED — DO NOT APPLY` header.

The user chose this over applying 095 separately first. The deciding argument: the function is being
dropped and recreated regardless, so the alternative was deliberately typing a known
schedule-destroying bug into a brand-new function.

### Security finding surfaced on the way

Checking grants before the `DROP+CREATE` (which resets them) revealed **19 of 52 `SECURITY DEFINER`
`media_*` functions on production are executable by `anon` and `authenticated`**. They take
`p_tenant_id` as a parameter and check tenant membership *inside the body*, which does not constrain
a caller who supplies the tenant id. The list includes `media_publication_delete`,
`media_publish_single` and `media_asset_signing_keys`.

Not exploited or HTTP-tested — that would be a security test on production and needs its own
authorization. Root cause is the documented one: `CREATE FUNCTION` grants `EXECUTE` to `PUBLIC`.

The three functions this ticket touches are locked down in this migration. **The other 16 are
tracked as a separate task** and deliberately not pulled into ticket 04.

Verified safe before revoking: all three are called only via `callMedia(admin, ...)` where `admin` is
`getAdminClient()` → `SUPABASE_SERVICE_ROLE_KEY` (`src/utils/supabase/admin.ts`). The anon key at
`src/lib/core/media.ts:69` is used only for `auth.getUser()`, never for RPC.

### Applied to develop (`ftfmokgphewzyxzwjitv`) — verified

- `media_publication_upsert`: **exactly one overload, 18 args** — the specific failure this ticket
  risked
- `set_content` and `duplicate`: one overload each, signatures unchanged
- CHECK now includes `composition`; `composition_id uuid` nullable, partial index created
- Both folded-in 095 guards present in the live bodies
- Grants: `anon` false, `authenticated` false, `service_role` true, all three
- Row counts unchanged: 109 publications (51 playlist, 30 video, 28 image)
- Advisors: 147 findings, **none new**; all three functions dropped off
  `anon_security_definer_function_executable`, leaving `media_publications_list` from the other 16

### Scratch-tenant probe, 9/9

| # | probe | result |
|---|---|---|
| 1 | create a composition Publication | `composition_id` set, `playlist_id` NULL |
| 2 | composition + playlist together | `Invalid input: a composition publication cannot also reference a playlist` |
| 3 | composition type, null composition | `Invalid input: a composition publication requires a composition` |
| 4 | playlist type carrying a composition | `Invalid input: only a composition publication may reference a composition` |
| 5 | composition from another tenant | `not found: composition not found for this tenant` |
| 6 | `set_content` on a composition Publication | `Invalid input: composition publications carry their content on the composition, not inline items` |
| 7 | duplicate | shares the same `composition_id`, mints no Playlist |
| 8 | folded-in 095 schedule guard | recurrence survived a re-save, one schedule row |
| 9 | cleanup | back to 109 publications, 0 compositions |

Every message carries a prefix `EXPECTED_ERROR` in `src/lib/core/media.ts` will surface.

### Production — approved to WAIT, by the user's decision

Impact was measured and presented; the user chose to hold until the routes and frontend are done so
the whole thing can be verified through HTTP in one pass. Numbers for whenever it goes:

- 120 publications get a NULL column; the CHECK revalidates all 120, **0 would violate it**
- 3 schedules with recurrence stop being destroyed on re-save
- **112 already-wiped schedules are NOT repaired** — this stops the bleeding only
- the `set_content` playlist guard: 1 publication matches, **0 of them are `draft`**, and
  `set_content` only edits drafts, so no operator hits the new error
- brief window during `DROP`/`CREATE` where an in-flight call fails once

## Part 3 — backend reads, and the full frontend rewrite (Sonnet)

### `media_publication_get` / `media_publications_list` also needed a migration

Both compose their JSON by hand (`jsonb_build_object`, not `SELECT *`), so the new
`publications.composition_id` column was invisible to every caller until these were updated —
opening a composition Publication's detail page would have shown no Composition at all. Not called
out in the ticket file; found while wiring the routes.

New migration `20260826150000_publication_composition_in_reads.sql` — signatures unchanged on both
functions, so `CREATE OR REPLACE` only, no `DROP FUNCTION`. Applied to **develop only**. Verified with
a scratch-tenant probe: `media_publication_get(...)->'composition'` returns
`{id, name, status}`; `media_publications_list(...)` returns `composition_id` + `composition_name`
per row.

### Routes (`Thunder_Core/src/app/api/core/v1/media/publications/route.ts`)

- `publicationPostSchema` gains `composition_id: z.string().uuid().optional()`, `publication_type`
  enum gains `'composition'`
- Both `media_publication_upsert` call sites (POST at line ~63, PATCH at line ~94) now pass
  `p_composition_id: input.composition_id ?? null`

### Frontend — the ADR-0048 layout-mode feature was mid-flight in the working tree; it is now fully
### replaced by the ADR-0049/0052 composition picker

Before this session, `git status` already showed 14 files modified with an in-progress "Layout mode"
implementation (a Full screen/Layout switch in step 2, per-Zone content binding, `zoneBindings` in
the draft store) — the superseded ADR 0048 model, built on top of `publications/zone-bindings.ts`
(deleted earlier this session). Every one of those files has now been rewritten to the ADR 0049/0052
shape: one Composition per Publication, no per-Zone binding UI in the wizard.

| File | What changed |
|---|---|
| `types/index.ts` | `PUBLICATION_TYPES` gains `'composition'`; `composition_id`/`composition_name` added to list/form types; `PublicationDetail.layout_id`/`.zones` replaced by `.composition: {id,name,status}\|null`; dead `PublicationZoneBinding` type removed |
| `mock-data.ts` | New type option `{ id: "composition", label: "Layout", sublabel: "Split-screen layout" }` — contract word is `composition`, operator sees "Layout" (ADR 0052 §1) |
| `step-validation.ts` | Layout-mode branch replaced with: composition type requires `compositionId`, else same "กรุณาเลือก Layout" message |
| `publish-eligibility.ts` | Content check gains a `composition` branch **before** the assets fallthrough — this is the exact fix the ticket file warned was required, since the `else` previously read an empty `assetItems` as "no content" |
| `content-selection.ts` | Doc comment on `acceptedAssetKind` now names `composition` alongside `playlist` as taking no assets through this path |
| `draft-mapping.ts` | `basicInfoToForm` gains a third `compositionId` param, same pattern as `playlistId` |
| `detail-mapping.ts` | `ResumedDraft` drops `layoutId`/`zoneBindings`, gains `compositionId: string \| null` from `detail.composition?.id` |
| `services/publications-api.ts` | `cleanBasicInfoBody` sends `composition_id`; `savePublicationZones` and its `ZoneBindingsPayload` import deleted |
| `store/usePublicationDraftStore.ts` | `contentMode`/`layoutId`/`layoutZoneIds`/`zoneBindings`/`zoneClearPending` and their five actions all removed; single `compositionId: string \| null` + `setCompositionId` added; `setBasicInfo` clears it on type change like it already does for `playlistId`; **persisted key bumped v8 → v9** (old drafts dropped, not migrated) |
| `hooks/usePublishDraft.ts` | The whole zone-resolve-and-persist block (implicit-Playlist creation, `savePublicationZones` call) deleted; guard changed to "composition type but no `compositionId` → throw"; `basicInfoToForm` call now passes `compositionId` |
| `components/ContentStep.tsx` | Rewritten: branches on `publicationType === "composition"` → renders new `CompositionPicker`; every other type renders the original (pre-layout-mode) `AssetLibraryStep` flow. Full screen/Layout switch and its confirm modal are gone |
| `components/CompositionPicker.tsx` | **New.** Fetches Compositions via the existing `compositions` feature's `fetchCompositions()`, filters to `status === 'active'`, click-to-select grid, writes `compositionId` to the draft store |
| `components/AssetLibraryStep.tsx` | Reverted to its pre-layout-mode shape (no `selection`/`zoneLabel` props, no `zone-bindings` import) — kept the one real bug fix that had ridden along with the layout-mode diff: picking an asset now clears `playlistId` and vice versa |
| `components/CreatePublicationPage.tsx` | Zone-playlist prefetch loop on resume deleted; `setLayoutDraft(...)` replaced with `setCompositionId(draft.compositionId)` |
| `components/publicationTypeIcons.tsx` | Added a `composition: <GridIcon />` entry — `Record<PublicationTypeId, ReactNode>` is exhaustive and failed to compile without it |
| `components/SelectedAssetList.tsx`, `ContentSummaryPanel.tsx` | **Almost reverted by mistake.** `SelectedAssetList`'s `selection` override is still consumed by `compositions/components/ZoneContentPicker.tsx` — ticket 03's already-shipped Composition editor, unrelated to the Publication wizard. Caught by `tsc`, restored. `ContentSummaryPanel` had no such outside consumer and stayed reverted |
| 6 `.check.mts` files | `basic-info-limits`, `next-transition`, `publish-eligibility`, `resume-prompt`, `detail-mapping` updated for the new `DraftFields`/`PublicationDetail` shape and given `composition` test cases; `content-selection.check.mts` needed no change |

Two files were deleted outright, approved by the user, both **untracked so `git checkout` could not
have recovered them** (corrected after initially saying otherwise) — copies sit in this session's
scratchpad under `deleted-ticket04/`:

1. `publications/zone-bindings.ts` + `.check.mts` — the superseded ADR 0048 per-Publication binding
   module
2. `Thunder_Core/.../publications/[id]/zones/route.ts` — called `media_publication_set_zones`,
   confirmed absent from both develop and production

## What is verified, and what is not

**Verified: SQL on develop** (both migrations, 9-probe scratch test, reads-migration probe) and
**`tsc --noEmit` clean repo-wide** (0 errors) plus every touched `.check.mts` passing.

**Not verified: HTTP, the browser, or production.** `Thunder_Core` deploys from `develop` while this
branch is `feat/layout`, so even the routes above are not reachable through the deployed backend yet.
Nothing has been committed or pushed.

## Two deletions — approved by the user and done

1. `src/features/media-workspace/publications/zone-bindings.ts` + `.check.mts` — the superseded
   ADR 0048 per-Publication binding module. Its ADR 0049 replacement
   (`compositions/zone-bindings.ts`) already shipped in ticket 03.
2. `Thunder_Core/src/app/api/core/v1/media/publications/[id]/zones/route.ts` — called
   `media_publication_set_zones`, **confirmed absent from production** (only
   `media_composition_set_zones` exists). Dead on arrival; every call 500s.

**All three files were UNTRACKED**, so `git checkout` could not have recovered them — I said
otherwise when proposing the deletion and corrected it before acting. Copies are in this session's
scratchpad under `deleted-ticket04/` in case anything is wanted back.

### The deletion is the frontend worklist

`npx tsc --noEmit` now reports **15 errors across exactly the 7 files that must be refactored** —
the same tsc-driven technique ticket 01 used to find the last `role` references:

| file | what it imports |
|---|---|
| `components/ContentStep.tsx` | the whole binding UI; the Full screen/Layout switch is at 131-146, the confirm modal at 203 |
| `components/AssetLibraryStep.tsx` | `totalZoneDurationSeconds`, `ZoneBindingDraft` |
| `hooks/usePublishDraft.ts` | `findUnboundZoneIds`, `toZoneBindingsPayload` |
| `store/usePublicationDraftStore.ts` | `ContentMode`, `ZoneBindingDraft` — also where the persisted key version gets bumped |
| `services/publications-api.ts` | `ZoneBindingsPayload` |
| `step-validation.ts` | `findUnboundZoneIds` |
| `detail-mapping.ts` | `ZoneBindingDraft` |

Clearing to zero is the definition of done for the frontend half. A handful of the 15 are
`TS7006 implicitly any` that appear only because the deleted types were feeding inference — they
resolve with the same edits, not separately.

**Gotcha found while checking:** a stale `.next/dev/types/routes.d.ts` still referencing the deleted
route carried a *syntax* error, and tsc reports syntactic diagnostics instead of semantic ones for
the whole program when that happens — so it printed 3 unrelated errors and hid all 15 real ones.
`rm -rf .next/dev/types` before trusting a tsc run after deleting a route.
