# asset-intelligence/requests

`AssetRequest` — an employee asking their Department to use/borrow an asset (requirement doc EMP-03 / DM-03 flow). Read by both Employee's "My Requests" view and Department Manager's incoming requests queue. Namespaced `ai-` per `docs/adr/0023-asset-intelligence-feature-namespacing.md`.

> R&D placeholder — mock data, no backend yet. No "new request" form built this round — the requirement was to *view* requests already made, not submit new ones.

- `components/` — `MyRequestsPage` (timeline-style status per request)
- `types.ts` — `AssetRequest`, `AssetRequestStatus`
- `mock-data.ts` — seeded requests, read by both Employee and `asset-intelligence/departments`
