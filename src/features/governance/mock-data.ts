// R&D placeholder data for the department_admin / manager_it_asset
// ("manager") variant of Governance — config/rbac.ts's resolveShellVariant.
// No CEO variant exists yet (the shell route still falls back to the old
// "Not built yet" stub for every other role) — matches the reference
// mockup exactly (Nie, 2026-08-25). Same "Marketing Manager" persona/team
// as the other manager variants, no backend yet.

export interface GovernanceStatTileData {
  id: string;
  label: string;
  value: string;
  sublabel: string;
  deltaLabel?: string;
  icon: "shield" | "checkCircle" | "warning" | "document" | "users";
  color: "indigo" | "emerald" | "amber" | "purple" | "blue";
  linkLabel: string;
}

export const governanceStatTiles: GovernanceStatTileData[] = [
  { id: "policies", label: "Active Policies", value: "24", sublabel: "Active Policies", icon: "shield", color: "indigo", linkLabel: "View all" },
  {
    id: "compliance",
    label: "Policy Compliance",
    value: "92%",
    sublabel: "vs last 30 days",
    deltaLabel: "▲ 5%",
    icon: "checkCircle",
    color: "emerald",
    linkLabel: "View details",
  },
  {
    id: "risks",
    label: "Risks to Manage",
    value: "7",
    sublabel: "High / Medium",
    deltaLabel: "▲ 2 items",
    icon: "warning",
    color: "amber",
    linkLabel: "View all",
  },
  { id: "approvals", label: "Pending Approvals", value: "12", sublabel: "Pending Approvals", icon: "document", color: "purple", linkLabel: "View list" },
  {
    id: "training",
    label: "Training Completion",
    value: "86%",
    sublabel: "Completion Rate",
    deltaLabel: "▲ 7%",
    icon: "users",
    color: "blue",
    linkLabel: "View details",
  },
];

export interface ComplianceAreaData {
  id: string;
  label: string;
  percent: number;
}

export const complianceByArea: ComplianceAreaData[] = [
  { id: "ca-1", label: "Information Security", percent: 96 },
  { id: "ca-2", label: "Data Privacy (PDPA)", percent: 94 },
  { id: "ca-3", label: "Finance & Accounting", percent: 92 },
  { id: "ca-4", label: "People & Culture", percent: 88 },
  { id: "ca-5", label: "Vendor Management", percent: 84 },
  { id: "ca-6", label: "Operations", percent: 81 },
];

export const riskOverview = {
  total: 14,
  segments: [
    { label: "High Risk", value: 3, color: "#ef4444" },
    { label: "Medium Risk", value: 7, color: "#f59e0b" },
    { label: "Low Risk", value: 4, color: "#10b981" },
    { label: "Accepted Risk", value: 0, color: "#a1a1aa" },
  ],
};

export interface InternalControlRow {
  id: string;
  label: string;
  value: number;
}

export const internalControlStatus: InternalControlRow[] = [
  { id: "ic-1", label: "Controls in Place", value: 38 },
  { id: "ic-2", label: "Effective", value: 31 },
  { id: "ic-3", label: "Needs Improvement", value: 5 },
  { id: "ic-4", label: "Not Effective", value: 2 },
];

export const policyTabs = ["Active Policies", "Standards", "Procedures", "Guidelines"] as const;

export interface PolicyRow {
  id: string;
  name: string;
  category: string;
  version: string;
  effectiveDate: string;
  status: "Active";
}

export const activePolicies: PolicyRow[] = [
  { id: "p-1", name: "Information Security Policy", category: "Information Security", version: "v2.1", effectiveDate: "1 Jul 2025", status: "Active" },
  { id: "p-2", name: "Data Privacy Policy (PDPA)", category: "Compliance", version: "v2.0", effectiveDate: "1 Jun 2025", status: "Active" },
  { id: "p-3", name: "Code of Conduct", category: "People & Culture", version: "v1.3", effectiveDate: "1 Mar 2025", status: "Active" },
  { id: "p-4", name: "Anti-Corruption Policy", category: "Compliance", version: "v1.2", effectiveDate: "15 Feb 2025", status: "Active" },
  { id: "p-5", name: "Acceptable Use Policy", category: "IT Governance", version: "v1.1", effectiveDate: "1 Feb 2025", status: "Active" },
];

