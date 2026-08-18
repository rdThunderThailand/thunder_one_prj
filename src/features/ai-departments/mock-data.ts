// R&D placeholder data for the Department Manager's dashboard (requirement
// doc §4.3). No backend yet — a real version would scope features/ai-assets
// by department_id server-side, not filter client-side like this.
import { getMockAssets, type Asset } from "@/features/ai-assets";
import { getMockAssetRequests } from "@/features/ai-requests";
import { getMockIssues } from "@/features/ai-issues";
import { CURRENT_DEPARTMENT_ID } from "@/config/current-department";

export function getDepartmentAssets(): Asset[] {
  return getMockAssets().filter((a) => a.departmentId === CURRENT_DEPARTMENT_ID);
}

export interface StatTileData {
  id: string;
  label: string;
  value: string;
  color: "zinc" | "emerald" | "amber" | "red";
}

const departmentAssets = getDepartmentAssets();
const healthy = departmentAssets.filter((a) => a.status === "healthy").length;
const attention = departmentAssets.filter((a) => a.status === "attention").length;
const openIssuesCount = getMockIssues().filter((i) => i.status !== "resolved").length;

// Total/Healthy/Attention are scaled up from the small mock set to read like
// a real department, same convention as ai-mission-control/ai-assets's
// dashboards — "Open Issues" is a real, unscaled count since ai-issues's
// mock data is small enough to count directly.
export const departmentStatTiles: StatTileData[] = [
  { id: "total", label: "Total Assets", value: String(departmentAssets.length * 9), color: "zinc" },
  { id: "healthy", label: "Healthy", value: String(healthy * 8), color: "emerald" },
  { id: "attention", label: "Attention", value: String(attention * 3), color: "amber" },
  { id: "open-issues", label: "Open Issues", value: String(openIssuesCount), color: "red" },
];

export interface TeamMember {
  id: string;
  name: string;
  role: string;
}

export const mockTeamMembers: TeamMember[] = [
  { id: "emp-114", name: "Nattapong", role: "Sales Executive" },
  { id: "emp-220", name: "Siriwan", role: "Sales Executive" },
  { id: "emp-231", name: "Kittipong", role: "Sales Manager" },
];

const teamMemberName = (id: string | null): string =>
  mockTeamMembers.find((m) => m.id === id)?.name ?? "Unassigned";

export interface NeedsAttentionRow {
  id: string;
  tag: string;
  subtitle: string;
  assignee: string;
  severity: "red" | "yellow";
}

const severityFor = (status: Asset["status"]): "red" | "yellow" => (status === "critical" ? "red" : "yellow");

export const needsAttention: NeedsAttentionRow[] = departmentAssets
  .filter((a) => a.status !== "healthy")
  .map((a) => ({
    id: a.id,
    tag: a.tag,
    subtitle: a.status === "critical" ? "Needs immediate attention" : "Needs attention",
    assignee: teamMemberName(a.assigneeId),
    severity: severityFor(a.status),
  }));

export const requestsSummary = {
  waitingIT: getMockAssetRequests().filter((r) => r.status === "waiting_it").length,
  completedToday: 1,
};
