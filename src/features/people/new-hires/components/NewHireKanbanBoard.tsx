import { Avatar } from "@/components/ui/Avatar";
import { Badge, type BadgeColor } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { newHireFunnelStats, type NewHireRow, type NewHireStatus } from "../mock-data";

const CARDS_PER_COLUMN = 4;

const columnColor: Record<NewHireStatus, BadgeColor> = {
  "pre-boarding": "zinc",
  onboarding: "blue",
  "ready-to-work": "indigo",
  active: "green",
};

function HireCard({ hire }: { hire: NewHireRow }) {
  return (
    <div className="rounded-xl border border-zinc-100 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-2.5">
        <Avatar name={hire.name} size={32} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{hire.name}</p>
          <p className="truncate text-xs text-zinc-400">{hire.position}</p>
        </div>
      </div>
      <p className="mt-2 text-xs text-zinc-400">
        {hire.status === "onboarding" ? `ความคืบหน้า ${hire.progress}%` : `เริ่ม ${hire.startDateLabel}`}
      </p>
    </div>
  );
}

interface NewHireKanbanBoardProps {
  rows: NewHireRow[];
}

// "ติดตามความคืบหน้า" — the 4-column Kanban board (Pre-boarding →
// Onboarding → Ready to Work → Active) that replaces the old table + status
// tabs. Cards are static (no click-to-select) — this redesign's sidebar is
// a fixed dashboard (NewHireSidebar), not a per-row detail panel.
export function NewHireKanbanBoard({ rows }: NewHireKanbanBoardProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {newHireFunnelStats.map((stage) => {
        const stageRows = rows.filter((row) => row.status === stage.id);
        const shown = stageRows.slice(0, CARDS_PER_COLUMN);
        const remaining = stageRows.length - shown.length;

        return (
          <Card key={stage.id} className="flex flex-col gap-3 p-3">
            <div className="flex items-center justify-between px-1">
              <Badge variant="pill" color={columnColor[stage.id]}>
                {stage.label}
              </Badge>
              <span className="text-xs text-zinc-400">{stageRows.length} คน</span>
            </div>
            <div className="flex flex-col gap-2">
              {shown.length === 0 ? (
                <p className="rounded-xl border border-dashed border-zinc-200 p-4 text-center text-xs text-zinc-400 dark:border-zinc-800">
                  ไม่มีรายการ
                </p>
              ) : (
                shown.map((hire) => <HireCard key={hire.id} hire={hire} />)
              )}
              {remaining > 0 && (
                <span title="ยังไม่เปิดใช้งาน" className="cursor-not-allowed px-1 text-xs font-medium text-indigo-400">
                  ดูเพิ่ม {remaining} คน
                </span>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
