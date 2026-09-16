import { useState, type DragEvent } from "react";
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

/** Only pre-boarding/onboarding/ready-to-work are reachable by drag —
 *  "active" reflects the real Core account actually being active (invite
 *  accepted, genuinely logged in), not checklist progress, so it can't be
 *  set or unset by dragging a card without fabricating that someone started
 *  working when they haven't. See NewHiresPage.tsx's handleMoveStage for
 *  what a drag actually does (toggles real onboarding-checklist steps via
 *  PATCH .../members/:memberId/onboarding). */
const DRAGGABLE_STATUSES: NewHireStatus[] = ["pre-boarding", "onboarding", "ready-to-work"];

const STAGE_LABEL: Record<NewHireStatus, string> = {
  "pre-boarding": "Pre-boarding",
  onboarding: "Onboarding",
  "ready-to-work": "Ready to Work",
  active: "Active",
};

function HireCard({
  hire,
  draggable,
  moving,
  onDragStart,
  onDragEnd,
  onMoveStage,
}: {
  hire: NewHireRow;
  draggable: boolean;
  moving: boolean;
  onDragStart: (e: DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
  onMoveStage?: (target: NewHireStatus) => void;
}) {
  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      title={draggable ? "ลากเพื่อย้ายขั้นตอน" : undefined}
      className={`rounded-xl border border-zinc-100 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900 ${
        draggable ? "cursor-grab active:cursor-grabbing" : ""
      } ${moving ? "opacity-50" : ""}`}
    >
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
      {draggable && onMoveStage && (
        // Click-based fallback for the same move — drag-and-drop alone is a
        // known accessibility gap (no keyboard/touch/automation-friendly
        // path), so every drag target is also reachable by picking it here.
        // Calls the exact same handler as a drop, not a separate code path.
        <select
          value=""
          onChange={(e) => {
            if (e.target.value) onMoveStage(e.target.value as NewHireStatus);
          }}
          className="mt-2 w-full cursor-pointer rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
        >
          <option value="">ย้ายไปยัง...</option>
          {DRAGGABLE_STATUSES.filter((s) => s !== hire.status).map((s) => (
            <option key={s} value={s}>
              {STAGE_LABEL[s]}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

interface NewHireKanbanBoardProps {
  rows: NewHireRow[];
  /** Fires when a card is dropped on a different column — `undefined` (the
   *  default, e.g. Core hasn't confirmed the roster endpoint yet, or the
   *  caller doesn't want drag enabled) disables drag-and-drop entirely
   *  rather than silently no-op-ing on drop. */
  onMoveStage?: (row: NewHireRow, target: NewHireStatus) => void;
  /** Id of a row whose move is in flight — owned by the parent (only it
   *  knows when the underlying PATCH calls + refetch actually resolve), not
   *  local state here. */
  movingId?: string | null;
}

// "ติดตามความคืบหน้า" — the 4-column Kanban board (Pre-boarding →
// Onboarding → Ready to Work → Active). Real drag-and-drop since
// 2026-09-15 for the 3 checklist-driven stages (see DRAGGABLE_STATUSES'
// comment for why "active" is excluded) — see NewHiresPage.tsx for what a
// drop actually calls.
export function NewHireKanbanBoard({ rows, onMoveStage, movingId }: NewHireKanbanBoardProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<NewHireStatus | null>(null);

  function moveRow(row: NewHireRow, target: NewHireStatus) {
    if (!onMoveStage || !DRAGGABLE_STATUSES.includes(target)) return;
    if (row.status === target || !DRAGGABLE_STATUSES.includes(row.status)) return;
    onMoveStage(row, target);
  }

  function handleDrop(stageId: NewHireStatus) {
    setDragOverStage(null);
    if (!draggingId) return;
    const row = rows.find((r) => r.id === draggingId);
    setDraggingId(null);
    if (row) moveRow(row, stageId);
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {newHireFunnelStats.map((stage) => {
        const stageRows = rows.filter((row) => row.status === stage.id);
        const shown = stageRows.slice(0, CARDS_PER_COLUMN);
        const remaining = stageRows.length - shown.length;
        const isDropTarget = DRAGGABLE_STATUSES.includes(stage.id);

        return (
          <Card
            key={stage.id}
            onDragOver={(e) => {
              if (!isDropTarget || !draggingId) return;
              e.preventDefault();
              setDragOverStage(stage.id);
            }}
            onDragLeave={() => setDragOverStage((current) => (current === stage.id ? null : current))}
            onDrop={(e) => {
              e.preventDefault();
              handleDrop(stage.id);
            }}
            className={`flex flex-col gap-3 p-3 transition-colors ${
              dragOverStage === stage.id ? "ring-2 ring-indigo-400 dark:ring-indigo-500" : ""
            }`}
          >
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
                shown.map((hire) => {
                  const draggable =
                    Boolean(onMoveStage) &&
                    !movingId &&
                    DRAGGABLE_STATUSES.includes(hire.status) &&
                    hire.onboardingTotal !== undefined;
                  return (
                    <HireCard
                      key={hire.id}
                      hire={hire}
                      draggable={draggable}
                      moving={movingId === hire.id}
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", hire.id);
                        e.dataTransfer.effectAllowed = "move";
                        setDraggingId(hire.id);
                      }}
                      onDragEnd={() => {
                        setDraggingId(null);
                        setDragOverStage(null);
                      }}
                      onMoveStage={draggable ? (target) => moveRow(hire, target) : undefined}
                    />
                  );
                })
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
