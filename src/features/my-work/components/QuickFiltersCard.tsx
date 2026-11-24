import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { CalendarIcon, CheckIcon, RepeatIcon, WarningTriangleIcon } from "@/components/ui/icons";
import { countByGroup, type MyWork } from "../work-items";

// "At a Glance" — real counts from `MyWork`. Replaces the old decorative
// "Quick Filters" chips, which looked clickable but filtered nothing; the
// queue's own tabs are the filter.
export function QuickFiltersCard({ work, now }: { work: MyWork; now: Date }) {
  const counts = countByGroup(work.items, now);
  const chips: { id: string; label: string; count: number; icon: ReactNode; tone: string }[] = [
    { id: "overdue", label: "Overdue", count: counts.overdue, icon: <WarningTriangleIcon />, tone: "bg-error-muted text-error" },
    { id: "due-today", label: "Due today", count: counts["due-today"], icon: <CalendarIcon />, tone: "bg-info-muted text-info" },
    { id: "waiting", label: "Waiting on others", count: work.items.filter((item) => item.kind === "waiting").length, icon: <RepeatIcon />, tone: "bg-muted text-muted-foreground" },
    { id: "completed", label: "Completed", count: work.completed.length, icon: <CheckIcon />, tone: "bg-success-muted text-success" },
  ];

  return (
    <Card className="p-4">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        At a Glance
      </h2>
      <div className="grid grid-cols-2 gap-2">
        {chips.map((chip) => (
          <div
            key={chip.id}
            className="flex items-center gap-2 rounded-lg border border-border px-2.5 py-2 text-sm"
          >
            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${chip.tone}`}>
              {chip.icon}
            </span>
            <span className="min-w-0 flex-1 truncate text-muted-foreground">{chip.label}</span>
            <span className="shrink-0 text-xs font-semibold text-t1-gray-400">{chip.count}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
