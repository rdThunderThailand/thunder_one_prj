# Media Workspace asks for what it draws

**Status:** accepted · 2026-09-08
**Extends:** `0049-composition-layout-with-content.md` §3, `0052-merged-layout-authoring.md` §5, `0057-channel-first-now-and-next.md`
**Defers:** catalogue caching (§7) and pagination (§8), each gated on the measurement in §6

## Context

Media Workspace is slow to move around in, and the cause is request *count*, not data volume.
Measured on ThunderCore prod on 2026-09-08, in the one active tenant: 33 Media Assets, 92
Playlists, 153 Publications of which 39 are active, 5 Compositions, 3 Channels. Every list RPC
filters on `p_tenant_id`; no page reads another tenant's rows.

Every request crosses three hops — browser → Next proxy → Thunder_Core → Supabase — so a page's
cost is roughly its request count.

### What each page costs today

Estimated from the call graph at current prod cardinality — **not measured**. Detail reads run in
parallel, so a page's wall-clock cost is not proportional to its count; Phase 0 of the plan
replaces every number here with a measured baseline. The Overview figure also undercounts: each
Program card additionally runs `usePlaylistPreview` and `usePreviewUrls`.

| Page | est. requests on load | why |
|---|---|---|
| Overview | **~81**, plus 40 more every 60s | two cards each read every active Publication one by one |
| Composition editor | **~98** | reads every Playlist's detail one by one |
| Publications list | 3 | one call per lifecycle status |
| Playlist detail panel | 3 | same, to find one Playlist's Publications |
| Publication wizard | 6 | the Asset library is read twice on the same page |
| Compositions list | 2, **+1 whole Asset library per preview click** | |
| Playlist editor, Channel editor, Full preview | 1–4 | each reads a whole catalogue for a slice |
| Media Library | 2 | paginated, debounced — **the model the others should follow** |
| Now & Next | 1, polling 60s | appropriate; it is a live operational view |

### Five patterns produce all of it

**P1 — a list is read, then each row is read again.** Three sites:
`useCompositionEditorData` (92 Playlists), `ProgramStatusCards` (39 Publications) and
`LowerOverview` (the same 39 again).

**P2 — the same call is issued more than once per page.** `fetchPublications("active")` runs twice
on Overview; `fetchMediaAssets` runs twice in the Publication wizard; `fetchPublications` is
called three times where the endpoint already accepts "all statuses".

**P3 — a whole catalogue is read for a slice of it.** `fetchMediaAssets` at six sites,
`fetchPlaylists` at five. Cheap at 33 Assets, quadratic in annoyance later.

**P4 — nothing is remembered.** No cache exists: `apiClient` is a bare axios instance, pages fetch
in `useEffect`, `/api/proxy/[...path]` is `force-dynamic`. Leaving a page and returning re-reads
everything.

**P5 — a poll re-runs an N+1.** `ProgramStatusCards` repeats its 40 requests every 60 seconds for
as long as the tab is open.

P1 and P2 are the whole measurable problem. P3–P5 are real but smaller, and P4 is the one the
work started out assuming was primary — wrongly, since a cache only ever helps the *second* visit.

### Three of the reads were already answered

Reading the RPCs rather than trusting the call sites changed what this ADR decides:

- `media_playlists_list` **already returns `cover_asset_id`**, resolved server-side as the explicit
  cover with a fallback to the first item by position — the only thing the Composition editor's 92
  requests were fetching.
- `media_publications_list` **accepts a null status** and returns every row, so the three-call
  pattern needs no backend change to become one call.
- `media_publications_list` **already LATERAL-joins `schedules`** for `starts_at`/`ends_at` to
  compute `effective_status`, and simply does not emit them.

## Decision

**A page asks for what it draws.** Concretely, in the order the work is done.

### 1. Delete the redundant reads (no backend, no new file, no new concept)

- **Composition editor.** Remove the bulk `Promise.all(allPlaylists.map(fetchPlaylist))`. Covers
  come from the `cover_asset_id` the list already returns; `items` and `playback` are needed only
  for a Zone's *bound* Playlist and are already hydrated by `loadCompositionDraft` on load and
  `hydratePlaylist` on binding change. **~98 → ~6.**
- **Publications list and Playlist detail panel.** One `fetchPublications()` with no status,
  filtered in the client. **3 → 1**, twice.
