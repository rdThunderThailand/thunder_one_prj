// Shared badge/color maps for thunder-care/service-ops's pages.
import type { IssueStatus } from "@/features/asset-intelligence/issues";
import type { BadgeColor } from "@/components/ui/Badge";
import { EnvelopeIcon, GlobeIcon, HeadsetIcon, PhoneIcon } from "@/components/ui/icons";
import type { CaseChannel, CasePriority, InboxStatus, SlaRisk } from "./mock-data";

// ยังใช้โดย ReportsPage/WorkQueuePage (นอกขอบเขตการ redesign รอบนี้) — ไม่แตะ
export const issueStatusBadge: Record<IssueStatus, { color: "red" | "yellow" | "green"; label: string }> = {
  waiting: { color: "red", label: "Waiting" },
  in_progress: { color: "yellow", label: "In Progress" },
  resolved: { color: "green", label: "Resolved" },
};

export const priorityBadge: Record<CasePriority, { color: BadgeColor; label: string }> = {
  high: { color: "red", label: "High" },
  medium: { color: "yellow", label: "Medium" },
  low: { color: "blue", label: "Low" },
};

export const slaRiskTextColor: Record<SlaRisk, string> = {
  ok: "text-muted-foreground",
  warning: "text-t1-amber-700",
  overdue: "text-t1-red-700",
};

export const channelIcon: Record<CaseChannel, typeof GlobeIcon> = {
  web: GlobeIcon,
  line: HeadsetIcon,
  phone: PhoneIcon,
  email: EnvelopeIcon,
};

export const inboxStatusColor: Record<InboxStatus, BadgeColor> = {
  unhandled: "zinc",
  pending_triage: "yellow",
  waiting_customer: "indigo",
};
