import { Avatar } from "@/components/ui/Avatar";
import { Badge, type BadgeColor } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { EyeIcon, MoreIcon } from "@/components/ui/icons";
import { countRows, type CountRowStatus } from "../mock-data";

const statusColor: Record<CountRowStatus, BadgeColor> = {
  ดำเนินการแล้ว: "green",
  รออนุมัติผล: "blue",
  อยู่ระหว่างดำเนินการ: "yellow",
  รอเริ่มดำเนินการ: "zinc",
  พบความคลาดเคลื่อน: "red",
};

// Row 2 (CNT-2025-0002) stays visually selected — the row CountDetailPanel
// shows (no real row-selection state exists yet, matching this table's
// other decorative controls).
export function CountTable() {
  return (
    <Card className="overflow-x-auto">
      <table className="w-full min-w-[1000px] text-left text-sm">
        <thead className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          <tr>
            <th className="w-10 px-4 py-3">
              <input type="checkbox" className="rounded border-zinc-300" disabled title="Not built yet" />
            </th>
            <th className="px-4 py-3 font-medium">รหัสแผนการตรวจนับ</th>
            <th className="px-4 py-3 font-medium">ชื่อแผนการตรวจนับ</th>
            <th className="px-4 py-3 font-medium">ประเภททรัพย์สิน</th>
            <th className="px-4 py-3 font-medium">สถานที่</th>
            <th className="px-4 py-3 font-medium">กำหนดตรวจนับ</th>
            <th className="px-4 py-3 font-medium">ผู้รับผิดชอบ</th>
            <th className="px-4 py-3 font-medium">สถานะ</th>
            <th className="px-4 py-3 font-medium">ความคืบหน้า</th>
            <th className="px-4 py-3 font-medium">การดำเนินการ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
          {countRows.map((row) => (
            <tr key={row.id} className={row.planCode === "CNT-2025-0002" ? "bg-indigo-50/60 dark:bg-indigo-500/10" : undefined}>
              <td className="px-4 py-3">
                <input type="checkbox" className="rounded border-zinc-300" disabled title="Not built yet" />
              </td>
              <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">{row.planCode}</td>
              <td className="px-4 py-3 text-zinc-700 dark:text-zinc-200">{row.planName}</td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{row.category}</td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{row.location}</td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                {row.scheduleStart} - {row.scheduleEnd}
              </td>
              <td className="px-2 py-3">
                <div className="flex items-center gap-2">
                  <Avatar name={row.owner} size={26} />
                  <div className="min-w-0">
                    <p className="truncate text-zinc-700 dark:text-zinc-200">{row.owner}</p>
                    <p className="truncate text-xs text-zinc-400">{row.ownerDepartment}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <Badge variant="pill" color={statusColor[row.status]}>
                  {row.status}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <p className="mb-1 text-xs text-zinc-500 dark:text-zinc-400">{row.progressPercent}%</p>
                <ProgressBar
                  value={row.progressPercent}
                  color={row.status === "พบความคลาดเคลื่อน" ? "red" : "indigo"}
                  className="w-24"
                />
                <p className="mt-1 text-xs text-zinc-400">
                  {row.countedItems.toLocaleString()}/{row.totalItems.toLocaleString()}
                </p>
              </td>
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
