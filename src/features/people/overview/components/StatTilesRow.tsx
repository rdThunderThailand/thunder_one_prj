import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { DonutChart } from "@/components/ui/DonutChart";
import { ArrowRightIcon } from "@/components/ui/icons";
import { workforceHealth, type StatTileColor } from "../mock-data";

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
   *  from the same roster fetch every other real overview card uses.
   *  การเปลี่ยนแปลง/ออกจากองค์กร stay mock — no change-request or offboarding
   *  concept exists in Core at all yet (see people/changes, people/
   *  departures — both still fully mock, unrelated Core work). Workforce
   *  Health stays mock too — a synthetic composite score with no real
   *  metric behind it in this design. No `deltaLabel` ("↑ 3 จากเดือนที่แล้ว")
   *  on the real tiles either: a real trend needs a historical snapshot to
   *  compare against, which Core has no mechanism for — showing one would
   *  be a fabricated number dressed up as precise. */
  totalHeadcount: number;
  newHiresThisMonth: number;
  onboardingCount: number;
}

// Six tiles across — matching the mockup layout, now a mix of real and mock
// (see props doc above for exactly which). The Workforce Health ring reuses
// DonutChart (2 segments: score/remainder) rather than a one-off SVG, same
// "no second chart primitive for the same shape" discipline as the rest of
// this codebase's chart usage.
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
    {
      id: "changes",
      label: "การเปลี่ยนแปลง",
      value: "3",
      sublabel: "รออนุมัติ 2 รายการ",
      color: "blue",
      href: "/people/changes",
    },
    {
      id: "departures",
      label: "ออกจากองค์กร (เดือนนี้)",
      value: "2",
      sublabel: "รอ Clearance 1 รายการ",
      color: "red",
      href: "/people/departures",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
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

      <Card className="flex items-center gap-3 p-4">
        <div className="relative shrink-0" style={{ width: 56, height: 56 }}>
          <DonutChart
            size={56}
            strokeWidth={7}
            segments={[
              { label: "Workforce Health", value: workforceHealth.score, color: "#6366f1" },
              { label: "Remaining", value: 100 - workforceHealth.score, color: "#e4e4e7" },
            ]}
          />
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[11px] font-semibold text-zinc-900 dark:text-zinc-50">
            {workforceHealth.score}%
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Workforce Health</p>
          <p className="text-xs font-medium text-emerald-500">{workforceHealth.deltaLabel}</p>
          <p className="truncate text-[11px] text-zinc-400">{workforceHealth.previousLabel}</p>
        </div>
      </Card>
    </div>
  );
}
