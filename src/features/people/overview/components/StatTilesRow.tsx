import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { ArrowRightIcon } from "@/components/ui/icons";
import type { StatTileColor } from "../mock-data";

const valueColor: Record<StatTileColor, string> = {
  indigo: "text-indigo-600 dark:text-indigo-400",
  emerald: "text-emerald-600 dark:text-emerald-400",
  amber: "text-amber-600 dark:text-amber-400",
  blue: "text-blue-600 dark:text-blue-400",
  red: "text-red-600 dark:text-red-400",
};

interface StatTile {
  id: string;
  label: string;
  value: string;
  sublabel?: string;
  color: StatTileColor;
  /** Where "ดูรายละเอียด" takes you — same sub-link pattern
   *  `people/personnel`'s own `PersonnelStatTilesRow` uses, added 2026-09-15
   *  once UAT (PP01-004) flagged these cards as dead ends. */
  href: string;
}

interface StatTilesRowProps {
  /** Real since 2026-09-15: headcount/new-hires-this-month/onboarding-count
   *  from the same roster fetch every other real overview card uses. No
   *  `deltaLabel` ("↑ 3 จากเดือนที่แล้ว") on any tile — a real trend needs a
   *  historical snapshot to compare against, which Core has no mechanism
   *  for yet (proposed separately — a daily `tenant_metrics_daily`-style
   *  snapshot table); showing one would be a fabricated number dressed up
   *  as precise. */
  totalHeadcount: number;
  newHiresThisMonth: number;
  onboardingCount: number;
}

// **2026-09-16**: dropped 2 fabricated tiles and the Workforce Health ring
// entirely (audit found them showing hardcoded "3"/"2" and a synthetic 92%
// score as if real — see git history for the before state). "การเปลี่ยนแปลง"/
// "ออกจากองค์กร" have no real backend at all yet (no change-request or
// offboarding entity exists in Core — see people/changes, people/departures,
// both still fully mock, proposed separately as new Core entities).
// Workforce Health was a synthetic composite score with no real metric
// design behind it, not just missing data — removing it rather than
// inventing a formula. Now 3 tiles, all real.
export function StatTilesRow({ totalHeadcount, newHiresThisMonth, onboardingCount }: StatTilesRowProps) {
  const statTiles: StatTile[] = [
    {
      id: "headcount",
      label: "จำนวนบุคลากรทั้งหมด",
      value: String(totalHeadcount),
      color: "indigo",
      href: "/people/personnel",
    },
    {
      id: "new-hires",
      label: "เข้าใหม่ (เดือนนี้)",
      value: String(newHiresThisMonth),
      color: "emerald",
      href: "/people/new-hires",
    },
    {
      id: "onboarding",
      label: "กำลัง Onboarding",
      value: String(onboardingCount),
      color: "amber",
      href: "/people/new-hires",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {statTiles.map((tile) => (
        <Card key={tile.id} className="flex flex-col gap-1 p-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{tile.label}</p>
          <span className={`text-2xl font-semibold ${valueColor[tile.color]}`}>{tile.value}</span>
          {tile.sublabel && <p className="text-xs text-zinc-400">{tile.sublabel}</p>}
          <Link
            href={tile.href}
            className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
          >
            ดูรายละเอียด
            <ArrowRightIcon className="h-3 w-3" />
          </Link>
        </Card>
      ))}
    </div>
  );
}
