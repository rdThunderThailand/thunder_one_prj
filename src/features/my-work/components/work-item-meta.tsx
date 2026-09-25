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
    tone: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  },
  task: {
    label: "Task",
    icon: <ClipboardIcon />,
    tone: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400",
  },
  draft: {
    label: "Draft",
    icon: <ImageIcon />,
    tone: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
  },
  waiting: {
    label: "Waiting on others",
    icon: <ClockIcon />,
    tone: "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
  },
};

export const GROUP_META: Record<DueGroup, { label: string; text: string; color: string }> = {
  overdue: { label: "Overdue", text: "text-red-500", color: "#ef4444" },
  "due-today": { label: "Due today", text: "text-amber-500", color: "#f59e0b" },
  upcoming: { label: "Upcoming", text: "text-zinc-400", color: "#6366f1" },
  "no-due": { label: "No due date", text: "text-zinc-400", color: "#a1a1aa" },
};

export const GROUP_ORDER: DueGroup[] = ["overdue", "due-today", "upcoming", "no-due"];
