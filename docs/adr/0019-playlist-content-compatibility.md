# 0019 — Content compatibility is a geometry warning, computed from dimensions captured at upload

## Context

Ticket [86d3xxk5b](https://app.clickup.com/t/86d3xxk5b) AC 12 requires the playlist's Output
Profile to be used for checking content compatibility in Step 2. The ticket never defines
"incompatible", which is why `docs/playlists/plan-create-playlist-step1.md` Phase 3.1 listed the
definition as the check's entire spec.

What the system actually has, verified 2026-08-17:

- **The "Output Profile" is two fields**, not an entity: a Resolution picked from four fixed
  options and a Frame Rate picked from `24 / 25 / 30 / 60` (`BasicInfoStep.tsx:12-19`). Both are
  stored in the draft's `metadata.info` (`metadata.ts:62-63`). Every offered resolution is either
  16:9 (`1920x1080`, `3840x2160`, `1280x720`) or 9:16 (`1080x1920`); there is no separate aspect
  ratio field.
- **`media_assets` has `width`, `height` and `codec`**, and `media_videos_list` returns all three
  to the frontend — the fact recorded in the plan and in the ticket's open-questions block.
- **Nothing ever writes them.** `registerVideo()` posts only `file_id`, `title`,
  `duration_seconds` and `thumbnail_storage_key` (`upload-api.ts:38-42`), even though the backend
  route accepts `width` / `height` and passes them to the RPC as `p_width` / `p_height`
  (`Thunder_Core .../media/videos/route.ts:9-10,29-30`).
- A count against production confirms it: all **17** rows in `media_core.media_assets` (7 video,
  10 image) have `width`, `height` and `codec` NULL. Only `duration_seconds` is populated.

So the plan's note that AC 12 "is not blocked on data" was wrong in practice. A compatibility
check written against these columns today would be silent on every asset in the system.

There is no frame-rate column on an asset at all — not NULL, absent — so a frame-rate check would
need a migration before it could be written. Codec compatibility is a different question with a
different owner: it is what the firmware questionnaire in `.docs/player_codec_capability_request.md`
exists to answer, and ADR 0016 already decided the system does not re-encode.

## Decision

**"Incompatible" means geometry only: an aspect ratio that does not match the profile, or a
resolution meaningfully below it. It is a warning, never a block, and it is computed on every
render rather than stored.** Dimensions are captured client-side at upload so the check has data
to work with.

The rule, as one pure function `checkContentCompatibility(profileResolution, asset)` returning
`"aspect" | "resolution" | null`:

| Condition | Result |
|---|---|
| `width` or `height` missing | `null` — silent |
| \|(assetW/assetH) ÷ (profileW/profileH) − 1\| > 0.01 | `"aspect"` |
| `assetW < profileW × 0.9` or `assetH < profileH × 0.9` | `"resolution"` |
| otherwise, including assets larger than the profile | `null` |

Each threshold answers a specific failure:

- **The 1% aspect tolerance** keeps a file that was cropped a few pixels off (1918×1080) from
  warning, while one comparison catches both 4:3-on-16:9 pillarboxing and portrait-on-landscape.
  Special-casing orientation was considered and dropped: it is a second rule that catches a subset
  of what the first one already catches.
- **The 90% resolution floor** is the line between upscaling nobody sees and upscaling everybody
  sees. 1728×972 on a 1080p profile is 90% and invisible; 1280×720 on 1080p is 67% and obvious —
  and it is the most common real case, which is why a 50% floor was rejected. Warning on any
  shortfall at all was rejected for the same reason the 1% aspect tolerance exists.
- **Larger than the profile never warns.** Downscaling is not a defect.

Images and videos use the same rule. They land on the same screen and are scaled the same way; a
separate rule for images would have to be justified to an operator asking why a blurry photo is
silent. If images turn out to warn too often, the number moves — not the rule.

**The result is never persisted.** It is a function of the profile and the asset, both already
stored. A stored copy goes stale the moment the operator changes Resolution in Step 1. The ticket's
Core Logic mentions a separate "Validation Status" alongside Playlist and Version status; if that
is wanted as durable state it is its own ticket, not AC 12.

**Assets with no dimensions are silent.** Warning about something the operator cannot see, cannot
fix, and did not cause teaches them to ignore every warning the product shows.

Warnings appear as a badge on each row of "Selected for Playlist" and as one summary line in the
Review step. The Content Library grid is left alone: badging every card before anything is
selected turns the picker into a wall of yellow.

## Consequence for the upload path: dimensions are read in the browser

`registerVideo` gains `width` and `height`. The upload flow already detaches a `<video>` twice —
once for duration (`upload-api.ts:47`), once to capture the poster frame (ADR 0016) — so
`videoWidth` / `videoHeight` are already decoded and free; images use `Image().naturalWidth`.

If the browser cannot decode the file, the upload proceeds with no dimensions, matching what
`readVideoDuration` already does and what this ADR decided about missing data. Blocking an upload
because a cosmetic check could not be prepared inverts the priorities. This case is not
hypothetical — it overlaps exactly with Q6 of the firmware questionnaire (`.mov` containers).

This is the first coupling between the playlist feature and the upload path; they had been
independent. It is ~15 lines and lands as its own commit so it can be reverted separately.

## Rejected: backfilling the 17 existing rows

Their dimensions could be recovered by fetching each file and reading it. Declined: it is an R0
UPDATE against production to give test data a warning it does not need, and every asset uploaded
after this change has dimensions anyway. The existing rows stay silent under the missing-data rule.

## Rejected: reading dimensions on the server

`ffprobe` or an image library in `Thunder_Core` would be authoritative and would cover uploads that
never pass through this frontend. Declined: it adds a dependency and a decode pass to do what the
browser has already done by the time the file finishes uploading. Revisit if assets ever arrive
through a path other than this wizard.

## Rejected: checking frame rate and codec

Frame rate has no column on `media_assets`, so it costs a migration (R0) plus a way to read a
file's fps at upload, to warn about a difference viewers rarely perceive. Codec belongs to the
firmware questionnaire and ADR 0016; answering "will this screen play this file" from the playlist
wizard would duplicate a decision being made elsewhere, with a `codec` column that is NULL on
every row today. Both are additive later — the function returns a union, and a third member costs
one branch.

## Rejected: blocking incompatible content

AC 12 says the profile is used to *check*, not to *forbid*. The system does not convert files
(ADR 0016), so the screen scales and letterboxes at playback: a 720p clip on a 1080p playlist
plays, just softer. Blocking would stop an operator who knows exactly what they are doing, and the
first workaround would be to change the playlist's Resolution to make the warning go away — which
is worse than the warning.
