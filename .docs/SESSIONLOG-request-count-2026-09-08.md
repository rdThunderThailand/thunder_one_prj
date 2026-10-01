# SESSIONLOG — Media Workspace request-count baseline + Now & Next parity

**Date:** 2026-09-08 · **Branch:** `feat/caching` (cut from `dev`) · **Issue:** #63 (Phase 0 of `docs/media-library/plan-request-count.md`)
**No production code changed.** Measurement only.

## Environment — read this before trusting the numbers

| | |
|---|---|
| Frontend | local `next dev` on `http://localhost:3000` |
| Backend | `CORE_API_URL=http://localhost:3001` — a local Thunder_Core instance on the **`develop`-branch Supabase** |
| Data cardinality | **develop branch, NOT prod.** This tenant: **36 active Publications**, ~11–14 Playlists (per composition hydration), 5 Compositions, 3 Channels. The ADR 0065 table is measured on **prod** (39 active Publications, 92 Playlists) — counts here scale with the smaller dataset and are not directly comparable row-for-row, but the *patterns* (P1–P5) reproduce exactly. |
| Measurement method | `performance.getEntriesByType('resource')` filtered to `/api/proxy/`, read from the in-app browser. Counts are of proxy calls (browser → Next proxy); each is one browser→proxy→Core→Supabase round trip. |
| Who observed | **All numbers below were observed by the agent driving the browser.** None were reported by the user. |
| Dev-mode caveat | React StrictMode double-invoke was checked for and is **not** inflating these counts: Overview shows `?status=active ×2` (one per card) and `/publications/:id ×72` (= 2 cards × 36), i.e. the two-N+1 pattern at 1×, not 2×. |
| "Time to first content" | Recorded as the **proxy-drain window** (first proxy request start → last proxy response end) for the surface, plus a note on when the user-visible content actually resolves. Not a Lighthouse/LCP metric. |

---

## 1. Baseline per surface

### `/media-workspace` — Overview

| metric | observed |
|---|---|
| Proxy requests on load | **75** |
| Breakdown | `/media/publications?status=active` ×2 · `/media/channels` ×1 · `/media/publications/{id}` ×72 |
| Proxy-drain window | first req @ ~1.38s → last detail response @ ~13.6s after nav start |
| Time to first content | Program cards ("Now Playing" / "Next Up") stay skeleton until **all 36 detail reads resolve** (`Promise.allSettled` in `ProgramStatusCards`), i.e. the headline card renders at ≈ **11–13s**. Upper stat cards (Total Channels / Online / Warning / Offline) and lower panels render earlier off their own reads. DOMContentLoaded ≈ 1.2s. |

**The two N+1s** (ADR P1): `ProgramStatusCards` and `LowerOverview` each call `fetchPublications("active")` (→ the ×2) then `fetchPublication(id)` for every one of the 36 rows (→ the ×72).

**60s poll (ADR P5) — measured over 2 minutes:**

| elapsed | added proxy requests |
|---|---|
| 67s (1 poll cycle) | **+37** — `?status=active` ×1, `/publications/{id}` ×36 |
| 141s (2 poll cycles) | **+74** — `?status=active` ×2, `/publications/{id}` ×72 |

Only `ProgramStatusCards` polls (`setInterval(load, 60_000)`); `LowerOverview` reads once. So Overview costs **75 on load, then ~37 requests every 60s** for as long as the tab is open. Over the first two minutes: **75 + 74 = 149**.

**Cover-resolving calls the two Program cards make** (`usePlaylistPreview` / `usePreviewUrls` in `ProgramCard`):
**0 observed on this tenant.** Both hooks are gated on a selected program having a `playlist.id`. Today `selectNowPlaying` and `selectNextProgram` both return `null` here (see §2), so neither card reaches the cover-resolve path. On a tenant where a program *is* selected, each card adds up to 2 more (`usePlaylistPreview` → 1, `usePreviewUrls` → 1 batched `POST /media/videos/preview-urls`).

