# 10 — Composition Publications poll a `zones[]` payload

**Spec:** `docs/layouts/spec-composition-content.md` · **Decided by:** `docs/adr/0044-multi-zone-layout.md` §9, §10 ·
`docs/adr/0045-publication-snapshot-materialization.md` §5

**What to build:** a screen showing a composition Publication receives the composition — each Zone with its
own geometry, loop duration and slot list — so it can lay out the screen without resolving anything. A
screen showing anything else receives the flat payload it receives today, unchanged, indefinitely.

This ticket ships after the guards that make a single `zones[]` sufficient and correct: the snapshot
it reads (ticket 05) and the equal-priority overlap block that stops two composition Publications
being merged into one loop with no arbitration (ticket 09). It no longer waits on the capability
gate — ADR 0054 defers that — and it no longer waits on a geometry *refusal*: ADR 0055 makes the
Layout ↔ target fit rule advisory, so ticket 16 warns rather than refuses and nothing on the geometry
path blocks a publish. Ticket 16 still precedes this one, for the operator-facing warning.

**Blocked by:** 05 — Activation materializes Zones and records revisions · 09 — Equal-priority
overlap blocks publish · 16 — Layout ↔ target geometry fit, now advisory (ADR 0055)

**Known limitation:** the server contract and the poll payload are verifiable here; player rendering
is a separate layer of verification in another repo. There is **no per-device capacity enforcement**
(ADR 0054), so a zoned payload reaches a Device whatever it can decode. **Do not report real playback
as verified until it has been tested against a real player build** — a correct payload is not a
rendered screen.

**Status:** ready-for-agent · unblocked 2026-08-28. All three blockers are done: 05 is applied to
production (`media_publication_activate` writes `publication_snapshot_zones`), 09 is applied to
production with its frontend committed as `4b6d9d7`, and 16's advisory warnings are committed
(`0e3e75e`, `63c9f04`, `f594573`). It does **not** wait on ticket 17, the flip to refusing unprofiled
Devices, which is held behind a fleet readiness threshold.

**Production baseline checked 2026-08-28** — `media_job_poll` is one overload and *already* joins
`publication_snapshot_zones`, but only to reach snapshot items
(`psi.snapshot_zone_id = z.id`), which it aggregates into the existing flat `v_slots`. **No `zones[]`
key is emitted today.** So the work here is the branch itself, and "byte-identical flat response"
means: for a snapshot whose Publication has no Composition, the current flattening path must be left
exactly as it is rather than re-derived from the new branch.

**Known limitation inherited from ticket 16 (widened by ADR 0055):** until ticket 17 lands, a Device
receives a zoned payload whether or not its geometry fits the Layout, and whether or not it has ever
reported geometry at all — nothing on that path refuses. The operator is warned at steps 3 and 5.
That is the same class of knowingly accepted risk as the deferred decoder capacity above. It does
**not** narrow on its own: no player build reads `profile_required`, so an unprofiled Device is
asked again only when it restarts. Ticket 18 is what changes that, and this ticket deliberately does
not wait on it.

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
