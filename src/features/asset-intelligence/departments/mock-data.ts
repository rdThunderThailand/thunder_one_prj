// R&D placeholder data for the Department Manager's dashboard (requirement
// doc §4.3). No backend yet — a real version would scope features/asset-intelligence/assets
// by department_id server-side, not filter client-side like this.
import { getMockAssets, type Asset } from "@/features/asset-intelligence/assets";
import { getMockAssetRequests } from "@/features/asset-intelligence/requests";
import { getMockIssues } from "@/features/asset-intelligence/issues";
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
// a real department, same convention as mission-control/asset-intelligence/assets's
// dashboards — "Open Issues" is a real, unscaled count since asset-intelligence/issues's
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

// --- Manager Mission Control (the department_admin variant of the shell's
// Mission Control landing page — config/rbac.ts's resolveShellVariant)
// --- placeholder content matching the reference mockup exactly (Nie,
// 2026-08-25) — a Marketing Manager's team and campaigns, not this feature's
// own Sales team (mockTeamMembers/needsAttention above), which a first draft
// of this page reused and got corrected away from. Kept separate from that
// data on purpose: this page's persona/domain doesn't match the rest of this
// feature, so forcing a shared roster would misrepresent one or the other.

const managerTeam = ["Ploy S.", "Tan T.", "Fah F.", "Golf T.", "Pim C."];

export interface ManagerStatTileData {
  id: string;
  label: string;
  value: string;
  sublabel: string;
  deltaLabel?: string;
  color: "indigo" | "amber" | "red" | "blue" | "emerald" | "zinc";
}

export const managerStatTiles: ManagerStatTileData[] = [
  { id: "team", label: "Total Team", value: "18", sublabel: "Active 18", color: "indigo" },
  { id: "focus", label: "Needs Focus", value: "6", sublabel: "items", deltaLabel: "▲ 2 from yesterday", color: "amber" },
  { id: "overdue", label: "Overdue", value: "3", sublabel: "items", deltaLabel: "▲ 1 from yesterday", color: "red" },
  { id: "decisions", label: "Pending Decisions", value: "2", sublabel: "items", color: "blue" },
  { id: "on-plan", label: "On Plan Today", value: "72%", sublabel: "vs plan", deltaLabel: "▲ 8% from yesterday", color: "emerald" },
  { id: "satisfaction", label: "Team Satisfaction", value: "4.3", sublabel: "/5", deltaLabel: "▲ 0.2 from yesterday", color: "zinc" },
];

export interface ManagerAttentionItem {
  id: string;
  title: string;
  subtitle: string;
  assignee: string;
  meta: string;
  status: "overdue" | "at-risk" | "waiting";
  actionLabel: string;
}

export const managerAttentionItems: ManagerAttentionItem[] = [
  {
    id: "m-1",
    title: "Q3 Campaign Artwork",
    subtitle: "Deadline is today at 11:00",
    assignee: managerTeam[0],
    meta: "Due 24 Aug • Overdue 2h",
    status: "overdue",
    actionLabel: "Follow up",
  },
  {
    id: "m-2",
    title: "Influencer Collaboration",
    subtitle: "Waiting on budget approval",
    assignee: managerTeam[1],
    meta: "Due 25 Aug",
    status: "at-risk",
    actionLabel: "View detail",
  },
  {
    id: "m-3",
    title: "Approve: Facebook Ads Budget",
    subtitle: "Needs your approval",
    assignee: managerTeam[2],
    meta: "Waiting since 22 Aug",
    status: "waiting",
    actionLabel: "Decide",
  },
];

export const teamProgress = {
  totalTasks: 18,
  onPlanPercent: 76,
  segments: [
    { label: "On plan", value: 12, color: "#10b981" },
    { label: "In progress", value: 4, color: "#6366f1" },
    { label: "Delayed", value: 1, color: "#f59e0b" },
    { label: "Waiting on others", value: 1, color: "#a1a1aa" },
  ],
};

export interface WorkloadRow {
  id: string;
  name: string;
  percent: number;
  tone: "high" | "medium" | "good";
}

export const teamWorkloadRows: WorkloadRow[] = [
  { id: "ploy-s", name: managerTeam[0], percent: 85, tone: "high" },
  { id: "tan-t", name: managerTeam[1], percent: 72, tone: "medium" },
  { id: "fah-f", name: managerTeam[2], percent: 68, tone: "good" },
  { id: "golf-t", name: managerTeam[3], percent: 55, tone: "good" },
  { id: "pim-c", name: managerTeam[4], percent: 40, tone: "good" },
];

