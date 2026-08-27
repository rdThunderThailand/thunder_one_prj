# 07 — Media Device reports its rendering capabilities

**Spec:** `docs/layouts/spec-composition-content.md` · **Decided by:** `docs/adr/0044-multi-zone-layout.md` §11

**What to build:** a Media Device tells the server what it can actually render — whether it supports
multi-zone composition at all, and how many video Zones it can decode at once — and a Device that has
never said so is told to. Nothing is gated on the answer yet (that is ticket 05); this ticket makes the
answer exist.

**Blocked by:** None — independent of the Composition track, can run in parallel with 01–06.

**Status:** applied to `develop` (`ftfmokgphewzyxzwjitv`), pending production approval — 2026-08-27.
The migration `supabase/migrations/20260826093000_media_device_capabilities.sql` and the route change
`src/app/api/core/v1/media/player/device-profile/route.ts` are committed on `feat/layout`
(`Thunder_Core@8c709e9`); the migration header ticket number and the ADR 0009 contract note were
fixed in a follow-up commit. `player_capabilities` still absent from production.

Post-apply verification on `develop`: column present with the intended comment; exactly one overload
each of `media_device_profile_set` (3-arg) and `media_heartbeat` (2-arg), old 2-arg `profile_set`
gone; `has_function_privilege` confirms `service_role` only, `anon`/`authenticated` revoked; security
advisors show no finding naming either function. **Not done:** the scratch-tenant functional probe
(calling the SECURITY DEFINER RPCs is a write, blocked by the auto-mode classifier this session) and
production apply.

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
- [ ] Scratch-tenant SQL probe: a Device with NULL capabilities gets `profile_required`, reports
      capabilities, and then does not — **blocked**: calling the RPCs is a write, denied by the
      auto-mode classifier this session
- [ ] Production apply + approval
