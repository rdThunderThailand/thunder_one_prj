# Plan — ticket 09, equal-priority Composition overlap blocks publish

Ticket `docs/layouts/tickets/09-equal-priority-overlap-blocks.md` · ADR 0044 §8 · spec story ~29.
Risk: R1 (cross-file, one new migration). Production apply is a separate R0 ask.

## Decision — no signature change, derive "this side" from the id

`media_schedule_conflicts` keeps its 8-arg signature and `media_publication_activate` its 3-arg one.
Both change by `CREATE OR REPLACE` only — no `DROP`, so grants and the "no second overload" rule
hold for free.

"Either side carries a Composition":
- **other side** — `pub.publication_type = 'composition'`, already in scope.
- **this side** — looked up from `p_publication_id` inside the function (`v_this_is_composition`).
  `NULL` id (step-4 advisory on an unsaved draft) → treated as not-composition. The real gate —
  step 5 and `media_publication_activate` — always has a saved id (`ReviewPublishStep.tsx:96`
  "publicationId always exists here"), so nothing load-bearing depends on the null case.

## SQL — `20260827150000_equal_priority_overlap_block.sql`

### `media_schedule_conflicts`
- new local `v_this_is_composition boolean` — `SELECT publication_type = 'composition' FROM
  media_core.publications WHERE id = p_publication_id` (guarded by `p_publication_id IS NOT NULL`).
- each conflict object gains **`blocks`**:
  `v_priority_rank = <other rank>` AND (`v_this_is_composition` OR `pub.publication_type =
  'composition'`).
  Window overlap + shared device + recurrence logic is the existing `WHERE` — untouched, so the
  "same window logic, not a simplified one" checklist item is met by construction.
- `would_suppress` / `would_be_suppressed` expressions unchanged, byte for byte.

### `media_publication_activate`
- `SELECT` list gains `priority` (→ `v_priority`).
- after `v_target_device_ids` is built and before the snapshot insert: if a `media_core.schedules`
  row exists for the publication, call
  `public.media_schedule_conflicts(p_tenant_id, p_publication_id, v_target_device_ids,
  s.starts_at, s.ends_at, s.recurrence, s.timezone, v_priority)` and, if any element has
  `blocks = true`, `RAISE EXCEPTION 'Invalid input: cannot activate — equal-priority overlap with
  %'` naming each blocking publication and its `starts_at..ends_at`.
- transaction-local: the `FOR UPDATE` on the publication row is already held, and the exception
  rolls the whole activation back.

## Frontend — `thunder_one_prj`

- `types/index.ts` — `ScheduleConflict.blocks: boolean`.
- `publish-eligibility.ts` — `summarizePriorityConflicts` counts `blockingOverlapCount`
  (`c.blocks`) and `hasBlockingConflict` becomes `higherPriorityCount > 0 || blockingOverlapCount
  > 0`. `computeEligibility` already routes `hasBlockingConflict` → check[4] `fail` → `canPublish
  false`; no further change.
- `publish-eligibility.check.mts` — add: one `blocks` conflict fails; a plain equal-priority
  conflict still passes; mixed set fails.
- `ReviewPublishStep.tsx` — headline and per-row label handle `blocks`
  ("same priority + layout; blocks Publish"), reusing the existing red styling.

## Verify

1. `publish-eligibility.check.mts` passes (`node …`).
2. `tsc` + `eslint` on changed files (`.next/dev/types` cleared first).
3. Migration applied to **develop**; `pg_get_functiondef` diffed against the file, one overload
   each, grants re-checked with `has_function_privilege`, advisors clean.
4. Scratch-tenant SQL probe on develop: equal-priority composition overlap → `blocks`; equal
   flat overlap → no `blocks`; differing-priority composition overlap → advisory shape only;
   `media_publication_activate` raises on the blocking case and commits on the others.
5. Browser at step 5 against develop (ask first): the block renders, names the other Publication
   and its window, Publish disabled.
6. Production apply — separate R0 ask, same file verbatim.
