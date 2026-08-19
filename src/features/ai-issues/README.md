# ai-issues

`Issue` — a reported problem on an asset (requirement doc §3 shared business object). Employee's "Report a problem" (EMP-02) is meant to route here, into Thunder Care's Work Queue (TCARE-01). Namespaced `ai-` per `docs/adr/0023-asset-intelligence-feature-namespacing.md`.

> R&D placeholder — mock data, no backend yet. `ReportProblemForm` shows a real local confirmation on submit but doesn't write back to `mock-data.ts` — cross-role consistency (Thunder Care seeing an employee's issue) comes from both sides reading the same seeded mock records, not a live mutation pipeline. See the form's own comment for why.

- `components/` — `ReportProblemForm` (used inline on `ai-assets`'s My Assets cards), `MyServiceStatusPage` (Employee's own reported-issues timeline), `ResolvedIssuesList` (shared "Recently Resolved" list, used by all three Reports pages — `ai-assets`, `ai-departments`, `ai-mission-control`)
- `types.ts` — `Issue`, `IssueSeverity`, `IssueStatus`. `Issue.resolvedAt` is set once `status` reaches `"resolved"` — that's what the Reports pages sort/show.
- `mock-data.ts` — seeded issues, read by Employee's Service Status, Thunder Care's Work Queue, and every Reports page. `issue-1`/`issue-2`/`issue-3` are explicitly linked to `ai-work-orders`'s `WorkOrder.issueId` (`wo-10`/`wo-1`/`wo-2`) — verified 2026-08-19 via an in-memory trace (`tsx`, since it crosses `@/` feature boundaries the plain `.check.mts` convention can't resolve) that the full Employee → Thunder Care → Technician → Reports chain actually connects for one real asset (NB-032), not just similarly-worded mock rows.
