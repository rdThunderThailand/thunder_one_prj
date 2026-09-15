import { useState } from "react";
import { Card } from "@/components/ui/Card";
import type { NewHireRow } from "../mock-data";

interface NewHireSidebarProps {
  /** Real since 2026-09-15 — "สรุปภาพรวม" counts the same fetched roster the
   *  funnel row/Kanban use. **2026-09-16**: this was the only real card of
   *  the original 3 — "งานที่ต้องดำเนินการ" (fabricated counts) and
   *  "เอกสารและแหล่งข้อมูล" (fabricated document names, no real target) were
   *  removed entirely rather than left showing mock data — see
   *  ../mock-data.ts for what was removed and why. */
  rows: NewHireRow[];
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

// The right-column sidebar on the redesigned "เข้าใหม่ / Onboarding" page —
// just สรุปภาพรวม now (real). Replaces the old click-to-select
// NewHireDetailPanel; this redesign has no per-row detail view (see
// NewHireKanbanBoard's header comment).
export function NewHireSidebar({ rows }: NewHireSidebarProps) {
  // Lazy useState initializer, not a bare Date.now() call — same "seed
  // impure external state once at mount" pattern NewHiresPage's own
  // readHandoff() already uses (react-hooks/purity flags calling Date.now()
  // directly in render, even memoized). The 7-day/this-month buckets below
  // don't need instant-of-render precision anyway.
  const [now] = useState(() => Date.now());
  const readySoon = rows.filter((r) => {
    if (r.status !== "ready-to-work" || !r.startDate) return false;
    const start = new Date(r.startDate).getTime();
    return !Number.isNaN(start) && start - now <= SEVEN_DAYS_MS && start - now >= 0;
  }).length;
  const startedThisMonth = rows.filter((r) => {
    if (r.status !== "active" || !r.startDate) return false;
    const start = new Date(r.startDate);
    const today = new Date(now);
    return !Number.isNaN(start.getTime()) && start.getUTCFullYear() === today.getUTCFullYear() && start.getUTCMonth() === today.getUTCMonth();
  }).length;
  const summaryStats = [
    { id: "total", label: "พนักงานเข้าใหม่ทั้งหมด", value: `${rows.length} คน` },
    { id: "in-progress", label: "อยู่ระหว่างดำเนินการ", value: `${rows.filter((r) => r.status === "onboarding").length} คน` },
    { id: "ready-soon", label: "พร้อมเริ่มงานใน 7 วัน", value: `${readySoon} คน` },
    { id: "started-this-month", label: "เริ่มแล้ว (เดือนนี้)", value: `${startedThisMonth} คน` },
  ];

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">สรุปภาพรวม</h3>
        <dl className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
          {summaryStats.map((stat) => (
            <div key={stat.id} className="flex items-center justify-between py-2 text-sm">
              <dt className="text-zinc-500 dark:text-zinc-400">{stat.label}</dt>
              <dd className="font-semibold text-zinc-900 dark:text-zinc-50">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  );
}
