# Layout Trash is blocked by live Programs

**Status:** accepted · 2026-09-08
**Amends:** `0056-nested-feature-folders-and-trash.md` for Composition/Layout Trash behavior

## Context

The Layout library calls Compositions “Layouts” and Publications “Programs”. Today
`media_composition_trash` reports how many Publications reference a Composition but still moves
it to Trash. The list UI therefore cannot implement the approved two-state confirmation safely:
an unused Layout may move to Trash, while a Layout used by a live Program must stay available
until the operator removes or replaces it there.

The list's `usageCount` is useful presentation data but is not an action-time guard. A Program
can start using the Layout after the list loads and before the operator confirms the action.

## Decision

1. A Layout is **in use** when at least one tenant-owned Publication that references its
   Composition is `draft`, effectively `scheduled`, or effectively `active`. Ended and cancelled
   Publications do not block Trash.
2. `media_composition_trash` re-evaluates that rule in the same database operation that would set
   `deleted_at`. If blockers exist it returns them and does not mutate the Composition.
3. A tenant-scoped read returns the blocking Programs for one Composition with `name`, effective
   `status`, `startsAt`, and `endsAt`. The UI calls them Programs; API and database identifiers
   remain Publications.
4. The Layout modal has two states:
   - no blockers: confirm `Move to Trash` and explain that Restore remains available;
   - blockers: do not offer Trash, show `View Programs`, then display the blocking Program list.
5. `usageCount` selects the initial visual state, but opening the blocker list and confirming Trash
   use current server data. The Core guard remains authoritative under races or stale clients.

## Rejected alternatives

- **Warning but allow Trash:** contradicts the approved operator rule and leaves active authoring
  references pointing at hidden content.
- **Frontend-only blocking:** stale and bypassable by another client or a direct API call.
- **Load every Publication and filter in the browser:** transfers unrelated tenant data and scales
  with the whole catalogue instead of this Layout's usage.

## Consequences

- Moving an in-use Layout to Trash becomes a rejected, non-mutating action.
- The frontend needs one small blocker-list view and Core needs one tenant-scoped read contract.
- Applying the migration and deploying Core remain separate R0 actions requiring explicit approval.
