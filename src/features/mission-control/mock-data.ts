// R&D placeholder data for the CEO Mission Control dashboard — derived from
// asset-intelligence/assets and thunder-care/work-orders mock data where it
// makes sense, rather than inventing separate fake numbers from scratch.
// Replace once a real cross-App insights backend exists.
import { getMockAssets } from "@/features/asset-intelligence/assets";
import { getMockWorkOrders } from "@/features/thunder-care/work-orders";

const assets = getMockAssets();
const workOrders = getMockWorkOrders();

export interface StatCardData {
  id: string;
  label: string;
  value: string;
  delta: string;
  trend: number[];
  color: "indigo" | "blue" | "amber" | "emerald";
  icon: "monitor" | "warningTriangle" | "checkCircle" | "chart";
}

const critical = assets.filter((a) => a.status === "critical").length;
const attention = assets.filter((a) => a.status === "attention").length;
const maintenanceYtd = assets.reduce((sum, a) => sum + a.purchaseValue * 0.02, 0);
const overdueWorkOrders = workOrders.filter((w) => w.status === "overdue").length;

// Read by InsightsPage — kept in the original "Total Assets / Attention /
// Critical / Maintenance YTD" shape (requirement doc §4.1 CEO-01).
export const statCards: StatCardData[] = [
  {
    id: "total-assets",
    label: "Total Assets",
    value: String(assets.length * 210), // scaled up from the small mock set to read like a real fleet
    delta: "3.4%",
    trend: [780, 795, 802, 810, 818, 825, 830, 834, 838, 840, 841, 842],
    color: "indigo",
    icon: "monitor",
  },
  {
    id: "attention",
    label: "Attention",
    value: String(attention * 8),
    delta: "1",
    trend: [10, 12, 11, 14, 13, 15, 16, 15, 17, 16, 17, 17],
    color: "amber",
    icon: "warningTriangle",
  },
  {
    id: "critical",
    label: "Critical",
    value: String(critical),
    delta: "0",
    trend: [3, 3, 4, 4, 3, 4, 4, 5, 4, 4, 4, 4],
    color: "blue",
    icon: "checkCircle",
  },
  {
    id: "maintenance-ytd",
    label: "Maintenance YTD",
    value: `฿${Math.round(maintenanceYtd * 1600).toLocaleString("en-US")}`,
    delta: "10%",
    trend: [200, 210, 215, 230, 240, 250, 255, 260, 270, 275, 280, 286],
    color: "emerald",
    icon: "chart",
  },
];

export type RecommendationStatus = "pending" | "approved" | "rejected";

export interface RecommendationData {
  id: string;
  title: string;
  summary: string;
  evidence: string;
  status: RecommendationStatus;
}

// CEO-03: a decision with evidence, reviewed via Approvals (CEO-04) —
// matches the requirement doc's mockup text exactly.
export const mockRecommendations: RecommendationData[] = [
  {
    id: "rec-1",
    title: "Replacement decision",
    summary: "3 Accounting printers now cost 42% of replacement value to maintain.",
    evidence: "11 incidents / 90 days",
    status: "pending",
  },
];

export function getMockRecommendations(): RecommendationData[] {
  return mockRecommendations;
}

// Strategic Brief (top of Mission Control) — a short AI-style summary plus
// five headline metrics. Critical Risks reuses the same critical-asset count
// as statCards; the rest are placeholder numbers with no backend source yet.
export interface StrategicBriefData {
  summary: string[];
  organizationHealth: { score: number; status: "Good" | "Fair" | "Poor"; trend: number[]; deltaLabel: string };
  keyPriorities: { active: number; onTrack: number; atRisk: number };
  financialSnapshot: { budgetUtilization: number; deltaLabel: string };
  engagement: { interactions: string; trend: number[]; deltaLabel: string };
  criticalRisks: { count: number; deltaLabel: string };
}

export const strategicBrief: StrategicBriefData = {
  summary: [
    "Overall, the organization is on track.",
    "Media Workspace has one delayed campaign requiring your approval.",
    `Field Operations workload is above normal — ${overdueWorkOrders} work order${
      overdueWorkOrders === 1 ? "" : "s"
    } overdue.`,
    "Customer engagement improved this week.",
  ],
  organizationHealth: {
    score: 82,
    status: "Good",
    trend: [70, 72, 74, 73, 76, 78, 77, 79, 80, 81, 81, 82],
    deltaLabel: "▲ 6 vs last week",
  },
  keyPriorities: { active: 3, onTrack: 2, atRisk: 1 },
  financialSnapshot: { budgetUtilization: 92, deltaLabel: "▲ 4% vs last month" },
  engagement: {
    interactions: "128K",
    trend: [90, 95, 98, 100, 105, 108, 112, 115, 118, 122, 125, 128],
    deltaLabel: "▲ 18% vs last week",
  },
  criticalRisks: { count: critical, deltaLabel: "vs last week" },
};

