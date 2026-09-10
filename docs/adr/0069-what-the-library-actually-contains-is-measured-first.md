# What the library actually contains is measured before anything acts on it

**Status:** accepted (2026-09-09) — revised the same day to cover MP4 files whose `moov` box is at the end

A read-only probe reads the container of every existing Asset, determines the codec and H.264 profile
it actually holds, and produces a report. It writes nothing — no column, no status, no RPC, no
migration. Running it and running nothing at all leave the system in the same state, and a wrong
parser is fixed and re-run rather than migrated away from.

Its output is one number nobody has: how many Assets the players are refusing right now. ADR 0070
(quarantine) and ADR 0071 (transcode) are both worth building, and both are easier to size, justify
and scope once that number exists. This ADR exists so that number arrives before either is committed
to.

## Why the cheapest question is the one that is blocking

`upload-limits.ts` (thunder_one_prj) accepts a file on its extension and MIME type. Neither describes
what is inside the container, so an `.mp4` holding H.264 High Profile or HEVC passes every check we
have, `media_video_register` writes `'ready'`, and Media Detail shows a normal Asset. The Android
player then refuses it before playback starts — `H264_HIGH_PROFILE`, `HEVC_UNSUPPORTED`, per the
player team's `VIDEO_CODEC_SUPPORT.md` — and that refusal never reaches the backend. This is the
reported case where an operator uploaded three Assets and two played: the third was not an incomplete
download, it was a silently rejected profile.

Measured on production (Supabase project `sfiefevtxalqjizdkcsw`, the default `main` branch,
2026-09-09): 49 Assets — 34 video, 15 image — with `media_assets.codec` null on all 49 and `status`
`'ready'` on all 49. The column has existed since migration 048 and `media_video_register` accepts
`p_codec`, but nothing has ever sent it. Every statement anyone can make today about how much media
is broken is a guess.

That is why the two ADRs that follow are hard to scope. Quarantine is proportionate at forty broken
Assets and heavy-handed at two; transcoding is obviously worth building at forty and arguably
premature at two. Neither decision improves by being made blind, and the measurement costs a
read-only pass.

## Considered options

- **Probe as part of quarantining (the original single ADR):** rejected. It bundles a reversible read
  with an irreversible policy change, so the policy has to be decided before its own evidence exists,
  and a wrong call costs a migration and a rollback instead of a re-run.
