import type { ReactNode } from "react";
import { CheckCircleIcon, ClipboardIcon, ClockIcon, ImageIcon } from "@/components/ui/icons";
import type { DueGroup, WorkItemKind } from "../work-items";

// Per-kind icon/tone/label shared by all three My Work variants, so an
// approval looks the same on the CEO queue, the manager table and the
// employee list.
export const KIND_META: Record<WorkItemKind, { label: string; icon: ReactNode; tone: string }> = {
  approval: {
    label: "Approval",
    icon: <CheckCircleIcon />,
    tone: "bg-success-muted text-t1-green-700",
  },
  task: {
    label: "Task",
    icon: <ClipboardIcon />,
    tone: "bg-accent text-primary",
  },
  draft: {
    label: "Draft",
    icon: <ImageIcon />,
    tone: "bg-info-muted text-t1-blue-700",
  },
  waiting: {
    label: "Waiting on others",
    icon: <ClockIcon />,
    tone: "bg-in-progress-muted text-t1-purple-700",
  },
};

export const GROUP_META: Record<DueGroup, { label: string; text: string; color: string }> = {
  overdue: { label: "Overdue", text: "text-error", color: "var(--color-error)" },
  "due-today": { label: "Due today", text: "text-warning", color: "var(--color-warning)" },
  upcoming: { label: "Upcoming", text: "text-t1-gray-400", color: "var(--color-primary)" },
  "no-due": { label: "No due date", text: "text-t1-gray-400", color: "var(--color-t1-gray-400)" },
};

export const GROUP_ORDER: DueGroup[] = ["overdue", "due-today", "upcoming", "no-due"];
