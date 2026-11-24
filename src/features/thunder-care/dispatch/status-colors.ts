// Shared badge/color maps for thunder-care/dispatch's pages.
import type { BadgeColor } from "@/components/ui/Badge";
import type { Priority } from "./mock-data";

export const priorityBadge: Record<Priority, { color: BadgeColor; label: string }> = {
  urgent: { color: "red", label: "เร่งด่วน" },
  normal: { color: "yellow", label: "ปานกลาง" },
  low: { color: "blue", label: "ต่ำ" },
};
