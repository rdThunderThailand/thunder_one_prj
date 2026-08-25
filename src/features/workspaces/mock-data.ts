// R&D placeholder data for the Workspaces launcher (landing page at
// `/work-space`). Media Workspace, Asset Intelligence, and Thunder Care are
// real, open Apps (config/apps.tsx) — everything else here is a "coming
// soon" tile with no route behind it, same convention mission-control's
// WorkspacesRow uses.
//
// Media Workspace was briefly split into two tiles here — a disabled
// "Communication" and a working "Media Workspace" pointing at just its
// /assets sub-route — while the whole app was still branded "Communication"
// and temporarily closed pending a rename. Nie then had the entire app
// (routes + features/communication) renamed to media-workspace instead, so
// there's no more separate "Communication" identity to disable; it's back
// to one tile for one app (2026-08-25).
import { APPS } from "@/config/apps";

function appHref(appId: string): string {
  const app = APPS.find((a) => a.id === appId);
  if (!app) throw new Error(`workspaces/mock-data: no App registered for id "${appId}"`);
  return app.basePath;
}

export type WorkspaceIcon = "megaphone" | "image" | "box" | "users" | "headset" | "clipboard" | "chart";

export interface WorkspaceTileData {
  id: string;
  /** Present only for real Apps — everything else renders inert. */
  href?: string;
  icon: WorkspaceIcon;
  iconTone: string;
  name: string;
  description: string;
  status: { label: string; kind: "active" | "updated" };
  collaborators?: string[];
  collaboratorsOverflow?: number;
}

export const workspaceTiles: WorkspaceTileData[] = [
  {
    id: "media-workspace",
    href: appHref("media-workspace"),
    icon: "megaphone",
    iconTone: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
    name: "Media Workspace",
    description: "Plan, create, approve and publish media across every channel.",
    status: { label: "Active", kind: "active" },
    collaborators: ["Somchai P.", "Nida K."],
    collaboratorsOverflow: 8,
  },
  {
    id: "asset-intelligence",
    href: appHref("asset-intelligence"),
    icon: "box",
    iconTone: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    name: "Asset Intelligence",
    description: "Track assets, lifecycle, maintenance and compliance in real time.",
    status: { label: "Active", kind: "active" },
    collaborators: ["Somchai P.", "Nida K."],
    collaboratorsOverflow: 8,
  },
  {
    id: "crm",
    icon: "users",
    iconTone: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
    name: "CRM",
    description: "Manage leads, opportunities, customers and activities.",
    status: { label: "Updated 15 min ago", kind: "updated" },
  },
  {
    id: "thunder-care",
    href: appHref("thunder-care"),
    icon: "headset",
    iconTone: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    name: "Thunder Care",
    description: "IT support, service requests and device management.",
    status: { label: "Active", kind: "active" },
    collaborators: ["Somchai P.", "Nida K."],
    collaboratorsOverflow: 4,
  },
  {
    id: "projects",
    icon: "clipboard",
    iconTone: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
    name: "Projects",
    description: "Plan, track and deliver projects with milestones and tasks.",
    status: { label: "Updated 30 min ago", kind: "updated" },
  },
  {
    id: "analytics",
    icon: "chart",
    iconTone: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
    name: "Analytics",
    description: "Advanced analytics, dashboards and data exploration.",
    status: { label: "Active", kind: "active" },
  },
];

export interface RecentlyOpenedData {
  id: string;
  icon: WorkspaceIcon;
  iconTone: string;
  name: string;
  timeAgo: string;
}

