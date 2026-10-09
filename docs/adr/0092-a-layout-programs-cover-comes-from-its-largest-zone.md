# A Layout Program's cover comes from its largest zone

**Status:** accepted · 2026-10-09
**Source:** issue #230 (follow-up to the 2026-10-06 Calendar review); revised after a plan review the same day
**Related:** `0085-the-calendar-shows-the-effective-schedule-one-lane-per-channel.md` (Rev.2 cover follow-up), `0091-asset-trash-warns-with-usage-and-permanent-delete-names-blockers.md`

## Context

Every Program cover (Now & Next, Calendar, Programs list) comes from `media_core.publication_cover`
(Core `20261006130000_layout_program_cover.sql`; live body identical on develop and prod, md5
`22fe42b2cd6c9e506141f43df98c6f1b`, 2026-10-09). A Layout Program takes the cover of its **first** zone
(`ORDER BY layout_zones.position`) whose Playlist has items. A ticker or logo strip often comes first, so
the Program shows a strip instead of the main content.

Issue #230 proposed rendering a picture of the whole Layout on save and storing it as the cover. A review
of that plan found it needs: a canvas renderer matching the preview's geometry and fit rules, an upload
route, two columns, a freshness rule over three `updated_at` sources, out-of-order-save protection
(revision-guarded stamp), a pre-render refetch of every bound Playlist, a skip-on-any-missing-image rule
(expired signed URLs, trashed Assets) and storage cleanup on permanent delete. Each of those exists only
to stop a stale or degraded picture from hiding a correct fallback.

## Decision

`publication_cover` picks the Layout's **largest** zone (by `width * height`) whose Playlist has items,
instead of the first; ties keep the old order (`position`, then `composition_zones.id`). Everything
else — the Playlist rule (chosen cover, else first item), the thumbnail/file fallback, signature, grants,
callers — is unchanged.

`layout_zones.width`/`height` are `numeric NOT NULL` in percent of the frame, so the product compares
zones within one Layout directly.

## Considered options

- **Rendered picture of the whole Layout** (issue #230's option b) — truest picture, but the machinery
  above for a thumbnail. Deferred: revisit only if the largest-zone cover proves not to be enough.
- **First zone** (status quo) — the reported problem.
- **User-picked cover** (option c) — out of scope.

## Consequences

- A Layout whose main content is not its largest zone still shows the wrong zone. Accepted; the operator
  can resize or the rendered-cover option can be revisited.
- No new storage, routes or columns. Rollback is the previous function body
  (`supabase/rollback/<ts>_layout_cover_largest_zone.rollback.sql`).
- Takes effect for every existing Layout Program at once, on the branch where it is applied.
