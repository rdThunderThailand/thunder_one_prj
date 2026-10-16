import { Avatar } from "@/components/ui/Avatar";
import { Badge, type BadgeColor } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { MoreIcon } from "@/components/ui/icons";
import type { DepartureRow, DepartureStatus } from "../mock-data";

export const departureStatusBadge: Record<DepartureStatus, { label: string; color: BadgeColor }> = {
  "in-progress": { label: "กำลังดำเนินการ", color: "blue" },
  "due-soon": { label: "ถึงกำหนดออก", color: "yellow" },
  completed: { label: "เสร็จสิ้น", color: "green" },
  cancelled: { label: "ยกเลิก", color: "zinc" },
};

interface DepartureTableProps {
  rows: DepartureRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function DepartureTable({ rows, selectedId, onSelect }: DepartureTableProps) {
  if (rows.length === 0) {
    return <Card className="p-10 text-center text-sm text-t1-gray-400">ไม่พบรายการออกจากองค์กรตามเงื่อนไขที่เลือก</Card>;
  }

  return (
    <Card className="overflow-x-auto">
      <table className="w-full min-w-[1080px] text-left text-sm">
        <thead className="border-b border-border text-xs text-muted-foreground">
          <tr>
            <th className="w-10 px-4 py-3">
              <input type="checkbox" className="rounded border-border" disabled title="Not built yet" />
            </th>
            <th className="px-4 py-3 font-medium">บุคลากร</th>
            <th className="px-4 py-3 font-medium">ตำแหน่ง / ทีม</th>
            <th className="px-4 py-3 font-medium">ประเภทการออก</th>
            <th className="px-4 py-3 font-medium">วันที่ออก</th>
            <th className="px-4 py-3 font-medium">สถานะ</th>
            <th className="px-4 py-3 font-medium">ความคืบหน้า</th>
            <th className="px-4 py-3 font-medium">ผู้รับผิดชอบ</th>
            <th className="px-4 py-3 font-medium">อัปเดตล่าสุด</th>
            <th className="px-4 py-3 font-medium">การกระทำ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => (
            <tr
              key={row.id}
              onClick={() => onSelect(row.id)}
              className={`cursor-pointer ${
                row.id === selectedId ? "bg-accent/60" : "hover:bg-muted"
              }`}
            >
              <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                <input type="checkbox" className="rounded border-border" disabled title="Not built yet" />
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <Avatar name={row.name} size={32} />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{row.name}</p>
                    <p className="truncate text-xs text-t1-gray-400">{row.employeeCode}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <p className="text-foreground">{row.position}</p>
                <p className="text-xs text-t1-gray-400">{row.unit}</p>
              </td>
              <td className="px-4 py-3">
                <p className="text-foreground">{row.exitTypeLabel}</p>
                <p className="text-xs text-t1-gray-400">{row.exitTypeSubLabel}</p>
              </td>
              <td className="px-4 py-3">
                {row.exitDateLabel ? (
                  <>
                    <p className="text-muted-foreground">{row.exitDateLabel}</p>
                    <p className="text-xs text-t1-gray-400">{row.daysLeftLabel}</p>
                  </>
                ) : (
                  <span className="text-t1-gray-400">-</span>
                )}
              </td>
              <td className="px-4 py-3">
                <Badge variant="pill" color={departureStatusBadge[row.status].color}>
                  {departureStatusBadge[row.status].label}
                </Badge>
              </td>
              <td className="px-4 py-3">
                {row.progress !== null ? (
                  <div className="flex items-center gap-2">
                    <ProgressBar
                      value={row.progress}
                      color={row.progress === 100 ? "emerald" : "indigo"}
                      className="w-20"
                    />
                    <span className="w-9 shrink-0 text-xs text-muted-foreground">{row.progress}%</span>
                  </div>
                ) : (
                  <span className="text-t1-gray-400">-</span>
                )}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <Avatar name={row.responsibleName} size={22} />
                  <div className="min-w-0">
                    <p className="truncate text-foreground">{row.responsibleName}</p>
                    {row.responsibleRole && <p className="truncate text-xs text-t1-gray-400">{row.responsibleRole}</p>}
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <p className="text-muted-foreground">{row.updatedDateLabel}</p>
                <p className="text-xs text-t1-gray-400">{row.updatedTimeLabel}</p>
              </td>
              <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  title="Not built yet"
                  className="cursor-not-allowed text-t1-gray-400 hover:text-muted-foreground"
                >
                  <MoreIcon className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
