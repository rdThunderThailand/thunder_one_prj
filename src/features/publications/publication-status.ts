import type { BadgeColor } from "@/components/ui/Badge";

/**
 * Colours for the derived lifecycle vocabulary (docs/adr/0004): the backend owns
 * the values, so an unrecognised one falls back to neutral rather than throwing.
 */
const STATUS_COLORS: Record<string, BadgeColor> = {
  draft: "zinc",
  scheduled: "blue",
  active: "green",
  ended: "zinc",
  cancelled: "red",
};

export function publicationStatusColor(status: string | undefined): BadgeColor {
  return (status && STATUS_COLORS[status]) || "zinc";
}

/**
 * What to show the operator. `effective_status` is clock-aware (scheduled/ended);
 * `status` is the stored intent and is the fallback for a backend that predates
 * the derivation.
 */
export function publicationDisplayStatus(item: {
  status: string;
  effective_status?: string;
}): string {
  return item.effective_status || item.status;
}
