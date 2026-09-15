import { Card } from "@/components/ui/Card";
import { BoxIcon, ClipboardIcon, MonitorIcon, UsersIcon } from "@/components/ui/icons";
import type { HomeStats } from "../core-mapper";
import { orgOverviewMock } from "../mock-data";

/**
 * "ภาพรวมองค์กร" — บุคลากรทั้งหมด/สินทรัพย์ทั้งหมด are real (see
 * `../core-mapper.ts`); จอแสดงผล/คำขอที่เปิดอยู่ stay mock (`../mock-data.ts`'s
 * `orgOverviewMock`, same gap `HomeStatTilesRow` already documents). No
 * fabricated percentage deltas on any tile — same "no historical snapshot,
 * so no invented trend" discipline used everywhere else in this app.
 */
export function OrgOverviewRow({ stats }: { stats: HomeStats | null }) {
  const displays = orgOverviewMock.find((t) => t.id === "displays");
  const openRequests = orgOverviewMock.find((t) => t.id === "open-requests");

  return (
    <Card className="p-4">
      <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">ภาพรวมองค์กร</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="flex items-start gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
            <UsersIcon className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              {stats ? stats.totalHeadcount : "-"}
            </p>
            <p className="text-xs text-zinc-400">บุคลากรทั้งหมด</p>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            <BoxIcon className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              {stats?.totalAssets ?? "-"}
            </p>
            <p className="text-xs text-zinc-400">สินทรัพย์ทั้งหมด</p>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
            <MonitorIcon className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">{displays?.value ?? "-"}</p>
            <p className="text-xs text-zinc-400">{displays?.label}</p>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
            <ClipboardIcon className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">{openRequests?.value ?? "-"}</p>
            <p className="text-xs text-zinc-400">{openRequests?.label}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
