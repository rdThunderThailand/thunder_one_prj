import { Badge } from "@/components/ui/Badge";
import type { CategoryStatus } from "../../domain/asset-category";
import { CATEGORY_STATUS_TONE } from "../../domain/status-tone";

export function CategoryStatusBadge({ status }: { status: CategoryStatus }) {
  return (
    <Badge color={CATEGORY_STATUS_TONE[status]} variant="pill" className="gap-1.5">
      <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-current" />
      {status}
    </Badge>
  );
}
