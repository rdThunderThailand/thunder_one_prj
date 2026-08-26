import { Badge, type BadgeColor } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EyeIcon, ImageIcon, MoreIcon } from "@/components/ui/icons";
import { transferRows, type TransferTypeLabel } from "../mock-data";

const typeColor: Record<TransferTypeLabel, BadgeColor> = {
  "บุคคล ↔ บุคคล": "green",
  "หน่วยงาน ↔ หน่วยงาน": "indigo",
  "สถานที่ ↔ สถานที่": "blue",
  หลายรายการ: "zinc",
  "โครงการ ↔ โครงการ": "yellow",
  "บุคคล → สถานที่": "red",
  "บุคคล → พ้นงาน": "red",
  "สถานที่ → คลัง": "zinc",
};

// Row 1 stays visually selected — the row TransferDetailPanel shows (no
// real row-selection state exists yet, matching this table's other
// decorative controls).
export function TransferTable() {
  return (
    <Card className="overflow-x-auto">
      <table className="w-full min-w-[1000px] text-left text-sm">
        <thead className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          <tr>
            <th className="w-10 px-4 py-3">
              <input type="checkbox" className="rounded border-zinc-300" disabled title="Not built yet" />
            </th>
            <th className="px-4 py-3 font-medium">เลขที่เอกสาร</th>
            <th className="px-4 py-3 font-medium">ประเภทการโอนย้าย</th>
            <th className="px-4 py-3 font-medium">ผู้โอน (จาก)</th>
            <th className="px-4 py-3 font-medium">ผู้รับโอน (ไปยัง)</th>
            <th className="px-4 py-3 font-medium">ทรัพย์สิน / รายการ</th>
            <th className="px-4 py-3 font-medium">วันที่ร้องขอ</th>
            <th className="px-4 py-3 font-medium">สถานะ</th>
            <th className="px-4 py-3 font-medium">กำหนดดำเนินการ</th>
            <th className="px-4 py-3 font-medium">การดำเนินการ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
          {transferRows.map((row, index) => (
            <tr key={row.id} className={index === 0 ? "bg-indigo-50/60 dark:bg-indigo-500/10" : undefined}>
              <td className="px-4 py-3">
                <input type="checkbox" className="rounded border-zinc-300" disabled title="Not built yet" />
              </td>
              <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">{row.docNumber}</td>
              <td className="px-4 py-3">
                <Badge variant="pill" color={typeColor[row.type]}>
                  {row.type}
                </Badge>
                <p className="mt-1 text-xs text-zinc-400">{row.typeSublabel}</p>
              </td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{row.from}</td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{row.to}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
                    <ImageIcon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-zinc-900 dark:text-zinc-50">{row.assetDisplay}</p>
                    <p className="truncate text-xs text-zinc-400">{row.serial}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                {row.requestDate}
                <p className="text-xs text-zinc-400">{row.requestTime}</p>
              </td>
              <td className="px-4 py-3">
                <Badge variant="pill" color="yellow">
                  รอดำเนินการ
                </Badge>
              </td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{row.dueDate}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2 text-zinc-400">
                  <button type="button" title="Not built yet" className="cursor-not-allowed hover:text-zinc-600 dark:hover:text-zinc-300">
                    <EyeIcon className="h-4 w-4" />
                  </button>
                  <button type="button" title="Not built yet" className="cursor-not-allowed hover:text-zinc-600 dark:hover:text-zinc-300">
                    <MoreIcon className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
