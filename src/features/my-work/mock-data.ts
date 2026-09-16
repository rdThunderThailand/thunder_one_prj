// R&D placeholder data for the "My Work" cross-App rollup (requirement doc
// consequence #11 of ADR-0033) — no cross-App data-sourcing design exists
// yet, so this is a self-contained mock queue rather than one derived from
// other features' mock data.

export type WorkItemType = "task" | "approval" | "inbox" | "draft" | "delegated";
export type WorkItemGroup = "overdue" | "due-today" | "upcoming";
export type WorkItemIcon = "megaphone" | "users" | "check" | "budget" | "calendar" | "feedback";
export type Priority = "High" | "Medium" | "Low";

export interface WorkItemData {
  id: string;
  type: WorkItemType;
  icon: WorkItemIcon;
  title: string;
  priority: Priority;
  category: string;
  team: string;
  group: WorkItemGroup;
  dueNote: string;
  dueTone: "red" | "amber" | "zinc";
  relatedTitle: string;
  relatedSubtitle: string;
  collaborators: string[];
  collaboratorsOverflow?: number;
  actionLabel: "Review" | "Open";
}

export const workItems: WorkItemData[] = [
  {
    id: "wi-1",
    type: "approval",
    icon: "megaphone",
    title: "Approve Q3 Product Launch Campaign",
    priority: "High",
    category: "Campaign",
    team: "Marketing Team",
    group: "overdue",
    dueNote: "Overdue by 2 days • Due 22 Aug 2025",
    dueTone: "red",
    relatedTitle: "Q3 Product Launch",
    relatedSubtitle: "Campaign",
    collaborators: ["Somchai P.", "Nida K.", "Arthit W."],
    collaboratorsOverflow: 2,
    actionLabel: "Review",
  },
  {
    id: "wi-2",
    type: "approval",
    icon: "users",
    title: "Confirm Additional Field Resources",
    priority: "Medium",
    category: "Field Operations",
    team: "Operations Team",
    group: "overdue",
    dueNote: "Overdue by 1 day • Due 23 Aug 2025",
    dueTone: "red",
    relatedTitle: "Field Operations",
    relatedSubtitle: "Request",
    collaborators: ["Somchai P.", "Nida K."],
    collaboratorsOverflow: 1,
    actionLabel: "Review",
  },
  {
    id: "wi-3",
    type: "approval",
    icon: "check",
    title: "Review ThunderOne Announcement",
    priority: "Medium",
    category: "Corporate Communication",
    team: "Comms Team",
    group: "due-today",
    dueNote: "Due today, 24 Aug 2025",
    dueTone: "amber",
    relatedTitle: "ThunderOne Announcement",
    relatedSubtitle: "Publication",
    collaborators: ["Somchai P.", "Nida K."],
    collaboratorsOverflow: 1,
    actionLabel: "Review",
  },
  {
    id: "wi-4",
    type: "approval",
    icon: "budget",
    title: "Approve Budget Reallocation",
    priority: "High",
    category: "Finance",
    team: "Finance Team",
    group: "due-today",
    dueNote: "Due today, 24 Aug 2025",
    dueTone: "amber",
    relatedTitle: "Budget Adjustment Q3",
    relatedSubtitle: "Finance Request",
    collaborators: ["Somchai P.", "Nida K.", "Arthit W."],
    actionLabel: "Review",
  },
  {
    id: "wi-5",
    type: "task",
    icon: "calendar",
    title: "Confirm Meeting: Board Review",
    priority: "Low",
    category: "Executive Office",
    team: "Board Secretariat",
    group: "due-today",
    dueNote: "Due today, 24 Aug 2025",
    dueTone: "amber",
    relatedTitle: "Board Review Meeting",
    relatedSubtitle: "Meeting",
    collaborators: [],
    actionLabel: "Open",
  },
  {
    id: "wi-6",
    type: "inbox",
    icon: "feedback",
    title: "Provide Feedback: New Feature Brief",
    priority: "Low",
    category: "Product Team",
    team: "Product Management",
    group: "upcoming",
    dueNote: "Due 26 Aug 2025",
    dueTone: "zinc",
    relatedTitle: "New Feature Brief",
    relatedSubtitle: "Product Brief",
    collaborators: ["Somchai P.", "Nida K.", "Arthit W."],
    actionLabel: "Review",
  },
];

