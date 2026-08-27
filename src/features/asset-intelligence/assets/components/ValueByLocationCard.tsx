import { Card } from "@/components/ui/Card";
import { ArrowRightIcon } from "@/components/ui/icons";
import { valueByLocation } from "../mock-data";

export function ValueByLocationCard() {
  const max = Math.max(...valueByLocation.map((row) => row.valueTHB));

  return (
    <Card className="flex h-full flex-col p-4">
      <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">มูลค่าทรัพย์สินตามสถานที่</h2>
      <ul className="flex flex-1 flex-col justify-center gap-3">
        {valueByLocation.map((row) => (
          <li key={row.label} className="flex items-center gap-2">
            <span className="w-28 shrink-0 truncate text-xs text-zinc-500 dark:text-zinc-400">{row.label}</span>
            <div className="h-3 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div
                className="h-full rounded-full bg-indigo-500"
                style={{ width: `${(row.valueTHB / max) * 100}%` }}
              />
            </div>
            <span className="w-12 shrink-0 text-right text-xs font-medium text-zinc-700 dark:text-zinc-200">
              {row.valueLabel}
            </span>
          </li>
        ))}
      </ul>
      <button className="mt-3 flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
        ดูรายงานละเอียด
        <ArrowRightIcon className="h-3 w-3" />
      </button>
    </Card>
  );
}
