# my-work

Cross-App "what's assigned to me" rollup (landing page at `/my-work`). No cross-App data-sourcing design exists yet (docs/adr/0033-thunder-one-shell-launcher-not-dropdown.md, consequence #11), so `mock-data.ts` is a self-contained mock queue rather than one derived from other features' mock data.

- `components/` —
  - `MyWorkPage` — the landing page, composing everything below
  - `MyWorkHeader` — title + Customize button
  - `StatTilesRow` — the five top-line tiles (Tasks / Approvals / Inbox / Drafts / Delegated to Me)
  - `WorkQueue` — the tab-filtered, grouped (Overdue / Due Today / Upcoming) work list; tabs are the one real filter, "Sort by" is decorative
  - `ScheduleCard` — today's schedule, same "static preview, no calendar backend" pattern as `mission-control`'s `TodayScheduleCard` (kept separate rather than shared — different feature, different mock content)
  - `WorkSummaryCard` — a `DonutChart` breakdown of the queue by due-date bucket
  - `QuickFiltersCard` — decorative filter chips (not wired to `WorkQueue`'s state yet)
  - `RecentlyCompletedCard` — a short list of recently closed items
- `mock-data.ts` — `workItems`, `workStatTiles`, `todaysSchedule`, `workSummary`, `quickFilters`, `recentlyCompleted` — all placeholder, no backend yet
