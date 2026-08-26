# 10 — Composition Publications poll a `zones[]` payload

**Spec:** `docs/layouts/spec-composition-content.md` · **Decided by:** `docs/adr/0044-multi-zone-layout.md` §9, §10 ·
`docs/adr/0045-publication-snapshot-materialization.md` §5

**What to build:** a screen showing a composition Publication receives the composition — each Zone with its
own geometry, loop duration and slot list — so it can lay out the screen without resolving anything. A
screen showing anything else receives the flat payload it receives today, unchanged, indefinitely.

This ticket ships last on purpose: the payload must not reach a screen before the guards that make a
single `zones[]` sufficient (tickets 05 and 06) are in place.

**Blocked by:** 05 — Activation materializes Zones and records revisions · 08 — Publish is gated on
reported capability · 09 — Equal-priority overlap blocks publish

**Status:** ready-for-agent

- [ ] `media_job_poll` branches on the polled Job's snapshot: no Composition → `slots[]`; with one →
      `zones[]`
- [ ] The flat response is byte-identical to today for a Publication without a Composition — same keys, same
      order, same values; no `zone_id` is added to `slots[]`
- [ ] The jobs **route** signs asset URLs by walking `result.zones[].slots` as well as `result.slots`
      — it walks only the latter today, so every asset in a zoned payload would arrive with
      `file.url = null`
- [ ] No `role` field is emitted; geometry is three decimal places, matching the columns after
      ticket 01
- [ ] Each `zones[]` entry carries its geometry in percent, its `loop_duration_seconds`, and its own
      `slots[]`
- [ ] `loop_anchor_at` is a single top-level value shared by every Zone, not per Zone
- [ ] Zone slots come from the snapshot only — `playlist_items` and `playlists` are not read
- [ ] Items are not deduplicated across Zones: the same asset in two Zones appears in both
- [ ] The device contract documentation states both shapes and that the player branches on the presence
      of `zones`
- [ ] Post-apply verification: `pg_get_functiondef` diffed against the migration file, exactly one
      overload, grants confirmed with `has_function_privilege`, advisors show no new finding
- [ ] Scratch-tenant SQL probe calling `media_job_poll` for a flat Publication and a two-Zone composition
      Publication, comparing both payloads against the snapshot rows; the flat payload additionally
      diffed against one captured before the change
