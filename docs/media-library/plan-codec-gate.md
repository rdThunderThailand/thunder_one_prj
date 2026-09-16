# Plan — Codec gate (ADR 0069 + ADR 0070, no backfill)

**Living document.** Update the status table every time a ticket moves, and paste this file's
path into the handoff at the start of every new session on this work. Spec of record:
[thunder_one_prj#119](https://github.com/rdThunderThailand/thunder_one_prj/issues/119).
ADRs: `docs/adr/0069-*.md`, `docs/adr/0070-*.md` (branch `feat/converter`). ADR 0071 is out of
scope and has no ticket.

## The problem in one paragraph

An operator uploads an `.mp4`; the backend checks only the extension and MIME type and writes
`ready`; the Android player refuses H.264 High / HEVC before playback; the screen goes black and
nobody is told. Nobody knows how many such files the library holds today either. After this plan:
every new video is probed on intake and refused with a readable reason, the reason is visible in
the Upload Queue and on Media Detail, publication activation refuses a non-ready Asset by name, and
a read-only report says how many existing files are affected so the backfill can be decided on
evidence.

## Status

Legend: `todo` · `in progress` · `in review` (PR open, Draft until verified) · `done` · `held`

| # | Ticket | Repo | Blocked by | Status | PR | Last touched |
|---|---|---|---|---|---|---|
| 1 | [Thunder_Core#63](https://github.com/rdThunderThailand/Thunder_Core/issues/63) MP4 codec parser + fixtures | Thunder_Core | — | todo | — | 2026-09-16 |
| 2 | [Thunder_Core#64](https://github.com/rdThunderThailand/Thunder_Core/issues/64) ADR 0069 read-only report | Thunder_Core | #63 | todo | — | 2026-09-16 |
| 3 | [Thunder_Core#65](https://github.com/rdThunderThailand/Thunder_Core/issues/65) intake admission (2 RPCs + route) | Thunder_Core | #63 | todo | — | 2026-09-16 |
| 4 | [#120](https://github.com/rdThunderThailand/thunder_one_prj/issues/120) Upload Queue + Media Detail show the refusal | thunder_one_prj | Thunder_Core#65 on `develop` | todo | — | 2026-09-16 |
| 5 | [Thunder_Core#66](https://github.com/rdThunderThailand/Thunder_Core/issues/66) activation guard | Thunder_Core | Thunder_Core#65 | todo | — | 2026-09-16 |
| 6 | [Thunder_Core#67](https://github.com/rdThunderThailand/Thunder_Core/issues/67) backfill existing Assets | Thunder_Core | #64, #65, #66 + human "go" | held | — | 2026-09-16 |
| 7 | [#121](https://github.com/rdThunderThailand/thunder_one_prj/issues/121) close WebP intake | both | human schedules it (prod writes) | held | — | 2026-09-16 |

**Frontier right now:** #63.
**Order:** 63 → (64 ∥ 65) → (120 ∥ 66) → 67 after the #64 count and a "go". 121 is independent.

## What each ticket delivers, and when it is closed

Full acceptance criteria live on the tickets; this is the plain reading.

1. **Parser (#63)** — one pure function: MP4 bytes in, verdict out (`unsupported_profile` /
   `unreadable` → `failed`; `unverified_preset` for Main → `ready` flagged; Baseline → `ready`).
   Reads only box headers + `moov`, follows `moov` to the tail when there is no `faststart`.
   *Closed when* its `*.check.mts` passes on two committed fixtures (same clip, `moov` at head and
   at tail) and a truncated tail makes the check fail loudly.
2. **Report (#64)** — run the parser over every existing Asset, write nothing, produce a file:
   codec, profile, verdict class, and **airing** (= referenced by an active Publication, window
   ignored). *Closed when* the file is with the player team, the headline count is a comment on
   #119, and `git status` is clean.
3. **Intake (#65)** — register route probes the uploaded object and passes the verdict to
   `media_video_register`; `media_asset_get` returns `probe_verdict`. *Closed when* five HTTP cases
   pass on `develop`, both RPCs have one overload and are closed to `anon`/`authenticated`, and
   the migration is applied to `develop` and prod.
4. **Frontend (#120)** — queue item goes red with a sentence, Media Detail shows codec + reason,
   Main shows a caveat. *Closed when* three cases are seen in a real browser and the
   verdict→sentence helper has its check.
5. **Activation guard (#66)** — Playlist with a failed Asset still saves; activating a Publication
   is refused naming every bad file; already-active Publications keep playing. *Closed when* that
   is seen through the UI plus one real player, and the migration is applied to `develop` and prod.
6. **Backfill (#67)** — literal-UUID migration + literal rollback. *Closed when* a human wrote
   "go" with the #64 number, and apply/rollback were rehearsed on `develop` before prod.
7. **WebP (#121)** — bucket drops `image/webp`, `upload-limits` drops it, two files replaced through
   the normal flow, old ones not deleted. *Closed when* the inventory was posted before any write
   and every prod write was approved.

## Facts every session must know (verified 2026-09-16 — the ADRs point at older files)

- `media_publication_activate` latest: `20260914010000_channel_v02_sync_guard_grandfather_group_drift.sql`
  (m2_cleanup only mentions it in a comment). Guard goes after `v_item_count` validation, before
  `SET status = 'active'`, once.
- `media_video_register` (13 params) and `media_asset_get` latest: `20260902140000_media_asset_tags.sql`.
- Thunder_Core has **no HTTP-level check convention** — `*.check.mts` files are zod-only. HTTP and
  UI verification is a manual checklist; ask before driving the browser (working agreement §3).
- Thunder_Core deploys from `develop`; MCP migrations are live the moment they apply. Frontend on
  localhost talks to deployed `develop` unless `CORE_API_URL` is set.
- Signature change ⇒ `DROP FUNCTION IF EXISTS <old sig>` first, then `CREATE`, then re-`REVOKE`
  from `PUBLIC, anon, authenticated` + `GRANT` to `service_role`. Both are working-agreement traps.
- Prod migration apply and any prod write are R0: stop and ask, show what will change.

## Handoff template (copy into the first message of a new session)

```
Continue codec-gate work. Read docs/media-library/plan-codec-gate.md first, then the ticket
in "Frontier right now". Repo: <Thunder_Core | thunder_one_prj>. Branch: <name>.
Last session log: .docs/SESSIONLOG-codec-gate-<date>.md
Open questions carried over: <none | list>
```

Before ending a session: update the Status table (status, PR link, date), set "Frontier right
now", write `.docs/SESSIONLOG-codec-gate-<date>.md`, and note anything the next session must not
rediscover in the Facts section above.

## Decisions already made — do not reopen

- No picker hiding of non-ready Assets (courtesy, not control; the guard is on activation).
- No browser-side pre-probe (parser must live in Thunder_Core anyway for the report).
- WebP closure is its own ticket, not part of the codec gate.
- Main profile is admitted and flagged, not quarantined (player team, 2026-09-09).
- Backfill waits for the #64 number; it is not built speculatively.
- ADR 0071 (transcode) stays gated on a hardware campaign that does not exist.

## Session log

| Date | Session | What moved |
|---|---|---|
| 2026-09-16 | spec + tickets | #119 written after scrutinize; 7 tickets opened; this plan created |
