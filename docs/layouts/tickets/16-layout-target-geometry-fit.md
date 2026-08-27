# 16 — A Layout warns about a target whose geometry does not fit

**Spec:** `docs/layouts/spec-composition-content.md` · **Decided by:**
`docs/adr/0055-geometry-fit-is-advisory.md` (which supersedes the enforcement half of
`docs/adr/0044-multi-zone-layout.md` §4, including its staged exception)

**What to build:** the operator is warned when a targeted Media Device's geometry does not fit the
Layout — wrong orientation, or an aspect ratio outside a 15% band — or when the Device has never
reported geometry at all. The warning appears at step 3 as soon as such a Channel is selected and
again at step 5. **Nothing is refused, and nothing on the server changes.** This ticket is frontend
only: no migration, no R0.

**Why the rule is advisory:** ADR 0055 has the measured argument. In short: the profile call reports
the *work area*, so a taskbar makes a 16:9 panel report 1920×1008; `screen_ratio` has two writers and
contradicts the profile fields on real Devices; and an exact match refuses two of the four profiled
production Devices for reasons no operator could act on. The warning is what makes the fleet
measurable, which is the precondition for enforcing anything.

**Blocked by:** 05 — Activation materializes Zones and records revisions (the Composition path this
warns about). Nothing else. Ticket 07's production apply is no longer a prerequisite: it was one
only because this ticket used to `CREATE OR REPLACE media_heartbeat`, and it no longer does. (It was
applied 2026-08-27 regardless.)

**Blocks:** 10 — `zones[]` payload, for the operator-facing warning only. Ticket 10 no longer waits
on a refusal, because there is none.

**Status:** ready-for-agent. ADR 0055 accepted 2026-08-27.

## Scope note — what ADR 0055 removed from this ticket

An earlier version of this ticket refused an unfitting Device at step 5 and again inside
`media_publication_activate`, and widened `media_heartbeat`'s `profile_required`. All three are
gone:

- **`media_publication_activate` is not modified.** The activation transaction keeps exactly the
  checks it has today, including ticket 09's equal-priority overlap block.
- **`publish-eligibility.ts` gains no row and no gate.** Its positional check array and `gateChecks`
  are unchanged. `publish-eligibility.check.mts` therefore gains no fit case either.
- **`media_heartbeat` is not modified.** The widening moved to **ticket 18**, because neither player
  build reads the heartbeat response body, so the flag has no reader and widening it here would
  change a value nobody fetches. ADR 0055 carries the sources. Do not re-add it to this ticket "for
  free" — it is not free, it is an R0 to production with nothing to verify at the far end.

Ticket 17 owns turning enforcement on, and it now owns **both** halves — known mismatch and unknown
geometry — behind one fleet readiness threshold, with ticket 18 as its prerequisite.

## Acceptance criteria

- [ ] A pure module computes fit from a Layout's declared `aspect_ratio` and a Device's reported
      `screen_width` / `screen_height`. Plain functions over plain data, with a `.check.mts` beside
      it — house style, no runner
- [ ] Orientation is **derived from `screen_width` / `screen_height`**, not read from the
      `orientation` column, and `screen_ratio` / `screen_dimension` are not read at all. A Device
      whose columns disagree (production Screen 04 does) must not produce a result the check has to
      arbitrate
- [ ] Geometry counts as reported only when **both** `screen_width` and `screen_height` are present.
      Anything else is `unknown`, which is a distinct outcome from `does-not-fit`
- [ ] A Device with `width == height` fits any Layout
- [ ] Aspect compatibility is the symmetric band from ADR 0055:
      `max(deviceAR, layoutAR) / min(deviceAR, layoutAR) <= 1.15`. The constant carries a
      `// ponytail:` comment naming the fleet measurement it came from and that it is tunable
- [ ] Checks cover the measured cases by name: 1920×1080 fits 16:9; 1920×1008 (taskbar) fits 16:9;
      1920×1200 (16:10) fits 16:9; 1080×1920 does not (orientation); 1024×768 (4:3) does not
      (aspect); a missing dimension is `unknown`
- [ ] Resolution is **not** compared at the Layout level. A Layout declares `aspect_ratio`, not a
      resolution (ADR 0044 §4); `reference_resolution` exists on `layouts` for the editor's pixel
      readout (ticket 11), not as a publish-time comparison
- [ ] Step 3 warns as soon as a selected Channel contains a Device that does not fit **or** has never
      reported geometry, naming the Devices and saying which of the two it is, and does not block
      progress
- [ ] Step 5 shows the same warning and **does not** prevent publishing. The Publish button's enabled
      state is unchanged by geometry
- [ ] A Publication with no Composition is never checked — the flat path is unchanged
- [ ] The fit check failing to run (the Layout's aspect ratio could not be loaded) says so, rather
      than rendering as "everything fits". A silent check is worse than no check
- [ ] No migration, and no file under `Thunder_Core/supabase/migrations/` is added or modified
- [ ] Verified in the browser at steps 3 and 5 — the warning appears, and Publish stays enabled

## Explicitly not this ticket

- Refusing anything on geometry, at any layer — **ticket 17**, both halves, behind a threshold.
- The readiness threshold itself — ticket 17, at grooming.
- Making unprofiled Devices report — **ticket 18**. This ticket warns about them; it cannot fix them.
- Removing the `screen_ratio` / `screen_dimension` double-write from `media_heartbeat` — recorded as
  debt by ADR 0055 §9. Nothing here reads either field.
- Decoder capacity / `max_video_zones` — deferred by ADR 0054, ticket 08.
- The Channel ↔ Media Device fit rule — already shipped, untouched here.
- Any operator override. ADR 0054 withdrew that design; there is no block for one to relieve.
