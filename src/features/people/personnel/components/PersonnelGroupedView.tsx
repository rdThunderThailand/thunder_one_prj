import { Card } from "@/components/ui/Card";
import { ChevronRightIcon, UsersIcon } from "@/components/ui/icons";
import type { PersonnelRow } from "../mock-data";

interface PersonnelGroupedViewProps {
  rows: PersonnelRow[];
  /** How to bucket each row — the raw key used for both grouping and the
   *  `onSelectGroup` callback. */
  groupBy: (row: PersonnelRow) => string;
  /** Display text for a group key, if it shouldn't just be the raw key
   *  itself (e.g. mapping a WorkStatus enum value to its Thai label). */
  labelFor?: (key: string) => string;
  onSelectGroup: (key: string) => void;
}

// Real since 2026-09-15 — backs "พนักงานตามหน่วยงาน"/"พนักงานตามตำแหน่ง"/
// "สถานะการจ้างงาน" (the 3 of 5 view tabs that are just a different grouping
// of the same real roster, not a different dataset). Clicking a group jumps
// back to "รายชื่อบุคลากร" filtered to it — same "grouped summary that
// drills into the real table" pattern as org-structure's own department
// summary cards.
export function PersonnelGroupedView({ rows, groupBy, labelFor, onSelectGroup }: PersonnelGroupedViewProps) {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const key = groupBy(row);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const groups = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);

  if (groups.length === 0) {
    return <Card className="p-10 text-center text-sm text-zinc-400">ไม่มีข้อมูล</Card>;
  }

  return (
    <Card className="overflow-hidden">
      <ul className="divide-y divide-zinc-100 dark:divide-zinc-900">
        {groups.map(([key, count]) => (
          <li key={key}>
            <button
              type="button"
              onClick={() => onSelectGroup(key)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
            >
              <span className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                  <UsersIcon className="h-4 w-4" />
                </span>
                <span className="font-medium text-zinc-900 dark:text-zinc-50">{labelFor ? labelFor(key) : key}</span>
              </span>
              <span className="flex items-center gap-1.5 text-zinc-400">
                {count} คน
                <ChevronRightIcon className="h-3.5 w-3.5" />
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
