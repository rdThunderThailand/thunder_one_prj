# Player spec — Playback Proof (what to report after each item plays)

For: Player team (Android / Windows). Why: `docs/adr/0089-playback-proof-records-player-reported-outcomes.md`.

**API reference (Swagger):** `POST /media/player/jobs` and `POST /media/player/playback` in the Core v1
Swagger — <https://thundercore.vercel.app/api-docs/v1> (tag **Media**). That page shows production, so it
lists the new fields only after the release; until then read the file on `develop`:
<https://github.com/rdThunderThailand/Thunder_Core/blob/develop/public/swagger-core-v1.json>.
If this spec and Swagger disagree, ask the server team — do not guess.

## In one sentence

**Every time an item finishes its turn on screen — or fails to play — write one small record, keep it
in a local queue, and upload the queue about once a minute.**

The server uses these records to build the Playback Proof report ("what played where, when, for how
long, and what failed"). If the Player does not report it, the report cannot show it.

## ⚠️ Order of work

The server must first put the ids on every poll slot (ticket A2b). Start coding now, but **testing
against develop works only after A2b is on develop** — the server team will tell you.

## The full loop

```
 ┌──────────────────────────────────────────────────────────────────────────┐
 │ 1. POLL       POST /api/core/v1/media/player/jobs        (every ~60 s)   │
 │               ← slots / zones, each slot carries:                        │
 │                 media_asset_id, publication_snapshot_id, snapshot_zone_id│
 │                                    │                                     │
 │ 2. PLAY       play the slot on screen                                    │
 │               remember: start time, which slot (the 3 ids above)         │
 │                                    │                                     │
 │ 3. RECORD     slot ends (finished, skipped, or gave up after retries)    │
 │               → append ONE record to the local queue (saved to disk)     │
 │                                    │                                     │
 │ 4. UPLOAD     POST /api/core/v1/media/player/playback                    │
 │               after each poll, or right away when queue ≥ 100 records    │
 │               up to 500 records per request, oldest first                │
 │                                    │                                     │
 │ 5. RESULT     2xx       → remove those records from the queue            │
 │               4xx       → remove them too (they will never be accepted)  │
 │                           and write them to the local error log          │
 │               5xx / no network → keep them, try again next round         │
 └──────────────────────── back to 1 ───────────────────────────────────────┘
```

Offline? Steps 1, 4 and 5 pause; steps 2 and 3 keep going. When the network returns, upload the queue
oldest first. The queue must survive a Player restart.

## Step 1 — what you already get from the poll

Every slot in the poll response (with or without a Layout) carries:

- `media_asset_id` — the file
- `publication_snapshot_id` — which published version of the Program this slot belongs to
- `snapshot_zone_id` — which Zone of the screen (a full-screen Program has one Zone too)

Keep these three with the slot while it plays. Do not cache them across polls: use the values of the
poll response the slot came from.

## Step 3 — one record

```json
{
  "media_asset_id": "3f0c…",
  "publication_snapshot_id": "9a12…",
  "snapshot_zone_id": "77be…",
  "played_at": "2026-10-08T10:32:15.120+07:00",
  "duration_played_seconds": 10,
  "outcome": "played"
}
```

A slot that could not play:

```json
{
  "media_asset_id": "3f0c…",
  "publication_snapshot_id": "9a12…",
  "snapshot_zone_id": "77be…",
  "played_at": "2026-10-08T10:32:25.004+07:00",
  "duration_played_seconds": 0,
  "outcome": "failed",
  "failure_reason": "decode_error",
  "failure_message": "MediaCodec: unsupported profile High 4:4:4"
}
```

| field | what to put |
|---|---|
| `played_at` | the moment the slot **started on screen** (not the upload time), with milliseconds and **a timezone** (`Z` or `+07:00`) — without one the batch is rejected (400) |
| `duration_played_seconds` | whole seconds it was actually on screen; `0` if it never showed; never negative |
| `outcome` | `played` or `failed` |
| `failure_reason` | only when `failed`: `decode_error` · `file_missing` · `file_corrupt` · `playback_stalled` · `other` |
| `failure_message` | optional, only when `failed`, max 500 characters — your technical detail for support |

Rules:

- **One record per slot, per Zone.** Two Zones on screen → two records for the same moment.
- **Retries are not separate records.** The slot failed, you retried, it played → one `played` record.
  You retried and gave up → one `failed` record.
- `publication_snapshot_id` and `snapshot_zone_id` go together: both, or neither.
- Leaving out `outcome` means `played` (that is how today's Players are read).

## Step 4 — the upload

```
POST /api/core/v1/media/player/playback
Authorization: Bearer <device token>
Content-Type: application/json

{ "logs": [ record, record, … ] }      ← 1 to 500 records
```

Response `200`: `{ "success": true, "data": { "logged": 498, "duplicates": 2 } }`

- `duplicates` > 0 is fine: you resent records the server already had (for example the previous
  response was lost). Nothing is stored twice.
- The request is all-or-nothing: if any record is invalid you get a 4xx and **nothing** from that
  request is stored. That is why a 4xx batch is dropped, not retried (step 5).

## What changes for you

| | today | after this spec |
|---|---|---|
| snapshot + zone ids | not sent | send on every record |
| failed slots | not reported | report as `outcome: "failed"` |
| offline | (unknown) | persistent queue, upload when back |
| batch size | unlimited | max 500 |
| 4xx | (unknown) | drop the batch, log locally |

## Not in scope

Screenshots, live position, per-output status, heartbeat — unchanged.
