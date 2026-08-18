# ai-work-orders

Technician's dashboard for Asset Intelligence (requirement doc §4.4). Namespaced `ai-` per `docs/adr/0023-asset-intelligence-feature-namespacing.md`.

> R&D placeholder — mock data, no backend yet. A real version reads `GET /api/v1/work-orders?assignee_id=me&date=`.

- `components/` —
  - `MyWorkPage` — today's compact schedule + a mini calendar preview + today's summary (the overview/landing page)
  - `AssignedPage` — every work order assigned to the technician, across all dates, grouped In Progress → Overdue → Assigned → Completed
  - `CalendarPage` — full interactive month calendar (click a day → filters the schedule list below, no reload, per requirement doc §2.4's acceptance criteria) — `MiniCalendar` on My Work is the compact, non-interactive preview of the same grid
  - `WorkOrderCard` — shared detail card with a real Start → In Progress → Complete toggle (local state only, resets on reload — same discipline as every other interactive action this sprint, see `ai-issues/components/ReportProblemForm.tsx`'s comment), used by both `AssignedPage` and `CalendarPage`
- `calendar-grid.ts` — the shared August grid (`WEEKS`, `WEEKDAY_LABELS`, `TODAY_DAY`) used by both `MiniCalendar` and `CalendarPage`, so they don't drift apart
- `mock-data.ts` — `mockWorkOrders` (spans several dates, not just "today"), `todaySummary` (derived from it), and `mockTechnicians` (read by `ai-service-ops`'s Work Queue dispatch picker)

**Routing note**: `AssignedPage`/`CalendarPage` route under `/asset-intelligence/work-orders/**` (not top-level siblings) — `resolveAssetIntelligenceNav` (`src/config/nav/asset-intelligence.tsx`) only reads the URL's third path segment to pick a nav, so any page beyond a persona's landing route must nest under that persona's own segment or the sidebar silently falls back to the CEO nav (this bit Employee's pages once — see that file's own comment).
