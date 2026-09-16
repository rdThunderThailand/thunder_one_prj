// R&D placeholder data for the shell-level Intelligence dashboard — "Risk,
// insight, and recommendation rollups across every App" (the old
// IntelligencePage stub's own description). Derives what it can from
// thunder-care/work-orders, same convention as mission-control/mock-data.ts,
// so the numbers agree across routes rather than inventing a second,
// contradictory set.
import { getMockWorkOrders } from "@/features/thunder-care/work-orders";

const workOrders = getMockWorkOrders();
const overdueWorkOrders = workOrders.filter((w) => w.status === "overdue").length;

export type MetricViz =
  | { type: "sparkline"; data: number[]; color: string }
  | { type: "progress"; value: number; color: "indigo" | "emerald" };

export interface HeadlineMetricData {
  id: string;
  icon: "heart" | "gauge" | "currency" | "users" | "smile" | "shield";
  iconTone: string;
  label: string;
  value: string;
  unit?: string;
  status: string;
  emphasize?: boolean;
  deltaLabel: string;
  deltaCaption: string;
  viz: MetricViz;
}

export const headlineMetrics: HeadlineMetricData[] = [
  {
    id: "org-health",
    icon: "heart",
    iconTone: "text-rose-500",
    label: "Organization Health",
    value: "82",
    unit: "/100",
    status: "Good",
    emphasize: true,
    deltaLabel: "▲ 6",
    deltaCaption: "vs last week",
    viz: { type: "sparkline", data: [70, 72, 74, 73, 76, 78, 77, 79, 80, 81, 81, 82], color: "text-emerald-500" },
  },
  {
    id: "strategic-progress",
    icon: "gauge",
    iconTone: "text-indigo-500",
    label: "Strategic Progress",
    value: "68%",
    status: "On Track",
    deltaLabel: "▲ 8%",
    deltaCaption: "vs last month",
    viz: { type: "progress", value: 68, color: "indigo" },
  },
  {
    id: "financial-snapshot",
    icon: "currency",
    iconTone: "text-emerald-500",
    label: "Financial Snapshot",
    value: "92%",
    status: "Budget Utilization",
    deltaLabel: "▲ 4%",
    deltaCaption: "vs last month",
    viz: { type: "progress", value: 92, color: "indigo" },
  },
  {
    id: "engagement",
    icon: "users",
    iconTone: "text-blue-500",
    label: "Engagement",
    value: "128K",
    status: "Interactions this week",
    deltaLabel: "▲ 18%",
    deltaCaption: "vs last week",
    viz: { type: "sparkline", data: [90, 95, 98, 100, 105, 108, 112, 115, 118, 122, 125, 128], color: "text-blue-500" },
  },
  {
    id: "customer-sentiment",
    icon: "smile",
    iconTone: "text-emerald-500",
    label: "Customer Sentiment",
    value: "4.2",
    unit: "/5",
    status: "Positive",
    deltaLabel: "▲ 0.3",
    deltaCaption: "vs last week",
    viz: { type: "sparkline", data: [3.6, 3.7, 3.9, 3.8, 4.0, 3.9, 4.1, 4.0, 4.1, 4.2, 4.1, 4.2], color: "text-purple-500" },
  },
  {
    id: "operational-status",
    icon: "shield",
    iconTone: "text-amber-500",
    label: "Operational Status",
    value: "98%",
    status: "All Systems Operational",
    deltaLabel: "▲ 2%",
    deltaCaption: "vs last week",
    viz: { type: "progress", value: 98, color: "emerald" },
  },
];

export interface KeyInsightData {
  id: string;
  icon: "gauge" | "users" | "trendUp";
  iconTone: string;
  title: string;
  description: string;
  linkLabel: string;
}

export const keyInsights: KeyInsightData[] = [
  {
    id: "insight-campaign",
    icon: "gauge",
    iconTone: "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400",
    title: "Q3 Product Launch is at risk",
    description: "Campaign is delayed by 2 days due to content approval bottleneck.",
    linkLabel: "View prediction",
  },
  {
    id: "insight-field-ops",
    icon: "users",
    iconTone: "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400",
    title: "Field Operations workload high",
    description: `${overdueWorkOrders} work order${overdueWorkOrders === 1 ? "" : "s"} overdue. Allocate resources to reduce impact.`,
    linkLabel: "View details",
  },
  {
    id: "insight-engagement",
    icon: "trendUp",
    iconTone: "bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400",
    title: "Customer engagement rising",
    description: "Engagement increased 18% this week, strongest on Product Update content.",
    linkLabel: "View trend",
  },
];