- **Publication wizard.** The Asset library is read once for the page, not once per component.
  The wizard owns both `assets` and a `reloadAssets(): Promise<MediaAsset[]>` and passes both
  down: `AssetLibraryStep`'s post-upload callback must still await a reload before selecting the
  new Asset, or an uploaded Asset never reaches the state the preview, eligibility and review
  steps read. **6 → 5.**

Overview is deliberately absent from this list. An interim shared loader between its two cards
would be thrown away by §2 and §3 — after those, the cards share no data — and it could not honour
"the poll must not re-run an N+1" anyway, since `LowerOverview` still needs per-Publication detail
until §3 lands. Overview changes once, straight to its final shape.

**Collapsing three status calls into one changes the failure contract.** Today
`PublicationsListPage` uses `Promise.allSettled` with a separate error per tab, so a failure
leaves the other two tabs usable; one call makes the page fail whole. Accepted deliberately —
the three calls hit one RPC on one connection, so independent failure is close to theoretical —
and the page's three error states collapse into one with it.

### 2. Now Playing and Next Up come from Now & Next — through a written adapter

`ProgramStatusCards` computes "what is playing / what is next" by reading every active
Publication's targets and playback window. `/media/now-next` already answers that question
server-side in one request — it is the endpoint `0057-channel-first-now-and-next.md` exists for.

Rejected: teaching `media_publications_list` to return target counts and playback windows. That
duplicates Now & Next's resolution logic — priority suppression, merged equal-priority loops,
heartbeat freshness — in a second place, where the two would drift.

**It is not a drop-in**, so the adapter is a decided contract rather than a mapping exercise.
Now & Next returns one row per Channel or direct Media Device, an occurrence may be a
`merged_loop` carrying several Publications, and its horizon is 60 or 180 minutes — while the card
takes exactly one Publication and ranked Now Playing by playing-target count, with no horizon
bound on Next Up.

**The adapter contract:**

- **Request.** `horizon_minutes=180`, `include_idle=false`, no `channel_id`, no `q`. One request
  serves both cards.
- **Aggregation.** Rows are folded **by Publication**: a Publication airing on several Channels is
  one candidate, and its rank is the number of rows it occupies. This is the closest available
  reading of the old "most playing targets" rank, which counted targets on the Publication itself.
- **Now Playing.** Candidates are rows whose `current` occurrence reports
  `playback_state === "confirmed"` — **not** every row with a `current`. The previous selector
  admitted a Publication only when `playingTargets > 0`, i.e. something was actually playing, and
  the card's `LIVE` badge is unconditional on that selection; mapping "scheduled now" into it
  would light `LIVE` for a `stale` or `not_confirmed` screen. Among those, the highest-ranked
  candidate wins, **ties breaking by Publication name** — the `localeCompare` the previous
  selector used as its own tie-breaker.

  This is marginally *stricter* than before: `confirmed` additionally requires a fresh Media
  Device heartbeat (`0057` §"Playback Confirmed"), where `playingTargets` only read job state. A
  Publication playing on a screen whose heartbeat has gone stale now falls out of Now Playing
  instead of showing `LIVE`, which is the more truthful of the two.

  Rejected: relabelling the card "Scheduled Now" and admitting every `current` row. That is a
  different card answering a different question, and Now & Next already answers it in full.

- **Next Up.** The **earliest `opens_at`** among `upcoming` occurrences — preserving the previous
  selector, which sorted on `next_opens_at` and ignored target counts entirely. Row-count rank is
  the Now Playing tie-breaker only. When two occurrences open at the same instant, rank by
  distinct rows occupied, then by name. A Publication appearing more than once within a single
  row does not increase its rank.
- **`merged_loop`.** An occurrence carrying several Publications contributes its **first**
  Publication to the card, labelled `+N more`. The card stays single-Publication; the merged loop
  is disclosed rather than hidden or expanded.
- **Target counts** mean **rows the Publication occupies in this response**, split into Channels
  and direct Devices by row type — the same two-part `X Channels · Y Devices` summary the card
  already renders. The card's footer also shows `N Playing` for Now Playing: that becomes the
  count of the Publication's rows reporting `confirmed`, which is what the selection filter is
  built on anyway.
- **Next Up beyond the horizon.** With `horizon_minutes=180` the card can only see three hours.
  When nothing upcoming falls inside it, the card says so — "No upcoming program in the next 3
  hours" — rather than implying there is none at all. Widening the endpoint's horizon to a full
  day was considered and deferred: it is a second production change, and Overview's Next Up is a
  glance, not a schedule. `/media-workspace/publications` remains the full view.

