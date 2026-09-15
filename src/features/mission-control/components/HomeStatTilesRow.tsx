import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { ClockIcon, MonitorIcon, UsersIcon, WarningTriangleIcon } from "@/components/ui/icons";
import type { HomeStats } from "../core-mapper";
import { topStatsMock } from "../mock-data";

const toneClasses = {
  red: { bg: "bg-red-50 dark:bg-red-500/10", text: "text-red-600 dark:text-red-400" },
  amber: { bg: "bg-amber-50 dark:bg-amber-500/10", text: "text-amber-600 dark:text-amber-400" },
  indigo: { bg: "bg-indigo-50 dark:bg-indigo-500/10", text: "text-indigo-600 dark:text-indigo-400" },
  emerald: { bg: "bg-emerald-50 dark:bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400" },
} as const;

/**
 * Top 4 stat tiles. Only "บุคลากรเข้าใหม่" (`stats.newHiresThisMonth`) is
 * real — see `../core-mapper.ts`'s `computeHomeStats`. The other 3 come
 * from `topStatsMock` (`../mock-data.ts`'s own header comment explains why
 * each stays mock). No tile shows a fabricated month-over-month delta — a
 * real trend needs a historical snapshot to compare against, which nothing
 * backing this page has, same discipline as people/personnel's own stat
 * tiles.
 */
export function HomeStatTilesRow({ stats }: { stats: HomeStats | null }) {
  const attention = topStatsMock.find((t) => t.id === "assets-attention");
  const requests = topStatsMock.find((t) => t.id === "pending-requests");
  const displays = topStatsMock.find((t) => t.id === "displays-online");

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <Card className="flex items-start gap-3 p-4">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${toneClasses.red.bg} ${toneClasses.red.text}`}>
          <WarningTriangleIcon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{attention?.label}</p>
          <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{attention?.value ?? "-"}</p>
          <p className="text-xs text-zinc-400">รายการ</p>
        </div>
      </Card>

      <Card className="flex items-start gap-3 p-4">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${toneClasses.amber.bg} ${toneClasses.amber.text}`}>
          <ClockIcon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{requests?.label}</p>
          <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{requests?.value ?? "-"}</p>
          <p className="text-xs text-zinc-400">รายการ</p>
        </div>
      </Card>

      <Card className="flex items-start gap-3 p-4">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${toneClasses.indigo.bg} ${toneClasses.indigo.text}`}>
          <UsersIcon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">บุคลากรเข้าใหม่</p>
          <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {stats ? stats.newHiresThisMonth : "-"}
          </p>
          <Link
            href="/people/new-hires"
            className="text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
          >
            เดือนนี้ →
          </Link>
        </div>
      </Card>

      <Card className="flex items-start gap-3 p-4">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${toneClasses.emerald.bg} ${toneClasses.emerald.text}`}>
          <MonitorIcon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{displays?.label}</p>
          <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{displays?.value ?? "-"}%</p>
          <p className="text-xs text-zinc-400">ออนไลน์</p>
        </div>
      </Card>
    </div>
  );
}
