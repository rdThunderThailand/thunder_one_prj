# Checklist — #41 BE-5 playlist tags, HTTP layer

Date: 2026-09-03 · Issue: #41 (BE-5) · ADR: 0060 §8 / §8a
Migration: `Thunder_Core/supabase/migrations/20260903150000_playlist_tags.sql`
Route: `PUT /media/playlists/{id}/tags`

## What is already verified — do not re-test

The SQL layer is done, on **develop** (`ftfmokgphewzyxzwjitv`) only:
RLS on with no policies and no `anon`/`authenticated` grants · `media_playlist_set_tags`
granted to `service_role` only · `media_playlists_list` still a single overload with its
grants intact · name normalisation (trim, drop blanks, case-insensitive dedupe) · repeat
calls idempotent · new names land in the shared `media_core.tags` · `tags: []` (never
`null`) on untagged rows · refusals for a trashed playlist, another tenant, a 65-char tag ·
empty array and `NULL` both clear the set.

**Prod (`sfiefevtxalqjizdkcsw`) is NOT applied.** That is the decision waiting on this
checklist.

What is unverified is the layer in between: does the route authenticate, validate, call the
RPC and shape its response the way the frontend will expect in FE-6.

## Setup

1. Thunder_Core running locally on `:3001` from branch `fix/playlist`
   (`cd Thunder_Core && npm run dev -- -p 3001`).
2. thunder_one_prj running on `:3000` with `CORE_API_URL=http://localhost:3001`.
   Confirm: open `http://localhost:3000/api/proxy/__config` — it must print
   `{"coreApiUrl":"http://localhost:3001","hasKey":true}`. If it prints the Vercel URL,
   set the env var and **restart the dev server**.
3. Log in to `http://localhost:3000` as normal, then open **any Playlists list page**
   (`/media-workspace/playlists`) and open DevTools → Console. Every step below is run
   from that console, so the session cookie travels with the request.
4. Paste this helper once:

