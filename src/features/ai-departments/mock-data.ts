// R&D placeholder data for the Department Manager's "My Department" dashboard
// (requirement doc §4.3). No backend yet — a real version would scope
// features/ai-assets by department_id instead of holding separate fake rows.
// requestsSummary.waitingIT and the "Open Issues" stat tile are derived from
// ai-requests/ai-issues's own mock data (imported via their index.ts) rather
// than hardcoded a second time, so the two personas' numbers stay consistent.
import { getMockAssetRequests } from "@/features/ai-requests";
import { getMockIssues } from "@/features/ai-issues";

export interface StatTileData {
  id: string;
  label: string;
  value: string;
  color: "zinc" | "emerald" | "amber" | "red";
}

const openIssuesCount = getMockIssues().filter((i) => i.status !== "resolved").length;

export const departmentStatTiles: StatTileData[] = [
  { id: "total", label: "Total Assets", value: "54", color: "zinc" },
  { id: "healthy", label: "Healthy", value: "48", color: "emerald" },
  { id: "attention", label: "Attention", value: "6", color: "amber" },
  { id: "open-issues", label: "Open Issues", value: String(openIssuesCount), color: "red" },
];

export interface NeedsAttentionRow {
  id: string;
  tag: string;
  subtitle: string;
  assignee: string;
  severity: "red" | "yellow";
}

export const needsAttention: NeedsAttentionRow[] = [
  {
    id: "nb-032",
    tag: "NB-032",
    subtitle: "Warranty expires in 14 days",
    assignee: "Nattapong",
    severity: "yellow",
  },
  {
    id: "nb-017",
    tag: "NB-017",
    subtitle: "Condition: Poor",
    assignee: "Sales Team",
    severity: "red",
  },
];

export const requestsSummary = {
  waitingIT: getMockAssetRequests().filter((r) => r.status === "waiting_it").length,
  completedToday: 1,
};
