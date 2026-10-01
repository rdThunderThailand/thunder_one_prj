# SESSIONLOG — Media Workspace request-count, Phase 3

**Date:** 2026-09-08 · **Branch:** `feat/caching`
**Plan:** `docs/media-library/plan-request-count.md` Phase 3 (items 15–19) · **ADR:** 0065 §2
**Model:** Opus (mapper contract + failure contract), executing a settled ADR — no design fork opened.

## Scope done — plan items 15–19

6 files touched, 2 added, 2 deleted.

### 15 — the mapper, written before the card was touched
New [now-next-programs.ts](../src/features/media-workspace/overview/now-next-programs.ts) — one pure function `mapNowNextPrograms(response) → { nowPlaying, nextUp }`, implementing the ADR §2 contract:
- rows folded **by Publication**; `publications[0]` is the subject and the rest of a merged loop become `+N more`, never candidates of their own
- **Now Playing** = rows whose `current.playback_state === "confirmed"`; rank is confirmed rows (the closest reading of the old `playingTargets` sort), ties by `localeCompare` on name
- **Next Up** = earliest `opens_at` outright; ties by distinct rows occupied, then name. A Publication appearing twice within one row contributes one row
- **target counts** = rows occupied in this response, split `channelRows` / `deviceRows` by `row_type`; `confirmedRows` is the card's "N Playing"
- `thumbnailUrl` comes straight off the response, so the card resolves no preview URLs

New [now-next-programs.check.mts](../src/features/media-workspace/overview/now-next-programs.check.mts) — `node:assert`, no runner. All seven cases the plan names (one Publication across several rows, a `merged_loop`, a tie on the ranking key, an empty result, a Next Up beyond the horizon, an all-`not_confirmed` `current` set, a mixed set) plus two Next Up cases (earliest wins; same-instant tie by rows, with the within-row duplicate not counted) and a `null` response.

### 16–19 — the card
[ProgramStatusCards.tsx](../src/features/media-workspace/overview/components/ProgramStatusCards.tsx) rewritten:
- one `fetchNowNext(180, false)` replacing `fetchPublications("active")` + `fetchPublication(id)` × 36; the 60 s poll now refreshes that one request (item 19)
- `usePlaylistPreview` and `usePreviewUrls` dropped from the card (item 18) — with them the "hooks must run before the empty-state return" hazard goes too. Both hooks stay alive for `ScheduleStep` / `ReviewPublishStep`
- three-state render (`loading` / `ready` / `failed`). Failure shows **"Live status unavailable"** on both cards — distinguishable from empty, never a skeleton that never resolves, and never the dev-only demo data `NowNextPage` falls back to (item 17, ADR §2)
- empty states: Now Playing keeps "No playback confirmed"; Next Up becomes **"No upcoming program in the next 3 hours"**
- `+N more` badge next to the name for a merged loop

### Supporting moves
- `fetchNowNext` lifted out of `NowNextPage.tsx` into [now-next.ts](../src/features/media-workspace/publications/now-next.ts) and exported from the publications barrel — two surfaces now call it, and the barrel is the sanctioned way in from another feature.
- **Deleted** `overview/program-status.ts` and `program-status.check.mts`. `selectNowPlaying` / `selectNextProgram` had no other consumer once the card stopped using them.

## Verification — browser, `localhost:3000` → `localhost:3001` (develop-branch Supabase)

Agent-driven (user logged in, chose option 1).

| check | baseline (Phase 0) | now |
|---|---|---|
| `/media-workspace` proxy requests on load | **75** | **39** |
| breakdown | `?status=active` ×2 · `channels` ×1 · `publications/{id}` ×72 | `now-next` ×1 · `?status=active` ×1 · `channels` ×1 · `publications/{id}` ×36 |
| 60 s poll | **+37 per cycle** (`?status=active` ×1 + `publications/{id}` ×36) | **+1 per cycle** — `now-next` starts observed at 2574 / 62880 / 122882 ms, `publications/{id}` stayed at 36 |
| two-minute total | 149 | **41** |
| Program cards resolve at | ≈11–13 s (waited on all 36 detail reads) | **≈3.5 s** (`now-next` responseEnd 3501 ms); the page's last request still ends at ≈8 s, but the headline no longer waits for it |
| request actually issued | — | `/media/now-next?horizon_minutes=180&include_idle=false` — the exact ADR §2 contract, no `channel_id`, no `q` |
| Now Playing renders | "No playback confirmed" | **"No playback confirmed"** — parity with the Phase 0 capture (old selector returned `null` too) |
| Next Up renders | "No upcoming program" | **"No upcoming program in the next 3 hours"** |
| console errors | — | none |
| `rm -rf .next/dev/types && tsc --noEmit` | — | clean, repo-wide |
| `eslint` on every touched path | — | clean |
| all `src/**/*.check.mts` | — | **61/61 pass** |

The remaining 38 requests are `LowerOverview`'s own N+1 — Phase 5's work, untouched here by design (ADR §1: Overview changes once, straight to its final shape).

## Not verified in the browser, and why

- **The non-empty card.** This tenant's develop devices have been offline since 2026-08-27, so no row reports `confirmed` and no row has `upcoming` — the same reason the old selector returned `null`. Every non-empty path (rank, ties, merged loop, target split, earliest-opens) is covered by the nine assertions in `now-next-programs.check.mts`, not by pixels.
- **The failure state.** Not exercised; the request succeeded every time. Verified by reading the code only. Carried to Gate 2.

## Next

- **Gate 1** — this is the re-measure Gate 1 asks for. Overview: 75 → 39 on load, 149 → 41 over two minutes, headline content at ≈3.5 s instead of ≈11–13 s. The decision Gate 1 gates is whether Phase 4 (the prod migration) is paid for now or joins Gate 2. **That is the user's call, not made here.**
- Phases 4–5 and 7 remain gated. No backend change was made.
- PR still not opened — one PR when the whole epic is done.
