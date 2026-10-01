# Session log — Playback Behavior reaches the player (2026-08-19)

Ticket: https://app.clickup.com/t/86d3xxk6n ([SUBTASK 2] Playback Behavior, under parent
86d3xxk5u — Create Playlist Step 3: Settings)

## What changed

Play mode, repeat, and start-from were fully built in the Create Playlist wizard's Step 3 but
never reached a player — `docs/adr/0010-playlist-settings-in-metadata.md` documented that
`media_job_poll` read only `duration_seconds`/`transition` and nothing validated the metadata
server-side. This session wires the values through, fixes a dead control, and writes the
`media_job_poll` migration that emits them — but does not apply it.

### Frontend — thunder_one_prj

- `src/features/playlists/types/index.ts` — added `START_FROMS`/`StartFrom`, widened
  `PlaylistPlayback.startFrom` from the literal `"first"` to `StartFrom`.
- `src/features/playlists/metadata.ts` — encode/decode now uses the shared `PLAY_MODES` /
  `REPEAT_MODES` / `START_FROMS` constants instead of re-typed literal arrays.
- `src/features/playlists/components/SettingsStep.tsx` — "Start Playback From" was a dead
  control (`value="first"` hardcoded, `onChange` always wrote `"first"`); now bound to
  `playback.startFrom` with a real "Resume last successful item" option.
- `src/features/playlists/duration.ts` — added `durationPerLoopSeconds(items, assetDurations,
  playback)`: media duration plus the transitions that actually play (wrap transition back to
  item 1 only when `repeat: "loop"` and more than one item; `"cut"` transitions cost 0s).
  `totalDurationSeconds` is unchanged — it still has its own callers.
- `src/features/playlists/step-validation.ts` — `ValidatableDraft` now requires `playback`;
  step 3 blocks Next when `playMode`/`repeat`/`startFrom` holds a value outside the frontend's
  known sets (a `ponytail:` comment notes there's no real engine-capability registry yet — see
  `.docs/player_codec_capability_request.md`, still pending the firmware team's answer — the
  authoritative reject is server-side).
- `src/features/playlists/components/CreatePlaylistPage.tsx`,
  `src/features/playlists/components/ReviewStep.tsx` — pass `playback` into `validatableDraft`
  / `canSubmit`.
- `src/features/playlists/components/ReviewStep.tsx` — "Total duration" row is now "Duration
  per Loop" using `durationPerLoopSeconds`; added a Start Playback From row.
- `src/features/playlists/components/PlaylistSummary.tsx`,
  `src/features/playlists/components/PlaylistProperties.tsx`,
  `src/features/playlists/components/PlaylistPanelTabs.tsx` — added a Start Playback From row
  next to the existing Play Mode/Repeat rows.
- Check files updated: `duration.check.mts` (4 new cases for `durationPerLoopSeconds`),
  `metadata.check.mts` (encode/decode round-trip for `start_from: "resume"`),
  `step-validation.check.mts` (5 call sites fixed to pass `playback`, 4 new step-3 cases).

### Backend — Thunder_Core (migration written, **not applied**)

- `supabase/migrations/099_playback_reaches_the_player.sql` — additive `CREATE OR REPLACE` on
  two functions, both signature-unchanged (no `DROP FUNCTION` needed):
  - `media_job_poll` now joins `media_core.playlists` and emits a `playback` object
    (`play_mode`/`repeat`/`start_from`, each defaulted) on **every slot**. No existing key,
    ordering, or the `start_offset_seconds`/`loop_duration_seconds` semantics changed.
  - `media_playlist_upsert` now rejects a `metadata.playback.play_mode`/`repeat`/`start_from`
    outside its known value set.
- `public/swagger-core-v1.json` — documented `slots[].playback` on `/media/player/jobs`
  (description + example) and added `400` responses to `/media/playlists` POST/PATCH for the
  new validation.

### Docs

