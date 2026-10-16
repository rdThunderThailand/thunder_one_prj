import { Card } from "@/components/ui/Card";
import { ChevronRightIcon } from "@/components/ui/icons";

interface OrgStructureCardProps {
  /** Real since 2026-09-15 — top-level departments from the same org tree
   *  people/org-structure uses, sorted by real `employeeCount`. */
  orgStructureRows: { id: string; name: string; count: number }[];
}

export function OrgStructureCard({ orgStructureRows }: OrgStructureCardProps) {
  return (
    <Card className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">โครงสร้างองค์กร</h2>
        <button type="button" className="text-xs font-medium text-primary hover:text-primary">
          ดูทั้งหมด
        </button>
      </div>
      <ul className="flex flex-1 flex-col divide-y divide-border">
        {orgStructureRows.map((row) => (
          <li key={row.id} className="flex items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0">
            <span className="truncate text-sm text-foreground">{row.name}</span>
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              {row.count}
              <ChevronRightIcon className="h-3.5 w-3.5 text-t1-gray-400" />
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
