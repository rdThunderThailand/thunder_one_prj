# ai-issues

`Issue` — a reported problem on an asset (requirement doc §3 shared business object). Employee's "Report a problem" (EMP-02) is meant to route here, into Thunder Care's Work Queue (TCARE-01). Namespaced `ai-` per `docs/adr/0023-asset-intelligence-feature-namespacing.md`.

> R&D placeholder — mock data, no backend yet. `ReportProblemForm` shows a real local confirmation on submit but doesn't write back to `mock-data.ts` — cross-role consistency (Thunder Care seeing an employee's issue) comes from both sides reading the same seeded mock records, not a live mutation pipeline. See the form's own comment for why.

- `components/` — `ReportProblemForm` (used inline on `ai-assets`'s My Assets cards), `MyServiceStatusPage` (Employee's own reported-issues timeline)
- `types.ts` — `Issue`, `IssueSeverity`, `IssueStatus`
- `mock-data.ts` — seeded issues, read by both Employee's Service Status and Thunder Care's Work Queue
