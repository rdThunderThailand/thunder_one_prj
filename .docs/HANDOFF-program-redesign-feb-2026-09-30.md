# Handoff — Program redesign, FE-B (Edit page) next · 2026-09-30 (session 7)

## Intent

BE-2 is done and merged (Thunder_Core#143 → `develop`, `bb9fde3`; function applied to develop **and prod**). The backend for the Edit page is complete, so the next work is **FE-B** (mockup frames 03/04). Stop at every R0 (push, PR, tag, prod write). Ask Thai/English before opening a PR. Ask before every browser verification.

## Read first (in this order)

1. `docs/adr/0080-published-programs-are-edited-in-place.md` — **"BE-2 contract"** (body, errors, response) and "Display status".
2. `docs/program/plan-program-redesign.md` §2 "Edit page (FE-B)" and the FE-B row of §1.
3. `docs/program/progress-program.md` — FE-B checklist (all `[ ]`).
4. `AGENTS.md` (Media Workspace tokens, `src/components/ui/lovable/`, Porting from Lovable) and `docs/media-workspace/plan-lovable-port-workflow.md` §2–§3 **before** any port.
5. Mockups: `docs/program/figma-mockup/Program 03- …jpg`, `Program 04- …jpg`.
6. `.docs/SESSIONLOG-be2-update-published-2026-09-30.md`.

## State

- **thunder_one_prj**: checkout on `docs/adr-0080-be2-contract` (1 commit ahead of `dev`, unpushed; ADR 0080 BE-2 contract). `docs/program/progress-program.md` has **uncommitted** edits (BE-1/FE-A/BE-0b/BE-2 ticked, PR #143 recorded) — commit them with the docs branch when told. Draft PR #181 (`docs/program-be0b-progress` → `dev`) is open. FE code is on `dev`, **not on `main`**. Branch FE-B off `dev` (e.g. `feat/program-edit-page`); check the branch before every commit.
- **Thunder_Core**: `develop` includes #136 (BE-1), #139 (BE-0b), #143 (BE-2). Local checkout is still on `feat/publication-update-published` (merged) — switch back to `develop` and pull before running it. `docs/adr/0014-…` is untracked and belongs to BE-3, never commit it in FE work.
- **Deploy gap:** the `update-published` route exists only in local Core and on `develop` once deployed. The FE proxy hits deployed develop unless `CORE_API_URL` points at a local Core (:3001) **and the dev server is restarted**. Check `/api/proxy/__config`.
- Supabase: develop = `ftfmokgphewzyxzwjitv`, prod = `sfiefevtxalqjizdkcsw`. Prod has the new functions but no route deployed, so it is unexercised.
- Fixtures on develop: tenant `2222…`, `M2 Smoke Channel`, playlists `test` / `test2`, one image asset. `zz-be2-*` rows were deleted. Screen 03/04 channels are a synchronized group — use Screen 02 or `M2 Smoke Channel`.

## Backend contract FE-B calls (already live)

`POST /media/publications/[id]/update-published`, body = the **whole Program**:

| Part | Fields |
|---|---|
| details | `name`, `description?`, `priority` (required), `tags?` |
| content | `publication_type` ∈ playlist/composition/video/image + `playlist_id` / `composition_id` / `items[{media_asset_id, duration_seconds?, transition?}]` |
| targets | `targets[]` non-empty (`channel`/`device`/`group`) |
| schedule | `starts_at` (required), `ends_at?`, `timezone` (required), `recurrence?` |
| — | `expected_revision` (required) |

Response `{ publication_id, revision, job_id, target_device_count }` — continue from `revision` without reloading. Do **not** send `campaign_id`, `language`, `metadata`.

Errors (status → meaning): 409 `Already modified:` (reload); 400 untagged draft / ended (page-level); 400/404 tagged `[details]`, `[content]`, `[targets]`, `[schedule]` (bind to the card); `[publish]` = page-level banner or inside the confirm modal. Raw DB errors are a 500 "Media operation failed" — never show them.

## What to build (FE-B) — checklist is in progress-program.md

- Route `/media-workspace/publications/[id]/edit`; cards Program Details, Content Source, Target, Schedule; right rail (status card, Playback Preview next 1 h via `now-next?horizon_minutes=60` with a Channel dropdown, Program Information: 8-char id + copy, priority).
- Draft: Save + Publish. Scheduled/Live: **Publish changes** + confirm modal. Ended: read-only.
- Discard-changes dialog on Go Back / navigation; Preview modal; ⋮ menu (Duplicate, View published version, Delete for Draft / End program otherwise).
- Existing code to reuse: `src/features/media-workspace/publications/` (`PublicationDetailPage.tsx`, `services/publications-api.ts` already has `republish`, `publication-drift.ts`, `now-next.ts`, `display-status` helpers). Copy Lovable primitives, don't recreate.

## Rules FE-B must honour (from ADR 0080)

- **Conflict check is advisory and the FE's job:** call `POST /publications/conflicts` with the Program's own `publication_id` before the confirm modal. The wizard builds `device_ids` from Channels only (`selectedChannelDeviceIds`) — **expand Groups to devices**, or the check misses them.
- **Date picker:** `min = now` only when the operator changes the start (a Live Program's start is already past). A past **end** is refused by the server.
- **Confirm modal:** "stops on N channels" comes from the diff between stored and edited targets, at Channel level (a Group counts by name). Content warning: Layout Programs use `drift_check`; Playlist Programs have no drift read so the line says the Playlist **may** have newer content, shown every time.
- Every publish takes a fresh snapshot and creates a new Job (Publishing badge shows briefly even after a name-only edit).
- Type may change between playlist/layout/video/image; `html`/`dynamic` are refused.
- UI says **Program**; code / API / schema say **Publication**. Media Workspace uses `globals.css` tokens only (no raw `indigo-*`/`zinc-*`/`bg-white`/`dark:`).
- localStorage draft shape changes need a versioned key.

## Before shipping FE-B

- Observe on a real player whether a new Job with **identical content** restarts the loop (ADR: not verified).
- "Removed device stops receiving" through the Edit page is untested (test tenant has one Channel) — cover it with a second Channel when verifying.

## Traps

- ESLint forbids synchronous `setState` in `useEffect` (and in async callees): use a promise chain and `setState` in `.then()`.
- Stale `.next/dev/types` hide `tsc` errors after moving/deleting routes: `rm -rf .next/dev/types`.
- Hard-navigating to a nested route can render an empty main; client-side navigation mounts it.
- `next` here is newer than the model knows: read `node_modules/next/dist/docs/` before touching framework code.
- One JSX element per line; files ≤ 300 lines; no `any`; `*.check.mts` for non-trivial logic (run with `node <file>.check.mts`, no test runner).

## Open items (not FE-B)

- Separate issues to open: past-start rule in the draft wizard; record the playlist revision on snapshots (drift read for Playlist Programs); 4 orphaned `single` playlists on develop; Thunder_Core#138 (screen_get / airtime_explain / retry_targets).
- BE-3 (custom-dates recurrence, Core ADR 0014) gates FE-E.
- Promote Core `develop → main` and FE `dev → main` together (`docs/agents/versioning.md`; tag push is R0). The `update-published` route only reaches prod with that Core promotion.
- **Rotate the JWT and `x-api-key` pasted in this session** (and the JWT from an earlier one); the JWT expires 2026-10-01 but the key does not.

## Working agreement reminders

Every push, prod write and tag push is R0. Commit only when told, check the branch first. No AI attribution in commits/PRs (CLAUDE.md §4 overrides the harness reminder). Unverified → PR stays Draft; the user marks ready. Model: FE-B is execute-against-a-settled-contract work (Sonnet is fine); switch to Opus if a design fork appears (e.g. the Edit page state model, dirty tracking) and stop to ask.