export interface ObjectiveData {
  id: string;
  icon: "gauge" | "shield" | "users" | "currency";
  iconTone: string;
  title: string;
  detail: string;
  percent: number;
  status: "On Track" | "At Risk" | "Behind";
}

export const objectives: ObjectiveData[] = [
  {
    id: "obj-engagement",
    icon: "gauge",
    iconTone: "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400",
    title: "Grow Customer Engagement",
    detail: "Increase engagement by 20% in Q3",
    percent: 72,
    status: "On Track",
  },
  {
    id: "obj-operational",
    icon: "shield",
    iconTone: "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400",
    title: "Operational Excellence",
    detail: "Reduce process cycle time by 15%",
    percent: 58,
    status: "At Risk",
  },
  {
    id: "obj-innovation",
    icon: "users",
    iconTone: "bg-purple-50 text-purple-500 dark:bg-purple-500/10 dark:text-purple-400",
    title: "Product Innovation",
    detail: "Launch 2 new features in Q3",
    percent: 40,
    status: "Behind",
  },
  {
    id: "obj-financial",
    icon: "currency",
    iconTone: "bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400",
    title: "Financial Discipline",
    detail: "Maintain budget utilization > 90%",
    percent: 92,
    status: "On Track",
  },
];

export const performanceTrend = {
  xKey: "day",
  series: [
    { key: "engagement", label: "Engagement", color: "#6366f1" },
    { key: "reach", label: "Reach", color: "#10b981" },
    { key: "conversions", label: "Conversions", color: "#a855f7" },
  ],
  data: [
    { day: "Mon 18", engagement: 92000, reach: 68000, conversions: 34000 },
    { day: "Tue 19", engagement: 98000, reach: 78000, conversions: 40000 },
    { day: "Wed 20", engagement: 96000, reach: 82000, conversions: 30000 },
    { day: "Thu 21", engagement: 88000, reach: 62000, conversions: 26000 },
    { day: "Fri 22", engagement: 108000, reach: 76000, conversions: 42000 },
    { day: "Sat 23", engagement: 118000, reach: 80000, conversions: 38000 },
    { day: "Sun 24", engagement: 128000, reach: 72000, conversions: 44000 },
  ],
  summary: [
    { id: "engagement", label: "Engagement", value: "128K", deltaLabel: "▲ 18%" },
    { id: "reach", label: "Reach", value: "2.4M", deltaLabel: "▲ 12%" },
    { id: "conversions", label: "Conversions", value: "18.7K", deltaLabel: "▲ 9%" },
  ],
};

export const riskRadar = {
  axes: [
    { axis: "Financial", current: 55, previous: 60 },
    { axis: "Operational", current: 65, previous: 55 },
    { axis: "Compliance", current: 40, previous: 45 },
    { axis: "Reputation", current: 35, previous: 40 },
    { axis: "Customer", current: 60, previous: 50 },
    { axis: "Technology", current: 50, previous: 45 },
  ],
  highRisks: 2,
  mediumRisks: 3,
};

export interface DepartmentMetricData {
  id: string;
  icon: "megaphone" | "gauge" | "shield" | "currency";
  iconTone: string;
  name: string;
  metricLabel: string;
  value: string;
  deltaLabel: string;
  trend: number[];
  trendColor: string;
}

