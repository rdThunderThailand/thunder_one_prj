# 0032 — Playlist Output Profile: trimmed enum, numeric width/height, field-level validation

## Context

Ticket [86d3xxkab](https://app.clickup.com/t/86d3xxkab) (`Playlist Type & Output Profile`, subtask
of `86d3xxk5b`) asks for Playlist Type, Resolution, and Frame Rate on Create Playlist Step 1, used
as the playlist's Output Profile and as the basis for Step 2's content-compatibility check.

Verified 2026-08-20 against `thunder_one_prj` @ `07be050` and `Thunder_Core`'s working tree. Every
selector already existed and looked correct, but the whole Output Profile was frontend-only:

- `PLAYLIST_TYPES = ["standard", "dynamic", "loop", "manual"]` (`types/index.ts`), but the wizard
  can only ever produce `standard` — `loop`/`manual`/`dynamic` were dead dropdown options, an open
  question since ADR 0017.
- Resolution stored as the string `"1920x1080"` (`PlaylistInfo.resolution`); no numeric
  width/height, aspect ratio existing only inside a display label (and inconsistently — 4K was
  labelled `(4K)` while the other three said `(16:9)`).
- `validateStep(1)` (`step-validation.ts`) checked only name and description; no combination of
  type/resolution/frame rate could ever fail.
- `Thunder_Core`'s playlist routes (`media/playlists/route.ts`, `media/playlists/[id]/route.ts`)
  validate only `name` and `status`; `metadata` is `z.record(z.string(), z.unknown())` — any value
  under `metadata.info` is written through unchecked. No config endpoint serving allowed values
  exists under `/media/*`.

A read-only query against prod (`media_core.playlists`, 62 rows) confirmed no row uses `dynamic`,
`loop`, or `manual` — 5 rows are `standard`, 57 have no profile at all — so trimming the enum
breaks nothing already stored.

## Decision

**Type enum becomes `standard` + `dynamic`; only `standard` is offered in Create.** `loop` and
`manual` are removed outright — nothing ever produced one, and no ticket or ADR claims they need
to exist. `dynamic` stays in the *decode* enum (so a row a future phase writes doesn't get dropped
on read) but the wizard's Type selector only lists `standard`
(`CREATABLE_PLAYLIST_TYPES`, `types/index.ts`) until dynamic playlists are actually built.

**Allowed values are enforced with a zod enum on the `Thunder_Core` routes, not a new config
endpoint.** `src/lib/core/playlist-metadata.ts` exports `validatePlaylistOutputProfile()`, wired
into both `POST /media/playlists` and `PATCH /media/playlists/[id]`. It inspects only
`metadata.info.{playlist_type,resolution,width,height,frame_rate}` and leaves every other key
(description, campaign_id, tags, cover_asset_id, the whole `playback` object) untouched — this is
a gate on the Output Profile fields, not a schema for the jsonb blob. The four lists
(`thunder_one_prj/src/features/playlists/output-profile.ts` and the backend copy) are deliberately
duplicated rather than served from one place — see Rejected below.

**Resolution keeps `resolution` as the canonical selector value; `width`/`height` are derived
numbers alongside it, not a second thing the caller sets.** `encodeMetadata` computes them from
`resolution` via `parseResolution()` at write time; `decodeMetadata` reads the stored numbers and
falls back to re-parsing `resolution` for rows written before this change. Aspect ratio is
computed from width/height via gcd (`aspectRatio()`), never stored — a stored ratio would just be
a second representation of the same two numbers, one more place to go stale.

**`METADATA_VERSION` stays `1`.** `decodeMetadata` returns *empty* on a version mismatch
(`metadata.ts`), so bumping it would blank description/campaign/tags/cover on all 62 existing
playlists to add two additive keys. `width`/`height` are new optional keys under the same version
— backward and forward compatible without a migration of any kind. The localStorage draft key
(`…create-draft.v2`) is unaffected for the same reason.

**4.4 (Output Profile validation) is field-level only — no cross-field combination rule.** Every
field individually must be one of its allowed values; there is no rule like "no 4K at 60fps".
Writing such a rule would require real player-capability data, which does not exist yet — the
firmware questionnaire (`.docs/player_codec_capability_request.md`) that would answer it is still
unanswered, exactly the reasoning ADR 0019 already used to exclude frame rate and codec from the
Step 2 compatibility check.

## Consequences

The three "API ปฏิเสธค่าที่ไม่รองรับ" acceptance criteria (4.1/4.2/4.3) now pass once
`Thunder_Core` is deployed — before that, `CORE_API_URL` points at the already-deployed instance,
so the rejection is invisible through the UI. 4.4's AC ("combination ที่ไม่รองรับแสดง Error
ชัดเจน") is met only for out-of-range single values; a value from the allowed list on each field
can still form a combination nobody has actually validated against player capability. That gap is
intentional and re-opens once the firmware answer lands, not before.

## Rejected

**A `GET /media/config/output-profile` endpoint the frontend fetches from, instead of a duplicated
constant.** This is the honest single-source-of-truth answer and was the frontend's first
instinct, but it costs a new route, a fetch + loading state on Step 1, and a round trip on every
Create open, to serve four values that change on a deploy cadence measured in months, not
per-tenant or per-request. The zod enum and the frontend list are the same four numbers in two
files; if they drift, `tsc`/`eslint` catch nothing but a wrong choice becomes a 400, which is
loud, not silent. Revisit if the list needs to vary per tenant or per device capability — that is
a different, real reason to centralize it.

**Cross-field combination rules (e.g. "reject 4K at 60fps").** Rejected for the reason above: there
is no source of truth for what a real Media Device can actually decode. Inventing thresholds now
would be guessing, and the first wrong guess blocks an operator who knows their hardware fine.

**A real `output_profile` column set on `media_core.playlists`** (a `type`/`width`/`height`/
`frame_rate` columns instead of jsonb keys). Rejected on the same grounds ADR 0010 already
settled: no code needs to filter or join on these values, so a column buys query ergonomics nobody
uses at the cost of an R0 migration. Revisit if a report or filter ever needs to query by
resolution across playlists.
