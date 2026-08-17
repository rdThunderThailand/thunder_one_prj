# 0016 — Video thumbnails captured in the browser, and remux-only input normalization

## Context

The asset picker in the publication wizard (`AssetLibraryStep`, and the `MediaThumb` /
`AssetCard` grid cells under it) has no thumbnail to show for a video, so it renders the video
itself: `<video src="…#t=0.1" preload="metadata">`. The `#t=0.1` media fragment forces the browser
to seek and decode a real frame, which means downloading the file. Measured against the production
library on 2026-08-14 (`.docs/SESSIONLOG-asset-preview-perf-2026-08-14.md`), that is 8 `video/mp4`
files averaging 11 MB (max 24 MB) plus one `video/quicktime` at 27 MB — tens of megabytes pulled to
paint a grid of still images. Two properties of the current system make it worse: `files` and
`file_versions` carry only `storage_key` / `mime_type` / `file_size_bytes`, with no thumbnail,
poster, or preview column anywhere; and `usePreviewUrls` mints a fresh 1-hour signed URL on every
mount, so the URL never repeats, the browser HTTP cache never hits, and `/_next/image` re-fetches
and re-resizes the original on every visit.

A lazy-mount fix has already landed on this branch (`src/components/ui/LazyVideo.tsx`, wired into
`MediaThumb` and `AssetCard`): the `<video>` gets no `src` until it is within 200 px of the
viewport. That spreads the cost over scrolling; it does not remove it. Removing it requires a small
image to point at instead of the video.

The second, entangled question was whether Thunder should accept video in any format and convert it
server-side. The `.mov` sitting in production is the evidence that it currently accepts anything and
fails later: the file input was `accept="video/*,image/*"` with no gate behind it. That has since
been narrowed to `.mp4,.png,.jpg,.jpeg,.webp` with a real check in `handleFilePicked`
(`src/features/publications/upload-limits.ts`) — a stopgap taken explicitly pending this decision.

Facts checked during the design pass that constrain the options:

- The client `PUT`s bytes straight to Supabase Storage from a signed upload URL
  (`uploadToStorage`, `src/features/publications/services/upload-api.ts:20-36`). The backend never
  sees the bytes, so any server-side processing would mean downloading the file back out of
  storage first.
- There are no edge functions in the Supabase project and `pg_net` is not installed, so the
  database cannot make outbound HTTP calls. A server-side pipeline would need new infrastructure
  from scratch, not a hook into something already running.
- `media_core.media_assets.status` already has a `CHECK` for `'processing' | 'ready' | 'failed'`,
  so a state machine is available if wanted — but nothing implements it today.
- The `media` bucket already permits `image/jpeg | image/png | image/webp`, so storing a generated
  thumbnail needs no bucket configuration change.
- `readVideoDuration` (`upload-api.ts:48-64`) already decodes every uploaded video in a detached
  `<video>` element before upload. Frame capture is the same decode, one `drawImage` further on.
- `mp4box.js` probes well — it returns codec strings such as `"avc1.42c00d"` — but its documented
  output path is fragmented MP4 only, with no API for writing a progressive, faststart MP4. It is
  a probing tool here, not a remuxing one, and any later plan to remux with it must re-verify that.

## Decision

**Thumbnails are captured in the browser at upload time, not generated server-side.** The upload
handler draws the first frame of the already-decoded `<video>` onto a `<canvas>`, calls `toBlob()`,
and uploads the result as a second file alongside the video. This reuses the decode
`readVideoDuration` performs anyway and needs no new infrastructure. The alternative — a job queue,
a worker outside Vercel's serverless limits (ffmpeg on a 27 MB file will not survive a serverless
timeout/memory budget), a `processing` state surfaced in the UI, retry, and compute cost — was
rejected as a system built to solve a problem that a `drawImage` call solves. If Thunder later
needs server-side media processing for other reasons, that pipeline can subsume this; it is not
worth building for thumbnails alone.

