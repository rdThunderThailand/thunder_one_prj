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
        <thead className="border-b border-border text-xs text-muted-foreground">
          <tr>
            <th className="w-10 px-4 py-3">
              <input type="checkbox" className="rounded border-border" disabled title="Not built yet" />
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
        <tbody className="divide-y divide-border">
          {countRows.map((row) => (
            <tr key={row.id} className={row.planCode === "CNT-2025-0002" ? "bg-accent/60" : undefined}>
              <td className="px-4 py-3">
                <input type="checkbox" className="rounded border-border" disabled title="Not built yet" />
              </td>
              <td className="px-4 py-3 font-medium text-foreground">{row.planCode}</td>
              <td className="px-4 py-3 text-foreground">{row.planName}</td>
              <td className="px-4 py-3 text-muted-foreground">{row.category}</td>
              <td className="px-4 py-3 text-muted-foreground">{row.location}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {row.scheduleStart} - {row.scheduleEnd}
              </td>
              <td className="px-2 py-3">
                <div className="flex items-center gap-2">
                  <Avatar name={row.owner} size={26} />
                  <div className="min-w-0">
                    <p className="truncate text-foreground">{row.owner}</p>
                    <p className="truncate text-xs text-t1-gray-400">{row.ownerDepartment}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <Badge variant="pill" color={statusColor[row.status]}>
                  {row.status}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <p className="mb-1 text-xs text-muted-foreground">{row.progressPercent}%</p>
                <ProgressBar
                  value={row.progressPercent}
                  color={row.status === "พบความคลาดเคลื่อน" ? "red" : "indigo"}
                  className="w-24"
                />
                <p className="mt-1 text-xs text-t1-gray-400">
                  {row.countedItems.toLocaleString()}/{row.totalItems.toLocaleString()}
                </p>
              </td>
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
