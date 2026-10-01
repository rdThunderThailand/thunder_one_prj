# SESSIONLOG — ticket 09, equal-priority Composition overlap blocks publish (2026-08-27)

Ticket `docs/layouts/tickets/09-equal-priority-overlap-blocks.md` · ADR 0044 §8 · plan
`docs/layouts/plan-overlap-block.md`. Risk R1. Continuation from
`/private/tmp/HANDOFF-layouts-continuation-2026-08-27.md` (recommended-order item 3).

## What changed

### Thunder_Core — `supabase/migrations/20260827150000_equal_priority_overlap_block.sql`

Both functions by `CREATE OR REPLACE`, identical signatures — no `DROP`, no second overload,
grants untouched (verified post-apply: `media_schedule_conflicts` anon/authenticated/service_role;
`media_publication_activate` service_role only; one overload each).

- **`media_schedule_conflicts`** — each conflict object gains **`blocks`**:
  `equal priority rank` AND (`v_this_is_composition` OR `pub.publication_type = 'composition'`).
  `v_this_is_composition` is looked up from `p_publication_id` (guarded for NULL). The existing
  `would_suppress` / `would_be_suppressed` expressions and the recurrence-aware `WHERE` are
  byte-for-byte unchanged, so the "same window logic, not a simplified one" requirement holds by
  construction. `pub.publication_type` added to `GROUP BY` (functionally dependent on the grouped
  PK anyway; listed for style parity with the columns already there).
- **`media_publication_activate`** — selects `priority`; after `v_target_device_ids` is built and
  before the snapshot insert, if the publication has a `media_core.schedules` row it calls
  `media_schedule_conflicts` with that window and raises
  `'Invalid input: cannot activate — equal-priority overlap with <name> (<start> to <end>); …'`
  when any returned element has `blocks = true`. The publication row's `FOR UPDATE` is already
  held; the exception rolls the whole activation back.

### thunder_one_prj

- `types/index.ts` — `ScheduleConflict.blocks: boolean`.
- `publish-eligibility.ts` — `summarizePriorityConflicts` counts `blockingOverlapCount`;
  `hasBlockingConflict = higherPriorityCount > 0 || blockingOverlapCount > 0`. `computeEligibility`
  already routes `hasBlockingConflict` → check[4] `fail` → `canPublish false`; no other change.
- `publish-eligibility.check.mts` — `blocks: false` added to the shared fixture and the existing
  `summarizePriorityConflicts` deepEqual; three new cases (a lone `blocks` conflict fails; a
  `blocks` + advisory mix fails; the summary counts).
- `components/ReviewPublishStep.tsx` — headline gains an "equal-priority layout overlap" variant
  and a Thai sub-line; per-row label gains "same priority + layout; blocks Publish". Existing red
  styling reused. Step 4 (`ScheduleStep.tsx`) advisory display left untouched per the ticket.

## Verified

### Local (thunder_one_prj)
- `node …/publish-eligibility.check.mts` — passes.
- `npx tsc --noEmit` — clean (`.next/dev/types` cleared first).
- `npx eslint` on the four changed files — clean.

### develop `ftfmokgphewzyxzwjitv` — migration applied, then probed against existing tenant
`22222222-2222-2222-2222-222222222222`, device `11110000-…011` ("ThunderOne Screen 01").
Two active Publications already sit on that device: `7b6cb708-…` (composition, normal) and
`18436e18-…` (image/flat, normal).

`media_schedule_conflicts` calls (read-only), overlapping window:

| caller | `7b6cb708` (composition) | `18436e18` (flat) |
|---|---|---|
| `p_priority normal`, `p_publication_id NULL` | `blocks true` | `blocks false` — **equal-priority flat overlap does not block** |
| `p_priority high` | `blocks false`, `would_suppress true` | `blocks false`, `would_suppress true` |
| `p_priority low` | `blocks false`, `would_be_suppressed true` | `blocks false`, `would_be_suppressed true` |
| `p_publication_id = 7b6cb708` (this side is a Composition) | — (self, excluded) | `blocks true` — **either-side rule** |

Differing-priority rows keep the exact advisory shape (`would_suppress` / `would_be_suppressed`
only), matching the checklist "byte-for-byte" item.

`media_publication_activate` — `7b6cb708` set to `draft`, `media_publication_activate(...)` called
inside a `DO` block that catches: it raised (the equal-priority overlap with flat `18436e18`), and
the rollback left the publication `draft` with its **job count unchanged at 3** — no snapshot, no
job, no status flip leaked. `7b6cb708` and `18436e18` both restored to `active` afterwards;
develop is back to its prior state.

### Advisors
`get_advisors(security)` after apply — the only findings naming either function are the
pre-existing `anon` / `authenticated` `SECURITY DEFINER`-executable WARNs on
`media_schedule_conflicts` (that function already had those grants and `SET search_path TO ''`
before this migration). No new finding.

## Verified — browser, step 5, run by the operator against develop

`7b6cb708-…` reverted to `draft` (composition, normal, Screen 01, open-ended schedule); `18436e18-…`
left `active` (flat, normal, Screen 01, open-ended) — a guaranteed equal-priority overlap where one
side is a Composition. Wizard opened at `/media-workspace/publications/create?id=7b6cb708-…`, Next
through to step 5. All four passed:

- headline "Publish blocked (1 equal-priority layout overlap)" in red
- the Thai sub-line for the equal-priority-layout case
- bullet "Browser Verify Ticket 04 G Image 2026-08-26 (normal) — same priority + layout; blocks Publish"
- Publish button disabled

`7b6cb708-…` restored to `active` immediately after; develop back to prior state.

## NOT verified

- The `conflicts` HTTP route was not re-hit; it passes `media_schedule_conflicts` output straight
  through and the new field rides along untyped on the wire, so there is no route change to test.

## Not committed

Nothing committed this session. Changed files:
- `Thunder_Core`: `supabase/migrations/20260827150000_equal_priority_overlap_block.sql`
- `thunder_one_prj`: `types/index.ts`, `publish-eligibility.ts`, `publish-eligibility.check.mts`,
  `components/ReviewPublishStep.tsx`, `docs/layouts/plan-overlap-block.md`, this log

## Next

1. Production apply of `20260827150000_equal_priority_overlap_block.sql` — separate R0 ask, same
   file verbatim. Production has 0 composition Publications, so the blocking path is inert there
   until one is published; the change is a pure `CREATE OR REPLACE` of two functions.
3. Commit — `Thunder_Core` migration on its own; `thunder_one_prj` frontend + plan + log.
