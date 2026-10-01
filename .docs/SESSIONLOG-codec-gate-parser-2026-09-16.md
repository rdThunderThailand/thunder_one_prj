# Session log — codec gate, Thunder_Core#63 (2026-09-16)

Continued from `docs/media-library/plan-codec-gate.md` + HANDOFF-codec-gate-2026-09-16.md.

## What moved

- Read Thunder_Core#63, ADR 0069, ADR 0070 for the exact verdict vocabulary and box-walk contract.
- Repo: `Thunder_Core`. Branch `feat/codec-parser-63` cut from `develop`.
- Built `src/lib/media-codec/probe.ts` — pure module, `probeMp4(read: ByteReader, fileSize)`:
  - Walks top-level box headers (handles 64-bit size, size=0) to locate `moov` without reading its
    content first; fetches only the `moov` range, wherever it sits (head or tail).
  - Descends `trak → mdia → minf → stbl → stsd` to find the first video sample entry (`avc1`/`avc3`
    or `hev1`/`hvc1`), reads `avcC` for `profile_idc` + constraint flags.
  - Verdict codes: `unsupported_profile` (High=100, HEVC, and any H.264 profile_idc ADR 0070 does not
    name — marked `// ponytail:`, widen when a real file surfaces one), `unreadable` (well-formed
    container, no parseable codec info), `unverified_preset` (Main=77), and `supported` (a 4th code I
    picked for Baseline/Constrained Baseline — the ticket describes this outcome but never names a
    `code` for it).
  - Throws (does not return `unreadable`) when a box's declared size exceeds the remaining file —
    that is the truncated/malformed case, kept distinct from "readable but no codec info" per
    acceptance criteria #3.
- Fixtures (`src/lib/media-codec/fixtures/`): generated with ffmpeg (installed via `brew`, **not**
  added to Thunder_Core's `package.json`) — 1s H.264 Baseline clip, `-movflags +faststart`
  (`baseline-faststart.mp4`), the same file remuxed with `-c copy` and no faststart flag so `moov`
  lands after `mdat` (`baseline-tail-moov.mp4`), and that file truncated mid-`moov`
  (`baseline-tail-moov-truncated.mp4`). All three are a few KB.
- `probe.check.mts` (`node src/lib/media-codec/probe.check.mts`): asserts faststart and tail-moov
  fixtures produce identical verdicts (`profile_idc: 66`, `code: 'supported'`), and that the
  truncated fixture makes `probeMp4` reject with a "truncated" message.

## Verified

- `node src/lib/media-codec/probe.check.mts` → `media-codec probe: all checks passed` (ran for real,
  output above).
- `npx tsc --noEmit -p tsconfig.json` → `probe.ts` clean. `probe.check.mts` shows `TS5097` (bare
  `.ts` import extension) — confirmed pre-existing on every other `*.check.mts` in the repo
  (`schema.check.mts` ×6), not something this change introduced.
- `git diff package.json` — empty; no dependency added.
- Committed locally on `feat/codec-parser-63` (message references `Closes:
  rdThunderThailand/Thunder_Core#63`), **not pushed** — user chose "commit only" this session.
  No AI attribution line, per user rule.

## Not done this session

- Push + open Draft PR (user deferred; language will be Thai when it happens).
- HEVC/High-profile paths are implemented per ADR 0070 but have no fixture exercising them — not
  required by #63's acceptance criteria (only the two H.264 fixtures + truncated tail are named).

## Next session

- Push `feat/codec-parser-63`, open Draft PR to `develop` with the check output pasted in
  Verification (Thai PR body, per user's answer this session).
- After merge, plan's frontier moves to `(64 ∥ 65)`.
