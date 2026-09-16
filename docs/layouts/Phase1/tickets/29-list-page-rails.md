# 29 — Folders and Tags rails on the Layouts list

**Issue:** https://github.com/rdThunderThailand/thunder_one_prj/issues/59
**Repo:** `thunder_one_prj`
**Decided by:** `docs/adr/0063-create-layout-flow-phase-1.md` §4
**Plan:** `docs/layouts/Phase1/plan-create-layout-flow.md` FE-6
**Design:** `docs/layouts/Phase1/Create Modal.png` (the list behind the modal)
**Blocked by:** 23
**Runs in parallel with:** 24, and with the editor work once 25 has landed
**Status:** verified — browser-checked on localhost 2026-09-06, in full.

> **Checklist item 3 was wrong and has been corrected — see ADR 0063 §4's 2026-09-06 amendment.**
> This list is server-paginated (`p_page_size` clamped to 100), so client-side counts understate the
> collection and a client-side filter hides matches on other pages. The rail now uses the page's own
> pattern: a server-computed facet plus a filter parameter, like `referenceResolutions` /
> `p_reference_resolution` and `p_folder_id`.

## What to build

The list page's left rail, following `PlaylistsListPage`'s tag rail rather than inventing a second
pattern.

## Context — ADR 0063 §4

> - **Folders already exist.** `20260829040259_nested_feature_folders_and_trash.sql` carries scope
>   `'composition'` and `media_composition_move`. Nothing to build.
> - **Tags do not.** ... same shared vocabulary (`media_core.tags`), same "list RPC gains a `tags`
>   array" shape.
>
> Neither is collected at creation. An operator picking a starting geometry has no filing decision to
> make yet.

## Checklist

- [x] Folders rail, backed by the existing folder scope and `media_composition_move` — already
      shipped; now sits behind a `Folders` / `Tags` tab pair, as on `PlaylistsListPage`
- [x] Tags rail, reading the `tags` array ticket 22 added to `media_compositions_library_list`
- [x] ~~Per-tag counts and the tag filter are computed client-side from the rows~~ **Superseded.**
      Counts come from `facets.tags` (counted over the `base` CTE, i.e. the whole collection) and the
      filter from `p_tag_id`. Migration `20260906120000_composition_tag_filter_and_facet.sql`
- [x] Filter state joins the existing list URL state (ADR 0047) — `tagId` ↔ `?tag=`, covered by
      `list-url-state.check.mts`
- [x] A folder selection and a tag selection are mutually exclusive; picking one clears the other
- [x] Move-to-folder from a row uses the existing dialog pattern; the destructive path keeps its
      confirmation step — unchanged, `CompositionLibraryDialogs`

## Verification

SQL layer, on `develop` 2026-09-06 (read-only, no rows written):

- [x] Exactly **one** `media_compositions_library_list` in `pg_proc` after DROP + CREATE — no
      overload. ACL `postgres=X/postgres | service_role=X/postgres`: no `PUBLIC`, no `anon`, no
      `authenticated`, matching what `20260901043600` established
- [x] No regression with `p_tag_id` omitted: 3 rows, `pagination.total` 3,
      `facets.referenceResolutions` `["1080x1920","1920x1080"]` unchanged, new `facets.tags` `[]`
      (nothing is tagged), row `tags` `[]`
- [x] `p_tag_id` with an unknown uuid: `data` empty, `pagination.total` 0, while `summary.total`
      stays 3 — proving the predicate lands in `filtered` only, and facets/summary keep counting
      over `base`

Browser, localhost dev servers (One :3000 → Core :3001 → `develop` DB), 2026-09-06:

- [x] Two Layouts tagged via the ticket-23 route (`ข่าว`+`Promo`, `ข่าว`). Rail shows
      `All (3) · ข่าว (2) · Promo (1)` — counts come from `facets.tags`, not the page
- [x] Selecting `ข่าว` narrows the table to 2 rows and puts `?tag=<uuid>` in the URL. **The rail's
      counts stay 2 / 1** rather than collapsing to the filtered set — the point of counting over
      `base`
- [x] Browser back clears `?tag=` and restores all 3 rows (not an empty list); forward returns to
      the filtered view
- [x] Switching to the Folders tab and picking a folder drops `?tag=` and sets `?collection=` —
      the two selections are mutually exclusive
- [x] Scratch tags cleared back to `[]` afterwards

- [x] Move-to-folder from a row moves it and the list updates; delete from a row asks first and
      Cancel does not delete. Pre-existing `CompositionLibraryDialogs` paths this ticket did not
      touch — re-checked after the rail change anyway, 2026-09-06.
