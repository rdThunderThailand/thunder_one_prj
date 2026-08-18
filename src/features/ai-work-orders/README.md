# ai-work-orders

Technician's "My Work" dashboard for Asset Intelligence (requirement doc §4.4) — today's schedule, a mini calendar, and a work summary strip. Namespaced `ai-` per `docs/adr/0023-asset-intelligence-feature-namespacing.md`.

> R&D placeholder — mock data, no backend yet. A real version reads `GET /api/v1/work-orders?assignee_id=me&date=`.

- `components/` — `MyWorkPage`, `MiniCalendar` (static, non-interactive placeholder — a real calendar needs click-to-filter per requirement doc §2.4, not built yet)
- `mock-data.ts` — placeholder schedule items and today's summary counts