- **Probe and persist `codec` on the way (this ADR's first draft):** rejected, and the reason is
  worth recording because it is not obvious. `media_core` is closed at PostgREST and Thunder_Core
  reaches it only through `public` RPCs — there is no `.schema('media_core')` anywhere in its `src/`
  — while `media_video_register` is `ON CONFLICT (tenant_id, file_id) … DO NOTHING`, so
  re-registering an existing Asset updates nothing. Writing `codec` to Assets that already exist
  therefore requires a new RPC, which is a migration, which is exactly the property this ADR claims
  not to have. The benefit it was buying — re-judging Assets by query instead of re-scanning — is
  worth little at 34 videos and 400 MB, where a full re-scan of ranged reads finishes in minutes.
  Persisting `codec` moves to ADR 0070, which alters `media_video_register` and backfills `status`
  anyway, so it costs nothing extra there.
- **Ask the player team how many files they are refusing:** rejected. The players emit the reason and
  it goes nowhere — asking for that callback is Q9 in
  `docs/media-library/player-codec-questions.md` and is worth having, but it reports only on media
  that has already aired and cannot see the library.
- **ffprobe over every file:** rejected as disproportionate. Deciding whether a file is H.264 High
  needs one byte: the `avcC` box in an MP4 carries `profile_idc` (66 Baseline, 77 Main, 100 High) and
  the constraint-set flags that distinguish Constrained Baseline. Reaching it is a bounded walk of
  top-level box headers followed by a ranged read of `moov` wherever its offset points — including at
  the end of a file without `faststart` — and a few dozen lines, against shipping a media toolchain
  to answer one question.
- **A read-only probe, reported and not persisted (chosen).**

## The parser is a shared module from the start

The probe runs as a one-off task in Thunder_Core with the service-role Storage client. Its range
reader walks top-level box headers by offset and size, then fetches the `moov` range even when it is
at the end of the object; it does not assume the first range contains `avcC`. The parser itself is
written as a plain module — bytes in, verdict out — with no Storage client, no route handler and no
database access of its own, because two consumers need it: this report and ADR 0070's admission check
on upload. (An earlier draft counted ADR 0071's check on its own encoder output as a third. It is not:
that worker is the component that will carry ffmpeg and ffprobe, and ADR 0071 makes proving that
toolchain fits and runs on the deployed function part of its benchmark.)

The smallest regression check is one ordinary MP4 and the same fixture remuxed without `faststart`:
both must produce the same codec, raw H.264 `profile_idc`, constraint flags and verdict. A tail
`moov` that becomes `unreadable` fails the probe rather than becoming report data.

Stating that now avoids the alternative, where a script grows the parsing inline and ADR 0070 begins
by moving it. It is not an abstraction: there is one implementation and no interface, only a refusal
to entangle byte parsing with where the bytes came from.

`media_video_register` could not host it in any case — it is `plpgsql SECURITY DEFINER SET
search_path = ''` with no `pg_net`, so it cannot read Storage and cannot be made to. That constrains
ADR 0070 as much as this one, and is the reason the admission decision there is computed in
Thunder_Core's route layer and passed into the RPC rather than derived inside it.

## What the report has to say, and what "airing" means

A count is not enough to act on. The report names, per Asset: the codec and profile found; whether
that profile is one the player document blocks outright (High, HEVC), one it records as untested
(Main), or one it accepts (Baseline, Constrained Baseline); whether the file could not be parsed at
all; and whether the Asset is currently airing.

That last column turns a number into a decision, so its definition belongs here rather than being
assumed downstream. **Airing means `publications.status = 'active'`, without regard to the schedule
window.** A Publication that is active but whose window has not opened yet counts as airing, because
the alternative fails in the worst possible way: quarantining such an Asset does nothing visible
today and breaks a screen weeks later, when nobody will connect the blank display to a backfill. The
narrower reading buys nothing — on production 375 `publication_snapshot_items` rows reference Assets,
so a meaningful share of the library is committed to snapshots either way.

The report is a deliverable, not a log line. **It is handed over as a file and is not committed** —
it carries Asset titles and filenames, which are customer content, and a repository is the wrong
place for that. It goes to the player team alongside
`docs/media-library/player-codec-questions.md`, where it answers the one question they cannot answer
for us and we have been unable to answer for them.

## Consequences

Nothing in the running system changes. No column is written, no status moves, no RPC signature
changes, no constraint is added, no upload is refused, and no screen an operator looks at differs
before and after the run. That is the entire point: the decisions with consequences are ADR 0070 and
ADR 0071, and they should be made against evidence rather than ahead of it.

In particular `media_asset_get` returns `ma.codec` and Media Detail renders it as a `Codec` fact,
today showing `—` on every Asset. It continues to. Filling that column would put a raw string like
`avc1.640028` in front of operators before ADR 0070 exists to explain what it means or offer anything
to do about it, and how that value should be presented is a decision for the ADR that makes it
actionable.

Re-running the probe is safe and expected — after a parser fix, after the player team answers, and
after ADR 0071 re-encodes anything — because it is a read.

`approval_status` is untouched and is a separate dimension: `20260909081713_auto_approve_uploaded_media.sql`
defaults it to `approved`, and whether an Asset is technically playable is not whether it is
editorially approved.

## A drift this work uncovered, recorded because it misleads any reader of the migrations

Thunder_Core's `supabase/migrations/051_media_storage_bucket.sql` sets the `media` bucket to
`file_size_limit = 524288000` (500 MB) and `allowed_mime_types` of
`video/mp4, video/webm, video/quicktime, video/x-matroska`. **Neither value is live.** Verified
2026-09-09 against production (`sfiefevtxalqjizdkcsw`) and the `develop` branch project
(`ftfmokgphewzyxzwjitv`): both buckets read `file_size_limit = 5368709120` (5 GB) and
`allowed_mime_types` of `video/mp4, image/jpeg, image/png, image/webp`.

The bucket was changed outside the migration history and no migration records it. `051` is a
misleading source for both fields, and the 5 GB figure ADR 0059 promises is genuinely enforced — a
fact ADR 0071 depends on and would reach the opposite conclusion about if it trusted the migration.
Reconciling the migration with the live bucket is a separate fix and is not bundled here.
