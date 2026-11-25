import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { mediaStatus } from "../../../media-status";
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
        variant="pill"
        color={mediaStatus(status).color}
        className="px-2 py-0 text-[9px]"
      >
        {mediaStatus(status).label}
      </Badge>
    </div>
  );
}