// "Needs Your Attention" — operational status pings (distinct from
// decisionItems below, which need an explicit approve/reject).
export interface AttentionItemData {
  id: string;
  icon: "warning" | "users" | "phone";
  title: string;
  description: string;
  owner: string;
  due: string;
  severity: "High" | "Medium" | "Low";
}

export const attentionItems: AttentionItemData[] = [
  {
    id: "att-campaign",
    icon: "phone",
    title: "Q3 Product Launch Campaign Delayed",
    description: "Content approval is overdue in Media Workspace.",
    owner: "Marketing Team",
    due: "This week",
    severity: "High",
  },
  {
    id: "att-field-ops",
    icon: "users",
    title: "Field Operations Workload High",
    description: `${overdueWorkOrders} work order${overdueWorkOrders === 1 ? "" : "s"} overdue across active technicians.`,
    owner: "Operations Team",
    due: "This week",
    severity: "Medium",
  },
  {
    id: "att-critical-assets",
    icon: "warning",
    title: `${critical} Critical Asset${critical === 1 ? "" : "s"} Flagged`,
    description: "Repeated failures reported — see Asset Intelligence for detail.",
    owner: "Asset Intelligence",
    due: "Today",
    severity: critical > 0 ? "High" : "Low",
  },
];

// "Decisions Waiting for You" — items that need an explicit yes/no. The
// first reuses mockRecommendations (the one real, working Approvals queue);
// the rest are narrative placeholders that also route there — same "one
// queue for everything" simplification RequiresAttentionCard used before.
export interface DecisionItemData {
  id: string;
  icon: "clipboard" | "user" | "megaphone";
  title: string;
  meta: string;
}

export const decisionItems: DecisionItemData[] = [
  {
    id: "dec-asset-replacement",
    icon: "clipboard",
    title: mockRecommendations[0]?.title ?? "Approve pending recommendation",
    meta: `Evidence: ${mockRecommendations[0]?.evidence ?? "—"}`,
  },
  {
    id: "dec-field-resources",
    icon: "user",
    title: "Confirm Additional Field Resources",
    meta: "Request from Field Operations",
  },
  {
    id: "dec-announcement",
    icon: "megaphone",
    title: "Review ThunderOne Announcement",
    meta: "New feature release communication",
  },
];

// "Ask ThunderOne" — a static, non-interactive preview of an AI panel (no
// assistant backend exists yet); bullets restate the items above.
export interface AskRecommendation {
  id: string;
  icon: "target" | "users" | "phone";
  title: string;
  detail: string;
}

export const askRecommendations: AskRecommendation[] = [
  {
    id: "ask-1",
    icon: "target",
    title: "Focus on approving the Q3 campaign",
    detail: "It is blocking the planned launch.",
  },
  {
    id: "ask-2",
    icon: "users",
    title: "Review Field Operations workload",
    detail: `${overdueWorkOrders} work order${overdueWorkOrders === 1 ? "" : "s"} overdue.`,
  },
  {
    id: "ask-3",
    icon: "phone",
    title: "Customer complaints are trending up",
    detail: "Review top issues and response time.",
  },
];

// "Today & Now" — a static preview of the day's calendar (no calendar
// backend exists yet). Two feeds: a flat list of the day's events, and a
// short "what's next" rail that can include non-calendar items too.
export interface ScheduleEventData {
  id: string;
  time: string;
  title: string;
}

export const todaySchedule: ScheduleEventData[] = [
  { id: "sch-1", time: "09:30", title: "Management Daily" },
  { id: "sch-2", time: "13:00", title: "Customer Meeting" },
  { id: "sch-3", time: "16:00", title: "Product Review" },
];

export interface NextUpEventData {
  id: string;
  title: string;
  timeRange: string;
  statusLabel: string;
  statusTone: "now" | "upcoming";
}

export const nextUpEvents: NextUpEventData[] = [
  { id: "next-1", title: "Management Daily", timeRange: "09:30 - 10:00", statusLabel: "In 15 min", statusTone: "now" },
  {
    id: "next-2",
    title: "Review Campaign Q3",
    timeRange: "10:30 - 11:00",
    statusLabel: "Upcoming",
    statusTone: "upcoming",
  },
];
