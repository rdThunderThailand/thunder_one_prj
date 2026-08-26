# 05 — Activation materializes Zones and records revisions

**Spec:** `docs/layouts/spec-composition-content.md` ·
**Decided by:** `docs/adr/0049-composition-layout-with-content.md` §7, §11 ·
`docs/adr/0045-publication-snapshot-materialization.md` §1, §2, §4 ·
`docs/adr/0044-multi-zone-layout.md` §5

**What to build:** pressing publish on a composition Publication freezes the composition — geometry as
it stands at that instant, each Zone's playback settings, each Zone's resolved items — and records the
revision of everything it read, so a later edit can be detected (ticket 06) instead of silently
reshaping an airing screen. Screens do not receive the new shape yet; that is ticket 10.

**Blocked by:** 04 — A Publication can be of type `composition`

**Status:** ready-for-agent

**R0 — this rewrites an activation function already live in production. Rehearse on `develop` first.**

- [ ] `media_publication_activate` writes one `publication_snapshot_zones` row per `composition_zones`
      row, with geometry read from `layout_zones` at activation time and `source_layout_zone_id`
      recorded for tracing
- [ ] Each Zone's Playlist is expanded into `publication_snapshot_items` under that Zone, with
      `file_version_no` pinned per ADR 0045 §4 and duration resolved as it is today —
      `COALESCE(pi.duration_seconds, ma.duration_seconds)`
- [ ] Each Zone's `playback` is carried onto the snapshot Zone, so Zones in one Layout may legitimately
      differ
- [ ] The snapshot records `composition_revision`, `layout_updated_at`, and one `playlist_revision`
      per snapshot Zone. Level two is `layouts.updated_at`, **not** a new `layouts.revision` column —
      `media_layout_upsert` already sets `updated_at` on every path, and a counter nothing maintains
      fails silently by comparing 1 against 1 forever
- [ ] A Publication with no `composition_id` still produces exactly the single implicit full-screen
      Zone of ADR 0045 §1 — same rows, same values as today
- [ ] Activation refuses: an incomplete Composition, a Composition that is not `active`, and a
      Composition from another tenant — each inside the activation transaction, before anything is
      written
- [ ] Republishing takes a fresh snapshot and generates new Jobs against it, leaving older Jobs
      pointing at what they delivered; the Publication keeps its id
- [ ] Everything happens in the activation transaction — a failure leaves no partial snapshot
- [ ] Post-apply verification: `pg_get_functiondef` diffed against the migration file, exactly one
      overload, grants confirmed with `has_function_privilege`, advisors show no new finding
- [ ] Scratch-tenant SQL probe: activate a 2-Zone composition Publication, count and compare snapshot
      Zones and items against the bindings, and read back the three recorded revisions; activate a
      flat Publication and confirm its snapshot is unchanged from today's shape
