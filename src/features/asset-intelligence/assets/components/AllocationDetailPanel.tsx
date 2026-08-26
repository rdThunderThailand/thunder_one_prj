import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ArrowRightIcon, ImageIcon, UsersIcon, XIcon } from "@/components/ui/icons";
import { allocationDetail } from "../mock-data";

const historyDot: Record<string, string> = {
  emerald: "bg-emerald-500",
  blue: "bg-blue-500",
  zinc: "border-2 border-zinc-300 bg-white dark:bg-zinc-900",
};

const detailRows: { label: string; value: string }[] = [
  { label: "Serial / Tag", value: allocationDetail.serial },
  { label: "ประเภททรัพย์สิน", value: allocationDetail.category },
  { label: "รหัสทรัพย์สิน (Asset ID)", value: allocationDetail.assetId },
  { label: "สถานที่ / พื้นที่", value: allocationDetail.location },
  { label: "วันที่จัดสรร", value: allocationDetail.allocatedDate },
  { label: "จัดสรรโดย", value: allocationDetail.allocatedBy },
  { label: "เหตุผล / รายการหมายเหตุ", value: allocationDetail.note },
];

export function AllocationDetailPanel() {
  return (
    <Card className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">รายละเอียดการจัดสรร</h2>
        <button title="Not built yet" className="cursor-not-allowed text-zinc-300 hover:text-zinc-400">
          <XIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
          <ImageIcon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">{allocationDetail.assetName}</p>
          <p className="truncate text-xs text-zinc-400">{allocationDetail.assetModel}</p>
        </div>
        <Badge variant="pill" color="green">
          {allocationDetail.status}
        </Badge>
      </div>

      <dl className="flex flex-col gap-2.5 text-sm">
        {detailRows.map((row) => (
          <div key={row.label} className="flex flex-col gap-0.5">
            <dt className="text-xs text-zinc-400">{row.label}</dt>
            <dd className="text-zinc-700 dark:text-zinc-200">{row.value}</dd>
          </div>
        ))}
        <div className="flex flex-col gap-0.5">
          <dt className="text-xs text-zinc-400">ผู้ถือครองปัจจุบัน</dt>
          <dd className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-200">
            <UsersIcon className="h-3.5 w-3.5 text-zinc-400" />
            {allocationDetail.holder}
            <span className="text-xs text-zinc-400">/ {allocationDetail.holderDepartment}</span>
          </dd>
        </div>
      </dl>

      <div className="mt-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">ประวัติการดำเนินการ</p>
        <ul className="space-y-3">
          {allocationDetail.history.map((event) => (
            <li key={event.id} className="flex items-start gap-2.5">
              <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${historyDot[event.tone]}`} />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-zinc-900 dark:text-zinc-50">{event.timestamp}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {event.label} {event.by}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <button
        title="Not built yet"
        className="mt-4 flex cursor-not-allowed items-center justify-center gap-1.5 rounded-lg bg-indigo-50 py-2 text-sm font-semibold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
      >
        ดูประวัติการจัดสรรทั้งหมด
        <ArrowRightIcon className="h-3.5 w-3.5" />
      </button>
    </Card>
  );
}
