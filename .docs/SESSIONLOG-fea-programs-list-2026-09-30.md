# Session log — FE-A Programs list · 2026-09-30

## Done
- Programs list rebuilt on `GET /media/publications` paged contract (BE-1). New: `publication-list-query.ts`, `publication-list-display.ts` (+ `.check.mts`), `PublicationKpiCards`, `PublicationsFilterBar`, `PublicationsTable`, `PublicationRowActions`; `PublicationsListPage` rewritten (295 lines).
- Old callers (`PlaylistPanelTabs`, `OverviewDashboard`) keep `fetchPublications`.

## Decisions
- Created-by filter hidden (no readable user list). Delivery label wording fixed after browser check ("Delivered" on 0/1 playing was misleading → "Not playing yet" / "Partly playing" / "Ended").
- Open/View → existing detail page until FE-B.

## Verification
- Layer: browser on localhost:3000 via Core :3001 (develop DB). Filters, paging, empty state, delete-confirm dialog OK. Action execution not run (would touch real develop rows).

## Open
- Uncommitted; Draft PR → `dev` pending (ask Thai/English).
- Radix Select needs pointerdown to open in automation — use JS PointerEvent, not plain click.
