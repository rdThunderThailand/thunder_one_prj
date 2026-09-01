import { Avatar } from "@/components/ui/Avatar";
import { Badge, type BadgeColor } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { MoreIcon } from "@/components/ui/icons";
import type { NewHireRow, NewHireStatus } from "../mock-data";

const statusBadge: Record<NewHireStatus, { label: string; color: BadgeColor }> = {
  "in-progress": { label: "กำลังดำเนินการ", color: "blue" },
  pending: { label: "รอดำเนินการ", color: "yellow" },
  "not-started": { label: "รอการเริ่มงาน", color: "red" },
  completed: { label: "เสร็จสิ้น", color: "green" },
};

interface NewHireTableProps {
  rows: NewHireRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function NewHireTable({ rows, selectedId, onSelect }: NewHireTableProps) {
  if (rows.length === 0) {
    return <Card className="p-10 text-center text-sm text-zinc-400">ไม่พบพนักงานเข้าใหม่ตามเงื่อนไขที่เลือก</Card>;
  }

  return (
    <Card className="overflow-x-auto">
      <table className="w-full min-w-[980px] text-left text-sm">
        <thead className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          <tr>
            <th className="w-10 px-4 py-3">
              <input type="checkbox" className="rounded border-zinc-300" disabled title="Not built yet" />
            </th>
            <th className="px-4 py-3 font-medium">บุคลากร</th>
            <th className="px-4 py-3 font-medium">ตำแหน่งงาน</th>
            <th className="px-4 py-3 font-medium">หน่วยงาน / ทีม</th>
            <th className="px-4 py-3 font-medium">วันที่เริ่มงาน</th>
            <th className="px-4 py-3 font-medium">ความคืบหน้า</th>
            <th className="px-4 py-3 font-medium">สถานะ</th>
            <th className="px-4 py-3 font-medium">ผู้จัดการ</th>
            <th className="px-4 py-3 font-medium">การกระทำ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
          {rows.map((row) => (
            <tr
              key={row.id}
              onClick={() => onSelect(row.id)}
              className={`cursor-pointer ${
                row.id === selectedId ? "bg-indigo-50/60 dark:bg-indigo-500/10" : "hover:bg-zinc-50 dark:hover:bg-zinc-900"
              }`}
            >
              <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                <input type="checkbox" className="rounded border-zinc-300" disabled title="Not built yet" />
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <Avatar name={row.name} size={32} />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-zinc-900 dark:text-zinc-50">{row.name}</p>
                    <p className="truncate text-xs text-zinc-400">{row.employeeCode}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-zinc-700 dark:text-zinc-200">{row.position}</td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{row.unit}</td>
              <td className="px-4 py-3">
                <p className="text-zinc-600 dark:text-zinc-300">{row.startDateLabel}</p>
                <p className="text-xs text-zinc-400">{row.daysLeftLabel}</p>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <ProgressBar value={row.progress} className="w-20" />
                  <span className="w-9 shrink-0 text-xs text-zinc-500 dark:text-zinc-400">{row.progress}%</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <Badge variant="pill" color={statusBadge[row.status].color}>
                  {statusBadge[row.status].label}
                </Badge>
              </td>
              <td className="px-4 py-3">
                {row.managerName ? (
                  <div className="flex items-center gap-2">
                    <Avatar name={row.managerName} size={22} />
                    <div className="min-w-0">
                      <p className="truncate text-zinc-700 dark:text-zinc-200">{row.managerName}</p>
                      <p className="truncate text-xs text-zinc-400">{row.managerRole}</p>
                    </div>
                  </div>
                ) : (
                  <span className="text-zinc-300 dark:text-zinc-600">-</span>
                )}
              </td>
              <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  title="Not built yet"
                  className="cursor-not-allowed text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
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