// "Upcoming (4+)" — more upcoming items exist than the one rendered here;
// this mock queue only fleshes out the visible rows.
export const upcomingCountLabel = "4+";

export interface WorkStatTileData {
  id: string;
  label: string;
  value: number;
  icon: "tasks" | "approvals" | "inbox" | "drafts" | "delegated";
  sublabel: string;
  note: string;
  noteTone: "red" | "amber" | "blue" | "zinc";
}

export const workStatTiles: WorkStatTileData[] = [
  { id: "tasks", label: "Tasks", value: 6, icon: "tasks", sublabel: "To do", note: "2 overdue", noteTone: "red" },
  {
    id: "approvals",
    label: "Approvals",
    value: 3,
    icon: "approvals",
    sublabel: "Waiting for you",
    note: "1 due today",
    noteTone: "amber",
  },
  { id: "inbox", label: "Inbox", value: 7, icon: "inbox", sublabel: "Unread", note: "2 high priority", noteTone: "red" },
  {
    id: "drafts",
    label: "Drafts",
    value: 3,
    icon: "drafts",
    sublabel: "In progress",
    note: "2 updated",
    noteTone: "blue",
  },
  {
    id: "delegated",
    label: "Delegated to Me",
    value: 4,
    icon: "delegated",
    sublabel: "New tasks",
    note: "1 due today",
    noteTone: "amber",
  },
];

export interface ScheduleRowData {
  id: string;
  time: string;
  title: string;
  note?: string;
  dot: "indigo" | "zinc";
  badge?: { label: string; tone: "now" | "upcoming" };
}

export const todaysSchedule: ScheduleRowData[] = [
  { id: "s-1", time: "09:30", title: "Management Daily", dot: "indigo", badge: { label: "In 15 min", tone: "now" } },
  { id: "s-2", time: "13:00", title: "Customer Meeting", dot: "indigo" },
  { id: "s-3", time: "16:00", title: "Product Review", dot: "indigo" },
  { id: "s-4", time: "All day", title: "Focus time", note: "No meetings", dot: "zinc" },
];

export interface WorkSummarySegment {
  label: string;
  value: number;
  color: string;
}

export const workSummary: { total: number; segments: WorkSummarySegment[] } = {
  total: 16,
  segments: [
    { label: "Overdue", value: 2, color: "#ef4444" },
    { label: "Due today", value: 3, color: "#f59e0b" },
    { label: "Upcoming", value: 6, color: "#6366f1" },
    { label: "No due date", value: 5, color: "#a1a1aa" },
  ],
};

export interface QuickFilterData {
  id: string;
  label: string;
  count: number;
  icon: "warning" | "calendar" | "delegated" | "waiting" | "check";
  tone: "red" | "blue" | "indigo" | "zinc" | "emerald";
}

export const quickFilters: QuickFilterData[] = [
  { id: "high-priority", label: "High priority", count: 4, icon: "warning", tone: "red" },
  { id: "due-today", label: "Due today", count: 3, icon: "calendar", tone: "blue" },
  { id: "overdue", label: "Overdue", count: 2, icon: "warning", tone: "red" },
  { id: "delegated", label: "Delegated to me", count: 4, icon: "delegated", tone: "indigo" },
  { id: "waiting", label: "Waiting on others", count: 5, icon: "waiting", tone: "zinc" },
  { id: "completed", label: "Completed", count: 12, icon: "check", tone: "emerald" },
];

export interface CompletedItemData {
  id: string;
  title: string;
  completedOn: string;
}

export const recentlyCompleted: CompletedItemData[] = [
  { id: "c-1", title: "Approve Service Update Campaign", completedOn: "Completed 22 Aug 2025" },
  { id: "c-2", title: "Review Monthly Financial Report", completedOn: "Completed 21 Aug 2025" },
  { id: "c-3", title: "Confirm Venue for Town Hall", completedOn: "Completed 21 Aug 2025" },
];