export interface PendingApprovalData {
  id: string;
  requester: string;
  title: string;
  subtitle: string;
  type: "Policy" | "Budget" | "Vendor";
  timeAgo: string;
  priority: "High" | "Medium";
}

export const pendingApprovals: PendingApprovalData[] = [
  {
    id: "pa-1",
    requester: "Pim C.",
    title: "Travel Expense Policy (v1.3)",
    subtitle: "Update the travel expense usage policy",
    type: "Policy",
    timeAgo: "2h ago",
    priority: "High",
  },
  {
    id: "pa-2",
    requester: "Tan T.",
    title: "Q3 Marketing Budget",
    subtitle: "Request Q3 marketing budget usage",
    type: "Budget",
    timeAgo: "5h ago",
    priority: "Medium",
  },
  {
    id: "pa-3",
    requester: "Fah F.",
    title: "New Vendor: ABC Solutions",
    subtitle: "Request new vendor approval",
    type: "Vendor",
    timeAgo: "1d ago",
    priority: "Medium",
  },
];

export const trainingCompletion = { percent: 86 };

export interface TrainingItemData {
  id: string;
  label: string;
  percent: number;
}

export const trainingItems: TrainingItemData[] = [
  { id: "ti-1", label: "Information Security Awareness", percent: 92 },
  { id: "ti-2", label: "PDPA Awareness", percent: 88 },
  { id: "ti-3", label: "Code of Conduct", percent: 85 },
  { id: "ti-4", label: "Anti-Corruption", percent: 78 },
];

export interface IncidentStatData {
  id: string;
  label: string;
  value: number;
  icon: "incident" | "investigation" | "closed" | "critical";
  tone: "red" | "amber" | "emerald" | "purple";
}

export const incidentStats: IncidentStatData[] = [
  { id: "is-1", label: "Open Incidents", value: 2, icon: "incident", tone: "red" },
  { id: "is-2", label: "Under Investigation", value: 5, icon: "investigation", tone: "amber" },
  { id: "is-3", label: "Closed (This Month)", value: 12, icon: "closed", tone: "emerald" },
  { id: "is-4", label: "Critical Alerts", value: 1, icon: "critical", tone: "purple" },
];

export interface AuditItemData {
  id: string;
  label: string;
  period: string;
  statusLabel: string;
  percent: number;
  kind: "progress" | "score";
}

export const auditItems: AuditItemData[] = [
  { id: "au-1", label: "Internal Audit", period: "Q2/2025", statusLabel: "In Progress", percent: 68, kind: "progress" },
  { id: "au-2", label: "External Audit", period: "Q1/2025", statusLabel: "Completed", percent: 91, kind: "score" },
];

export interface GovernanceTaskData {
  id: string;
  icon: "shield" | "users" | "document" | "folder";
  title: string;
  subtitle: string;
  due: string;
}

export const myGovernanceTasks: GovernanceTaskData[] = [
  {
    id: "gt-1",
    icon: "shield",
    title: "Acknowledge: Information Security Policy",
    subtitle: "Confirm you've read the security policy",
    due: "Due in 2 days",
  },
  {
    id: "gt-2",
    icon: "users",
    title: "Complete: PDPA Awareness Training",
    subtitle: "Employee data-privacy training",
    due: "Due in 3 days",
  },
  {
    id: "gt-3",
    icon: "document",
    title: "Approve: Budget Exception Request",
    subtitle: "Approve special Q3 budget usage",
    due: "Due in 5 days",
  },
  {
    id: "gt-4",
    icon: "folder",
    title: "Review: Vendor Risk Assessment",
    subtitle: "Review the vendor risk assessment",
    due: "Due in 7 days",
  },
];