**Covers come from the same response.** A Now & Next publication carries `thumbnail_url`, so the
mapper supplies it and the card drops `usePlaylistPreview` and `usePreviewUrls` entirely. Without
this the card has no `playlist.id` to resolve a cover from, and the obvious repair — fetching the
Publication detail to find one — reintroduces the N+1 this section exists to remove.

**This section rests on an assumption, and the assumption is checked before it is built.**
"Now & Next already answers the question" is true of the endpoint's contract, not yet observed of
this tenant's data. `NowNextPage` carries a dev-only demo fallback for *two* conditions — the
endpoint erroring, and every row returning with no `current` and no `upcoming` — and its
production error path reads "backend read model is not available yet". That fallback exists
because both have happened. So the first act of this section is a parity capture: at one instant,
what `selectNowPlaying` / `selectNextProgram` return today beside the raw
`GET /media/now-next?horizon_minutes=180&include_idle=false` body. If the endpoint returns nothing
where the current selector still finds a Now Playing, this section does not proceed — it returns
here for a decision, rather than silently emptying the headline card of Overview.

**The failure contract is part of the decision, not an implementation detail.** Overview's
headline now rests on one request where a per-Publication read could previously half-succeed, so
what the cards show when it fails is a decision: the cards render their existing empty state with
a message distinguishable from "nothing is scheduled" — never a skeleton that never resolves, and
never the dev-only demo data. Overview is not a place to show invented programmes.

The mapper is a pure function with a runnable `*.check.mts` covering one Publication across
several rows, a `merged_loop` occurrence, a tie on the ranking key, an empty result, a Next Up
beyond the horizon, and a `current` set that is entirely `not_confirmed` plus a mixed one — written
before `ProgramStatusCards` is touched.

### 3. `media_publications_list` carries what the schedule panel draws

`LowerOverview`'s "today's schedule" panel is the last thing needing per-Publication detail. It
needs more than the window: it filters and formats with `schedule.timezone`, and it renders
`publication_targets.length`. So the list contract must carry, at minimum:

- `starts_at`, `ends_at` — the LATERAL join already selects both for `effective_status`
- `timezone` — the same LATERAL, one more column; without it "today" is evaluated in the wrong
  zone for any Schedule outside `Asia/Bangkok`, which `0031`'s single-timezone rule permits
- a **target summary** — a new aggregate over `publication_targets`

The target summary is **split by `target_type` into Channels and Devices**, and the panel renders
`X Channels · Y Devices` like the Program cards do. The panel today renders
`publication_targets.length` — every row, Channel and Device alike — under the label "Channels",
so it is already wrong; `program-status.ts` splits the two correctly on the same page. Splitting
costs no more than a combined count in the same aggregate, corrects the mislabelling rather than
preserving it, and leaves both halves of Overview speaking one vocabulary.

This changes a number operators currently see: a Publication targeting two Channels and one
Device reads `3 Channels` today and `2 Channels · 1 Device` afterwards. That is the correction,
not a regression.

The claim that this is "two lines with no new query cost" was wrong: the timezone column extends
the LATERAL, and the target summary adds an aggregate.

**It is also behind a gate.** §2 removes one of Overview's two per-Publication N+1s at no
irreversible cost, and this migration is the only step in this ADR that cannot be undone. Overview
is re-measured after §2 lands; if it is comfortable then, this section waits alongside §7 rather
than being spent in advance. A prod migration should not be the one change in the plan that skips
the gate everything cheaper has to pass.

When it does proceed, it stops for approval. It uses `CREATE OR REPLACE` **without** a
preceding `DROP FUNCTION`: the signature stays `(uuid, character varying DEFAULT NULL) RETURNS
jsonb`, only the JSON body grows, so a drop would add a window where the function does not exist
and would re-grant EXECUTE to PUBLIC that the original had revoked. ACLs are compared before and
after; nothing is re-granted beyond what was there. It is the *only* backend change in this ADR.

### 4. `openPreview` keeps reading the Asset library, for now

