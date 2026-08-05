# 0003 — Optimistic locking for publication drafts via `revision`

## Context

Reverses the 2026-08-04 "YAGNI" call on `docs/publications/plan-revision-409.md` §3 item A.
That call gated the work on evidence ("wait until someone reports losing data"). The gate was
lifted deliberately on 2026-08-05 for two reasons that are not evidence of past loss:

- The team is growing and concurrent editing of one draft is expected, not observed.
- Login/identity wiring against `Thunder_Core` is planned, which makes multiple named editors
  a real thing rather than a shared app key.

State verified from prod and from both codebases, not from documents:

- `media_core.publications` has **no** `revision` / `version` / `idempotency_key` column.
  27 publications, 3 drafts.
- The media API has **no concept of a user**. `Thunder_Core/src/lib/core/media.ts:11`
  `requireMediaApp` authenticates the *application* via `x-api-key` and returns only
  `{ applicationId, tenantId, admin }`. The frontend proxy does forward a user Bearer token
  (`src/app/api/proxy/[...path]/route.ts:41`, cookie `to_at`), and the media API ignores it.
  `activate/route.ts` passes `p_actor_id: null` hardcoded; `published_by` is NULL on all 27 rows.
  `src/features/auth/services/auth.service.ts` says so itself: "No backend exists yet".
- `persistDraft` (`src/features/publications/hooks/usePublishDraft.ts:174`) writes the same
  publication row up to **three times in sequence** per save: `media_publication_upsert` →
  `media_publication_set_content` → `media_publication_set_schedule`.
- Error plumbing is prefix-driven at both hops. `media.ts:29`
  `EXPECTED_ERROR = /^(Invalid input:|not found:|Unauthorized|Permission denied|Already )/` —
  anything else is swallowed into `'Media operation failed'` → 500. Then `api-utils.ts:99`
  maps any message containing `already`/`Already` to **409**.
- Consequently 409 is already reachable today, and not from any conflict:
  `media_publication_activate` raises `'Already active: …'` (correctly intercepted by
  `classifyApiError`'s `isAlreadyActive` guard *before* the 409 branch), and
  `media_video_delete` raises `'Already in use: video is still referenced by a playlist'`,
  which would fall through to the `conflict` branch and tell the user to reload for a problem
  reloading cannot fix. Latent only — no frontend call site reaches video delete today.
- `src/features/publications/api-error.ts` already classifies 409 → `kind: "conflict"`, but
  **nothing consumes that kind** — `usePublishDraft` reads only `.message`.

## Decision

Add `revision integer NOT NULL DEFAULT 1` to `media_core.publications` and use it as the
concurrency token.

**Rejected — reuse `updated_at` as the token (If-Unmodified-Since style).** It looks free
because the column exists, but `media_publication_set_schedule` does not bump `updated_at` at
all, so a migration is needed either way; and two writes landing in the same `now()` are
indistinguishable. Paying the same migration cost, the correct-on-edge-cases option wins.

**Scope of enforcement — check on the first write, bump on all three.** Only
`media_publication_upsert` gains `p_expected_revision` and rejects a mismatch. All three RPCs
bump `revision`.

The alternative (every RPC checks, each returns the new revision, the client threads it
through calls 2 and 3) closes a ~200ms window *inside a single save cycle* at the cost of three
signature changes and client-side revision threading. It is rejected as disproportionate: a
competing editor who touches *any* part of the draft bumps `revision`, so our first call —
`upsert`, which always runs — collides and stops the save cycle before calls 2 and 3 execute.
Checking on the first write catches every conflict that started before the save cycle did.

This also avoids a self-inflicted 409: with per-row revision and a naive "every RPC checks",
the client holds `revision=N`, call 1 succeeds and bumps to N+1, and call 2 sends the now-stale
`N` — conflicting with itself while no one else touched anything.

**Signalling — reuse the existing `Already ` prefix.** The RPC raises
`'Already modified: draft was changed elsewhere'`. This passes `EXPECTED_ERROR` and maps to 409
through the untouched shared handler. `Conflict:` was rejected precisely because it matches
neither pattern and would arrive as a 500.

`classifyApiError` narrows `kind: "conflict"` to match that message, **not** bare status 409 —
which simultaneously fixes the latent `media_video_delete` mis-fire described above. The
`isAlreadyActive` guard keeps running first, so `'Already active'` stays `already-active`.

**Conflict UX — two actions, no merge UI.** An inline banner (same amber pattern as the Cancel
confirmation, this codebase has no Dialog library) offering:

- **โหลดใหม่** — re-fetch via `fetchPublication(id)` and overwrite the local store. Discards the
  user's unsaved edits, so it is never automatic.
- **บันทึกทับ** — re-read the current `revision`, then re-send the save with it. Deliberate
  last-write-wins with informed consent.

Reload-only was rejected: it converts silent data loss into loud data loss, which is not what
this ADR is for. A side-by-side diff was rejected as disproportionate for Phase 1.

**Draft shape — bump the persisted key.** `revision` enters the persisted draft, so
`thunderone.publications.create-draft.v3` becomes `…v4`
(`src/features/publications/store/usePublicationDraftStore.ts:138`). Without the bump, an
existing draft rehydrates into a shape the new code does not expect.

**Identity stays out.** Optimistic locking prevents the lost update regardless of who the
editors are; identity only upgrades the message from "someone else" to a name. Wiring user
identity through `requireMediaApp` and every `p_actor_id` call site (note
`media_publication_set_schedule` has no `p_actor_id` parameter at all) is a separate, larger
piece of work and is not a prerequisite for this one.

`CREATE OR REPLACE FUNCTION` does not replace a function when a parameter is added — it creates
an overload and makes existing calls ambiguous. `media_publication_upsert` gains a parameter, so
its migration must `DROP FUNCTION IF EXISTS` the old 15-argument signature first. The other two
RPCs keep their signatures and can be replaced directly.

## Consequences

Every future write path to `media_core.publications` must bump `revision`, or it becomes a
silent hole in the lock — a new RPC that forgets is indistinguishable from no protection.

The residual unprotected window is the interval between `upsert` and `set_schedule` within one
save cycle. This is accepted and recorded here so it is not rediscovered as a bug.

`kind: "conflict"` is now reachable and consumed. Any *other* backend message starting with
`Already ` will be classified as `rejected`, not `conflict` — a new one that genuinely means
"conflict" must opt in by matching the agreed message, not by returning 409.
