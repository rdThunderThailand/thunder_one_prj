# SESSIONLOG — ADR 0071 transcode v1 design — 2026-09-17

Design-only session (grill-with-docs). No code, no migration, no deploy.

## Decided

- Automatic transcode is built despite the count (prod 3/25, 0 airing) — product outcome, not
  population; gate 1 of the 2026-09-10 draft is overridden on purpose and the ADR says so.
- v1 trigger = ADR 0070 byte-walk verdict only (High/Main/HEVC → job; unreadable → refuse). No
  ffprobe on intake; provisional ceilings, `unverified_preset` conversion, admin CLI, recipe
  versioning, soft-timeout accounting all deferred to v2 with triggers.
- Vercel Pro function in Thunder_Core, cron `* * * * *` as the only trigger (no kick), one encode
  per invocation, two attempts never a third, `ready_to_install` installed by a separate RPC when
  the Asset is off air (`publication_playback_window` helper + latest Publish Job snapshot).
- Rendition = two nullable columns + two `COALESCE` lines in `media_job_poll`; original kept.
- Rollout: worker (no cron) → migration → manual smoke → cron → backfill; prod promotes T2+T3 then
  T4+T6 by cherry-pick so migration source is on `main` before apply.

## Files

- `docs/adr/0071-*.md` rewritten in place (572 → ~240 lines; old draft in git history as v2 spec).
- `docs/media-library/plan-transcode.md` new — T1–T8 with acceptance and R0 map.
- `CONTEXT.md` — `Rendition` as planned term; WebP wording fixed; "codec or H.264 profile".

## Review rounds

Four external review rounds; each finding fixed and re-checked (rollout order, Main on-air swap,
claim SQL, output identity, ffprobe contract, cron-on-preview, retry ceiling, fail state machine,
migration-source promotion, Rendition orphan). `git diff --check` clean.

## Next

T1 spike on a Thunder_Core preview deployment (Sonnet-suitable). ADR stays `proposed` until T1.