export interface PolicyUpdateData {
  id: string;
  day: string;
  month: string;
  title: string;
  subtitle: string;
  badge: "New" | "Updated";
}

export const policyUpdates: PolicyUpdateData[] = [
  { id: "pu-1", day: "20", month: "AUG", title: "Information Security Policy (v2.1)", subtitle: "Updated information security policy", badge: "New" },
  { id: "pu-2", day: "18", month: "AUG", title: "PDPA Policy (v2.0)", subtitle: "Updated data protection policy", badge: "Updated" },
  { id: "pu-3", day: "15", month: "AUG", title: "Vendor Management Standard (v1.4)", subtitle: "Updated vendor management standard", badge: "Updated" },
];

export interface GovernanceQuickLinkData {
  id: string;
  icon: "document" | "forms" | "calendar" | "reporting";
  label: string;
}

export const governanceQuickLinks: GovernanceQuickLinkData[] = [
  { id: "ql-1", icon: "document", label: "Policy Library" },
  { id: "ql-2", icon: "forms", label: "Forms & Templates" },
  { id: "ql-3", icon: "calendar", label: "Governance Calendar" },
  { id: "ql-4", icon: "reporting", label: "Reporting Center" },
];

// --- Employee Governance (the operator/employee_media "employee" variant of
// this page — config/rbac.ts's resolveShellVariant) — a personal
// compliance/policy view (my tasks, my approvals, org policy framework)
// rather than the manager variant's org-wide policy-table/audit shape
// above, so it's separate, purpose-built mock content matching the
// reference mockup exactly (Nie, 2026-08-25). Same "Ploy S." / Marketing
// persona as this feature's other employee variants. `governanceQuickLinks`
// above is reused as-is for this variant too — it's generic org-wide
// utility links, not persona-specific content, so duplicating it would add
// nothing.

export interface EmployeeGovernanceStatTileData {
  id: string;
  label: string;
  value: string;
  sublabel: string;
  deltaLabel?: string;
  icon: "shield" | "checkCircle" | "clock" | "document" | "users";
  color: "indigo" | "emerald" | "amber" | "purple" | "blue";
  linkLabel: string;
}

export const employeeGovernanceStatTiles: EmployeeGovernanceStatTileData[] = [
  { id: "e-policies", label: "Active Policies", value: "12", sublabel: "Active Policies", icon: "shield", color: "indigo", linkLabel: "View all" },
  { id: "e-ack", label: "Pending Acknowledgment", value: "5", sublabel: "Pending Acknowledgment", icon: "checkCircle", color: "emerald", linkLabel: "View all" },
  { id: "e-exceptions", label: "Exceptions Awaiting Approval", value: "2", sublabel: "Exceptions Awaiting Approval", icon: "clock", color: "amber", linkLabel: "View all" },
  { id: "e-approvals", label: "My Approvals", value: "14", sublabel: "My Approvals", icon: "document", color: "purple", linkLabel: "View details" },
  {
    id: "e-compliance",
    label: "Compliance Score",
    value: "98%",
    sublabel: "Compliance Score",
    deltaLabel: "▲ 4%",
    icon: "users",
    color: "blue",
    linkLabel: "View details",
  },
];

export interface PolicyFrameworkCategoryData {
  id: string;
  icon: "building" | "lock" | "users" | "document";
  iconTone: string;
  name: string;
  policyCount: number;
}

