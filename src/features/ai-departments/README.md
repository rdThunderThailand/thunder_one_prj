# ai-departments

Department Manager's "My Department" dashboard for Asset Intelligence (requirement doc §4.3) — assets and requests scoped to the manager's own department. Namespaced `ai-` per `docs/adr/0023-asset-intelligence-feature-namespacing.md`.

> R&D placeholder — mock data, no backend yet. A real version would scope `features/ai-assets` by `department_id` rather than holding separate fake rows here.

- `components/` — `DepartmentPage`, composing `StatTile`/`Card` from `components/ui`
- `mock-data.ts` — placeholder stat tiles, needs-attention list, and requests summary
