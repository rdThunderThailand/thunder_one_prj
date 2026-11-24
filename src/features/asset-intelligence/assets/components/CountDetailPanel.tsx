import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { DonutChart } from "@/components/ui/DonutChart";
import { ArrowRightIcon, XIcon } from "@/components/ui/icons";
import { countDetail } from "../mock-data";

const historyDot: Record<string, string> = {
  emerald: "bg-success",
  blue: "bg-info",
  zinc: "border-2 border-border bg-card",
};

const planRows: { label: string; value: string }[] = [
  { label: "ประเภททรัพย์สิน", value: countDetail.category },
  { label: "ขอบเขต", value: countDetail.scope },
  { label: "กำหนดตรวจนับ", value: countDetail.scheduleRange },
];

export function CountDetailPanel() {
  return (
    <Card className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground">{countDetail.planCode}</p>
            <Badge variant="pill" color="green">
              {countDetail.status}
            </Badge>
          </div>
          <p className="text-xs text-t1-gray-400">{countDetail.planName}</p>
        </div>
        <button title="Not built yet" className="cursor-not-allowed text-t1-gray-400 hover:text-muted-foreground">
          <XIcon className="h-4 w-4" />
        </button>
      </div>

      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-t1-gray-400">รายละเอียดแผนการตรวจนับ</p>
      <dl className="mb-4 flex flex-col gap-2.5 text-sm">
        {planRows.map((row) => (
          <div key={row.label} className="flex flex-col gap-0.5">
            <dt className="text-xs text-t1-gray-400">{row.label}</dt>
            <dd className="text-foreground">{row.value}</dd>
          </div>
        ))}
        <div className="flex flex-col gap-0.5">
          <dt className="text-xs text-t1-gray-400">ผู้รับผิดชอบ</dt>
          <dd className="flex items-center gap-1.5">
            <Avatar name={countDetail.owner} size={22} />
            <span className="text-foreground">{countDetail.owner}</span>
            <span className="text-xs text-t1-gray-400">/ {countDetail.ownerDepartment}</span>
          </dd>
        </div>
      </dl>

      <div className="border-t border-border pt-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-t1-gray-400">สรุปผลการตรวจนับ</p>
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <DonutChart segments={countDetail.resultSegments} size={110} strokeWidth={14} />
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-semibold text-foreground">{countDetail.resultTotal}</span>
              <span className="text-[9px] text-t1-gray-400">ทั้งหมด</span>
            </div>
          </div>
          <ul className="flex-1 space-y-1.5 text-xs">
            {countDetail.resultSegments.map((segment) => (
              <li key={segment.label} className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: segment.color }} />
                  {segment.label}
                </span>
                <span className="font-medium text-foreground">
                  {segment.value}
                  <span className="ml-1 font-normal text-t1-gray-400">({segment.percentLabel})</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <button className="mt-3 flex items-center gap-1 text-xs font-medium text-primary hover:text-accent-foreground">
          ดูรายละเอียดผลการตรวจนับ
          <ArrowRightIcon className="h-3 w-3" />
        </button>
      </div>

      <div className="mt-4 border-t border-border pt-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-t1-gray-400">ประวัติการดำเนินการ</p>
        <ul className="space-y-3">
          {countDetail.history.map((event) => (
            <li key={event.id} className="flex items-start gap-2.5">
              <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${historyDot[event.tone]}`} />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-foreground">{event.timestamp}</p>
                <p className="text-xs text-muted-foreground">
                  {event.label} {event.by}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <span
          title="Not built yet"
          className="flex cursor-not-allowed items-center justify-center rounded-lg border border-border py-2 text-sm font-semibold text-muted-foreground"
        >
          ดูรายละเอียดทั้งหมด
        </span>
        <span
          title="Not built yet"
          className="flex cursor-not-allowed items-center justify-center rounded-lg bg-t1-blue-300 py-2 text-sm font-semibold text-primary-foreground"
        >
          พิมพ์รายงาน
        </span>
      </div>
    </Card>
  );
}
