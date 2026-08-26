# 08 — Publish is gated on reported capability

**Spec:** `docs/layouts/spec-composition-content.md` · **Decided by:** `docs/adr/0044-multi-zone-layout.md` §11

**What to build:** an operator cannot send a Layout to a screen that cannot compose it. As soon as they
pick Channels at step 3 they are warned, by name, which Media Devices cannot render this Layout and
why; at step 5 publishing is refused outright, and refused again by the server if the UI is bypassed.
A Device that has never reported its capabilities counts as unable — unknown fails.

**Blocked by:** 05 — Activation materializes Zones
and records revisions · 07 — Media Device reports its rendering capabilities

**Status:** ready-for-agent

- [ ] `media_publication_activate` refuses a composition Publication whose resolved target set contains a
      Media Device with NULL `player_capabilities`, no multi-zone support, or a `max_video_zones` below
      what the Layout requires — inside the activation transaction, before anything is written
- [ ] The refusal message names the offending Media Devices and the reason
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