### `/media-workspace/layouts/{id}` — Composition editor

Measured on `b993132c-…` ("ZZTEST-T15-browser-layout").

| metric | observed |
|---|---|
| Proxy requests on load | **19** |
| Breakdown | `/media/playlists/{id}` ×11 · `/media/tags` ×2 · `/media/layouts?kind=template` ×1 · `/media/videos?page=1&page_size=200` ×1 · `/media/playlists` ×1 · `/media/folders?scope=composition` ×1 · `/media/compositions/{id}` ×1 · `/media/layouts/{id}` ×1 |
| Proxy-drain window | first req @ ~1.05s → last @ ~6.1s |
| Time to first content | canvas + Playlist picker usable at ≈ 2–3s (`/media/compositions/{id}` + `/media/layouts/{id}` + `/media/playlists` list); the `×11` Playlist-detail N+1 drains by ≈ 6.1s |

**The N+1 (ADR P1):** `useCompositionEditorData` reads `/media/playlists` (list) then `Promise.all(allPlaylists.map(fetchPlaylist))` → `/media/playlists/{id}` ×11. On prod (92 Playlists) this is the ~98→~6 case; on this tenant it is 19→~6.

### `/media-workspace/publications/manage` — Publications list

| metric | observed |
|---|---|
| Proxy requests on load | **3** |
| Breakdown | `/media/publications?status=draft` ×1 · `?status=active` ×1 · `?status=cancelled` ×1 |
| Proxy-drain window | ~2.64s → ~3.28s (parallel, `Promise.allSettled`) |
| Time to first content | ≈ 3.3s (all three tabs populate together) |

Matches ADR estimate exactly (3, one per lifecycle status — ADR P2).

### `/media-workspace/publications/create` — Publication wizard

| metric | observed |
|---|---|
| Proxy requests on load (step 1, no draft) | **4** |
| Breakdown | `/media/campaigns` ×1 · `/media/videos?page=1&page_size=200` ×1 · `/media/tags` ×1 · `/media/channels` ×1 |
| Proxy-drain window | ~0.96s → ~1.68s |
| With a resumed localStorage draft | **7** on load (adds `/media/compositions/{id}`, `/media/layouts/{id}`, `/media/publications/conflicts`) — a draft-rehydration cost, not a fresh-wizard cost. First attempt hit this; re-measured after "เริ่มใหม่". |

The ADR's "6" / "reads the Asset library twice" (P2) is a **step-2 (Content) phenomenon** — `fetchMediaAssets` runs once for the wizard shell and again inside `AssetLibraryStep`. Not exercised here (would require filling step 1 and advancing, risking test data). On-load baseline for step 1 is **4**.

### editor → playlists → editor — the *second* editor load (ADR P4, "nothing is remembered")

Path: Composition editor (`b993132c-…`) → sidebar **Playlists** → sidebar **Layouts** (compositions list) → click the same composition → editor again. Resource timings cleared on landing at `/playlists`; measured through to the second editor render.

| metric | observed |
|---|---|
| Proxy requests for the round trip | **36** |
| Breakdown | `/media/playlists/{id}` ×14 · `/media/compositions?page=1&page_size=10` ×2 · `/media/videos/preview-urls` ×5 · `/media/folders?scope=composition` ×4 · `/media/layouts?kind=template` ×2 · `/media/videos?page=1&page_size=200` ×2 · `/media/playlists` ×2 · `/media/compositions/{id}` ×2 · `/media/tags` ×2 · `/media/layouts/{id}` ×1 |
| Interpretation | **The second editor load repeats its entire N+1.** `/media/playlists/{id}` fires ~14× again, `/media/videos?page_size=200` is re-fetched, `/media/playlists`, `/media/folders`, `/media/layouts?kind=template` all re-fetched. Nothing from the first visit is reused — `apiClient` is a bare axios instance, pages fetch in `useEffect`, the proxy is `force-dynamic`. |

The second editor load in isolation ≈ the first (~19). The extra requests in the 36 are the Playlists list page and the Compositions list page passed through on the way back.

