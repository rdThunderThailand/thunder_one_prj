import { Avatar } from "@/components/ui/Avatar";
import { Badge, type BadgeColor } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { MoreIcon } from "@/components/ui/icons";
import type { PositionRow, PositionStatus } from "../mock-data";

const statusBadge: Record<PositionStatus, { label: string; color: BadgeColor }> = {
  open: { label: "เปิดรับ", color: "blue" },
  filled: { label: "มีคนครอง", color: "green" },
  closed: { label: "ปิดรับ", color: "zinc" },
  cancelled: { label: "ยกเลิก", color: "red" },
};

interface PositionTableProps {
  rows: PositionRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function PositionTable({ rows, selectedId, onSelect }: PositionTableProps) {
  if (rows.length === 0) {
    return <Card className="p-10 text-center text-sm text-zinc-400">ไม่พบตำแหน่งงานตามเงื่อนไขที่เลือก</Card>;
  }

  return (
    <Card className="overflow-x-auto">
      <table className="w-full min-w-[880px] text-left text-sm">
        <thead className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          <tr>
            <th className="px-4 py-3 font-medium">ตำแหน่งงาน</th>
            <th className="px-4 py-3 font-medium">หน่วยงาน</th>
            <th className="px-4 py-3 font-medium">อัตรากำลัง</th>
            <th className="px-4 py-3 font-medium">ผู้บังคับบัญชา</th>
            <th className="px-4 py-3 font-medium">สถานะ</th>
            <th className="px-4 py-3 font-medium">การกระทำ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
          {rows.map((row) => {
            const fillRate = row.total > 0 ? Math.round((row.filled / row.total) * 100) : 0;
            return (
              <tr
                key={row.id}
                onClick={() => onSelect(row.id)}
                className={`cursor-pointer ${
                  row.id === selectedId ? "bg-indigo-50/60 dark:bg-indigo-500/10" : "hover:bg-zinc-50 dark:hover:bg-zinc-900"
                }`}
              >
                <td className="px-4 py-3">
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">{row.name}</p>
                  <p className="text-xs text-zinc-400">{row.code}</p>
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{row.unit}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <ProgressBar value={fillRate} className="w-16" />
                    <span className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
                      {row.filled}/{row.total} ({fillRate}%)
                    </span>
                  </div>
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
                <td className="px-4 py-3">
                  <Badge variant="pill" color={statusBadge[row.status].color}>
                    {statusBadge[row.status].label}
                  </Badge>
                </td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    title="ยังไม่เปิดใช้งาน"
                    className="cursor-not-allowed text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                  >
                    <MoreIcon className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}
