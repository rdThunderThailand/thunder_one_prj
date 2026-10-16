import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ChevronDownIcon, ImageIcon, XIcon } from "@/components/ui/icons";
import { returnDetail } from "../mock-data";

const historyDot: Record<string, string> = {
  amber: "bg-warning",
  blue: "bg-info",
};

const infoRows: { label: string; value: string }[] = [
  { label: "ประเภทเอกสาร", value: returnDetail.docTypeLabel },
  { label: "วันที่ยื่นคำขอ", value: returnDetail.requestDate },
  { label: "วันที่กำหนดคืน", value: returnDetail.dueDate },
  { label: "เหตุผลในการคืน", value: returnDetail.reason },
  { label: "หมายเหตุ", value: returnDetail.note },
];

export function ReturnDetailPanel() {
  return (
    <Card className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground">{returnDetail.docNumber}</p>
            <Badge variant="pill" color="red">
              {returnDetail.status}
            </Badge>
          </div>
          <p className="text-xs text-t1-gray-400">{returnDetail.docTypeLabel}</p>
        </div>
        <button title="Not built yet" className="cursor-not-allowed text-t1-gray-400 hover:text-muted-foreground">
          <XIcon className="h-4 w-4" />
        </button>
      </div>

      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-t1-gray-400">ข้อมูลผู้เกี่ยวข้อง</p>
      <div className="mb-4 flex items-center gap-2.5">
        <Avatar name={returnDetail.person} size={36} />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{returnDetail.person}</p>
          <p className="truncate text-xs text-t1-gray-400">{returnDetail.personDepartment}</p>
          <p className="truncate text-xs text-t1-gray-400">{returnDetail.personEmail}</p>
          <p className="truncate text-xs text-t1-gray-400">{returnDetail.personPhone}</p>
        </div>
      </div>

      <dl className="flex flex-col gap-2.5 text-sm">
        {infoRows.map((row) => (
          <div key={row.label} className="flex flex-col gap-0.5">
            <dt className="text-xs text-t1-gray-400">{row.label}</dt>
            <dd className="text-foreground">{row.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 border-t border-border pt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-t1-gray-400">รายการทรัพย์สิน</p>
        <div className="flex items-start gap-2.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-muted text-t1-gray-400">
            <ImageIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-medium text-foreground">{returnDetail.assetName}</p>
              <Badge variant="pill" color="green">
                {returnDetail.assetStatus}
              </Badge>
            </div>
            <p className="text-xs text-t1-gray-400">{returnDetail.assetModel}</p>
            <p className="text-xs text-t1-gray-400">{returnDetail.category}</p>
            <p className="text-xs text-t1-gray-400">S/N: {returnDetail.serial}</p>
            <p className="text-xs text-t1-gray-400">Asset ID: {returnDetail.assetId}</p>
            <p className="text-xs text-t1-gray-400">จำนวน: {returnDetail.quantity}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 border-t border-border pt-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-t1-gray-400">ประวัติการดำเนินการ</p>
        <ul className="space-y-3">
          {returnDetail.history.map((event) => (
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
          className="flex cursor-not-allowed items-center justify-center gap-1.5 rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground"
        >
          ดำเนินการต่อ
          <ChevronDownIcon className="h-3.5 w-3.5" />
        </span>
        <span
          title="Not built yet"
          className="flex cursor-not-allowed items-center justify-center rounded-lg border border-border py-2 text-sm font-semibold text-muted-foreground"
        >
          พิมพ์ใบส่งคืน
        </span>
      </div>
    </Card>
  );
}