export const departmentOverview: DepartmentMetricData[] = [
  {
    id: "dept-marketing",
    icon: "megaphone",
    iconTone: "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400",
    name: "Marketing",
    metricLabel: "Engagement",
    value: "128K",
    deltaLabel: "▲ 18%",
    trend: [80, 85, 82, 90, 95, 100, 108, 115, 120, 124, 126, 128],
    trendColor: "text-blue-500",
  },
  {
    id: "dept-sales",
    icon: "gauge",
    iconTone: "bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400",
    name: "Sales",
    metricLabel: "Pipeline",
    value: "96M",
    deltaLabel: "▲ 12%",
    trend: [70, 72, 68, 74, 78, 76, 82, 85, 88, 90, 93, 96],
    trendColor: "text-emerald-500",
  },
  {
    id: "dept-operations",
    icon: "shield",
    iconTone: "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400",
    name: "Operations",
    metricLabel: "Workload",
    value: "78%",
    deltaLabel: "▲ 6%",
    trend: [60, 62, 65, 63, 68, 70, 72, 71, 74, 76, 77, 78],
    trendColor: "text-amber-500",
  },
  {
    id: "dept-finance",
    icon: "currency",
    iconTone: "bg-purple-50 text-purple-500 dark:bg-purple-500/10 dark:text-purple-400",
    name: "Finance",
    metricLabel: "Budget Utilization",
    value: "92%",
    deltaLabel: "▲ 0.3",
    trend: [85, 86, 88, 87, 89, 90, 90, 91, 91, 92, 92, 92],
    trendColor: "text-purple-500",
  },
];

export interface AskSuggestionData {
  id: string;
  text: string;
}

export const askSuggestions: AskSuggestionData[] = [
  { id: "ask-1", text: "What are the key risks I should know today?" },
  { id: "ask-2", text: "How is our Q3 campaign performing?" },
  { id: "ask-3", text: "Show me trends in customer engagement" },
  { id: "ask-4", text: "Which teams need support right now?" },
];

export interface DataSourceData {
  id: string;
  icon: "platform" | "megaphone" | "currency" | "users" | "shield";
  iconTone: string;
  name: string;
  syncedLabel: string;
}

