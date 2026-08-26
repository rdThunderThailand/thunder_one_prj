# 07 — Media Device reports its rendering capabilities

**Spec:** `docs/layouts/spec-composition-content.md` · **Decided by:** `docs/adr/0044-multi-zone-layout.md` §11

**What to build:** a Media Device tells the server what it can actually render — whether it supports
multi-zone composition at all, and how many video Zones it can decode at once — and a Device that has
never said so is told to. Nothing is gated on the answer yet (that is ticket 05); this ticket makes the
answer exist.

**Blocked by:** None — independent of the Composition track, can run in parallel with 01–06.

**Status:** written, applied nowhere — checked 2026-08-26. The migration
`supabase/migrations/20260826093000_media_device_capabilities.sql` and the 14-line change to
`src/app/api/core/v1/media/player/device-profile/route.ts` exist in the `Thunder_Core` working tree,
both untracked/uncommitted. `player_capabilities` is absent from **both** `develop` and production, so
this ticket is not done — it is a draft awaiting a rehearse-then-approve pass like any other.

Its migration header still cites the old ticket number (`Ticket 04 …
04-device-reports-capabilities.md`) from before the series was renumbered. Harmless, and the file is
uncommitted, so fix it whenever this ticket is picked up.

- [ ] `public.assets` has a nullable `player_capabilities jsonb`; NULL means *never reported*
      (Media Devices are `public.assets` rows, per ADR 0044 §11 and migration `096` — not
      `media_core.assets`, which an earlier draft of this ticket wrongly named)
- [ ] `media_device_profile_set` accepts capabilities and stores them there, carrying at least
      multi-zone support and `max_video_zones`
- [ ] The profile route passes capabilities through; a profile call without them is still accepted and
      leaves the column as it was
- [ ] `media_heartbeat` returns `profile_required` = true when the calling Device's
      `player_capabilities IS NULL`, and does not otherwise change its response
- [ ] The device contract documentation states the new field and the `profile_required` signal
- [ ] `media_device_profile_set` changed its argument list, so the old signature is dropped before the
      new function is created — no overload is left behind
- [ ] Post-apply verification: `pg_get_functiondef` diffed against the migration file, exactly one
      overload of each touched function, grants confirmed with `has_function_privilege`, advisors show
      no new finding
- [ ] Scratch-tenant SQL probe: a Device with NULL capabilities gets `profile_required`, reports
      capabilities, and then does not