**The thumbnail's location is a new `media_core.media_assets.thumbnail_storage_key text` column.**
Two alternatives were weighed: a row in `files` (correct-looking, but a thumbnail is not an
independently managed file — it has no version history, no approval, and no life outside its
parent asset, so a `files` row would need every one of those columns left null and a join on every
read), and a key inside the existing `metadata` jsonb (no schema change, but unqueryable without a
cast and invisible to anyone reading the table definition). A nullable text column is honest about
what it is: an optional pointer, one per asset.

**The nine existing videos are backfilled by a one-off local script that is not committed as
production code.** A "generate on read if missing" path would put decode-and-upload logic on a
render path forever to serve a fixed set of nine rows.

**Input normalization is remux only — never re-encode.** Re-encoding is what forces the whole
server-side apparatus back into scope; remuxing a container is a byte-shuffle that can happen on the
client, which already holds the bytes. Concretely: remux happens before upload, writes a *new*
`storage_key` with updated checksum and mime rather than overwriting the original (screens cache by
key, so overwriting would serve stale bytes under a key the screen believes it already has), keeps
the original via the existing `file_versions` mechanism, and needs no `processing` status because it
completes before anything reaches storage. Input scope is `mp4 / mov / webm / mkv` at ≤ 500 MB,
which is what the bucket already enforces.

**Sub-project B starts with probing only, not remuxing.** The first step is `mp4box.js` (~200 KB)
reading the codec at upload time and recording it on the asset, giving Thunder real codec data on
its own library. It changes no bytes. Pulling in `ffmpeg.wasm` (~30 MB of wasm shipped to
every operator's browser) is deferred until the codec question is settled, because the display
team's answer to `.mov` container support (`.docs/player_codec_capability_request.md`, question 6 —
document written, **not yet sent**) can delete the remux work entirely. Building the expensive half
before that answer arrives risks building it for nothing.

**Remux does not make "upload anything" work, and the upload gate stays.** A `.mov` containing HEVC
— the iPhone camera default — and a `.webm` containing VP9 will still fail on screens that decode
neither, because changing the container does not change the codec inside it. Remux fixes exactly one
class of file: right codec, wrong wrapper.

## Consequences

Thumbnail quality and existence become dependent on the uploader's browser. A browser that cannot
decode a given file yields no thumbnail, exactly as `readVideoDuration` already yields no duration
in that case; `thumbnail_storage_key` is nullable and the grid must keep the `LazyVideo` fallback
rather than assuming a thumbnail is always there. Uploads also get slower by one extra round trip.

An asset now spans two storage objects with no foreign key between them. Deleting an asset means
deleting two keys, and nothing in the schema enforces that — a dropped thumbnail becomes an orphan
object no query will find.

Remuxing on the client means a large file is processed in the operator's tab, on their CPU, before
the upload starts. A 500 MB input on a weak machine will be slow and visibly so; there is no server
to move that work to under this decision, only the option to reject the file.

Because remux writes a new `storage_key` and keeps the original, storage for normalized videos
roughly doubles. That is the deliberate price of not invalidating a key a screen may already be
serving from cache.

The signed-URL churn described in Context is untouched by this ADR. Thumbnails shrink the payload
by two orders of magnitude but each one still gets a fresh, uncacheable URL per mount. Rounding
signed-URL expiry to a bucketed value so URLs repeat (a `Thunder_Core` change) and collapsing the
`/media/videos` → `/media/videos/preview-urls` → image waterfall remain open, unaddressed
improvements.

The production `video/quicktime` asset (`asset_id 05e4e5ce-…`, 26.6 MB, `ready` + `approved`) is
deliberately left as-is. It stays selectable in the wizard, and if an operator puts it in a
playlist the screen may fail to play it. Marking it `rejected` was considered and declined; this is
a known, accepted exposure, not an oversight.