export const dataSources: DataSourceData[] = [
  { id: "ds-platform", icon: "platform", iconTone: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400", name: "ThunderOne Platform", syncedLabel: "Real-time" },
  { id: "ds-media-workspace", icon: "megaphone", iconTone: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400", name: "Media Workspace", syncedLabel: "5 min ago" },
  { id: "ds-financial", icon: "currency", iconTone: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400", name: "Financial System", syncedLabel: "1 hour ago" },
  { id: "ds-crm", icon: "users", iconTone: "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400", name: "CRM System", syncedLabel: "15 min ago" },
  { id: "ds-hr", icon: "shield", iconTone: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400", name: "HR System", syncedLabel: "2 hours ago" },
];

// --- Manager Intelligence (the department_admin / manager_it_asset variant
// of this page — config/rbac.ts's resolveShellVariant) — placeholder content
// matching the reference mockup exactly (Nie, 2026-08-25), same "Marketing
// Manager" persona/team as the manager variants of Mission Control and My
// Work. An AI-first layout (insight cards with evidence/recommendation, a
// scope switcher) rather than the CEO variant's metrics-dashboard shape
// above, so it's separate, purpose-built mock content instead of reshaping
// headlineMetrics/keyInsights to fit two different designs.

export interface ScopeOption {
  id: string;
  label: string;
}

export const scopeOptions: ScopeOption[] = [
  { id: "for-you", label: "For You" },
  { id: "team", label: "Team" },
  { id: "work", label: "Work" },
  { id: "customer", label: "Customer" },
  { id: "campaign", label: "Campaign" },
];

export interface ManagerAskSuggestion {
  id: string;
  text: string;
}

export const managerAskSuggestions: ManagerAskSuggestion[] = [
  { id: "mask-1", text: "How is Marketing running this week?" },
  { id: "mask-2", text: "Any risk I should know about?" },
  { id: "mask-3", text: "Summarize Q3 Campaign progress" },
];

export type ManagerInsightKind = "insight" | "risk" | "opportunity";

export interface ManagerInsightData {
  id: string;
  kind: ManagerInsightKind;
  title: string;
  description: string;
  factorLabel: string;
  factorDetail: string;
  evidence: string;
  recommendation: string;
  primaryActionLabel: string;
  secondaryActionLabel?: string;
}

export const managerInsights: ManagerInsightData[] = [
  {
    id: "mi-1",
    kind: "insight",
    title: "Delivery is slowing",
    description: "Task completion rate dropped from 89% to 81%.",
    factorLabel: "Primary factor",
    factorDetail: "Content Approval is taking 0.8 days longer.",
    evidence: "18 tasks • 3 projects • Last 14 days",
    recommendation: "Review approval workload",
    primaryActionLabel: "Review Workload",
    secondaryActionLabel: "Explore",
  },
  {
    id: "mi-2",
    kind: "risk",
    title: "Resource pressure detected",
    description: "Creative Team workload is 17% above capacity.",
    factorLabel: "Likely impact",
    factorDetail: "Q3 Campaign may slip 2-3 days.",
    evidence: "Capacity • Workload • Projects",
    recommendation: "Reassign tasks or adjust timeline",
    primaryActionLabel: "Review Team",
    secondaryActionLabel: "View Evidence",
  },
  {
    id: "mi-3",
    kind: "opportunity",
    title: "Customer response improving",
    description: "Campaign engagement ▲ 12% while CSAT improved to 4.3/5.",
    factorLabel: "Opportunity",
    factorDetail: "Consider extending current campaign.",
    evidence: "Engagement • CSAT • Conversions",
    recommendation: "Extend campaign or scale budget",
    primaryActionLabel: "Explore Opportunity",
  },
];

export interface WatchingMetricData {
  id: string;
  icon: "calendar" | "warning" | "trendUp" | "currency" | "users";
  label: string;
  value: string;
  status: string;
  statusTone: "red" | "amber" | "emerald" | "blue" | "zinc";
}

export const watchingMetrics: WatchingMetricData[] = [
  { id: "w-1", icon: "calendar", label: "Team Delivery", value: "81%", status: "▼ 8% vs last 7 days", statusTone: "red" },
  { id: "w-2", icon: "warning", label: "Q3 Campaign", value: "At Risk", status: "2-3 days delay risk", statusTone: "red" },
  { id: "w-3", icon: "trendUp", label: "Customer Response", value: "Improving", status: "CSAT 4.3 / 5", statusTone: "emerald" },
  { id: "w-4", icon: "currency", label: "Budget", value: "On Track", status: "72% used", statusTone: "blue" },
  { id: "w-5", icon: "users", label: "Team Capability", value: "Developing", status: "3 areas to improve", statusTone: "amber" },
];

export interface ExploreTileData {
  id: string;
  icon: "dashboards" | "reports" | "explorer" | "savedViews" | "kpiLibrary";
  label: string;
}

export const exploreTiles: ExploreTileData[] = [
  { id: "e-1", icon: "dashboards", label: "Dashboards" },
  { id: "e-2", icon: "reports", label: "Reports" },
  { id: "e-3", icon: "explorer", label: "Data Explorer" },
  { id: "e-4", icon: "savedViews", label: "Saved Views" },
  { id: "e-5", icon: "kpiLibrary", label: "KPI Library" },
];

export interface AiSuggestedData {
  id: string;
  icon: "star" | "warning" | "bulb";
  title: string;
  detail: string;
}

export const aiSuggestedForYou: AiSuggestedData[] = [
  { id: "ai-1", icon: "star", title: "Analyze root cause of delay", detail: "7 tasks affected" },
  { id: "ai-2", icon: "warning", title: "Review Q3 Campaign risk", detail: "3 critical issues" },
  { id: "ai-3", icon: "bulb", title: "Opportunity to increase engagement", detail: "Est. +12% Engagement" },
];

export interface TopIssueData {
  id: string;
  title: string;
  severity: "High" | "Medium";
  timeAgo: string;
}

export const managerTopIssues: TopIssueData[] = [
  { id: "ti-1", title: "Content Approval delay", severity: "High", timeAgo: "2h ago" },
  { id: "ti-2", title: "Q3 budget nearly used up (87%)", severity: "Medium", timeAgo: "5h ago" },
  { id: "ti-3", title: "Resource Overload — Creative team over capacity", severity: "Medium", timeAgo: "1d ago" },
];

export interface RecentlyAnalyzedData {
  id: string;
  title: string;
  analyzedLabel: string;
}

export const recentlyAnalyzed: RecentlyAnalyzedData[] = [
  { id: "ra-1", title: "Q3 Marketing Performance", analyzedLabel: "Analyzed 1h ago" },
  { id: "ra-2", title: "Influencer Campaign Impact", analyzedLabel: "Analyzed 5h ago" },
  { id: "ra-3", title: "Website Redesign Progress", analyzedLabel: "Analyzed yesterday" },
];

// --- Employee Intelligence (the operator/employee_media "employee" variant
// of this page — config/rbac.ts's resolveShellVariant) — a personal
// productivity view (my stats, my trend, my recommendations) rather than
// the manager variant's org-wide insight cards above, so it's separate,
// purpose-built mock content matching the reference mockup exactly (Nie,
// 2026-08-25). Same "Ploy S." / Marketing persona as Mission Control's and
// My Work's employee variants — not shared as one module since none of
// these features otherwise depend on each other.

export interface EmployeeStatTileData {
  id: string;
  label: string;
  value: string;
  sublabel: string;
  deltaLabel: string;
  trend: number[];
  trendColor: string;
  icon: "inProgress" | "dueSoon" | "onTime" | "collaboration";
  iconTone: string;
}

export const employeeIntelStatTiles: EmployeeStatTileData[] = [
  {
    id: "my-tasks",
    label: "My Tasks",
    value: "7",
    sublabel: "In progress",
    deltaLabel: "+2 from last week",
    trend: [3, 4, 4, 5, 5, 6, 6, 6, 7, 7, 7, 7],
    trendColor: "text-blue-500",
    icon: "inProgress",
    iconTone: "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400",
  },
  {
    id: "due-soon",
    label: "Nearing Deadline",
    value: "3",
    sublabel: "Within 2 days",
    deltaLabel: "▲ 1 from last week",
    trend: [1, 1, 2, 2, 2, 2, 3, 2, 3, 3, 3, 3],
    trendColor: "text-amber-500",
    icon: "dueSoon",
    iconTone: "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400",
  },
  {
    id: "on-time",
    label: "Weekly Efficiency",
    value: "92%",
    sublabel: "Completed on time",
    deltaLabel: "▲ 6% from last week",
    trend: [80, 82, 84, 83, 86, 88, 87, 89, 90, 91, 91, 92],
    trendColor: "text-emerald-500",
    icon: "onTime",
    iconTone: "bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400",
  },
  {
    id: "collaboration",
    label: "Collaboration",
    value: "14",
    sublabel: "Updates from your team",
    deltaLabel: "Today",
    trend: [6, 8, 7, 9, 10, 9, 11, 10, 12, 11, 13, 14],
    trendColor: "text-purple-500",
    icon: "collaboration",
    iconTone: "bg-purple-50 text-purple-500 dark:bg-purple-500/10 dark:text-purple-400",
  },
];

export interface EmployeeAiInsightData {
  id: string;
  icon: "target" | "trendUp" | "clock";
  iconTone: string;
  eyebrow: string;
  title: string;
  detail: string;
  actionLabel?: string;
}

export const employeeAiInsights: EmployeeAiInsightData[] = [
  {
    id: "eai-1",
    icon: "target",
    iconTone: "bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400",
    eyebrow: "Your #1 focus today",
    title: "Prepare Artwork for Q3 Campaign",
    detail: "Will finish on time if you start within the next 2 hours.",
    actionLabel: "Start now",
  },
  {
    id: "eai-2",
    icon: "trendUp",
    iconTone: "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400",
    eyebrow: "Your work trend",
    title: "You're completing tasks 18% faster",
    detail: "Compared to the same period last month.",
  },
  {
    id: "eai-3",
    icon: "clock",
    iconTone: "bg-purple-50 text-purple-500 dark:bg-purple-500/10 dark:text-purple-400",
    eyebrow: "Your optimal work time",
    title: "Peak focus window: 10:00 – 12:00",
    detail: "Based on your last 3 weeks of activity.",
  },
];

export const employeePerformanceTrend = {
  xKey: "day",
  series: [
    { key: "completed", label: "Completed tasks", color: "#6366f1" },
    { key: "assigned", label: "Assigned tasks", color: "#10b981" },
  ],
  data: [
    { day: "Mon", completed: 4, assigned: 4 },
    { day: "Tue", completed: 6, assigned: 5 },
    { day: "Wed", completed: 9, assigned: 6 },
    { day: "Thu", completed: 12, assigned: 7 },
    { day: "Fri", completed: 11, assigned: 6 },
    { day: "Sat", completed: 17, assigned: 8 },
    { day: "Sun", completed: 13, assigned: 6 },
  ],
  summary: [
    { id: "completed", label: "Completed", value: "12", deltaLabel: "+3 from last week" },
    { id: "assigned", label: "Assigned", value: "15", deltaLabel: "+1 from last week" },
  ],
};

export interface RecommendedActionData {
  id: string;
  icon: "approve" | "update" | "template";
  iconTone: string;
  title: string;
  detail: string;
  actionLabel: string;
}

export const employeeRecommendedActions: RecommendedActionData[] = [
  {
    id: "rec-1",
    icon: "approve",
    iconTone: "bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400",
    title: "Review and Approve",
    detail: "1 item is awaiting your approval",
    actionLabel: "Go to task",
  },
  {
    id: "rec-2",
    icon: "update",
    iconTone: "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400",
    title: "Update Progress",
    detail: "Let your team know how it's going",
    actionLabel: "Update now",
  },
  {
    id: "rec-3",
    icon: "template",
    iconTone: "bg-purple-50 text-purple-500 dark:bg-purple-500/10 dark:text-purple-400",
    title: "Use a Template",
    detail: "Create a new task from a template",
    actionLabel: "Choose Template",
  },
];

export interface EmployeeActivityRow {
  id: string;
  name: string;
  action: string;
  target: string;
  timeAgo: string;
}

export const employeeIntelActivity: EmployeeActivityRow[] = [
  { id: "eia-1", name: "Fah F.", action: "uploaded file", target: "Q3 Campaign Brief.pdf", timeAgo: "1h ago" },
  { id: "eia-2", name: "Than T.", action: "commented on", target: "Prepare Artwork", timeAgo: "2h ago" },
  { id: "eia-3", name: "Pim C.", action: "updated status of", target: "Website Content", timeAgo: "3h ago" },
  { id: "eia-4", name: "Golf T.", action: "assigned you a task in", target: "Q3 Campaign", timeAgo: "5h ago" },
];

export type ProjectStatus = "On Track" | "At Risk";

export interface RelatedProjectData {
  id: string;
  icon: "target" | "share" | "sparkles" | "star";
  category: string;
  title: string;
  status: ProjectStatus;
  percent: number;
}

export const relatedProjects: RelatedProjectData[] = [
  { id: "rp-1", icon: "target", category: "Marketing", title: "Q3 Campaign", status: "On Track", percent: 78 },
  { id: "rp-2", icon: "share", category: "Marketing", title: "Website Redesign", status: "On Track", percent: 52 },
  { id: "rp-3", icon: "sparkles", category: "Cross-functional", title: "New Product Launch", status: "At Risk", percent: 35 },
  { id: "rp-4", icon: "star", category: "Marketing", title: "Brand Refresh", status: "On Track", percent: 60 },
];

export interface DocumentInsightData {
  id: string;
  title: string;
  updatedLabel: string;
}

export const documentInsights: DocumentInsightData[] = [
  { id: "di-1", title: "Q3 Campaign Brief.pdf", updatedLabel: "Updated 2h ago" },
  { id: "di-2", title: "Marketing OKR Q3", updatedLabel: "Updated 5h ago" },
  { id: "di-3", title: "Competitor Analysis", updatedLabel: "Updated 1 day ago" },
];

export interface ThingsToKnowItem {
  id: string;
  tag: string;
  title: string;
  detail: string;
  icon: "announcement" | "policy";
}

export const thingsToKnowToday: ThingsToKnowItem[] = [
  { id: "ttk-1", tag: "CEO Announcement", title: "Roadmap for ThunderOne's new product", detail: "09:15", icon: "announcement" },
  {
    id: "ttk-2",
    tag: "Policy Update",
    title: "Data Security Policy (new version)",
    detail: "Please read and acknowledge by Friday",
    icon: "policy",
  },
];
