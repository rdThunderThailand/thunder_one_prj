import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { BoxIcon, ClipboardIcon, MonitorIcon, UsersIcon } from "@/components/ui/icons";
import type { HomeStats } from "../core-mapper";

/**
 * "ภาพรวมองค์กร" — บุคลากรทั้งหมด/สินทรัพย์ทั้งหมด/จอแสดงผล come from
 * `../core-mapper.ts`'s `HomeStats`; คำขอที่เปิดอยู่ has no Core source
 * (Thunder Care requests aren't in Core) and always shows "-". Only
 * บุคลากรทั้งหมด has a real % (`headcountDeltaPercent`); the rest show a gray
 * "–" because Core keeps no historical snapshot to compare against.
 * Async for the same streaming reason as `HomeStatTilesRow`.
 */
// Chip hues follow the mockup (node 396:4742): people blue, assets purple,
// displays green, requests red. The node's literal fills were never fetched
// (Figma MCP rate limit), so the hex pairs reuse the exact fetched values of
// the same hues from WorkspaceCardsRow (purple) and HomeStatTilesRow (the rest).
export async function OrgOverviewRow({ stats: statsPromise }: { stats: Promise<HomeStats> }) {
  const stats = await statsPromise;

  return (
    <Card className="flex flex-col p-4">
      <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">ภาพรวมองค์กร</h2>
      {/* Icon-then-label-then-number-then-delta, stacked top-down per item —
          the mockup's own per-item order (node 396:4748's children). */}
      <div className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-4">
        <OverviewItem
          chipClassName="bg-[#eaf4ff] text-[#075df7] dark:bg-blue-500/10 dark:text-blue-400"
          icon={<UsersIcon className="h-4 w-4" />}
          label="บุคลากรทั้งหมด"
          value={stats.totalHeadcount}
          deltaPercent={stats.headcountDeltaPercent}
          deltaTitle="คนที่เริ่มงานเดือนนี้ เทียบกับจำนวนคนต้นเดือน (ยังไม่หักคนที่ออก)"
        />
        <OverviewItem
          chipClassName="bg-[#f1e8ff] text-[#7117df] dark:bg-violet-500/10 dark:text-violet-400"
          icon={<BoxIcon className="h-4 w-4" />}
          label="สินทรัพย์ทั้งหมด"
          value={stats.totalAssets}
        />
        <OverviewItem
          chipClassName="bg-[#e7faef] text-[#09a96d] dark:bg-emerald-500/10 dark:text-emerald-400"
          icon={<MonitorIcon className="h-4 w-4" />}
          label="จอแสดงผล"
          value={stats.displaysTotal}
        />
        <OverviewItem
          chipClassName="bg-[#fff0f1] text-[#f42b41] dark:bg-red-500/10 dark:text-red-400"
          icon={<ClipboardIcon className="h-4 w-4" />}
          label="คำขอที่เปิดอยู่"
          value={null}
        />
      </div>
    </Card>
  );
}

/**
 * One cell. The label reserves two lines (`min-h-8`) so every value and
 * delta sits on the same baseline whether its label wraps or not — "จอแสดงผล"
 * fits on one line while "บุคลากรทั้งหมด" wraps at this card's width.
 *
 * Delta: a real % when the caller has one (green ▲, or gray at 0%), else a
 * gray "–" — not "0%", since there's no historical data to say "no change".
 */
function OverviewItem({
  chipClassName,
  icon,
  label,
  value,
  deltaPercent = null,
  deltaTitle = "ยังไม่มีข้อมูลย้อนหลังสำหรับเปรียบเทียบ",
}: {
  chipClassName: string;
  icon: ReactNode;
  label: string;
  value: number | null;
  deltaPercent?: number | null;
  deltaTitle?: string;
}) {
  return (
    <div className="flex min-w-0 flex-col">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${chipClassName}`}>
        {icon}
      </span>
      <p className="mt-2 line-clamp-2 min-h-8 text-xs leading-4 text-zinc-400">{label}</p>
      <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">{value ?? "-"}</p>
      <p
        title={deltaTitle}
        className={`mt-0.5 text-xs font-medium ${
          deltaPercent !== null && deltaPercent > 0 ? "text-[#09a96d] dark:text-emerald-400" : "text-zinc-400"
        }`}
      >
        {deltaPercent === null ? "–" : deltaPercent > 0 ? `▲ ${deltaPercent}%` : "0%"}
      </p>
    </div>
  );
}
