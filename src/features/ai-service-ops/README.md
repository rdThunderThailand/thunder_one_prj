# ai-service-ops

Thunder Care's "Customer Health" / Service Operations dashboard for Asset Intelligence (requirement doc §4.6) — customer attention list and today's work-queue summary. Namespaced `ai-` per `docs/adr/0023-asset-intelligence-feature-namespacing.md`.

> R&D placeholder — mock data, no backend yet. Real data would come from `GET /api/v1/service/work-queue`, `GET /api/v1/service/sla-status`, `GET /api/v1/service/customers/{id}/health`.

- `components/` — `ServiceOpsPage` (Overview — compact cards, each with a "View all" link into the full page below), `CustomersPage` (full customer list), `WorkQueuePage` (full issue queue with a Dispatch action — pick a technician from `ai-work-orders`'s `mockTechnicians`, real local confirmation state, no live mutation — see `DispatchControl`'s comment), `ReportsPage` (full detail per reported issue: reporter, asset, date, status). The latter three route under `/asset-intelligence/service-ops/**` (not top-level siblings) specifically to avoid colliding with other personas' own "Reports"/"Settings" nav items if those ever get real pages.
- `status-colors.ts` — badge/color maps shared by all four page components, so they don't each redefine the same `IssueStatus`/customer-severity → color mapping
- `mock-data.ts` — placeholder stat tiles, customer attention list (a handful shown on Overview), `mockCustomers` (a fuller but still representative sample for the Customers page — not literally all 18 from `serviceStatTiles`), today's work summary. Its Work Queue card/page reads `ai-issues`'s mock data directly (not duplicated here) — that's where Employee's "Report a problem" (EMP-02) is meant to route to (TCARE-01), distinct from the Customer Attention/Customers data (external MSP customers, multi-tenant mode, TCARE-05).
