// Issue — a reported problem on an asset (requirement doc §3 shared business
// object). Created by Employee "Report a problem" (EMP-02), routed to Thunder
// Care's Work Queue (TCARE-01).
export type IssueSeverity = "critical" | "attention" | "info";
export type IssueStatus = "waiting" | "in_progress" | "resolved";

export interface Issue {
  id: string;
  assetId: string;
  assetTag: string;
  description: string;
  severity: IssueSeverity;
  status: IssueStatus;
  reportedBy: string;
  reportedAt: string;
}
