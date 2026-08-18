// R&D placeholder data — no backend yet. Seeded (not written by
// ReportProblemForm, which only shows a local confirmation — see its own
// comment) so Employee's Service Status and Thunder Care's Work Queue can both
// show a consistent, connected picture without live cross-page mutation.
import { CURRENT_EMPLOYEE_ID } from "@/config/current-employee";
import type { Issue } from "./types";

export const mockIssues: Issue[] = [
  {
    id: "issue-1",
    assetId: "nb-032",
    assetTag: "NB-032",
    description: "Laptop battery drains within an hour, even fully charged.",
    severity: "attention",
    status: "in_progress",
    reportedBy: CURRENT_EMPLOYEE_ID,
    reportedAt: "2026-08-15",
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
  },
];

export function getMockIssues(): Issue[] {
  return mockIssues;
}
