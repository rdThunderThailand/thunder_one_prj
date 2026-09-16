import { Avatar } from "@/components/ui/Avatar";
import { Badge, type BadgeColor } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EyeIcon, ImageIcon, MoreIcon } from "@/components/ui/icons";
import { returnRows, type ReturnDocType, type ReturnRowStatus } from "../mock-data";

const docTypeColor: Record<ReturnDocType, BadgeColor> = {
  ขอคืน: "green",
  โอนย้าย: "blue",
};

const statusColor: Record<ReturnRowStatus, BadgeColor> = {
  เกินกำหนด: "red",
  รอการคืน: "yellow",
};

// Row 1 stays visually selected — the row ReturnDetailPanel shows (no real
// row-selection state exists yet, matching this table's other decorative
// controls).
export function ReturnTable() {
  return (
    <Card className="overflow-x-auto">
      <table className="w-full min-w-[860px] text-left text-sm">
        <thead className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          <tr>
            <th className="w-10 px-4 py-3">
              <input type="checkbox" className="rounded border-zinc-300" disabled title="Not built yet" />
            </th>
            <th className="px-4 py-3 font-medium">เลขที่เอกสาร</th>
            <th className="px-2 py-3 font-medium">ผู้เกี่ยวข้อง</th>
            <th className="px-4 py-3 font-medium">ทรัพย์สิน / รายการ</th>
            <th className="px-4 py-3 font-medium">วันที่กำหนดคืน</th>
            <th className="px-4 py-3 font-medium">สถานะ</th>
            <th className="px-4 py-3 font-medium">วันที่ยื่นคำขอ</th>
            <th className="px-4 py-3 font-medium">การดำเนินการ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
          {returnRows.map((row, index) => (
            <tr key={row.id} className={index === 0 ? "bg-indigo-50/60 dark:bg-indigo-500/10" : undefined}>
              <td className="px-4 py-3">
                <input type="checkbox" className="rounded border-zinc-300" disabled title="Not built yet" />
              </td>
              <td className="px-4 py-3">
                <p className="font-medium text-zinc-900 dark:text-zinc-50">{row.docNumber}</p>
                <Badge variant="pill" color={docTypeColor[row.docType]} className="mt-1">
                  {row.docType}
                </Badge>
              </td>
              <td className="px-2 py-3">
                <div className="flex items-center gap-2.5">
                  <Avatar name={row.person} size={30} />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-zinc-900 dark:text-zinc-50">{row.person}</p>
                    <p className="truncate text-xs text-zinc-400">{row.department}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
                    <ImageIcon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-zinc-900 dark:text-zinc-50">{row.assetName}</p>
                    <p className="truncate text-xs text-zinc-400">{row.serial}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <p className="text-zinc-700 dark:text-zinc-200">{row.dueDate}</p>
                <p className={`text-xs ${row.status === "เกินกำหนด" ? "text-red-500" : "text-zinc-400"}`}>
                  {row.dueSublabel}
                </p>
              </td>
              <td className="px-4 py-3">
                <Badge variant="pill" color={statusColor[row.status]}>
                  {row.status}
                </Badge>
              </td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{row.requestDate}</td>
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