`CompositionsListPage.openPreview` fetches every Asset on each preview click to resolve the
handful the preview draws, and that looks like the same waste as everywhere else. It is not, at
this scale: the Asset API offers `GET /media/videos/{id}` per id and no batch-by-ids, so resolving
"only what the preview references" would trade **one** request for **N**, against the goal. The
preview also needs Asset metadata to fill in missing `duration_seconds` (`PreviewStage`), so the
ids alone are not enough.

Deferred until either a batch-by-ids read exists or the preview payload carries durations. It is
recorded here so the next reader does not mistake it for an oversight.

### 5. Now & Next keeps its own refresh and never reads through a cache

It is the answer to "what is on the screen right now"; playback evidence is its subject.

### 6. Everything after §1–§2 is gated on measurement

§1–§2 are measured before §3 is paid for, and again before anything in §7 or §8 is written. Two numbers, recorded separately
because they move independently: **request count** and **time to first content**. A cache moves
only the second; deleting a read moves both.

The order past this gate is **measurement → a second ADR accepted → implementation**. §7 and §8
are constraints on decisions not yet taken, not a licence to start once the numbers look bad.

### 7. If a catalogue cache is built, its shape is already constrained

Should §6's measurement call for it, the cache wraps exactly `fetchLayouts`, `fetchMediaAssets`,
`fetchPlaylists` and `fetchContentFolders`, and nothing else.

It is explicitly **not** placed on `requestApi`. That is shared transport well outside Media
Workspace: `asset-intelligence` reads `GET /session` through it to resolve the current tenant, and
`people/personnel` uses it for member reads. A cache there is keyed by path alone, carries no user
or tenant identity, and lives in a module-level `Map` that a client-side logout/login does not
tear down — so operator A's session and catalogue could be served to operator B in the same tab.
Four named functions have no such reach.

- **Invalidation is declared, never derived**, from a four-value resource union —
  `invalidate("playlists")`, never a URL — because a mutation's item path is *longer* than the
  list key it must clear, so no prefix rule derived from the mutation URL can find the list.
- **Stale-while-revalidate is not settled here.** It works only through a subscribing seam: a
  plain `async` function receives a stale value once and can never learn the refresh landed. The
  second ADR either names that seam — a `useCatalogueResource` hook and the call sites it converts
  — or drops stale-first for a short freshness window alone and deletes the subscriber mechanism
  with it. Note that the freshness window is what removes repeat *requests*; stale-first only
  moves time-to-content.
- **Auth changes clear it**, on login and on logout.
- **In memory, per tab.** Not `sessionStorage`/`localStorage`: preview URLs are Supabase signed
  URLs with a one-hour life, and a cache surviving a browser restart rehydrates a page of dead
  image URLs. A `localStorage` draft shape has already cost this codebase one crash.
- **`fetchPreviewUrls` is out of it.** A POST over a variable id set needs a sorted-id key and a
  signature expiry — a different mechanism from a read cache, and not worth building for 33 Assets.
- **No dependency.** TanStack Query and SWR were considered and rejected as larger than the
  problem; their cache is the same `Map` underneath, and their retry, pagination and devtools
  surface is unused here.

### 8. Pagination is deferred, and Media Library is the pattern

`fetchMediaAssets` walks pages of 200 and `fetchPlaylists` returns everything; at 5,000 Assets the
first becomes 25 serial requests, which no cache saves. `media-library-page` already does this
correctly — `fetchMediaAssetPage` with a page size of 12 and a 250 ms debounce — and is the shape
the other readers adopt when the day comes. Revisit past roughly 500 Assets or 300 Playlists.

## Consequences

- Overview is expected to drop from roughly 81 requests to a handful, and to stop re-running an
  N+1 every minute — confirmed against the measured baseline, not asserted from the call graph.
- The Composition editor drops from ~98 to ~6.
- Publications list and the Playlist detail panel drop from 3 to 1; the wizard from 6 to 5.
- One production migration — schedule window, timezone and a target summary — needing explicit
  approval, applied with `CREATE OR REPLACE` and no drop. Everything else is frontend deletion.
- The Publications list and Playlist detail panel lose per-status partial availability.
- Overview's Now Playing card becomes a second consumer of Now & Next, so that view's resolution
  rules now serve two surfaces — deliberate, and the reason §2 rejects duplicating them.
- Now Playing tightens slightly: a Publication on a screen with a stale heartbeat leaves the card
  rather than showing `LIVE`.
- Return visits are unchanged by this ADR. Whether they still need work is an open question with
  a measurement attached, not an assumption.
