# people/policy

The company policy library (`/people/policy`) — HR Manager's "นโยบาย" page. Nests under `people/`
per `docs/adr/0034-feature-folders-nest-under-app.md`.

> R&D placeholder — mock data, no backend yet.

- `components/`
  - `PolicyPage` — a plain Server Component; unlike `people/new-hires`/`people/departures` this
    mockup has no row-selection/detail-panel, so no client state is needed at all
  - `PolicyHeader` — title + Export/Create-policy actions, both inert
  - `PolicyStatTilesRow` — 5 tiles (total + one per `PolicyStatus`)
  - `PolicyFilterBar` — search + 4 dropdown filters + grid/list toggle, all inert, same convention
    as `people/personnel`'s `PersonnelFilterBar`
  - `PolicyCategoriesCard` — the left-rail category list (`policyCategories`), inert
  - `PolicyTable` — the policy list (title/description, category, status badge, version, published
    date, publisher). View/kebab actions are both inert — no policy detail page exists yet
  - `PolicyTableControls` — decorative pagination (48 items / 5 pages), placed **below** the table
    here, unlike `people/personnel`'s (above) — matches this page's own mockup
- `mock-data.ts` — `policyStatTiles` and `policyCategories`' counts are both copied straight from
  the mockup (48/42/5/1/2 and the 8 category counts summing to 48); neither is derived from
  `policyRows` (8 rows) — same "mockup number vs. small sample" gap `people/personnel`'s
  mock-data.ts documents for itself.

**Not built yet**: every dropdown filter, search, sort, pagination, category click-through, row
view/edit, Export, and Create Policy. No policy detail/reader page exists yet either.
