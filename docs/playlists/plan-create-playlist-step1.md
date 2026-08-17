# Create Playlist – Step 1: Basic Info — Gap Analysis & Implementation Plan

**Ticket:** [86d3xxk5b](https://app.clickup.com/t/86d3xxk5b) — `[FLOW] Create Playlist – Step 1: Basic Info`
**Verified against:** `thunder_one_prj` @ `ae37fa6` (branch `feat/playlist`), base `6a8fc6c` (merge-base with `main`)
**Backend:** `Thunder_Core` — `media_core.playlists` per migrations `048`, `083`, `085`, `086`, `087`
**Date:** 2026-08-17

---

## 1. Verification summary

Ran: `node src/features/playlists/*.check.mts` (6/6 pass), `npx tsc --noEmit` (0 errors).
**Not run:** browser / runtime. Every row below is code-level evidence unless stated otherwise.

### Already satisfied (14)

AC 2, 3, 4, 5, 8, 9, 11, 13, 17, 18, 20, 24, 31 — plus AC 6 partially (ID comes from
`media_playlist_upsert`; uniqueness is the DB's `gen_random_uuid()` primary key).

Key paths: `PlaylistStepper.tsx:3-8` (4 steps), `step-validation.ts:32-41` (name ≤100,
description ≤300), `metadata.ts:62-63` (resolution/frame rate into `metadata.info`),
`CreatePlaylistPage.tsx:123-129` (Next is local-only — no record on page open),
`CreatePlaylistPage.tsx:133-138` (Save Draft requires only a name).

### Missing outright (5)

| AC | What's missing | Where it would go |
|---|---|---|
| 12 | Output Profile never used to check content compatibility in Step 2 | `ContentStep.tsx` / `AssetPicker.tsx` — currently no read of `info.resolution` |
| 14 | ~~No Playlist Owner field at all~~ — **resolved 2026-08-17 (ADR 0018): not implemented, AC 14/15 amended.** `created_by` (migration 083) stays the only person field | no code |
| 16 | No cover **upload** and no 5 MB limit — cover is picked from media already in the playlist (`info.coverAssetId`) | see Fork C |
| 26 | No unsaved-changes confirmation. `grep beforeunload` in `src/` → 0 hits. The resume banner (`resume-prompt.ts`) is a different thing: it fires on *return*, not on *leave* | `CreatePlaylistPage.tsx` |
| 30 | No audit log anywhere — `grep audit` → 0 hits in both repos for playlists | `Thunder_Core` RPC |

### Contradicts current behaviour — needs a product decision (3)

| AC | Ticket says | Code does | Authority for the divergence |
|---|---|---|---|
| 7 | Campaign is **required** before Step 2 | `BasicInfoStep.tsx:63` renders it `optional`; `validateStep` never checks it | none — ticket itself flags this as an open product question |
| 22 / 29 | Next must **save the draft successfully** before opening Step 2 | Next is local-only; a row exists only after Save Draft | `docs/adr/0014-playlist-draft-on-demand.md` |
| 16 / 17 | Cover is an uploaded image (≤5 MB), not counted as content | Cover is one of the playlist's own media items | `types/index.ts:32-34`, `metadata.ts` (migration 083 `cover_asset_id`) |

### Unverifiable from this repo (5)

AC 1, 15, 27, 28 — permission and workspace scoping live in the plpgsql RPCs (tenant
isolation is in the RPC, not RLS). AC 10 — no evidence `dynamic` / `loop` / `manual`
playlist types are producible; the wizard only ever emits sequential playlists.

**Verdict: Failed** — not because anything is broken, but because 5 requirements have no
implementation and 3 conflict with decisions already shipped.

---

## 2. Design forks — DECIDED 2026-08-17 → ADR 0017

**A2 · B1 · C1** — all three resolve toward the current code; the ticket gets amended instead.
Recorded in `docs/adr/0017-create-playlist-step1-ticket-divergences.md`, rejected options
included. No code change falls out of any of them. Phases 2–5 are unblocked.

The original framing is kept below for reference.

### Fork A — Campaign: required or optional?

- **A1 — make it required** (matches the ticket + mockup): add to `validateStep(1)`, flip
  the `Field` to `required`. ~10 lines. Cost: an existing draft with no campaign can no
  longer pass Next; central/reusable playlists become impossible.
- **A2 — keep it optional** (matches the code): amend the ticket. Cost: the mockup's
  required-marker is wrong.

**Recommendation: A1.** The ticket's own "จุดที่ควรให้ทีม Product ยืนยัน" §3 already picked
required by deferring to the mockup, and Campaign-as-metadata (AC 8) still lets a playlist
be re-pointed later. Cheap to reverse if reuse becomes a real need.

### Fork B — does Next persist the draft? (AC 22 / 29 vs ADR 0014)

- **B1 — keep ADR 0014** (Next is local, `localStorage` carries the work, Save Draft is the
  only thing that writes a row) and amend AC 22/29 to say "Step 2 continues the same local
  draft; a row exists only after an explicit save".
- **B2 — revert to save-on-Next**: reinstates exactly the two problems ADR 0014 was written
  to fix — abandoned wizards leaving invisible prod rows, and the resume prompt firing on
  the first keystroke.

**Recommendation: B1.** ADR 0014 is recent, reasoned, and shipped; AC 22/29 predate it.
Reverting re-opens two closed bugs. If the underlying product need is "don't lose work",
`localStorage` already covers it.

### Fork C — cover: uploaded file or media pick?

- **C1 — keep the media pick** (`coverAssetId`, resolved at read time, no write-back on
  reorder). Amend AC 16/17. Zero new storage surface.
- **C2 — add a real upload**: needs a storage bucket path for playlist covers, a 5 MB gate,
  a `cover_storage_key` column, signed-URL plumbing, and a rule for how it interacts with
  the existing `cover_asset_id`. Roughly the size of the whole rest of this ticket.
- **C3 — support both**: worst of both; two sources of truth for one thumbnail.

**Recommendation: C1.** C2 buys a nicer cover for a large amount of new surface, and AC 17
("cover must not count as a content item") is the only thing it genuinely fixes — a
cosmetic concern for a Step 1 form. Revisit only if operators ask for covers that aren't in
the playlist.

> **Decided.** A2 · B1 · C1 — see ADR 0017.

---

## 3. Plan

### Phase 1 — independent of the forks

- [x] **1.1 Unsaved-changes confirmation (AC 26)** — done in `CreatePlaylistPage.tsx`:
      inline amber `Card` confirm (same shape as the resume banner) on `goBack` from step 1,
      gated on `hasDraftContent(draft)`. No new dependency, no new predicate module.
      **Two deliberate departures from the original plan:**
      - **No `beforeunload`.** The store is `zustand/persist` → localStorage
        (`usePlaylistDraftStore.ts:97-153`), so a refresh or tab close loses nothing. The
        prompt would be a false alarm on every reload. The real loss is indirect: one global
        draft for the whole app, overwritten when another playlist is opened with `?id=` —
        which is what the in-app confirm now covers, and what its copy says.
      - **No guard on the stepper's back-navigation.** Step 3→2 keeps the draft; nothing to
        confirm.
      - **No `.check.mts`.** The predicate collapsed to the existing `hasDraftContent`; the
        rest is DOM behaviour, browser-verified.
      *Verified:* `npx tsc --noEmit` clean, `npx eslint` on the file clean, `pnpm build`
      clean. Browser: **passed** — run by the user against
      `docs/playlists/verify-step1-browser-checklist.md` on 2026-08-17, all rows reported
      passing (block A covers AC 26 including A7, which confirms no `beforeunload` fires and
      the draft survives a refresh).
- [ ] **1.2 Playlist Type honesty (AC 10)** — decide per type whether the system can
      actually produce it. Anything that only differs by a label should be removed from
      `PLAYLIST_TYPES` rather than shipped as a dead dropdown option.
      *Blocked on:* confirmation of what `dynamic` / `loop` / `manual` are meant to do.
      Raise with product alongside the forks.
- [x] **1.3 Runtime verification of the already-satisfied rows** — done 2026-08-17. The user
      ran `docs/playlists/verify-step1-browser-checklist.md` end to end and reported every row
      passing. Observed, not just code-correct: AC 1, 2, 3, 18, 19, 20, 23, 24, 25 (the pass
      also covered AC 2 and 24, which the plan had not listed).

### Phase 2 — Owner (AC 14, 15) · ~~planned~~ **CANCELLED 2026-08-17 → ADR 0018**

Owner is not implemented; `created_by` stays the only person field, and AC 14/15 were amended
on the ticket. Nothing in the system reads an owner — no filter, no permission, no routing —
so the column would have cost an R0 migration, an R0 RPC signature change, a membership check
written into plpgsql, and a member-picker UI, all to display a name `created_by` already
displays. `metadata.ownerId` (R2, no migration) was considered and also declined for the same
reason: a stored field with no behaviour behind it. Full reasoning and both rejected options
in `docs/adr/0018-playlist-owner-not-implemented.md`. None of this makes a later Owner more
expensive.

Backend facts verified directly in `Thunder_Core` on 2026-08-17 — recorded here so nobody
re-derives them:

- `media_core.playlists` has **no** `owner_id`. It has `created_by uuid REFERENCES
  public.users(id) ON DELETE SET NULL` (migration `083`).
- `media_playlist_upsert` currently takes **8 parameters** (`086_playlist_draft_save.sql:59`).
  `086:57` already demonstrates the required `DROP FUNCTION IF EXISTS <old signature>` before
  the replace — copy that pattern if any RPC ever gains a parameter.
- The plpgsql functions never inspect `auth.uid()`. They only scope with
  `WHERE tenant_id = p_tenant_id` and trust the caller. **The permission check lives in
  TypeScript**, in `requireMediaTenant()` (`src/lib/core/media.ts`) — so this plan's earlier
  claim that "tenant isolation is in the RPC, not RLS" is only half right: row scoping is in
  the RPC, authorisation is in the route.
- RLS on the table is a single `SELECT` policy (`playlists_read`, migration `048`). No write
  policies — the API uses `service_role`, which bypasses RLS.
- `status` now accepts `draft` / `active` / `inactive` (`086` added `draft`).
- **A members endpoint already exists**: `GET /api/core/v1/tenants/[id]/members`, paginated
  with search. It is gated by `requireTenantAdmin` and `thunder_one_prj` never calls it. Do
  not plan a new one.

### Phase 3 — Output Profile compatibility (AC 12) · after Fork decisions

- [ ] **3.1** Define what "incompatible" means — asset resolution below the playlist's, or
      aspect-ratio mismatch? Needs a product answer; this is the check's entire spec.
- [ ] **3.2** Pure function `checkContentCompatibility(profile, asset)` in
      `src/features/playlists/`, with a `.check.mts`.
- [ ] **3.3** Wire a warning (not a hard block) into `AssetPicker` / `ContentStep`.
      *Dependency resolved 2026-08-17:* `media_assets` **does** have `width` / `height`
      (`048_media_core_schema.sql:27-28`, `integer CHECK (> 0)`, nullable) and
      `media_videos_list` (`056`) already returns both to the frontend. No backend work needed
      — nullable, so the UI must handle assets with no dimensions recorded.

### Phase 4 — Audit log (AC 30) · after Fork decisions

- [ ] **4.1** There is no audit facility for playlists in `Thunder_Core` today. Decide
      scope first: a generic `media_core.audit_log` table, or `updated_by` + timestamps on
      the row. The second is a fraction of the cost and covers "who last touched this".
- [ ] **4.2** Whichever is chosen, the write belongs inside the RPC, not the route — a
      route-level write can be bypassed and can succeed while the RPC rolls back.

### Phase 5 — apply the fork decisions

- [x] **5.4** ADR 0017 records A2 / B1 / C1 with the rejected options.
- [x] **5.1–5.3** Done 2026-08-17 — AC 7, 16, 17, 22, 29 amended on ticket 86d3xxk5b to match
      ADR 0017, verified by reading the description back. Main Flow 9–11 and the Out of Scope
      line "ใช้ Cover เป็น Playlist Content" were amended in the same pass: they restate the
      same three requirements, and leaving them would have made the ticket contradict its own
      acceptance criteria. Product question §3 (Campaign required?) marked decided. The
      pre-edit wording of all nine lines is preserved in a changelog block at the bottom of
      the ticket, and three open product questions (AC 10, 12, 30) were added there.

---

## 4. Constraints

- All `.env` point at production; there is no local stack. Every migration here is **R0** —
  show the SQL and the affected objects, get approval, then dump `prosrc`/schema back and
  diff against the file.
- `CREATE OR REPLACE FUNCTION` does not replace when a parameter is added — it creates an
  ambiguous overload. Any RPC gaining a parameter needs `DROP FUNCTION IF EXISTS <old
  signature>` first.
- The frontend calls **deployed** `Thunder_Core` (`CORE_API_URL` → `thundercore.vercel.app`).
  Backend edits are invisible through the UI until deployed — check `/api/proxy/__config`.
- No test runner by design. `thunder_one_prj` uses `*.check.mts` with bare `node:assert`,
  run as `node <file>.check.mts`. One runnable check per piece of non-trivial logic.
- No new dependencies without asking.
- Commits: no `Co-Authored-By`, no mention of AI tooling. PR stays Draft while any
  verification point is unrun.
