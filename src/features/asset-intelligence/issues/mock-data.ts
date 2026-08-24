// R&D placeholder data — no backend yet. Seeded (not written by
// ReportProblemForm, which only shows a local confirmation — see its own
// comment) so Employee's Service Status and Thunder Care's Work Queue can both
// show a consistent, connected picture without live cross-page mutation.
//
// issue-1 and issue-3 are "resolved" with a resolvedAt — every role's
// Reports page (asset-intelligence/assets, asset-intelligence/departments, mission-control) reads
// resolved issues to show recent activity. issue-1 (NB-032) is also linked
// to a completed WorkOrder (thunder-care/work-orders's wo-10, via Issue.id ==
// WorkOrder.issueId) so the full Employee -> Thunder Care -> Technician ->
// Reports chain traces through one real asset end to end.
import { CURRENT_EMPLOYEE_ID } from "@/config/current-employee";
import type { Issue } from "./types";

export const mockIssues: Issue[] = [
  {
    id: "issue-1",
    assetId: "nb-032",
    assetTag: "NB-032",
    description: "Laptop battery drains within an hour, even fully charged.",
    severity: "attention",
    status: "resolved",
    reportedBy: CURRENT_EMPLOYEE_ID,
    reportedAt: "2026-08-15",
    resolvedAt: "2026-08-18",
  },
  {
    id: "issue-2",
    assetId: "nas-001",
    assetTag: "NAS-001",
    description: "Nightly backup job has failed three nights in a row.",
    severity: "critical",
    status: "waiting",
    reportedBy: "emp-201",
    reportedAt: "2026-08-17",
  },
  {
    id: "issue-3",
    assetId: "prn-019",
    assetTag: "PRN-019",
    description: "Paper jam on tray 2, recurring.",
    severity: "attention",
    status: "resolved",
    reportedBy: "emp-305",
    reportedAt: "2026-08-10",
    resolvedAt: "2026-08-12",
  },
];

export function getMockIssues(): Issue[] {
  return mockIssues;
}
