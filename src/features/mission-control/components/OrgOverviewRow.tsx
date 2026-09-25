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
// Chip hues follow the mockup (node 396:4742): people blue, assets purple,
// displays green, requests red. The node's literal fills were never fetched
// (Figma MCP rate limit), so the hex pairs reuse the exact fetched values of
// the same hues from WorkspaceCardsRow (purple) and HomeStatTilesRow (the rest).
export function OrgOverviewRow({ stats }: { stats: HomeStats | null }) {
  const displays = orgOverviewMock.find((t) => t.id === "displays");
  const openRequests = orgOverviewMock.find((t) => t.id === "open-requests");

  return (
    <Card className="p-4">
      <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">ภาพรวมองค์กร</h2>
      {/* Icon-then-label-then-number, stacked top-down per item — the
          mockup's own per-item order (node 396:4748's children), not the
          icon-beside-text row this used before. */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#eaf4ff] text-[#075df7] dark:bg-blue-500/10 dark:text-blue-400">
            <UsersIcon className="h-4 w-4" />
          </span>
          <p className="mt-2 text-xs text-zinc-400">บุคลากรทั้งหมด</p>
          <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            {stats ? stats.totalHeadcount : "-"}
          </p>
        </div>
        <div>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f1e8ff] text-[#7117df] dark:bg-violet-500/10 dark:text-violet-400">
            <BoxIcon className="h-4 w-4" />
          </span>
          <p className="mt-2 text-xs text-zinc-400">สินทรัพย์ทั้งหมด</p>
          <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            {stats?.totalAssets ?? "-"}
          </p>
        </div>
        <div>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e7faef] text-[#09a96d] dark:bg-emerald-500/10 dark:text-emerald-400">
            <MonitorIcon className="h-4 w-4" />
          </span>
          <p className="mt-2 text-xs text-zinc-400">{displays?.label}</p>
          <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">{displays?.value ?? "-"}</p>
        </div>
        <div>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#fff0f1] text-[#f42b41] dark:bg-red-500/10 dark:text-red-400">
            <ClipboardIcon className="h-4 w-4" />
          </span>
          <p className="mt-2 text-xs text-zinc-400">{openRequests?.label}</p>
          <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">{openRequests?.value ?? "-"}</p>
        </div>
      </div>
    </Card>
  );
}
