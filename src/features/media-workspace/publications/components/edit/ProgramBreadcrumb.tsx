import Link from "next/link";
import { Badge } from "@/components/ui/lovable/badge";
import { DISPLAY_STATUS_LABELS } from "../../publication-list-display";
import type { PublicationDisplayStatus } from "../../types";

/** The Edit page's first row: where you are, plus the Program's status (the title is in the Topbar). */
export function ProgramBreadcrumb({ listHref, name, status }: { listHref: string; name: string; status: PublicationDisplayStatus }) {
  return (
    <div className="flex items-center gap-3">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-xs text-muted-foreground"
      >
        <Link
          href={listHref}
          className="hover:text-foreground"
        >
          Programs
        </Link>
        <span aria-hidden>›</span>
        <span className="max-w-64 truncate">{name}</span>
        <span aria-hidden>›</span>
        <span className="font-medium text-foreground">Edit</span>
      </nav>
      <Badge
        variant={status === "live" ? "success" : "neutral"}
        className="rounded-full px-2 py-0 text-[9px]"
      >
        {DISPLAY_STATUS_LABELS[status]}
      </Badge>
    </div>
  );
}
