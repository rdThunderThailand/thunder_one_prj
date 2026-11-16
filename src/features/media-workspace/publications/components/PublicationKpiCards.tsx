import {
  ScheduleIcon as CalendarClock,
  EditIcon as FileEdit,
  PlaySquareIcon as PlaySquare,
  BroadcastIcon as Radio,
  WarningTriangleIcon as AlertTriangle,
} from "@/components/ui/icons";
import { LibrarySummary, LibrarySummarySkeleton } from "../../content-library/LibraryChrome";
import type { PublicationsPage } from "../types";

// Paused is not a Program state (no pause/resume exists) and there is no previous period to
// compare, so neither the card nor a % change is shown (plan §2).
export function PublicationKpiCards({ counts }: { counts: PublicationsPage["counts_by_status"] | null }) {
  if (!counts) return <LibrarySummarySkeleton count={5} />;
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);

  return (
    <LibrarySummary
      label="Program summary"
      cards={[
        { label: "Total Programs", value: total, detail: "All programs", icon: PlaySquare },
        { label: "Live", value: counts.live, detail: "On air now", icon: Radio, tone: "text-success bg-success-muted" },
        { label: "Failed", value: counts.failed, detail: "On no screen", icon: AlertTriangle, tone: "text-error bg-error-muted" },
        { label: "Scheduled", value: counts.scheduled, detail: "Starts later", icon: CalendarClock, tone: "text-warning bg-warning-muted" },
        { label: "Draft", value: counts.draft, detail: "Not published", icon: FileEdit, tone: "text-muted-foreground bg-muted" },
      ]}
    />
  );
}