```js
const api = async (method, path, body) => {
  const r = await fetch(`/api/proxy${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await r.text();
  let parsed; try { parsed = JSON.parse(text); } catch { parsed = text; }
  console.log(method, path, "→", r.status, parsed);
  return { status: r.status, body: parsed };
};
// Pick a playlist to work on — copy the id it prints.
const list = await api("GET", "/media/playlists?include_drafts=true");
```

Note the `id` and `name` of one playlist you are willing to tag, and keep the tab open.
Below, `PL` means that id. Also note whether `media_core.tags` already holds a tag whose
name differs only by case from `QA Tag` — the vocabulary on develop is
`FOOD, Promotion, test, thai, WEDNESDAY`, so it does not.

## A. The route exists and writes

| # | Step | Expected |
|---|---|---|
| A1 | `await api("PUT", "/media/playlists/PL/tags", { tags: ["QA Tag", "test"] })` | `200`. Body is `{ success: true, data: { tags: [...] } }` with **two** entries, each `{ id, name }`. Names are `QA Tag` and `test`, ordered by name. |
| A2 | In A1's response, look at the entry for `test` | Its `name` is exactly `test` (lowercase) — the pre-existing vocabulary spelling, **not** a second tag. This is the "reuse, don't duplicate" rule. |
| A3 | `await api("GET", "/media/playlists?include_drafts=true")` then find `PL` in the array | The row has a `tags` array matching A1 exactly (same ids, same names). |
| A4 | In that same response, find any playlist you have **not** tagged | It has `tags: []` — an empty array, not `null` and not a missing key. |

## B. Normalisation happens server-side

| # | Step | Expected |
|---|---|---|
| B1 | `await api("PUT", "/media/playlists/PL/tags", { tags: ["  QA Tag  ", "qa tag", "QA TAG", "", "   "] })` | `200`. `data.tags` holds **exactly one** entry. Its `name` is `QA Tag` — the spelling already in the vocabulary wins over the newly typed casing. |
| B2 | Repeat B1 verbatim | Identical response, same tag `id`. No duplicate rows, no error. |
| B3 | `await api("PUT", "/media/playlists/PL/tags", { tags: [] })` | `200` and `data.tags` is `[]`. This is how the UI clears every tag. |
| B4 | `await api("GET", "/media/playlists?include_drafts=true")`, find `PL` | `tags: []`. The clear stuck. |

## C. Validation and refusals — the body must never leak a raw DB error

| # | Step | Expected |
|---|---|---|
| C1 | `await api("PUT", "/media/playlists/PL/tags", { tags: "nope" })` | Non-2xx (or a `success:false` body). Message mentions that `tags` must be an array of strings. **No SQL text, no function name, no stack.** |
| C2 | `await api("PUT", "/media/playlists/PL/tags", {})` | Same shape of rejection as C1. |
| C3 | `await api("PUT", "/media/playlists/PL/tags", { tags: ["a".repeat(65)] })` | Rejected. Message is about the 64-character limit. Again no raw DB error. |
| C4 | `await api("PUT", "/media/playlists/00000000-0000-0000-0000-000000000000/tags", { tags: ["x"] })` | Rejected as not found. It must **not** be a 500 with a Postgres message. |
| C5 | `await api("PUT", "/media/playlists/not-a-uuid/tags", { tags: ["x"] })` | Rejected as invalid input, not a 500. |
| C6 | `await api("PUT", "/media/playlists/PL/tags", { tags: Array.from({length: 51}, (_, i) => "t" + i) })` | Rejected — the route caps a set at 50 tags. |

## D. Trash interaction

| # | Step | Expected |
|---|---|---|
| D1 | Tag `PL` again: `await api("PUT", "/media/playlists/PL/tags", { tags: ["QA Tag"] })` | `200`, one tag. |
| D2 | In the UI, move `PL` to Trash (row action). Then `await api("PUT", "/media/playlists/PL/tags", { tags: ["other"] })` | Rejected as not found — a trashed Playlist cannot be retagged. |
| D3 | `await api("GET", "/media/playlists?trash=true")`, find `PL` | The row still carries its `tags` from D1. Trashing does not wipe tags, so a restore brings them back. |
| D4 | Restore `PL` from Trash in the UI, then `await api("PUT", "/media/playlists/PL/tags", { tags: ["QA Tag"] })` | `200` again. |

## E. The vocabulary really is shared

| # | Step | Expected |
|---|---|---|
| E1 | `await api("GET", "/media/tags")` | `200`. The list includes `QA Tag` — the tag created through the Playlist route appears in the tenant's one vocabulary. |
| E2 | In that response, look at `QA Tag`'s `usage_count` | It is `0`, because `media_tags_list` counts **publications** only. This is expected and is why the Tags tab derives its counts from the playlist rows instead (ADR 0060 §8a). Flag it only if `usage_count` is missing entirely. |
| E3 | Open the Publications create/edit form's tag field | `QA Tag` is offered in the datalist. Same word, one tag. |

## F. Nothing else regressed

| # | Step | Expected |
|---|---|---|
| F1 | Reload `/media-workspace/playlists` | List renders. Row counts, durations, status, folder rail and Trash all behave as before — the `tags` key was added to `media_playlists_list`, nothing was removed. |
| F2 | Open one Playlist in the editor, change something, Save Draft | Saves normally. `media_playlist_upsert` was deliberately not touched. |
| F3 | DevTools Console across F1–F2 | No errors, no React warnings. |
| F4 | Move a Playlist between folders in the UI | Still works — `media_playlist_move` untouched. |

## Cleanup after the run

From the console, clear the tags you added and tell me which tag names ended up in
`media_core.tags` so I can delete the test vocabulary entries with your approval (deleting
rows is not something I do unasked):

```js
await api("PUT", "/media/playlists/PL/tags", { tags: [] });
await api("GET", "/media/tags");
```

## Report back

For each row: PASS / FAIL. For a FAIL, paste the status code and the response body verbatim.

Two things I specifically need in the answer, because they gate what happens next:

- **Any C-row that returned a raw Postgres message** (text containing `media_playlist_set_tags`,
  `plpgsql`, `ERROR:`, or a `22P02`-style code). That is a leak to fix before prod.
- **Whether A2 and B1 reused the existing spelling.** If a second tag appeared that differs
  only by case, the shared-vocabulary rule is broken and the migration must not go to prod.

All PASS → I apply the same migration to prod (`sfiefevtxalqjizdkcsw`) after you approve
that step separately, then start FE-6.
