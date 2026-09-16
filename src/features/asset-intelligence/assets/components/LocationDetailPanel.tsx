import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ArrowRightIcon, BoxIcon, CheckCircleIcon, CurrencyIcon, WarningTriangleIcon, XIcon } from "@/components/ui/icons";
import { locationDetail } from "../mock-data";

const detailRows: { label: string; value: string }[] = [
  { label: "ประเภทสถานที่", value: locationDetail.type },
  { label: "รหัสสถานที่", value: locationDetail.code },
  { label: "เบอร์โทรศัพท์", value: locationDetail.phone },
  { label: "อีเมล", value: locationDetail.email },
  { label: "ที่อยู่", value: locationDetail.address },
];

const summaryTiles = [
  { icon: <BoxIcon className="h-4 w-4" />, tone: "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400", value: locationDetail.summary.total.value, label: locationDetail.summary.total.label },
  { icon: <CurrencyIcon className="h-4 w-4" />, tone: "bg-purple-50 text-purple-500 dark:bg-purple-500/10 dark:text-purple-400", value: `${locationDetail.summary.valueTHB.value} THB`, label: locationDetail.summary.valueTHB.label },
  { icon: <CheckCircleIcon className="h-4 w-4" />, tone: "bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400", value: locationDetail.summary.utilization.value, label: `${locationDetail.summary.utilization.label} (${locationDetail.summary.utilization.detail})` },
  { icon: <WarningTriangleIcon className="h-4 w-4" />, tone: "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400", value: locationDetail.summary.needsAttention.value, label: locationDetail.summary.needsAttention.label },
];

export function LocationDetailPanel() {
  return (
    <Card className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{locationDetail.name}</p>
          <Badge variant="pill" color="green" className="mt-1">
            {locationDetail.status}
          </Badge>
        </div>
        <button title="Not built yet" className="cursor-not-allowed text-zinc-300 hover:text-zinc-400">
          <XIcon className="h-4 w-4" />
        </button>
      </div>

      <dl className="flex flex-col gap-2.5 text-sm">
        {detailRows.map((row) => (
          <div key={row.label} className="flex flex-col gap-0.5">
            <dt className="text-xs text-zinc-400">{row.label}</dt>
            <dd className="text-zinc-700 dark:text-zinc-200">{row.value}</dd>
          </div>
        ))}
        <div className="flex flex-col gap-0.5">
          <dt className="text-xs text-zinc-400">ผู้ดูแลสถานที่</dt>
          <dd className="flex items-center gap-1.5">
            <Avatar name={locationDetail.manager} size={22} />
            <span className="text-zinc-700 dark:text-zinc-200">{locationDetail.manager}</span>
            <span className="text-xs text-zinc-400">/ {locationDetail.managerDepartment}</span>
          </dd>
        </div>
      </dl>

      <div className="mt-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">ตำแหน่งที่ตั้ง</p>
        <div className="flex h-28 items-center justify-center rounded-lg bg-zinc-100 text-zinc-300 dark:bg-zinc-800 dark:text-zinc-600">
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6" aria-hidden="true">
            <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5Z" />
          </svg>
        </div>
        <button
          title="Not built yet"
          className="mt-2 flex cursor-not-allowed items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400"
        >
          ดูแผนที่
          <ArrowRightIcon className="h-3 w-3" />
        </button>
      </div>

      <div className="mt-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">สรุปสินทรัพย์</p>
        <div className="grid grid-cols-2 gap-2">
          {summaryTiles.map((tile) => (
            <div key={tile.label} className="rounded-lg border border-zinc-100 p-2.5 dark:border-zinc-800">
              <span className={`flex h-7 w-7 items-center justify-center rounded-md ${tile.tone}`}>{tile.icon}</span>
              <p className="mt-1.5 text-sm font-semibold text-zinc-900 dark:text-zinc-50">{tile.value}</p>
              <p className="text-[11px] leading-tight text-zinc-400">{tile.label}</p>
            </div>
          ))}
        </div>
      </div>

      <span
        title="Not built yet"
        className="mt-4 flex cursor-not-allowed items-center justify-center rounded-lg bg-indigo-300 py-2 text-sm font-semibold text-white dark:bg-indigo-500/40"
      >
        แก้ไขรายละเอียด
      </span>
    </Card>
  );
}
