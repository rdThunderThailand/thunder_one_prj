# 06 — A drifted Publication says so and offers re-publish

**Spec:** `docs/layouts/spec-composition-content.md` ·
**Decided by:** `docs/adr/0049-composition-layout-with-content.md` §7, §11

**What to build:** an operator who edits a Composition — or the Layout under it, or a Playlist inside
it — is told which Publications no longer match what is airing, and re-publishes deliberately. The
snapshot rule is not weakened: nothing reaches a screen without a re-publish.

**Blocked by:** 05 — Activation materializes Zones and records revisions

**Status:** built and verified on develop (`thunder_one_prj@1dac6c5`, `Thunder_Core@361c428`, both
pushed to `origin/feat/layout` — confirmed 2026-08-28) · migration applied to develop and production
· browser scenarios A–F verified in the originating session, scenario G (drift on a `draft`
Publication shows no indicator) verified 2026-08-27 · **`republish` HTTP route exercised in isolation
2026-08-28**: forced drift by re-saving Layout `413d7b1f-b1f5-4c97-b5b0-8616d537570b` (bumps
`updated_at`, no content change), confirmed the drift banner on Publication
`7b6cb708-bceb-4a0d-b266-a5e10e1f821e`, clicked re-publish in the browser —
`POST /api/proxy/media/publications/{id}/republish → 200 OK`, banner cleared, `Activated At` moved
from `3:10:41 PM` to `6:09:44 PM`, `compositions.revision` unchanged at `4` (the route re-snapshots
the same Composition, it does not bump its revision) — no residual left · see
`.docs/SESSIONLOG-ticket06-drift-indicator-2026-08-27.md`,
`.docs/SESSIONLOG-player-contract-reply-and-prs-2026-08-28.md`

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