// --- Manager My Work (department_admin / manager_it_asset variant of this
// same page — config/rbac.ts's resolveShellVariant) — a task table rather
// than the CEO variant's queue-of-approvals shape above, so it's separate,
// clearly-scoped placeholder content rather than reshaping workItems to fit
// two different designs. Reuses the same "Marketing Manager" persona/team
// as ManagerMissionControlPage (features/asset-intelligence/departments)
// for consistency, since both were sourced from the same reference mockups.

export interface ManagerWorkStatTileData {
  id: string;
  label: string;
  value: string;
  sublabel: string;
  icon: "pending" | "dueSoon" | "overdue" | "completed" | "progress";
  color: "indigo" | "amber" | "red" | "emerald" | "blue";
}

export const managerWorkStatTiles: ManagerWorkStatTileData[] = [
  { id: "due-pending", label: "8", value: "8", sublabel: "Due & Pending", icon: "pending", color: "indigo" },
  { id: "due-soon", label: "3", value: "3", sublabel: "Due within 2 days", icon: "dueSoon", color: "amber" },
  { id: "overdue", label: "1", value: "1", sublabel: "Overdue", icon: "overdue", color: "red" },
  { id: "completed", label: "12", value: "12", sublabel: "Completed", icon: "completed", color: "emerald" },
  { id: "week-progress", label: "68%", value: "68%", sublabel: "This Week", icon: "progress", color: "blue" },
];

export type ManagerTaskStatus = "In Progress" | "Pending Approval" | "To Do" | "Waiting on Others" | "Overdue";

export interface ManagerTaskRow {
  id: string;
  title: string;
  assignees: string[];
  assigneesOverflow?: number;
  project: string;
  workspace: string;
  priority: Priority;
  status: ManagerTaskStatus;
  dueDate: string;
  dueTime: string;
  flagged?: boolean;
}

export const managerTasks: ManagerTaskRow[] = [
  {
    id: "mt-1",
    title: "Review Q3 Campaign Brief",
    assignees: ["Ploy S.", "Tan T."],
    assigneesOverflow: 2,
    project: "Q3 Marketing Campaign",
    workspace: "Media Workspace",
    priority: "High",
    status: "In Progress",
    dueDate: "24 Aug",
    dueTime: "11:00",
  },
  {
    id: "mt-2",
    title: "Approve Influencer Collaboration",
    assignees: ["Tan T."],
    project: "Influencer Campaign",
    workspace: "Media Workspace",
    priority: "High",
    status: "Pending Approval",
    dueDate: "25 Aug",
    dueTime: "17:00",
  },
  {
    id: "mt-3",
    title: "Update Website Banner",
    assignees: ["Fah F."],
    project: "Website Redesign",
    workspace: "Customer",
    priority: "Medium",
    status: "To Do",
    dueDate: "26 Aug",
    dueTime: "23:59",
  },
  {
    id: "mt-4",
    title: "Prepare Campaign Performance Report",
    assignees: ["Golf T."],
    project: "Q2 Campaign Review",
    workspace: "Media Workspace",
    priority: "Medium",
    status: "To Do",
    dueDate: "27 Aug",
    dueTime: "23:59",
  },
  {
    id: "mt-5",
    title: "Content Approval: TikTok Campaign",
    assignees: ["Pim C."],
    project: "TikTok Campaign",
    workspace: "Media Workspace",
    priority: "Medium",
    status: "Waiting on Others",
    dueDate: "28 Aug",
    dueTime: "12:00",
  },
  {
    id: "mt-6",
    title: "Submit Budget Reallocation Request",
    assignees: ["Ploy S."],
    project: "Q3 Marketing Campaign",
    workspace: "Media Workspace",
    priority: "High",
    status: "Overdue",
    dueDate: "22 Aug",
    dueTime: "18:00",
    flagged: true,
  },
];

export const managerTasksTotalCount = 8;

export interface ManagerTabData {
  id: string;
  label: string;
  count?: number;
}

