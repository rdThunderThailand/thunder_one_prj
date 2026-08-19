import type { BadgeColor } from "@/components/ui/Badge";
import type { PlaylistStatus } from "./types";

/** Draft is yellow rather than zinc so it reads as in-progress, not switched off. */
export function statusBadge(status: PlaylistStatus): { color: BadgeColor; label: string } {
  if (status === "active") return { color: "green", label: "Active" };
  if (status === "draft") return { color: "yellow", label: "Draft" };
  return { color: "zinc", label: "Inactive" };
}