export const recentlyOpened: RecentlyOpenedData[] = [
  { id: "r-1", icon: "megaphone", iconTone: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400", name: "Media Workspace", timeAgo: "2 min ago" },
  { id: "r-2", icon: "box", iconTone: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400", name: "Asset Intelligence", timeAgo: "1 hour ago" },
  { id: "r-3", icon: "users", iconTone: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400", name: "CRM", timeAgo: "2 hours ago" },
  { id: "r-4", icon: "chart", iconTone: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400", name: "Analytics", timeAgo: "Yesterday" },
];

export interface WorkspaceOverviewSegment {
  label: string;
  value: number;
  percentLabel: string;
  color: string;
}

export const workspaceOverview: { total: number; segments: WorkspaceOverviewSegment[] } = {
  total: 8,
  segments: [
    { label: "Active", value: 4, percentLabel: "50%", color: "#6366f1" },
    { label: "Updated today", value: 2, percentLabel: "25%", color: "#10b981" },
    { label: "Needs attention", value: 1, percentLabel: "12%", color: "#f59e0b" },
    { label: "Not used recently", value: 1, percentLabel: "12%", color: "#a855f7" },
  ],
};

export interface WorkspaceHealthRow {
  id: string;
  icon: WorkspaceIcon;
  iconTone: string;
  name: string;
  status: "Healthy" | "Needs attention";
}

export const workspaceHealth: WorkspaceHealthRow[] = [
  { id: "wh-media", icon: "megaphone", iconTone: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400", name: "Media Workspace", status: "Healthy" },
  { id: "wh-asset", icon: "box", iconTone: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400", name: "Asset Intelligence", status: "Healthy" },
  { id: "wh-crm", icon: "users", iconTone: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400", name: "CRM", status: "Needs attention" },
  { id: "wh-thunder-care", icon: "headset", iconTone: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400", name: "Thunder Care", status: "Healthy" },
];

export interface QuickActionData {
  id: string;
  icon: "headset" | "users" | "shield" | "settings";
  label: string;
}

export const quickActions: QuickActionData[] = [
  { id: "qa-request", icon: "headset", label: "Request new workspace" },
  { id: "qa-give-access", icon: "users", label: "Give workspace access" },
  { id: "qa-manage-access", icon: "shield", label: "Manage workspace access" },
  { id: "qa-settings", icon: "settings", label: "Workspace settings" },
];

// --- Manager Workspaces (the department_admin / manager_it_asset variant of
// this page — config/rbac.ts's resolveShellVariant) — a workspace directory
// (categories, pinning, per-workspace role badge) rather than the CEO
// variant's health/overview-dashboard shape above, so it's separate,
// purpose-built mock content matching the reference mockup exactly (Nie,
// 2026-08-25). Same "Marketing Manager" persona/team as the other manager
// variants. Media (→ /media-workspace) and Operations (→ /thunder-care,
// Thunder Care's real basePath) are real routes — everything else here is
// inert, same "coming soon" convention as the CEO variant.

export type ManagerWorkspaceIcon = "megaphone" | "image" | "users" | "clipboard" | "settings" | "chart" | "box" | "grid";
export type ManagerWorkspaceRole = "Editor" | "User" | "Member" | "Viewer" | "Admin";

export const managerWorkspaceCategories = [
  "All",
  "Communication",
  "Customer",
  "Project",
  "Operations",
  "Tools",
  "Finance",
] as const;

export interface ManagerWorkspaceTileData {
  id: string;
  href?: string;
  icon: ManagerWorkspaceIcon;
  iconTone: string;
  category: (typeof managerWorkspaceCategories)[number];
  name: string;
  description: string;
  members: string[];
  membersOverflow: number;
  roleLabel: ManagerWorkspaceRole;
}

export const managerWorkspaceTiles: ManagerWorkspaceTileData[] = [
  {
    id: "mw-media",
    href: "/media-workspace",
    icon: "megaphone",
    iconTone: "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
    category: "Communication",
    name: "Media Workspace",
    description: "Company-wide media: campaigns, channels, playlists, and announcements.",
    members: ["Ploy S.", "Tan T.", "Fah F."],
    membersOverflow: 12,
    roleLabel: "Editor",
  },
  {
    id: "mw-crm",
    icon: "users",
    iconTone: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    category: "Customer",
    name: "CRM Workspace",
    description: "Manage customers, sales opportunities, and follow-ups.",
    members: ["Ploy S.", "Tan T.", "Fah F."],
    membersOverflow: 15,
    roleLabel: "User",
  },
  {
    id: "mw-project",
    icon: "clipboard",
    iconTone: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
    category: "Project",
    name: "Project Workspace",
    description: "Manage projects, tasks, and team progress.",
    members: ["Tan T.", "Golf T.", "Pim C."],
    membersOverflow: 9,
    roleLabel: "Member",
  },
  {
    // Was missing entirely (Nie, 2026-08-25) — this list was built around
    // the "Marketing Manager" reference mockup and never accounted for
    // manager_it_asset, who should see this above all else: it's their own
    // domain, and it's a real, working App (config/apps.tsx).
    id: "mw-asset-intelligence",
    href: "/asset-intelligence",
    icon: "box",
    iconTone: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    category: "Operations",
    name: "Asset Intelligence",
    description: "Track assets, lifecycle, maintenance and compliance in real time.",
    members: ["Ploy S.", "Golf T.", "Pim C."],
    membersOverflow: 8,
    roleLabel: "Admin",
  },
  {
    id: "mw-operations",
    href: "/thunder-care",
    icon: "settings",
    iconTone: "bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400",
    category: "Operations",
    name: "Operations Workspace",
    description: "Track operations, service requests, and field work.",
    members: ["Fah F.", "Golf T.", "Pim C."],
    membersOverflow: 18,
    roleLabel: "User",
  },
  {
    id: "mw-analytics",
    icon: "chart",
    iconTone: "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
    category: "Tools",
    name: "Analytics Workspace",
    description: "Dashboards, reports, and in-depth analysis.",
    members: ["Ploy S.", "Tan T."],
    membersOverflow: 6,
    roleLabel: "Viewer",
  },
  {
    id: "mw-document",
    icon: "box",
    iconTone: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
    category: "Tools",
    name: "Document Workspace",
    description: "Store documents, templates, and route document approvals.",
    members: ["Fah F.", "Pim C."],
    membersOverflow: 11,
    roleLabel: "Editor",
  },
  {
    id: "mw-tools",
    icon: "grid",
    iconTone: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
    category: "Tools",
    name: "Tools & Integrations",
    description: "Add-on tools, plugins, and system integrations.",
    members: ["Golf T."],
    membersOverflow: 5,
    roleLabel: "Admin",
  },
];

export interface PinnedWorkspaceData {
  id: string;
  icon: ManagerWorkspaceIcon;
  label: string;
  href?: string;
}

export const pinnedWorkspaces: PinnedWorkspaceData[] = [
  { id: "pin-media", icon: "megaphone", label: "Media Workspace", href: "/media-workspace" },
  { id: "pin-project", icon: "clipboard", label: "Project" },
  { id: "pin-analytics", icon: "chart", label: "Analytics" },
  { id: "pin-my-work", icon: "users", label: "My Work", href: "/my-work" },
];

export interface ManagerRecentlyOpenedData {
  id: string;
  icon: ManagerWorkspaceIcon;
  label: string;
  countLabel: string;
}

export const managerRecentlyOpened: ManagerRecentlyOpenedData[] = [
  { id: "mro-1", icon: "megaphone", label: "Media Workspace", countLabel: "2 opened" },
  { id: "mro-2", icon: "clipboard", label: "Project", countLabel: "15 opened" },
  { id: "mro-3", icon: "chart", label: "Analytics", countLabel: "1 opened" },
  { id: "mro-4", icon: "users", label: "CRM", countLabel: "2 opened" },
  { id: "mro-5", icon: "box", label: "Document", countLabel: "3 opened" },
];

export interface QuickAccessItemData {
  id: string;
  icon: "campaign" | "upload" | "task" | "reports" | "calendar" | "approvals";
  label: string;
  badge?: number;
}

export const managerQuickAccess: QuickAccessItemData[] = [
  { id: "qa2-1", icon: "campaign", label: "Create Campaign" },
  { id: "qa2-2", icon: "upload", label: "Upload Media" },
  { id: "qa2-3", icon: "task", label: "Create Task" },
  { id: "qa2-4", icon: "reports", label: "View Reports" },
  { id: "qa2-5", icon: "calendar", label: "Team Calendar" },
  { id: "qa2-6", icon: "approvals", label: "Approvals", badge: 3 },
];

export interface ManagerWorkspaceActivityData {
  id: string;
  name: string;
  action: string;
  workspace: string;
  file: string;
  timeAgo: string;
}

export const managerWorkspaceActivity: ManagerWorkspaceActivityData[] = [
  { id: "mact-1", name: "Pim C.", action: "uploaded to", workspace: "Media Workspace", file: "Q3 Campaign Visual.jpg", timeAgo: "15 min ago" },
  { id: "mact-2", name: "Tan T.", action: "updated status in", workspace: "Project Workspace", file: "Website Redesign → In Review", timeAgo: "35 min ago" },
  { id: "mact-3", name: "Fah F.", action: "sent a message in", workspace: "Media Workspace", file: "Q3 Product Launch", timeAgo: "1 hour ago" },
  { id: "mact-4", name: "Golf T.", action: "added a document to", workspace: "Document Workspace", file: "Marketing Budget Q3.xlsx", timeAgo: "2 hours ago" },
];

// --- Employee Workspaces (the operator/employee_media "employee" variant of
// this page — config/rbac.ts's resolveShellVariant) — the same directory
// shape as the manager variant above (search, categories, grid/list), but
// without Pinned Workspaces (not in the reference mockup for this persona)
// and with a "More Workspaces" tile in place of Tools & Integrations,
// matching the reference mockup exactly (Nie, 2026-08-25). Same "Ploy S." /
// Marketing persona as this feature's other employee variants. Unlike the
// manager variant, Communication and Media are shown as two separate tiles
// here (per the mockup) — both point into the real media-workspace App, at
// its /channels and /assets sub-routes respectively, rather than being one
// dead "coming soon" tile duplicating Media Workspace's purpose.

export const employeeWorkspaceCategories = ["All", "Communication", "Customer", "Project", "Operations", "Tools"] as const;

export interface EmployeeWorkspaceTileData {
  id: string;
  href?: string;
  icon: ManagerWorkspaceIcon;
  iconTone: string;
  category: (typeof employeeWorkspaceCategories)[number];
  name: string;
  description: string;
  members: string[];
  membersOverflow: number;
  roleLabel: ManagerWorkspaceRole;
}

export const employeeWorkspaceTiles: EmployeeWorkspaceTileData[] = [
  {
    id: "ew-communication",
    href: "/media-workspace/channels",
    icon: "megaphone",
    iconTone: "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
    category: "Communication",
    name: "Communication Workspace",
    description: "Create and send messages, news, and campaigns across every channel.",
    members: ["Ploy S.", "Tan T.", "Fah F."],
    membersOverflow: 8,
    roleLabel: "Editor",
  },
  {
    id: "ew-media",
    href: "/media-workspace/assets",
    icon: "image",
    iconTone: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
    category: "Communication",
    name: "Media Workspace",
    description: "Manage digital media, the asset library, playlists, and publishing.",
    members: ["Ploy S.", "Golf T."],
    membersOverflow: 5,
    roleLabel: "Editor",
  },
  {
    id: "ew-crm",
    icon: "users",
    iconTone: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    category: "Customer",
    name: "CRM Workspace",
    description: "Manage customers, sales opportunities, and follow-ups.",
    members: ["Tan T.", "Fah F."],
    membersOverflow: 6,
    roleLabel: "User",
  },
  {
    id: "ew-project",
    icon: "clipboard",
    iconTone: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
    category: "Project",
    name: "Project Workspace",
    description: "Manage projects, tasks, and team progress.",
    members: ["Ploy S.", "Golf T."],
    membersOverflow: 7,
    roleLabel: "Member",
  },
  {
    id: "ew-operations",
    href: "/thunder-care",
    icon: "settings",
    iconTone: "bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400",
    category: "Operations",
    name: "Operations Workspace",
    description: "Track operational tasks, service requests, and day-to-day operations.",
    members: ["Fah F.", "Pim C."],
    membersOverflow: 4,
    roleLabel: "User",
  },
  {
    id: "ew-analytics",
    icon: "chart",
    iconTone: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400",
    category: "Tools",
    name: "Analytics Workspace",
    description: "Dashboards, reports, and in-depth data analysis.",
    members: ["Ploy S.", "Tan T."],
    membersOverflow: 3,
    roleLabel: "Viewer",
  },
  {
    id: "ew-documents",
    icon: "box",
    iconTone: "bg-yellow-50 text-yellow-600 dark:bg-yellow-500/10 dark:text-yellow-400",
    category: "Tools",
    name: "Documents Workspace",
    description: "Store documents, templates, and route document approvals.",
    members: ["Golf T.", "Pim C."],
    membersOverflow: 6,
    roleLabel: "Editor",
  },
];

/** Not a real workspace — always rendered last, un-filtered, with a "View
 * All" action rather than "Open Workspace". */
export const employeeMoreWorkspacesTile = {
  icon: "grid" as ManagerWorkspaceIcon,
  iconTone: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
  name: "More Workspaces",
  description: "See all the workspaces you have access to.",
};

export const employeeQuickAccess: QuickAccessItemData[] = [
  { id: "eqa-1", icon: "campaign", label: "Create Campaign" },
  { id: "eqa-2", icon: "upload", label: "Upload Media" },
  { id: "eqa-3", icon: "task", label: "Create Task" },
  { id: "eqa-4", icon: "reports", label: "View Reports" },
  { id: "eqa-5", icon: "calendar", label: "Calendar" },
];

export interface WorkspaceAnnouncementData {
  id: string;
  tag: string;
  tagTone: string;
  icon: "megaphone" | "policy" | "system";
  iconTone: string;
  title: string;
  timeLabel: string;
}

export const workspaceAnnouncements: WorkspaceAnnouncementData[] = [
  {
    id: "wa-1",
    tag: "CEO Announcement",
    tagTone: "text-indigo-600 dark:text-indigo-400",
    icon: "megaphone",
    iconTone: "bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400",
    title: "Roadmap for ThunderOne's new product",
    timeLabel: "Today, 09:15",
  },
  {
    id: "wa-2",
    tag: "Policy Update",
    tagTone: "text-amber-600 dark:text-amber-400",
    icon: "policy",
    iconTone: "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400",
    title: "Data Security Policy (new version)",
    timeLabel: "Please read and acknowledge by Friday",
  },
  {
    id: "wa-3",
    tag: "System Update",
    tagTone: "text-blue-600 dark:text-blue-400",
    icon: "system",
    iconTone: "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400",
    title: "System will be down for maintenance this Saturday",
    timeLabel: "23 Aug 2025, 22:00 – 02:00",
  },
];

export const employeeRecentlyOpened: ManagerRecentlyOpenedData[] = [
  { id: "ero-1", icon: "megaphone", label: "Communication Workspace", countLabel: "2 min ago" },
  { id: "ero-2", icon: "image", label: "Media Workspace", countLabel: "15 min ago" },
  { id: "ero-3", icon: "clipboard", label: "Project Workspace", countLabel: "1 hour ago" },
  { id: "ero-4", icon: "chart", label: "Analytics Workspace", countLabel: "3 hours ago" },
  { id: "ero-5", icon: "users", label: "CRM Workspace", countLabel: "Yesterday, 10:30" },
];