---

## 2. Now & Next parity capture

Captured at **one instant** (`2026-09-08T08:44:22Z`), develop-branch data, this tenant.

### Today's selectors — `selectNowPlaying` / `selectNextProgram` (`overview/program-status.ts`)

Observed via the rendered Overview Program cards after all 36 `fetchPublication` detail reads resolved:

| selector | result today |
|---|---|
| `selectNowPlaying(publications)` | **`null`** — card renders "Now Playing / No playback confirmed". No active Publication has `playback_window.state === "open"` **and** `playingTargets > 0` (a target with `status === "playing"`). |
| `selectNextProgram(publications)` | **`null`** — card renders "Next Up / No upcoming program". No active Publication has a `playback_window.next_opens_at` in the future. |

### Raw `GET /media/now-next?horizon_minutes=180&include_idle=false`

`HTTP 200`. Top-level shape: `{ success, data }`. `data.rows` — **3 rows** (one per Channel; no direct Devices):

| row | target | `current` | `upcoming` |
|---|---|---|---|
| 1 | Channel for Screen 1 (`11110000-…-0022`) | present · `playback_state: "not_confirmed"` · publication `"ZZ ticket20 verify (do not publish)"` (`59682aed-…`) · `scheduled_now: true` · device `ThunderOne Screen 01` `status_level: "offline"`, `last_heartbeat_at: 2026-08-27T06:26:04Z` | `[]` |
| 2 | Channel for Screen 2 | present · `playback_state: "not_confirmed"` | `[]` |
| 3 | Channel for Screen 3-4 | present · `playback_state: "not_confirmed"` | `[]` |

Every `current` occurrence carries a real `publications[]` entry with `thumbnail_url` (signed Supabase URL). No row reports `playback_state: "confirmed"`. No row has any `upcoming`.

### Parity verdict

**"now-next answers for this tenant. Now Playing from Now & Next may proceed."**

Reasoning:
- The endpoint is **populated and healthy** — 3 real Channel rows, real Publication payloads, `thumbnail_url` present. Not the erroring case, not the "every row empty" case that `NowNextPage`'s dev-only demo fallback exists for.
- Applying the ADR §2 mapper to this response: Now Playing = rows with `current.playback_state === "confirmed"` → **none** → `null`. Next Up = earliest `opens_at` among `upcoming` → **none** → "No upcoming program in the next 3 hours".
- Today's selectors also return `null` / `null`.
- **The two agree.** The blocking condition — *endpoint returns nothing while the current selector still finds a Now Playing* — is **not** met. The current selector finds nothing either, and the endpoint clearly does return structured data.
- Note: nothing is "confirmed" here only because the develop-branch devices are offline with stale heartbeats (last seen 2026-08-27). That is equally true for the old `playingTargets` path. The mapping is consistent; it is the data that is quiet.

**Phase 3 (Now Playing / Next Up from `/media/now-next`) is not blocked by this capture.**

---

## Acceptance criteria — status

- [x] This SESSIONLOG exists and records request count + time-to-first-content for Overview (incl. 60s-poll delta over 2 min, and the cover-resolving calls the two Program cards make — 0 on this tenant, with the reason), the Composition editor, `/publications/manage`, `/publications/create`, and the second editor load on editor → playlists → editor
- [x] States which numbers were observed vs user-reported — **all observed by the agent**, no blanket "verified"; environment caveats (develop branch ≠ prod cardinality, dev-mode) called out
- [x] Parity capture recorded verbatim — selector output and raw now-next body at the same instant
- [x] Parity verdict stated explicitly — **"now-next answers for this tenant, Now Playing from Now & Next may proceed"**

## Not done / out of scope for #63

- Wizard step-2 double `fetchMediaAssets` not exercised (would require advancing the wizard with real input).
- Prod-cardinality re-measurement — the ADR table stands as the prod reference; this pass is the develop-branch baseline the later gates re-measure against on the same environment.
