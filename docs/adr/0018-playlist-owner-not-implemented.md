# 0018 — Playlist Owner is not implemented; `created_by` is the only person field

## Context

Ticket [86d3xxk5b](https://app.clickup.com/t/86d3xxk5b) AC 14 requires Owner and Created By to be
two separate fields, and AC 15 requires the Owner to belong to the same workspace as the playlist.
`docs/playlists/plan-create-playlist-step1.md` Phase 2 planned an `owner_id` column to satisfy
them. Before starting that work the backend was checked directly rather than taken from the plan
(`Thunder_Core`, verified 2026-08-17):

- `media_core.playlists` has **no** `owner_id` column — no migration mentions one.
- It does have `created_by uuid REFERENCES public.users(id) ON DELETE SET NULL`, added in
  `083_playlist_metadata_created_by_cover.sql`.
- `media_playlist_upsert` currently takes **8 parameters** (`086_playlist_draft_save.sql:59`).
  Adding a ninth requires dropping the old signature first — `086` itself does exactly that at
  line 57, so the pattern is established, but it is still an R0 change against production.
- The plpgsql functions never inspect `auth.uid()`. They only scope rows with
  `WHERE tenant_id = p_tenant_id` and trust the tenant id handed to them. The actual permission
  check lives in TypeScript, in `requireMediaTenant()` (`src/lib/core/media.ts`). An `owner_id`
  parameter would therefore need its own membership check written into the RPC to satisfy AC 15 —
  nothing existing would validate it.
- A members endpoint already exists: `GET /api/core/v1/tenants/[id]/members`, paginated with
  search. It is gated by `requireTenantAdmin`, and `thunder_one_prj` never calls it. A member
  picker for a non-admin author would first require deciding whether to relax that gate — an
  unmade decision of its own.

The question that decides the feature is what Owner does that `created_by` does not. Today:
nothing. No "my playlists" filter reads it, no permission depends on it, no notification or
approval routing exists. The one genuine distinction is handover — `created_by` is immutable
history, an owner is current responsibility and can be reassigned when someone leaves a team —
but nobody has asked for reassignment.

## Decision

**Owner is not implemented. `created_by` stays the only person field on a playlist, and AC 14 is
amended to say so.** AC 15 is amended to cover Campaign and Tags only. The Owner mentions in the
ticket's Description, Objective, In Scope, and Main Flow step 3 are amended in the same pass,
since leaving them would contradict the amended criteria. Plan Phase 2 (2.1–2.4) is cancelled.

This follows the same reasoning as ADR 0017: where the ticket describes behaviour the system does
not have and nothing depends on, the ticket is corrected rather than the system grown. The
difference is that 0017 resolved toward shipped code; here the resolution is toward code that was
never written and, on inspection, has no consumer.

Nothing about this decision makes a later Owner more expensive. The migration, the RPC parameter,
and the picker all cost the same whenever they are done.

## Rejected: `metadata.ownerId` in the existing jsonb column

`metadata` is `jsonb NOT NULL DEFAULT '{}'` and `media_playlist_upsert` already accepts
`p_metadata`, so an owner id could be stored with no migration, no signature change, and no
`DROP FUNCTION` — an R2 change rather than R0. It would also match how this feature already stores
everything else: `campaignId`, `coverAssetId`, tags, resolution and frame rate all live in
`metadata` today, so an owner would not be an odd one out. AC 15's workspace check would go in the
route's TypeScript, alongside the permission check that already lives there.

It was declined because it still buys a stored field that nothing reads, and it carries two
ceilings that a column does not: no foreign key, so the id dangles when a user is deleted (where
`created_by` is `ON DELETE SET NULL`), and "which playlists does X own" becomes a jsonb scan. If
Owner is later confirmed as a real requirement, this is the cheapest first step — the column
version backfills from `metadata` — but taking the step now means maintaining a field with no
behaviour behind it.

## Rejected: the real `owner_id` column (plan Phase 2 as written)

The correct end state if Owner ever acquires behaviour: a proper FK, indexable, cleaned up on user
deletion. It was declined for now because the full cost is an R0 migration, an R0 RPC signature
change with the overload trap, a membership check written into plpgsql, a member-picker UI, and an
unmade decision about the `requireTenantAdmin` gate on the members endpoint — all to display a
name that `created_by` already displays.

Revisit when any of these becomes real: reassigning responsibility for a playlist, filtering or
permissioning by owner, or routing an approval or notification to one.

## Consequences

No code changes. `PlaylistSummary` and `PlaylistDetailPanel` keep showing a single Created By row.

Plan Phase 2 is cancelled; the plan's remaining open work is Phase 3 (AC 12, still blocked on
product defining "incompatible") and Phase 4 (AC 30, audit scope). The verified backend facts
above are recorded in the plan so the next person does not re-derive them — in particular that the
members endpoint already exists, which two earlier sessions planned to build from scratch.

Anyone reading the ticket without this ADR will read an Owner requirement the implementation
knowingly does not meet.