export const policyFrameworkCategories: PolicyFrameworkCategoryData[] = [
  { id: "pf-1", icon: "building", iconTone: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400", name: "Corporate Governance", policyCount: 5 },
  { id: "pf-2", icon: "lock", iconTone: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400", name: "Information Security", policyCount: 8 },
  { id: "pf-3", icon: "users", iconTone: "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400", name: "People & Culture", policyCount: 6 },
  { id: "pf-4", icon: "document", iconTone: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400", name: "Finance & Compliance", policyCount: 7 },
];

export const employeeComplianceByArea: ComplianceAreaData[] = [
  { id: "eca-1", label: "Information Security", percent: 98 },
  { id: "eca-2", label: "Data Privacy", percent: 96 },
  { id: "eca-3", label: "Finance & Compliance", percent: 92 },
  { id: "eca-4", label: "People & HR", percent: 90 },
  { id: "eca-5", label: "Work & Operations", percent: 88 },
];

export const employeeRiskOverview = {
  total: 7,
  segments: [
    { label: "High Risk", value: 1, color: "#ef4444" },
    { label: "Medium Risk", value: 3, color: "#f59e0b" },
    { label: "Low Risk", value: 3, color: "#eab308" },
    { label: "Accepted Risk", value: 0, color: "#10b981" },
  ],
};

export const employeeInternalControls: InternalControlRow[] = [
  { id: "eic-1", label: "Controls in Place", value: 24 },
  { id: "eic-2", label: "Effective", value: 22 },
  { id: "eic-3", label: "Needs Improvement", value: 2 },
  { id: "eic-4", label: "Not Effective", value: 0 },
];

export interface EmployeeApprovalData {
  id: string;
  title: string;
  department: string;
  requestedBy: string;
  timeAgo: string;
}

export const employeeApprovals: EmployeeApprovalData[] = [
  { id: "ea-1", title: "CAPEX Request - New Laptop (10 units)", department: "Marketing Department", requestedBy: "K. Than", timeAgo: "1 hour ago" },
  { id: "ea-2", title: "Budget Reallocation Q3", department: "Marketing Department", requestedBy: "K. Pim", timeAgo: "3 hours ago" },
  { id: "ea-3", title: "Vendor Contract Renewal - ABC Co., Ltd.", department: "Operations Department", requestedBy: "K. Golf", timeAgo: "1 day ago" },
];

export interface EmployeeExceptionData {
  id: string;
  icon: "budget" | "policy" | "late";
  title: string;
  department: string;
  detail: string;
  detailTone: "red" | "zinc";
  severity: "High" | "Medium";
}

export const employeeExceptions: EmployeeExceptionData[] = [
  {
    id: "ee-1",
    icon: "budget",
    title: "Over Budget - Event Expense",
    department: "Marketing Department",
    detail: "+฿85,000 (12%)",
    detailTone: "red",
    severity: "High",
  },
  {
    id: "ee-2",
    icon: "policy",
    title: "Travel Policy Exception",
    department: "Marketing Department",
    detail: "Business Class",
    detailTone: "zinc",
    severity: "Medium",
  },
  {
    id: "ee-3",
    icon: "late",
    title: "Late Approval Request",
    department: "Marketing Department",
    detail: "3 days late",
    detailTone: "red",
    severity: "Medium",
  },
];

export const organizationInfo = {
  company: "ThunderOne Co., Ltd.",
  headquarters: "Bangkok, Thailand",
  employees: "256",
  fiscalYear: "Jan - Dec 2025",
};

export const employeeGovernanceTasks: GovernanceTaskData[] = [
  {
    id: "egt-1",
    icon: "shield",
    title: "Acknowledge: Information Security Policy",
    subtitle: "Please acknowledge the information security policy",
    due: "Due in 2 days",
  },
  {
    id: "egt-2",
    icon: "document",
    title: "Approve: Budget Exception Request",
    subtitle: "Approve Q3 Marketing budget exception",
    due: "Due in 3 days",
  },
  {
    id: "egt-3",
    icon: "folder",
    title: "Review: Vendor Risk Assessment",
    subtitle: "Review the vendor risk assessment",
    due: "Due in 5 days",
  },
];

export const employeePolicyUpdates: PolicyUpdateData[] = [
  { id: "epu-1", day: "20", month: "AUG", title: "Thailand PDPA Policy (v2.1)", subtitle: "Updated personal data protection policy", badge: "New" },
  { id: "epu-2", day: "18", month: "AUG", title: "Travel Expense Policy (v1.3)", subtitle: "Updated travel expense policy", badge: "Updated" },
  { id: "epu-3", day: "15", month: "AUG", title: "Code of Conduct (v3.0)", subtitle: "Updated business code of conduct", badge: "Updated" },
];
