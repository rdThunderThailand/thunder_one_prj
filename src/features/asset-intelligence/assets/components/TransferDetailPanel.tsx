import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ArrowLeftIcon, ImageIcon, XIcon } from "@/components/ui/icons";
import { transferDetail } from "../mock-data";

const historyDot: Record<string, string> = {
  blue: "bg-blue-500",
  zinc: "border-2 border-zinc-300 bg-white dark:bg-zinc-900",
};

function PartyCard({ label, party }: { label: string; party: typeof transferDetail.from }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-400">{label}</p>
      <div className="flex items-start gap-2.5">
        <Avatar name={party.name} size={32} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{party.name}</p>
          <p className="truncate text-xs text-zinc-400">{party.department}</p>
          <p className="truncate text-xs text-zinc-400">{party.email}</p>
          <p className="truncate text-xs text-zinc-400">{party.phone}</p>
          <p className="truncate text-xs text-zinc-400">{party.location}</p>
        </div>
      </div>
    </div>
  );
}

const infoRows: { label: string; value: string }[] = [
  { label: "ประเภทการโอนย้าย", value: transferDetail.type },
  { label: "วันที่ร้องขอ", value: transferDetail.requestDate },
  { label: "ผู้ร้องขอ", value: transferDetail.requestedBy },
  { label: "เหตุผล", value: transferDetail.reason },
  { label: "กำหนดดำเนินการ", value: transferDetail.dueDate },
  { label: "หมายเหตุ", value: transferDetail.note },
];

export function TransferDetailPanel() {
  return (
    <Card className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{transferDetail.docNumber}</p>
            <Badge variant="pill" color="yellow">
              {transferDetail.status}
            </Badge>
          </div>
          <p className="text-xs text-zinc-400">รายละเอียดการโอนย้าย</p>
        </div>
        <button title="Not built yet" className="cursor-not-allowed text-zinc-300 hover:text-zinc-400">
          <XIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <PartyCard label="ผู้โอน (จาก)" party={transferDetail.from} />
        <ArrowLeftIcon className="h-4 w-4 -rotate-90 text-zinc-300" />
        <PartyCard label="ผู้รับโอน (ไปยัง)" party={transferDetail.to} />
      </div>

      <div className="mt-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">ทรัพย์สิน / รายการ</p>
        <ul className="flex flex-col gap-2.5">
          {transferDetail.assets.map((asset) => (
            <li key={asset.id} className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
                <ImageIcon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{asset.name}</p>
                  <Badge variant="pill" color="green">
                    {asset.status}
                  </Badge>
                </div>
                <p className="truncate text-xs text-zinc-400">
                  {asset.model} · {asset.serial}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <dl className="mt-4 flex flex-col gap-2.5 border-t border-zinc-100 pt-4 text-sm dark:border-zinc-800">
        {infoRows.map((row) => (
          <div key={row.label} className="flex flex-col gap-0.5">
            <dt className="text-xs text-zinc-400">{row.label}</dt>
            <dd className="text-zinc-700 dark:text-zinc-200">{row.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">ประวัติการดำเนินการ</p>
        <ul className="space-y-3">
          {transferDetail.history.map((event) => (
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

      <div className="mt-4 flex flex-col gap-2">
        <span
          title="Not built yet"
          className="flex cursor-not-allowed items-center justify-center rounded-lg bg-indigo-300 py-2 text-sm font-semibold text-white dark:bg-indigo-500/40"
        >
          อนุมัติการโอนย้าย
        </span>
        <span
          title="Not built yet"
          className="flex cursor-not-allowed items-center justify-center rounded-lg border border-zinc-200 py-2 text-sm font-semibold text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
        >
          ปฏิเสธ
        </span>
      </div>
    </Card>
  );
}
