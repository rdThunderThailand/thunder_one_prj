# SESSIONLOG — Create Playlist Step 1: unsaved-changes guard (AC 26)

**Date:** 2026-08-17 · **Branch:** `feat/playlist` · **Plan:** `docs/playlists/plan-create-playlist-step1.md` Phase 1.1

## What was asked

Read the Step 1 plan and run the `plan-handoff` loop (plan → spec → delegate to `agy` → verify).

## Why nothing was delegated

Phase 1.1 is the only unblocked item in the plan — 1.2 / 3.1 / 4.1 wait on product answers,
2.1 is an R0 migration, 5.1–5.3 are ticket edits with no code. 1.1 came out at ~19 lines in a
single file, so the standalone spec `agy` would need was longer than the code it would produce.
Per the delegation rule (spec shorter than the resulting code), it was done in-session instead.
Confirmed with the user before proceeding.

## What changed

`src/features/playlists/components/CreatePlaylistPage.tsx`

- `confirmLeave` state; `goBack()` at step 1 shows an inline amber `Card` confirm when
  `hasDraftContent(draft)` instead of pushing to `/playlists` straight away.
- Buttons: **อยู่ต่อ** (dismiss) / **ออกโดยไม่บันทึก** (push). Same shape as the existing resume
  banner 15 lines above — no modal primitive exists in `src/components/ui/` and none was added.

## Three deliberate departures from the plan

1. **No `beforeunload`.** The draft store is `zustand/persist` → localStorage
   (`usePlaylistDraftStore.ts:97-153`, key `thunderone.playlists.create-draft.v2`), so a refresh
   or tab close loses nothing. A "you will lose your changes" prompt would fire on every reload
   and be false every time.
   The loss that *is* real: one global draft for the whole app, reset and overwritten when
   another playlist opens with `?id=`. That is what the in-app confirm covers, and the copy says
   exactly that rather than claiming data loss.
2. **No guard on stepper back-navigation.** Step 3→2 keeps the draft; nothing to confirm.
3. **No `.check.mts`.** The predicate collapsed to the existing `hasDraftContent`, already
   covered. The remainder is DOM behaviour, which a node assert cannot observe.

## Verification

- `npx tsc --noEmit` — clean
- `npx eslint src/features/playlists/components/CreatePlaylistPage.tsx` — clean
- `pnpm build` — clean, 13/13 pages, `/playlists/create` builds
- **Browser — passed, run by the user, not by me.** They walked
  `docs/playlists/verify-step1-browser-checklist.md` end to end on 2026-08-17 and reported
  every row passing. That covers AC 26 (block A, including A7: no `beforeunload` prompt on
  refresh and the draft survives it) plus AC 1, 2, 3, 18, 19, 20, 23, 24, 25.
  The report is the user's observation; I did not drive the browser myself.

## Phase 5.1–5.3 — ticket amended (same session)

Ticket 86d3xxk5b description rewritten to match ADR 0017. AC 7, 16, 17, 22, 29 replaced.
Main Flow 9–11 and the Out of Scope line "ใช้ Cover เป็น Playlist Content" were amended too —
they restate the same three requirements, and leaving them would have left the ticket
contradicting its own acceptance criteria. Product question §3 (Campaign required?) marked
decided. A changelog block at the bottom preserves the pre-edit wording of all nine lines, and
three open product questions (AC 10, 12, 30) were added.

Verified by reading the description back from ClickUp after the write. The first attempt was
blocked by the permission classifier; it went through on the user's explicit retry.
Ticket status left at `to do` — not ours to move.

## Phase 2 cancelled — ADR 0018 (same session)

Before starting the `owner_id` migration, the backend was checked directly instead of trusted
from the plan. A Sonnet subagent gathered the facts; every load-bearing claim was then re-grepped
in `Thunder_Core` first-hand before being acted on.

Findings: no `owner_id` anywhere; `created_by` exists (083); `media_playlist_upsert` is at 8
parameters (`086:59`) with the `DROP FUNCTION` pattern already demonstrated at `086:57`; the
plpgsql never inspects `auth.uid()` — authorisation is in `requireMediaTenant()` in TypeScript,
the RPC only does row scoping; RLS is a single SELECT policy; `status` now accepts `draft`.
**A members endpoint already exists** (`GET /api/core/v1/tenants/[id]/members`), admin-gated and
never called by the frontend — the third time a session has nearly built something already there.

That reframed the question from "how do we add owner" to "does owner need to exist". Nothing reads
an owner: no filter, no permission, no notification. The user chose not to implement it.
`docs/adr/0018-playlist-owner-not-implemented.md` records the decision and both rejected options
(`metadata.ownerId` as an R2 alternative, and the real column). AC 14 and 15 amended on the ticket
in the same pass as the Owner mentions in Description, Objective, In Scope, and Main Flow 3.

Side effect: Phase 3.3's unchecked assumption is now checked — `media_assets` does have
`width`/`height` and `media_videos_list` already returns them, so Phase 3 needs no backend work.

## Also touched

- `docs/playlists/plan-create-playlist-step1.md` — 1.1, 1.3, 5.1–5.3 checked off; Phase 2
  cancelled; Phase 3.3's dependency resolved; verified backend facts recorded inline.
- `docs/playlists/verify-step1-browser-checklist.md` — new.
- `docs/adr/0018-playlist-owner-not-implemented.md` — new.

## Next

Nothing left that does not need someone else. Blocked on product: 1.2 (what `dynamic` / `loop` /
`manual` mean, AC 10), 3.1 (definition of "incompatible", AC 12), 4.1 (audit scope, AC 30) — all
three are written on the ticket as open questions.

No R0 work remains: the only migration this plan called for was `owner_id`, now cancelled.

Uncommitted: this branch has the 1.1 change plus ~15 files of earlier unrelated work in the tree.
Nothing has been committed or pushed this session.
