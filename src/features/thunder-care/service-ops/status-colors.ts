// Shared badge/color maps, used by ServiceOpsPage's compact cards and the
// full Customers/Work Queue/Reports pages alike, so they don't each redefine
// the same mapping.
import type { IssueStatus } from "@/features/asset-intelligence/issues";
import type { CustomerAttentionRow } from "./mock-data";

export const issueStatusBadge: Record<IssueStatus, { color: "red" | "yellow" | "green"; label: string }> = {
  waiting: { color: "red", label: "Waiting" },
  in_progress: { color: "yellow", label: "In Progress" },
  resolved: { color: "green", label: "Resolved" },
};

type CustomerSeverity = CustomerAttentionRow["severity"];

export const customerDotColor: Record<CustomerSeverity, string> = {
  red: "bg-red-500",
  yellow: "bg-amber-500",
  green: "bg-emerald-500",
};

export const customerActionColor: Record<CustomerSeverity, string> = {
  red: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
  yellow: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  green: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
};