- `.docs/player_contract_timeline.md` — new section documenting `slots[].playback` for the
  firmware team, including the explicit rule that shuffle is the player's job, not the
  server's.
- `docs/adr/0031-playback-behavior-reaches-the-player.md` — records the per-slot placement
  decision, the two rejected shapes (top-level `playback`; a parallel `segments[]` array), and
  the open gap (undefined behavior at the seam between an in-window `repeat: once` publication
  finishing while another sharing the loop is still `repeat: loop`).

## Verification performed

- `pnpm tsc --noEmit` — passes, zero errors (this also type-checks every `.check.mts` file,
  since `tsconfig.json` includes `**/*.mts`).
- `pnpm lint` — passes.
- All edited/created frontend files stay ≤300 lines (largest: `PlaylistPanelTabs.tsx` at 285).
- `durationPerLoopSeconds`'s formula was additionally sanity-checked with a standalone
  reimplementation outside the repo (4 cases: multi-item loop, single-item loop, play-once,
  `cut` transition) — all passed.
- `099_playback_reaches_the_player.sql` was written against the current bodies of
  `media_job_poll` (080) and `media_playlist_upsert` (086, confirmed no later migration
  redefines either function).
- **Migration 099 applied to prod (ThunderCore project) via Supabase MCP.** Before applying,
  dumped live `prosrc` md5 of both functions and confirmed it matched the migration's source
  files exactly (no drift since 099 was written). After applying, dumped `prosrc` again and
  confirmed byte-for-byte md5 match against `099_playback_reaches_the_player.sql`. Ran
  `media_job_poll` against a real device token — returns the expected shape with no error; no
  currently-active publication in prod to observe a populated `playback` object live, but the
  added `JOIN media_core.playlists` cannot drop rows beyond what the pre-existing
  `playlist_items` join already required (same `pub.playlist_id` must be non-null either way).
- **Browser checklist — user-confirmed passed** (per the working agreement's §3 requirement to
  ask before every verify point): Start Playback From is a working, sticky control with both
  options; the wizard Review step shows "Duration per Loop" (not "Total duration") plus a Start
  Playback From row; the 24s/22s loop-vs-once duration arithmetic checked out; the playlist
  detail/side-panel view shows the new Start Playback From row next to Play Mode.

## Verification NOT performed — flagged explicitly

- **`node <file>.check.mts` could not be executed in this environment.** All three touched
  check files (and, confirmed by testing, every other `.check.mts` in this feature — e.g.
  `list-filtering.check.mts`, untouched this session) fail with
  `ERR_UNSUPPORTED_DIR_IMPORT` on the repo's own `from "./types"` barrel import. This is a
  pre-existing mismatch between `tsconfig.json`'s `moduleResolution: "bundler"` (which resolves
  `./types` as `./types/index.ts` fine, and is what `tsc`/Next.js use) and plain Node's ESM
  loader (which requires an explicit extension/index and has no bundler-style resolution). Node
  in this environment is v22.23.2. This blocks running `node *.check.mts` for *any* playlist
  check file today, not just the ones touched this session — worth a separate look, out of
  scope for this ticket.
- **Actual on-screen playback behavior is unverifiable from this repo**: sequential order
  playing correctly, shuffle covering every item once per loop without rewriting order,
  play-once holding the last frame without a black screen, and resume-with-fallback all depend
  on a firmware team implementing `docs/adr/0031` in a separate codebase (Aurora or whatever
  currently polls `media_job_poll`). None of ticket 86d3xxk6n's acceptance criteria that
  describe *playback behavior itself* are met by this session's work — only that the *intent*
  now reaches the payload a player would read.
## Still open

- Firmware/player team needs to implement `docs/adr/0031` against `.docs/player_contract_timeline.md`.
- The Node ESM `./types` directory-import issue affecting all `*.check.mts` files in this
  feature is unresolved and unrelated to this ticket.