export interface NowNextItem {
  id: string;
  title: string;
  subtitle: string;
}

export const managerNowItems: NowNextItem[] = [
  { id: "n-1", title: "Daily Team Call", subtitle: "Online Meeting" },
  { id: "n-2", title: "Q3 Campaign Review", subtitle: "Meeting Room 2" },
  { id: "n-3", title: "Customer Meeting", subtitle: "Zoom Meeting" },
];

export interface NextUpItem {
  id: string;
  when: string;
  title: string;
  subtitle: string;
}

export const managerNextItems: NextUpItem[] = [
  { id: "x-1", when: "Today", title: "Review Ad Performance", subtitle: "Focus Time" },
  { id: "x-2", when: "Tomorrow, 09:30", title: "Content Approval", subtitle: "Focus Time" },
  { id: "x-3", when: "Wed, 26 Aug", title: "Project Kick-off", subtitle: "Meeting Room 1" },
];

export interface ActivityItem {
  id: string;
  name: string;
  action: string;
  target: string;
  timeAgo: string;
}

export const teamActivity: ActivityItem[] = [
  { id: "a-1", name: managerTeam[4], action: "uploaded file", target: "Q3 Content Plan_v1.2.pptx", timeAgo: "15m ago" },
  { id: "a-2", name: managerTeam[1], action: "created task", target: "TikTok Campaign Planning", timeAgo: "35m ago" },
  {
    id: "a-3",
    name: managerTeam[2],
    action: "updated status",
    target: "Website Banner Design → In Review",
    timeAgo: "1h ago",
  },
  { id: "a-4", name: managerTeam[3], action: "closed task", target: "Agency Briefing", timeAgo: "2h ago" },
];

export interface TeamGoalData {
  id: string;
  title: string;
  detail: string;
  percent: number;
}

export const teamGoals: TeamGoalData[] = [
  { id: "g-1", title: "Q3 Marketing Campaign Success", detail: "Target: 90%", percent: 78 },
  { id: "g-2", title: "Lead Generation", detail: "Target: 1,200 Leads (840 / 1,200)", percent: 70 },
  { id: "g-3", title: "Brand Awareness (Reach)", detail: "Target: 2.5M (1.9M / 2.5M)", percent: 76 },
];

export interface ManagerDecisionData {
  id: string;
  title: string;
  detail: string;
}

export const managerDecisions: ManagerDecisionData[] = [
  { id: "d-1", title: "Approval: Influencer Budget", detail: "Budget: ฿120,000" },
  { id: "d-2", title: "Resource Allocation", detail: "Allocate resources for a new project" },
  { id: "d-3", title: "Vendor Selection", detail: "Choose an agency for creative work" },
];

export interface AnnouncementData {
  id: string;
  title: string;
  detail: string;
}

export const managerAnnouncements: AnnouncementData[] = [
  { id: "an-1", title: "CEO Town Hall", detail: "Join today at 16:00, via Live Stream" },
  { id: "an-2", title: "New Policy", detail: "Hybrid work policy — please review by 28 Aug" },
  { id: "an-3", title: "Happy Birthday!", detail: `${managerTeam[1]} (25 Aug)` },
];

// --- Employee Mission Control (the operator/employee_media "employee"
// variant of the shell's Mission Control page — config/rbac.ts's
// resolveShellVariant) --- placeholder content matching the reference
// mockup exactly (Nie, 2026-08-25). Same "Marketing" team/persona as the
// manager variant above — this is Ploy S.'s own individual view, not the
// team-oversight one, so it reuses managerTeam[0] ("Ploy S.") as "you"
// rather than inventing a second roster.

export interface EmployeeStatTileData {
  id: string;
  label: string;
  value: string;
  sublabel: string;
  icon: "focus" | "checkCircle" | "megaphone" | "trendUp" | "star";
  color: "indigo" | "emerald" | "purple" | "blue" | "amber";
}

