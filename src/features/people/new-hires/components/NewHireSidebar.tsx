import { Card } from "@/components/ui/Card";
import { ChevronRightIcon } from "@/components/ui/icons";
import { newHireActionItems, newHireResources, newHireSummaryStats } from "../mock-data";

// The 3 static right-column cards on the redesigned "เข้าใหม่ / Onboarding"
// page — สรุปภาพรวม / งานที่ต้องดำเนินการ / เอกสารและแหล่งข้อมูล. Replaces
// the old click-to-select NewHireDetailPanel; this redesign has no per-row
// detail view (see NewHireKanbanBoard's header comment). All figures and
// links here are static/inert, same discipline as the funnel row above it.
export function NewHireSidebar() {
  return (
    <div className="flex flex-col gap-4">
      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">สรุปภาพรวม</h3>
        <dl className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
          {newHireSummaryStats.map((stat) => (
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
