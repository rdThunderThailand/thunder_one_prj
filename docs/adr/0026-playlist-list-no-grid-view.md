# 0026 — Playlist List has no Grid view; List/table is the only view

## Context

Ticket [86d3xxp9k](https://app.clickup.com/t/86d3xxp9k) ("SUBTASK 4 – Search, Filters & View
Controls") nests four sub-cards, one of which is
[86d3xxpa1](https://app.clickup.com/t/86d3xxpa1) "4.4 List and Grid View". Neither card carries a
description or acceptance criteria beyond the title. The parent screen ticket
[86d3xxp7z](https://app.clickup.com/t/86d3xxp7z) AC 12 says "List และ Grid ใช้ Dataset เดียวกัน" —
it assumes a Grid view exists and constrains it, but does not itself require one.

The list page was actually built against a different ticket, 86d3xxp90 ("1.3 Page
Initialization"), in the session recorded at
`.docs/SESSIONLOG-playlists-overview-2026-08-19.md`. That session's plan
(`/Users/arty/.claude-thunder/plans/1-2-share-with-eager-pearl.md:19`) trimmed the filter set
against the mock ("ตัด Channel/Location และ More Filters") but never discussed a Grid/card view —
the mock it was built from only showed a table. `PlaylistsTable.tsx` is the only rendering of the
dataset; there is no card layout, no view-mode toggle, and no state for it anywhere in
`src/features/playlists/`.

Verifying ticket 86d3xxp9k against the shipped code (2026-08-19) surfaced this gap: 4.4 was never
explicitly scoped in or out, unlike 4.3 More Filters which the plan already covered. Asked
directly, the product owner confirmed Grid view should be cut from scope the same way More Filters
was.

## Decision

**No Grid view is built. The Playlists list page has a single view: the table
(`PlaylistsTable.tsx`).** Ticket 4.4 is satisfied by this decision, not by a card layout. Parent
ticket 86d3xxp7z AC 12 is moot as a result — there is no second view for the dataset to stay
consistent with.

## Consequences

No code changes. If a Grid view is requested later, it is new work: a card component, a view-mode
toggle in `PlaylistsListPage.tsx`, and it would reuse the same filtered dataset from
`list-filtering.ts` that the table already consumes — nothing there needs to change to support a
second view.

Anyone reading ticket 86d3xxp9k or its 4.4 sub-card without this ADR will look for a Grid view the
implementation knowingly does not have.