export const managerWorkTabs: ManagerTabData[] = [
  { id: "my-tasks", label: "My Tasks" },
  { id: "pending-approvals", label: "Pending Approvals", count: 3 },
  { id: "assigned-by-me", label: "Assigned by Me" },
  { id: "following", label: "Following" },
  { id: "saved", label: "Saved" },
];

export interface CalendarRowData {
  id: string;
  time: string;
  title: string;
  subtitle: string;
  icon: "team" | "campaign" | "customer" | "townhall";
}

export const managerCalendar: CalendarRowData[] = [
  { id: "cal-1", time: "09:30", title: "Daily Team Call", subtitle: "Online Meeting", icon: "team" },
  { id: "cal-2", time: "11:00", title: "Q3 Campaign Review", subtitle: "Meeting Room 2", icon: "campaign" },
  { id: "cal-3", time: "14:00", title: "Customer Meeting", subtitle: "Zoom Meeting", icon: "customer" },
  { id: "cal-4", time: "16:00", title: "CEO Town Hall", subtitle: "Live Stream", icon: "townhall" },
];

export interface ManagerQuickActionData {
  id: string;
  label: string;
  icon: "createTask" | "uploadMedia" | "sendMessage" | "requestApproval";
}

export const managerQuickActions: ManagerQuickActionData[] = [
  { id: "create-task", label: "Create Task", icon: "createTask" },
  { id: "upload-media", label: "Upload Media", icon: "uploadMedia" },
  { id: "send-message", label: "Send Message", icon: "sendMessage" },
  { id: "request-approval", label: "Request Approval", icon: "requestApproval" },
];

export interface RecentDocumentData {
  id: string;
  title: string;
  openedLabel: string;
  icon: "slides" | "sheet" | "pdf";
}

export const recentDocuments: RecentDocumentData[] = [
  { id: "doc-1", title: "Q3 Campaign Plan_v1.2.pptx", openedLabel: "Opened 1h ago", icon: "slides" },
  { id: "doc-2", title: "Marketing OKR Q3.xlsx", openedLabel: "Opened 3h ago", icon: "sheet" },
  { id: "doc-3", title: "Brand Guidelines 2025.pdf", openedLabel: "Opened yesterday", icon: "pdf" },
];

export interface MyGoalData {
  id: string;
  title: string;
  detail: string;
  percent?: number;
  current?: string;
}

// Same two goals as ManagerMissionControlPage's teamGoals (features/asset-intelligence/departments) —
// deliberately kept in sync by hand since they're the same manager's goals shown on two pages;
// not shared as one module because the two features don't otherwise depend on each other.
export const myGoals: MyGoalData[] = [
  { id: "mg-1", title: "Q3 Marketing Campaign Success", detail: "Target: 90%", percent: 78 },
  { id: "mg-2", title: "Lead Generation", detail: "Target: 1,200 Leads", percent: 70, current: "840 / 1,200" },
];

// --- Employee My Work (the operator/employee_media "employee" variant of
// this page — config/rbac.ts's resolveShellVariant) — a personal task list
// (Do First, My Tasks, Waiting on Others) rather than the manager variant's
// table-of-everyone shape above, so it's separate, purpose-built mock
// content matching the reference mockup exactly (Nie, 2026-08-25). Same
// "Ploy S." / Marketing persona as Mission Control's employee variant
// (features/asset-intelligence/departments) — not shared as one module
// since the two features don't otherwise depend on each other.

export interface EmployeeWorkStatTileData {
  id: string;
  label: string;
  value: number;
  sublabel: string;
  icon: "dueToday" | "upcoming" | "waiting" | "completed";
  color: "indigo" | "amber" | "purple" | "emerald";
}

export const employeeWorkStatTiles: EmployeeWorkStatTileData[] = [
  { id: "due-today", label: "Due Today", value: 3, sublabel: "Due today", icon: "dueToday", color: "indigo" },
  { id: "upcoming", label: "Upcoming", value: 2, sublabel: "Upcoming", icon: "upcoming", color: "amber" },
  { id: "waiting", label: "Waiting on Others", value: 1, sublabel: "Waiting on others", icon: "waiting", color: "purple" },
  { id: "completed", label: "Completed This Week", value: 5, sublabel: "Completed this week", icon: "completed", color: "emerald" },
];

