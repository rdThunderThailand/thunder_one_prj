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
        <thead className="border-b border-border text-xs text-muted-foreground">
          <tr>
            <th className="w-10 px-4 py-3">
              <input type="checkbox" className="rounded border-border" disabled title="Not built yet" />
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
        <tbody className="divide-y divide-border">
          {transferRows.map((row, index) => (
            <tr key={row.id} className={index === 0 ? "bg-accent/60" : undefined}>
              <td className="px-4 py-3">
                <input type="checkbox" className="rounded border-border" disabled title="Not built yet" />
              </td>
              <td className="px-4 py-3 font-medium text-foreground">{row.docNumber}</td>
              <td className="px-4 py-3">
                <Badge variant="pill" color={typeColor[row.type]}>
                  {row.type}
                </Badge>
                <p className="mt-1 text-xs text-t1-gray-400">{row.typeSublabel}</p>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{row.from}</td>
              <td className="px-4 py-3 text-muted-foreground">{row.to}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-t1-gray-400">
                    <ImageIcon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{row.assetDisplay}</p>
                    <p className="truncate text-xs text-t1-gray-400">{row.serial}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {row.requestDate}
                <p className="text-xs text-t1-gray-400">{row.requestTime}</p>
              </td>
              <td className="px-4 py-3">
                <Badge variant="pill" color="yellow">
                  รอดำเนินการ
                </Badge>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{row.dueDate}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2 text-t1-gray-400">
                  <button type="button" title="Not built yet" className="cursor-not-allowed hover:text-muted-foreground">
                    <EyeIcon className="h-4 w-4" />
                  </button>
                  <button type="button" title="Not built yet" className="cursor-not-allowed hover:text-muted-foreground">
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
