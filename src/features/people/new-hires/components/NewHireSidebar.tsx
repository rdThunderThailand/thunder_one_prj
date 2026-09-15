import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { ChevronRightIcon } from "@/components/ui/icons";
import { newHireActionItems, newHireResources, type NewHireRow } from "../mock-data";

interface NewHireSidebarProps {
  /** Real since 2026-09-15 — "สรุปภาพรวม" now counts the same fetched
   *  roster the funnel row/Kanban use, not the old static 32/14/3/18. Was
   *  reported live as showing a stale-vs-header mismatch before this fix
   *  (header already real, sidebar wasn't). "งานที่ต้องดำเนินการ" and
   *  "เอกสารและแหล่งข้อมูล" below stay mock — no real task/document concept
   *  exists in Core for either. */
  rows: NewHireRow[];
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

// The 3 right-column cards on the redesigned "เข้าใหม่ / Onboarding" page —
// สรุปภาพรวม (real) / งานที่ต้องดำเนินการ / เอกสารและแหล่งข้อมูล (still mock).
// Replaces the old click-to-select NewHireDetailPanel; this redesign has no
// per-row detail view (see NewHireKanbanBoard's header comment).
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

      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">งานที่ต้องดำเนินการ</h3>
        <ul className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
          {newHireActionItems.map((item) => (
            <li key={item.id} className="flex items-center justify-between py-2 text-sm">
              <span className="text-zinc-600 dark:text-zinc-300">{item.label}</span>
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                {item.count}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">เอกสารและแหล่งข้อมูล</h3>
        <ul className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
          {newHireResources.map((resource) => (
            <li key={resource.id}>
              <span
                title="ยังไม่เปิดใช้งาน"
                className="flex cursor-not-allowed items-center justify-between py-2 text-sm text-zinc-600 dark:text-zinc-300"
              >
                {resource.label}
                <ChevronRightIcon className="h-3.5 w-3.5 text-zinc-300 dark:text-zinc-700" />
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
