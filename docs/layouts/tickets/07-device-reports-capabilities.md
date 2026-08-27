# 07 — Media Device reports its rendering capabilities

**Spec:** `docs/layouts/spec-composition-content.md` · **Decided by:** `docs/adr/0044-multi-zone-layout.md` §11
(§11 superseded by `docs/adr/0054-capability-gate-on-publish.md` — this ticket survives as groundwork)

**What to build:** a Media Device tells the server what it can actually render — whether it supports
multi-zone composition at all, and how many video Zones it can decode at once — and a Device that has
never said so is told to. **Nothing is gated on the answer** — enforcement is the deferred ticket 08
(ADR 0054), not this one and not ticket 05. This ticket only makes the answer exist.

**Blocked by:** None — independent of the Composition track, can run in parallel with 01–06.
**Blocks:** no publish rule reads what it stores (ADR 0054), but **its production apply is a schema
prerequisite for ticket 16**: production has neither `player_capabilities` nor the
capabilities clause in `media_heartbeat`, and still the two-argument `media_device_profile_set`, so
ticket 16's `CREATE OR REPLACE` of `media_heartbeat` cannot be written to fit both environments.
Sequence is `07 production apply → 16 → 10`.

**Status:** groundwork applied to develop; production apply pending separate R0 approval and
required before ticket 16. No publish rule reads what it stores.

Applied to `develop` (`ftfmokgphewzyxzwjitv`) on 2026-08-27. **No rule in the current phase reads the
value it stores** (ADR 0054): `player_capabilities` is written by the profile call and read by
nothing that decides a publish. The `develop` migration is **not** rolled back — the column and the
widened `profile_required` are how the fleet's real capacity eventually gets measured, which is the
precondition for ticket 08.

The migration `supabase/migrations/20260826093000_media_device_capabilities.sql` and the route change
`src/app/api/core/v1/media/player/device-profile/route.ts` are committed on `feat/layout`
(`Thunder_Core@8c709e9`); the migration header ticket number and the ADR 0009 contract note were
fixed in a follow-up commit. `player_capabilities` still absent from production.

Post-apply verification on `develop`: column present with the intended comment; exactly one overload
each of `media_device_profile_set` (3-arg) and `media_heartbeat` (2-arg), old 2-arg `profile_set`
gone; `has_function_privilege` confirms `service_role` only, `anon`/`authenticated` revoked; security
advisors show no finding naming either function. Functional probe passed (see checklist).
**Not done:** production apply + approval.

- [x] `public.assets` has a nullable `player_capabilities jsonb`; NULL means *never reported*
      (Media Devices are `public.assets` rows, per ADR 0044 §11 and migration `096` — not
      `media_core.assets`, which an earlier draft of this ticket wrongly named)
- [x] `media_device_profile_set` accepts capabilities and stores them there, carrying at least
      multi-zone support and `max_video_zones`
- [x] The profile route passes capabilities through; a profile call without them is still accepted and
      leaves the column as it was
- [x] `media_heartbeat` returns `profile_required` = true when the calling Device's
      `player_capabilities IS NULL`, and does not otherwise change its response
- [x] The device contract documentation states the new field and the `profile_required` signal
      (ADR 0009 §"The split")
- [x] `media_device_profile_set` changed its argument list, so the old signature is dropped before the
      new function is created — no overload is left behind
- [x] Post-apply verification (`develop`): comment, exactly one overload of each touched function,
      grants confirmed with `has_function_privilege`, advisors show no new finding
- [x] SQL probe on `develop` (seed device "ThunderOne Screen 01", os+machine set, caps NULL):
      heartbeat → `profile_required: true` → `media_device_profile_set` with
      `{multi_zone_v1, max_video_zones}` echoes them back → heartbeat → `profile_required: false`;
      a non-object capabilities arg raises `Invalid input: capabilities must be an object`.
      (Side effect: that seed device now carries a capabilities value on develop — harmless.)
      **This probe proves the schema and the RPC contract only. It is not evidence that any real
      player reports capabilities** — none ever has, on either environment.
- [ ] **Production apply + approval — R0, still required, and now a prerequisite for ticket 16**
      rather than deferred to the enforcement phase. Verified read-only on production
      2026-08-27: no `player_capabilities` column, `media_device_profile_set(text, jsonb)` only,
      `media_heartbeat` with no capabilities clause. Note the `DROP FUNCTION` on the live two-argument
      signature — adding a parameter otherwise mints an ambiguous overload.
