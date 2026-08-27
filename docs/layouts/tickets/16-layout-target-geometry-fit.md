# 16 — A Layout warns about a target whose geometry does not fit

**Spec:** `docs/layouts/spec-composition-content.md` · **Decided by:**
`docs/adr/0055-geometry-fit-is-advisory.md` (which supersedes the enforcement half of
`docs/adr/0044-multi-zone-layout.md` §4, including its staged exception)

**What to build:** the operator is warned when a targeted Media Device's geometry does not fit the
Layout — wrong orientation, or an aspect ratio outside a 15% band — or when the Device has never
reported geometry at all. The warning appears at step 3 as soon as such a Channel is selected and
again at step 5. **Nothing is refused.** Alongside it, `media_heartbeat` starts prompting for missing
geometry, so the fleet begins reporting the values ticket 17 will need.

**Why the rule is advisory:** ADR 0055 has the measured argument. In short: the profile call reports
the *work area*, so a taskbar makes a 16:9 panel report 1920×1008; `screen_ratio` has two writers and
contradicts the profile fields on real Devices; and an exact match refuses two of the four profiled
production Devices for reasons no operator could act on. The warning is what makes the fleet
measurable, which is the precondition for enforcing anything.

**Blocked by:**
- 05 — Activation materializes Zones and records revisions (the Composition path this warns about)
- 07 — production apply. **Done, 2026-08-27.** This ticket does `CREATE OR REPLACE` on
  `media_heartbeat`, and before the apply the two environments held different bodies of it. They now
  match.

**Blocks:** 10 — `zones[]` payload, for the warning and the `profile_required` widening only. Ticket
10 no longer waits on a refusal, because there is none.

**Status:** ready-for-agent. ADR 0055 accepted 2026-08-27; ticket 07 applied to production the same
day.

## Scope note — what ADR 0055 removed from this ticket

An earlier version of this ticket refused an unfitting Device at step 5 and again inside
`media_publication_activate`. Both are gone:

- **`media_publication_activate` is not modified by this ticket.** The activation transaction keeps
  exactly the checks it has today, including ticket 09's equal-priority overlap block.
- **`publish-eligibility.ts` gains no row and no gate.** Its positional check array and `gateChecks`
  are unchanged. `publish-eligibility.check.mts` therefore gains no fit case either.
- The only server-side change is `media_heartbeat`'s `profile_required`.

Ticket 17 owns turning enforcement on, and it now owns **both** halves — known mismatch and unknown
geometry — behind one fleet readiness threshold.

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
- [ ] **`media_heartbeat`'s `profile_required` is widened to include missing geometry** — a Device
      lacking `screen_width` or `screen_height` is re-prompted — **and its identity clause is
      corrected from `AND` to `OR` in the same change**, so a partially profiled Device is prompted
      too. `CREATE OR REPLACE` is safe: the signature does not change
- [ ] A check covers the **partial profile** cases explicitly: identity present + geometry missing;
      identity present + capabilities present + geometry missing; geometry present + identity
      missing. Each must still be prompted. This is the case that silently breaks recovery today
- [ ] Post-apply verification on both environments: `pg_get_functiondef` matches the migration file,
      exactly one overload of `media_heartbeat`, grants confirmed with `has_function_privilege`,
      advisors show no new finding
- [ ] SQL probe: a Device with identity set and geometry missing gets `profile_required: true`; a
      Device with everything set gets `false`; the flat telemetry echo is unchanged
- [ ] Verified in the browser at steps 3 and 5 — the warning appears, and Publish stays enabled

## Explicitly not this ticket

- Refusing anything on geometry, at any layer — **ticket 17**, both halves, behind a threshold.
- The readiness threshold itself — ticket 17, at grooming.
- Removing the `screen_ratio` / `screen_dimension` double-write from `media_heartbeat` — recorded as
  debt by ADR 0055 §9. Nothing here reads either field.
- Decoder capacity / `max_video_zones` — deferred by ADR 0054, ticket 08.
- The Channel ↔ Media Device fit rule — already shipped, untouched here.
- Any operator override. ADR 0054 withdrew that design; there is no block for one to relieve.
