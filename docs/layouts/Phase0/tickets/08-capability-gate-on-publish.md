# 08 — Deferred: publish is gated on measured Device capacity

**Spec:** `docs/layouts/spec-composition-content.md`

**Deferred by:** `docs/adr/0054-capability-gate-on-publish.md` (which superseded
`docs/adr/0044-multi-zone-layout.md` §11)
**Future decision required:** a new ADR superseding ADR 0054

**Status:** deferred — not part of the current Composition publish phase.

ADR 0054 separates the **publish contract** (activation materializes a snapshot; the job payload
carries `zones[]`) from **device-capacity policy** (how many video Zones a player can decode at
once). The first ships now. This ticket is the second, and it waits.

Nothing in the current phase computes a required video-Zone count, reads `max_video_zones`, warns at
step 3, blocks at step 5, or offers an override. **Do not build any of it from this document.** The
accepted consequence is written into ADR 0054: a Composition may be published to a Device that cannot
decode all of its video Zones concurrently, and playback may stutter, drop video, or fail there.

**This ticket blocks nothing.** In particular it does not block ticket 10 (`zones[]` payload), whose
only remaining prerequisites are 05 and 09.

## Prerequisites before this can be picked up

- [ ] **A new ADR superseding ADR 0054 exists and is accepted.** ADR 0054 is the decision *not* to
      build this; it cannot authorise its own reversal, and neither can this ticket. Everything below
      is moot until that ADR lands
- [ ] The player has a real multi-Zone renderer (audit **B1**), on at least one platform
- [ ] The player actually reports capabilities through the device-profile call — a real build on a
      real device, not a SQL probe
- [ ] Concurrent video decoding has been **measured** on real target hardware (audit **A2**; Android 7
      boxes with a single hardware H.264 decoder are the constraining case)
- [ ] A rollout policy exists for Devices that have not reported — how much of the fleet may be
      refused, and for how long, before enforcement is worth turning on
- [ ] Override policy decided from real use cases. ADR 0054 **withdrew** the `capability_override`
      design rather than deferring it; if an escape hatch is wanted, it is designed then, not resumed

## Future scope (retained, not current work)

Kept from the original ticket so the design is not re-derived from scratch:

- [ ] Activation refuses a composition Publication whose resolved target set contains a Media Device
      with NULL `player_capabilities`, no multi-zone support, or a `max_video_zones` below what the
      Composition requires — inside the activation transaction
- [ ] **The check reads the snapshot that will actually be delivered**, not live bindings re-read in a
      separate statement. The count and the payload must come from the same rows, or a Playlist edited
      between the two makes the gate protect a snapshot that was never sent
- [ ] It reuses the target Device set that activation already resolves exactly once (ADR 0045 §8);
      it must never re-resolve Channel membership of its own
- [ ] The count is **Zones holding at least one item of `kind: "video"`**, not the number of video
      items — Zone loops run independently, so the conservative count is the correct one
      (ADR 0044 §11, the part that survives)
- [ ] The refusal names the offending Media Devices and the reason
- [ ] A capability-check endpoint answers, for a Composition and a set of Channel ids, which Media
      Devices cannot render it and why
- [ ] Step 3 surfaces that as a warning naming the Devices and reason, and does not block progress
- [ ] Step 5 blocks publishing while any targeted Device is incapable, showing the same detail
- [ ] A Publication with no Composition is never gated — the check does not run and its behaviour is
      unchanged
- [ ] `publish-eligibility` gains the capability-block cases in its existing check file
- [ ] Post-apply verification: `pg_get_functiondef` diffed against the migration file, exactly one
      overload, grants confirmed with `has_function_privilege`, advisors show no new finding
- [ ] Scratch-tenant SQL probe covering all four cases: NULL capabilities, no multi-zone support,
      `max_video_zones` too low, and a capable Device that publishes successfully
- [ ] Verified in the browser at steps 3 and 5, not only by check files
