import { Card } from "@/components/ui/Card";
import { BoxIcon, ClipboardIcon, MonitorIcon, UsersIcon } from "@/components/ui/icons";
import type { HomeStats } from "../core-mapper";

/**
 * "ภาพรวมองค์กร" — บุคลากรทั้งหมด/สินทรัพย์ทั้งหมด/จอแสดงผล come from
 * `../core-mapper.ts`'s `HomeStats`; คำขอที่เปิดอยู่ has no Core source
 * (Thunder Care requests aren't in Core) and always shows "-". No percentage
 * deltas on any tile — no historical snapshot exists to compute one from.
 * Async for the same streaming reason as `HomeStatTilesRow`.
 */
// Chip hues follow the mockup (node 396:4742): people blue, assets purple,
// displays green, requests red. The node's literal fills were never fetched
// (Figma MCP rate limit), so the hex pairs reuse the exact fetched values of
// the same hues from WorkspaceCardsRow (purple) and HomeStatTilesRow (the rest).
export async function OrgOverviewRow({ stats: statsPromise }: { stats: Promise<HomeStats> }) {
  const stats = await statsPromise;

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
            {stats.totalHeadcount ?? "-"}
          </p>
        </div>
        <div>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f1e8ff] text-[#7117df] dark:bg-violet-500/10 dark:text-violet-400">
            <BoxIcon className="h-4 w-4" />
          </span>
          <p className="mt-2 text-xs text-zinc-400">สินทรัพย์ทั้งหมด</p>
          <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            {stats.totalAssets ?? "-"}
          </p>
        </div>
        <div>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e7faef] text-[#09a96d] dark:bg-emerald-500/10 dark:text-emerald-400">
            <MonitorIcon className="h-4 w-4" />
          </span>
          <p className="mt-2 text-xs text-zinc-400">จอแสดงผล</p>
          <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">{stats.displaysTotal ?? "-"}</p>
        </div>
        <div>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#fff0f1] text-[#f42b41] dark:bg-red-500/10 dark:text-red-400">
            <ClipboardIcon className="h-4 w-4" />
          </span>
          <p className="mt-2 text-xs text-zinc-400">คำขอที่เปิดอยู่</p>
          <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">-</p>
        </div>
      </div>
    </Card>
  );
}
