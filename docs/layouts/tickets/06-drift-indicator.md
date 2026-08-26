# 06 — A drifted Publication says so and offers re-publish

**Spec:** `docs/layouts/spec-composition-content.md` ·
**Decided by:** `docs/adr/0049-composition-layout-with-content.md` §7, §11

**What to build:** an operator who edits a Composition — or the Layout under it, or a Playlist inside
it — is told which Publications no longer match what is airing, and re-publishes deliberately. The
snapshot rule is not weakened: nothing reaches a screen without a re-publish.

**Blocked by:** 05 — Activation materializes Zones and records revisions

**Status:** ready-for-agent

- [ ] The Publication read path returns, for a composition Publication, both the recorded revisions
      and the live ones: `compositions.revision`, `layouts.updated_at`, and each bound Playlist's
      `revision`
- [ ] A Publication is drifted when any recorded value differs from the live one, at any of the three
      levels
- [ ] Level three is not optional and is tested explicitly: editing the items of a Playlist a Zone
      points at must flag drift. `media_playlist_set_items` already does `revision = revision + 1` on
      every write, so this needs no backend change
- [ ] The indicator names **what** changed — the Composition, its Layout, or which Playlist — not just
      that something did
- [ ] The action offered is re-publish, which takes a fresh snapshot in place (ticket 05); no partial
      update path is added
- [ ] A Publication that is not `active` is not flagged, and a flat Publication is never flagged
- [ ] The comparison lives in a pure function with a `*.check.mts`: no drift, drift at each level
      separately, drift at all three, and a flat Publication
- [ ] `hasLayoutZoneDrift` is gone — confirm nothing still imports it. It compared Zone id sets, which
      fired on every Layout save while missing every real change
- [ ] Verified in the browser: publish a composition Publication, edit an item of one Zone's Playlist,
      and see the Publication flagged