export const employeeStatTiles: EmployeeStatTileData[] = [
  { id: "focus", label: "Needs Your Focus", value: "2", sublabel: "Needs your focus", icon: "focus", color: "indigo" },
  { id: "decisions", label: "Awaiting Your Decision", value: "3", sublabel: "Awaiting your decision", icon: "checkCircle", color: "emerald" },
  { id: "announcements", label: "Important Today", value: "1", sublabel: "Important today", icon: "megaphone", color: "purple" },
  { id: "progress", label: "Team Progress", value: "92%", sublabel: "Team progress", icon: "trendUp", color: "emerald" },
  { id: "satisfaction", label: "Team Satisfaction", value: "4.6 / 5", sublabel: "Team satisfaction", icon: "star", color: "indigo" },
];

export interface EmployeeAttentionItem {
  id: string;
  title: string;
  subtitle: string;
  meta: string;
  status: "overdue" | "waiting";
  actionLabel: string;
}

export const employeeAttentionItems: EmployeeAttentionItem[] = [
  {
    id: "ea-1",
    title: "Q3 Campaign Artwork overdue by 2 days",
    subtitle: `Owner: ${managerTeam[0]}`,
    meta: "Due 22 Aug • High",
    status: "overdue",
    actionLabel: "View detail",
  },
  {
    id: "ea-2",
    title: "Waiting for a summary from the Product Team",
    subtitle: "Project: New Product Launch",
    meta: "Waiting since 22 Aug",
    status: "waiting",
    actionLabel: "Follow up",
  },
];

export interface EmployeeScheduleItem {
  id: string;
  time: string;
  title: string;
  subtitle: string;
}

export const employeeSchedule: EmployeeScheduleItem[] = [
  { id: "es-1", time: "09:30", title: "Daily Team Call", subtitle: "Online Meeting" },
  { id: "es-2", time: "11:00", title: "Q3 Campaign Review", subtitle: "Meeting Room 2" },
  { id: "es-3", time: "14:00", title: "Customer Meeting", subtitle: "Zoom Meeting" },
  { id: "es-4", time: "16:00", title: "CEO Town Hall", subtitle: "Live Stream" },
];

export const myProgress = {
  totalTasks: 45,
  onTrackPercent: 92,
  segments: [
    { label: "Completed", value: 28, color: "#10b981" },
    { label: "In progress", value: 12, color: "#6366f1" },
    { label: "Delayed", value: 2, color: "#ef4444" },
    { label: "Waiting for response", value: 3, color: "#a1a1aa" },
  ],
};

export interface CompanyGoalData {
  id: string;
  title: string;
  detail: string;
  percent: number;
}

export const companyGoals: CompanyGoalData[] = [
  { id: "cg-1", title: "Launch ThunderOne v2.0", detail: "Target: 30 Sep 2025", percent: 78 },
  { id: "cg-2", title: "Customer Satisfaction ≥ 90%", detail: "Target: Q3 2025", percent: 92 },
  { id: "cg-3", title: "MRR Growth +20% QoQ", detail: "Target: Q3 2025", percent: 64 },
];

export const employeeInsight = {
  badge: "Great" as const,
  title: "Your work is trending to finish on time",
  detail: "You submit on time 96%, higher than the team average (89%).",
};

export const employeeRecommendation = {
  title: "Recommended for you",
  detail: "Try the Campaign Brief template to save time.",
  linkLabel: "Template",
};

export interface EmployeeActivityItem {
  id: string;
  name: string;
  action: string;
  target: string;
  timeAgo: string;
  icon: "approve" | "upload" | "comment";
}

export const employeeActivity: EmployeeActivityItem[] = [
  { id: "ea-act-1", name: managerTeam[1], action: "approved", target: "Social Media Content Plan", timeAgo: "10m ago", icon: "approve" },
  { id: "ea-act-2", name: managerTeam[2], action: "uploaded", target: "Q3 Campaign Brief.pdf", timeAgo: "1h ago", icon: "upload" },
  { id: "ea-act-3", name: managerTeam[3], action: "commented on", target: "Product Launch Plan", timeAgo: "2h ago", icon: "comment" },
];

export interface QuickAccessDocData {
  id: string;
  label: string;
  icon: "guideline" | "template" | "plan" | "calendar" | "dashboard";
}

export const quickAccessDocs: QuickAccessDocData[] = [
  { id: "qad-1", label: "Brand Guideline", icon: "guideline" },
  { id: "qad-2", label: "Campaign Brief Template", icon: "template" },
  { id: "qad-3", label: "Q3 Plan", icon: "plan" },
  { id: "qad-4", label: "Marketing Calendar", icon: "calendar" },
  { id: "qad-5", label: "Report Dashboard", icon: "dashboard" },
];
