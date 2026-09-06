# 29 — Folders and Tags rails on the Layouts list

**Issue:** https://github.com/rdThunderThailand/thunder_one_prj/issues/59
**Repo:** `thunder_one_prj`
**Decided by:** `docs/adr/0063-create-layout-flow-phase-1.md` §4
**Plan:** `docs/layouts/Phase1/plan-create-layout-flow.md` FE-6
**Design:** `docs/layouts/Phase1/Create Modal.png` (the list behind the modal)
**Blocked by:** 23
**Runs in parallel with:** 24, and with the editor work once 25 has landed
**Status:** not started

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

- [ ] Folders rail, backed by the existing folder scope and `media_composition_move`
- [ ] Tags rail, reading the `tags` array ticket 22 added to `media_compositions_library_list`
- [ ] **Per-tag counts and the tag filter are computed client-side from the rows** — no filter
      parameter joins the RPC, exactly as the Playlist rail does it
- [ ] Filter state joins the existing list URL state (ADR 0047), so back/forward work
- [ ] Move-to-folder from a row uses the existing dialog pattern; the destructive path keeps its
      confirmation step

## Verification

- [ ] Browser: tag two Layouts, filter by that tag, confirm the count and the rows agree
- [ ] Move a Layout between folders and reload
- [ ] Browser back after filtering returns to the previous filter, not to an empty list