export const doFirstTask = {
  priority: "High Priority" as const,
  title: "Prepare Q3 Campaign Artwork",
  subtitle: "Prepare the artwork for the Q3 campaign",
  dueLabel: "Due today 11:00",
  project: "Q3 Campaign",
  assignees: ["Ploy S.", "Tan T.", "Fah F."],
  assigneesOverflow: 2,
  percent: 40,
  actionLabel: "Start Work",
};

export type EmployeeTaskStatus = "In Progress" | "To Do";

export interface EmployeeTaskRow {
  id: string;
  time: string;
  dueLabel: string;
  title: string;
  status: EmployeeTaskStatus;
  project: string;
  assignee: string;
  assigneesExtra?: string[];
  assigneesOverflow?: number;
}

export const employeeTasksToday: EmployeeTaskRow[] = [
  {
    id: "et-1",
    time: "11:00",
    dueLabel: "Due today",
    title: "Prepare Q3 Campaign Artwork",
    status: "In Progress",
    project: "Q3 Campaign",
    assignee: "Ploy S.",
    assigneesExtra: ["Tan T.", "Fah F."],
    assigneesOverflow: 2,
  },
  {
    id: "et-2",
    time: "14:00",
    dueLabel: "Due today",
    title: "Update Customer Content",
    status: "To Do",
    project: "Website & Content",
    assignee: "Pim C.",
  },
  {
    id: "et-3",
    time: "16:00",
    dueLabel: "Due today",
    title: "Submit Weekly Report",
    status: "To Do",
    project: "Weekly Report",
    assignee: "Manager",
  },
];

export const employeeTaskTabs = ["Today", "Upcoming", "Completed", "All Tasks"] as const;

export interface WaitingOnOthersItem {
  id: string;
  title: string;
  subtitle: string;
  requestedOn: string;
  statusLabel: string;
  person: string;
}

export const waitingOnOthers: WaitingOnOthersItem[] = [
  {
    id: "woo-1",
    title: "Product Brief",
    subtitle: "Waiting for manager approval",
    requestedOn: "Requested on 21 Aug 2025",
    statusLabel: "Waiting for approval",
    person: "Marketing Manager",
  },
];

export interface EmployeeScheduleRow {
  id: string;
  time: string;
  title: string;
  subtitle: string;
}

export const employeeMyWorkSchedule: EmployeeScheduleRow[] = [
  { id: "ews-1", time: "09:30", title: "Daily Team Call", subtitle: "Online Meeting" },
  { id: "ews-2", time: "11:00", title: "Q3 Campaign Review", subtitle: "Meeting Room 2" },
  { id: "ews-3", time: "14:00", title: "Customer Meeting", subtitle: "Zoom Meeting" },
  { id: "ews-4", time: "16:00", title: "CEO Town Hall", subtitle: "Live Stream" },
];

export interface ImportantForYouItem {
  id: string;
  tag: string;
  title: string;
  detail: string;
  icon: "announcement" | "policy";
}

export const importantForYou: ImportantForYouItem[] = [
  {
    id: "ify-1",
    tag: "CEO Announcement",
    title: "Roadmap for ThunderOne's new product",
    detail: "Today, 09:15",
    icon: "announcement",
  },
  {
    id: "ify-2",
    tag: "Policy Update",
    title: "Data Security Policy (new version)",
    detail: "Please read and acknowledge by Friday",
    icon: "policy",
  },
];

export interface EmployeeQuickActionData {
  id: string;
  icon: "createTask" | "uploadFile" | "sendMessage" | "logTime";
  label: string;
}

export const employeeQuickActions: EmployeeQuickActionData[] = [
  { id: "eqa-1", icon: "createTask", label: "Create Task" },
  { id: "eqa-2", icon: "uploadFile", label: "Upload File" },
  { id: "eqa-3", icon: "sendMessage", label: "Send Message" },
  { id: "eqa-4", icon: "logTime", label: "Log Time" },
];
