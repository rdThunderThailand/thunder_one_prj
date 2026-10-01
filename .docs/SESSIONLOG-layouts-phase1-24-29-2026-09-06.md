# SESSIONLOG — Layouts Phase 1, tickets 24 + 29

Date: 2026-09-06
Branch: `feat/layoutV2` (both repos)
Model: Sonnet for #23/#24, switched to Opus to decide #29's design fork

## #24 — Template Picker (verified)

`New Layout` now opens one modal that merges two sources and writes nothing (ADR 0063 §2–§3).

- `layouts/templates.ts` — rewritten. 14 presets (7 geometries × landscape/portrait), each with
  `orientation`, `aspectRatio`, `description`, `use_cases`. The stale opening comment proposing
  `is_template` is gone.
- `layouts/template-picker.ts` + `.check.mts` — pure merge / filter / group.
- `layouts/create-seed.ts` — sessionStorage one-shot. The modal's choice crosses the navigation as
  client state, not a query parameter.
- `layouts/components/LayoutTemplatePicker.tsx` — 263 lines. Group tabs, client-side filters, card
  badges (`Copied` / `Shared`), details panel, `Create from Scratch` inside.
- `CompositionsListPage.tsx` — `+ New Layout` opens the modal instead of linking to `/create`.
- `CompositionEditorPage.tsx` — reads the seed on mount (setState only inside `.then()`).

`TemplateRail.tsx` kept: `LayoutEditorPage` (the *Templates* editor) still uses it as a
starting-geometry rail. Out of this ticket's scope; it now renders 14 tiles instead of 7.

## #29 — Tags rail (verified, one gap)

### The fork, and how it was decided

Ticket 29 said counts and filtering are client-side "exactly as the Playlist rail does it". Wrong
here: `PlaylistsListPage` holds its whole list in memory; `CompositionsListPage` is server-paginated
with `p_page_size` clamped to 100. Per-page counts understate the collection and a client-side
filter hides matches on other pages.

ADR 0063's "filtering is client-side" belongs to §3 (Template Picker, one fetch), not §4 (rails).
And the page already has the right pattern: `facets.referenceResolutions` (computed over the `base`
CTE) paired with `p_reference_resolution`; `p_folder_id` is server-side too. The comment added in
`20260906091500` claiming otherwise was wrong on both counts.

Chosen: server-computed facet + filter parameter. Rejected: pulling the whole library client-side
(a fetch loop at 100/page, discards working server sort/filter/paging); per-page counts (silently
low). Recorded as an amendment in ADR 0063 §4.

### Changes

- Migration `Thunder_Core/supabase/migrations/20260906120000_composition_tag_filter_and_facet.sql`
  — `p_tag_id uuid DEFAULT NULL` appended, `facets.tags` = `[{id,name,count}]` over `base`.
  DROP of the old 14-arg signature first (adding a parameter would otherwise create an overload),
  then the REVOKE/GRANT pair.
- `Thunder_Core` `compositions/schema.ts` (`tag_id` uuid) and `compositions/route.ts` (`p_tag_id`).
- `thunder_one_prj`: `types` (`tags` on the row, `CompositionTagCount`, `facets.tags`),
  `compositions-api` (map `tags`, send `tag_id`, read the facet), `list-url-state` (`tagId` ↔
  `?tag=`), `CompositionsListPage` (Folders/Tags tab pair, mutually exclusive selections).
- `TagsRail` reused from `playlists/components/` rather than duplicated, following
  `UnsavedLeaveConfirm`'s precedent. A `ponytail:` note says to move it to `content-library/` if a
  third page wants it.

## Applied to develop

`ftfmokgphewzyxzwjitv`, with approval. Verified back:

- Exactly one `media_compositions_library_list` in `pg_proc` — no overload.
  ACL `postgres=X/postgres | service_role=X/postgres`; no PUBLIC / anon / authenticated.
- No `p_tag_id`: 3 rows, total 3, `referenceResolutions` unchanged, `facets.tags` `[]`.
- Unknown `p_tag_id`: data empty, `pagination.total` 0, `summary.total` still 3 — the predicate
  lands in `filtered` only.
- No rows written or deleted.

## Browser verification (localhost → develop DB), user-run

#24 A1–A9 all pass, including the one that matters: picking a preset draws the Zones and the network
tab shows no POST/PUT/PATCH.

#29 B3–B6 all pass: rail reads `All (3) · ข่าว (2) · Promo (1)`; selecting `ข่าว` gives 2 rows and
`?tag=<uuid>` while the counts stay 2 / 1; back/forward restore correctly; Folders and Tags clear
each other. Scratch tags cleared afterwards.

**Not verified:** move-to-folder from a row, and the delete confirmation (B7). Untouched
`CompositionLibraryDialogs` paths, but not re-checked after the rail change. *Recently Used*
ordering was not exercised in the browser either.

## Gate

`tsc` 0 errors (One) · eslint 0 errors · `templates.check.mts`, `template-picker.check.mts`,
`list-url-state.check.mts` pass · Core `schema.check.mts` passes · Core's one tsc error on
`schema.check.mts(9,8)` confirmed pre-existing via `git stash`.

## State / next

Nothing committed yet this stretch; both trees dirty. PRs deliberately not opened — the user wants
the whole frontend done first. Next: **#25**, the Properties panel plus the split of
`CompositionEditorPage.tsx` (now 764 lines), which gates #26/#27/#28.
