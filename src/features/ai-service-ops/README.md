# ai-service-ops

Thunder Care's "Customer Health" / Service Operations dashboard for Asset Intelligence (requirement doc §4.6) — customer attention list and today's work-queue summary. Namespaced `ai-` per `docs/adr/0023-asset-intelligence-feature-namespacing.md`.

> R&D placeholder — mock data, no backend yet. Real data would come from `GET /api/v1/service/work-queue`, `GET /api/v1/service/sla-status`, `GET /api/v1/service/customers/{id}/health`.

- `components/` — `ServiceOpsPage`, composing `StatTile`/`Card` from `components/ui`. Its Work Queue card reads `ai-issues`'s mock data directly (not duplicated into this feature's own `mock-data.ts`) — that's where Employee's "Report a problem" (EMP-02) is meant to route to (TCARE-01), distinct from the Customer Attention list below it (external MSP customers, multi-tenant mode, TCARE-05).
- `mock-data.ts` — placeholder stat tiles, customer attention list, today's work summary
