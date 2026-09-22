# Handoff — Playlist v1

For the agent picking up GitHub issues #33–#41 in `rdThunderThailand/thunder_one_prj`.
Written 2026-09-02. Nothing has been implemented yet; every issue is at zero.

## Intent

Rebuild Playlist authoring as one editor page with a Folder/Tags/Trash-aware list, matching the
Figma design in `docs/playlists/v1/`, and carry per-item playback intent all the way to the
player's poll payload. Nine vertical slices, each demoable on its own:

| # | Slice | Blocked by |
|---|---|---|
| [#33](https://github.com/rdThunderThailand/thunder_one_prj/issues/33) | Playlist editor: one page replaces the create wizard | — |
| [#34](https://github.com/rdThunderThailand/thunder_one_prj/issues/34) | Playlists list: summary tiles, Type column, Mark as ready | — |
| [#35](https://github.com/rdThunderThailand/thunder_one_prj/issues/35) | Add Item panel | #33 |
| [#36](https://github.com/rdThunderThailand/thunder_one_prj/issues/36) | Playlist playback settings and timeline | #33 |
| [#37](https://github.com/rdThunderThailand/thunder_one_prj/issues/37) | Per-item playback intent reaches the player payload | #33, #34 |
| [#38](https://github.com/rdThunderThailand/thunder_one_prj/issues/38) | Folders for Playlists | #34 |
| [#39](https://github.com/rdThunderThailand/thunder_one_prj/issues/39) | Preview a Playlist | #33 |
| [#40](https://github.com/rdThunderThailand/thunder_one_prj/issues/40) | Trash and restore | #38 |
| [#41](https://github.com/rdThunderThailand/thunder_one_prj/issues/41) | Tags for Playlists | #38 |

**Start with #34, then #33.** #34 has no blocker but carries a hard merge-order constraint: today the
only code that writes a Playlist's status is `usePlaylistDraftSave.ts`, which #33 deletes. If #33
lands first, nothing can take a Playlist out of `draft`, `fetchPlaylists()` (default
`include_drafts=false`) hides drafts from the Publication picker, and **no new Publication can be
created anywhere in the product.** #39 must land with #33 for the same reason — Playlist preview
currently lives inside the wizard's review step.

## Context and paths

Two repositories, deployed on different cadences:

- **`thunder_one_prj`** (this repo) — Next.js frontend. Branch `fix/playlist`.
  - `src/features/media-workspace/playlists/` — the feature. The wizard (`PlaylistStepper`,
    `BasicInfoStep`, `ContentStep`, `SettingsStep`, `ReviewStep`, `step-validation.ts`,
    `store/usePlaylistDraftStore.ts`) is what #33 removes.
  - `src/features/media-workspace/layouts/` and `.../compositions/` — **copy these patterns.** They
    already are list + single editor with a folder rail, which is the shape Playlist is moving to.
  - `src/features/media-workspace/content-library/ContentFolderRail.tsx` — reuse for #38, do not
    write a second rail.
  - `src/features/media-workspace/preview/` — `FullPreviewPage`, `preview-clock`, `preview-geometry`.
  - `src/lib/api/media-api.ts` — shared reads. `src/types/domain.ts` — shared read shapes.
- **`Thunder_Core`** (`../Thunder_Core`, branch `fix/playlist`) — API routes + SQL migrations.
  Deploys from `develop`, so a pushed feature branch does **not** make backend changes live; MCP
  migrations, by contrast, are live the moment they are applied.

Read before writing code, in this order:

1. `docs/playlists/v1/design-guideline-playlist-editor.md` — per-field table of what the Figma asks
   for, what we build, and why. This is the reference for every UI decision; the four PNGs beside it
   are the design.
2. `docs/adr/0060-playlist-editor-single-page.md` — the eight decisions and their reasoning.
3. `docs/playlists/v1/plan-playlist-v1.md` — work breakdown, merge order, known risks.
4. `.docs/SESSIONLOG-playlist-v1-2026-09-02.md` — the traps found while tracing.

`docs/playlists/version 0/` is the superseded wizard plan. Do not follow it.

### Traps that cost real time to find

- **`CONTEXT.md`'s Publication entry is out of date.** It says `media_job_poll` joins
  `playlist_items` live and that ADR 0045 is unimplemented. Both are false: verified on production
  2026-09-02 that the poll reads snapshots only. The live read is in
  **`media_publication_activate`** (materialization) and `media_publication_republish` re-runs it.
  That is why #40's Trash guard covers `{draft, active}` and no other status: activate refuses
  anything not `draft`, republish refuses anything not `active`. Exact set, not a margin.
- **`playlistDisplayStatus()` is not a bug.** It implements ADR 0028 — `active`/`inactive` are
  derived from `publication_count`, which `media_playlists_list` has returned since Thunder_Core
  migration 098. Do not remove the derivation and do not store `active`. Marking a fresh Playlist
  ready correctly shows **Inactive**, not Active.
- **Units.** `metadata.playback.transition_duration` is **seconds** (`duration.ts:37`,
  `ReviewStep.tsx:187`, `PlaylistSummary.tsx:97` all render `…s`). The new column is
  `transition_duration_seconds`. A milliseconds column beside `duration_seconds` in the same table
  is exactly the silent-corruption trap this work is closing.
- **`metadata.ts` is a per-key whitelist on encode and decode.** A key not declared there never
  leaves the browser — the reason #36 and #37 both name that file.
- **`metadata.playback` already holds 11 keys**, not 3. Three reach the player; some are inheritance
  defaults; the rest are inert. Leave the inert ones alone.
- **Preview does not support Playlists.** `FullPreviewPage` takes `source: "composition" |
  "publication"` and a `CompositionPreview` payload of zones plus aspect ratio, over two routes only.
  #39 needs a third route, a widened union and handoff, and an adapter presenting the Playlist as one
  full-frame zone.
- **`CREATE OR REPLACE FUNCTION` does not replace when a parameter is added** — it creates an
  overload and every existing call becomes ambiguous. Always `DROP FUNCTION IF EXISTS <old
  signature>` first. And `CREATE FUNCTION` grants EXECUTE to PUBLIC; re-`REVOKE` after every create.

## Constraints

- **Reply in Thai.** Code, identifiers, commit messages, ADRs and specs stay English.
- **Commit and push only when asked.** Never add `Co-Authored-By: Claude` or mention AI in a commit
  message. A PR opens as **Draft** when verification is incomplete, and the agent never marks it
  ready. Ask whether the PR body should be Thai or English.
- **Every migration is R0 and requires explicit approval before it is applied**, naming the tables
  and row counts affected. `.env` in these repos points at hosted Supabase; there is no local stack.
  After applying, dump `prosrc`/schema back and diff it against the file.
- **#41's backfill of `metadata.info.tags` is a separate approval**, not part of merging that
  ticket's code. Show the affected row count first.
- **Ask before any browser verification run**, at every verify point, offering: (1) the agent drives
  the browser, (2) a checklist for the human to run, (3) skip. Options 2 and 3 count as unverified.
- **"Done" means verified at the layer the user touches.** `tsc`/`lint`/`build` passing means it
  compiles. For #37 specifically, the acceptance is the **deployed HTTP poll endpoint returning the
  four fields** — reading the RPC source does not count.
- No new dependencies without asking. Files ≤300 lines, no `any`, no dead code, Server Components by
  default with `'use client'` only at leaves, mutations through Server Actions.
- Tests in this repo are `*.check.mts` using bare `node:assert`, run as `node <file>.check.mts`.
  There is deliberately no test runner. Do not introduce one.
- Do not touch `playlistDisplayStatus()`, `ContentFolderRail`, `preview-clock` or `preview-geometry`
  beyond what an issue explicitly requires.

## Acceptance criteria

Each issue carries its own checklist; those are authoritative. Across the set:

- [ ] #34 merges before or with #33; #39 merges with #33
- [ ] Creating a Playlist, adding items, saving, reopening, marking ready and using it in a new
      Publication all work end to end in the browser
- [ ] Activating a Publication returns the four per-item fields in the live `media_job_poll`
      response, checked over HTTP against the deployed backend
- [ ] Trashing is refused for a Playlist referenced by a `draft` Publication, and by an `active` one,
      each naming the Publication; a cancelled or ended reference does not block
- [ ] Folder move, tag filter, Trash and restore all work from the UI
- [ ] Each migration has a dev and a prod application recorded on its issue, and the deployed schema
      was diffed against the migration file
- [ ] No raw backend or database error text reaches the operator anywhere
- [ ] Every session that touches code ends with a new `.docs/SESSIONLOG-<topic>-<date>.md`

Report per issue: what was built, which layers were verified and which were not, and the exact
command or endpoint that produced the evidence.

## Out of scope

Deferred to a later phase, with reasons recorded in ADR 0060 — do not pull them forward:

- **Composition as a Playlist item.** Inverts containment, admits cycles, needs a polymorphic
  `playlist_items` plus cycle detection and a redefinition of duration. Open design question, not a
  rejected one.
- An embedded **Upload New** tab in the Add Item panel (link out to `/assets/upload` instead).
- A `derived_usage` field replacing raw `publication_count`.
- Players actually acting on the new per-item fields — different repository and team. Update
  `docs/layouts/contract-v2-zones.md` and move on.
- Grid and compact list views; `lock_duration`; new transition values beyond `cut`/`fade`; server-side
  list filtering and pagination; loosening the permanent-delete guard.

Also out: unrelated refactors, renaming existing playlist modules beyond what an issue names, and any
change to Publication, Composition or Channel behaviour.
