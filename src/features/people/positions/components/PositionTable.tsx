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
    return <Card className="p-10 text-center text-sm text-t1-gray-400">ไม่พบตำแหน่งงานตามเงื่อนไขที่เลือก</Card>;
  }

  return (
    <Card className="overflow-x-auto">
      <table className="w-full min-w-[880px] text-left text-sm">
        <thead className="border-b border-border text-xs text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">ตำแหน่งงาน</th>
            <th className="px-4 py-3 font-medium">หน่วยงาน</th>
            <th className="px-4 py-3 font-medium">อัตรากำลัง</th>
            <th className="px-4 py-3 font-medium">ผู้บังคับบัญชา</th>
            <th className="px-4 py-3 font-medium">สถานะ</th>
            <th className="px-4 py-3 font-medium">การกระทำ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => {
            const fillRate = row.total > 0 ? Math.round((row.filled / row.total) * 100) : 0;
            return (
              <tr
                key={row.id}
                onClick={() => onSelect(row.id)}
                className={`cursor-pointer ${
                  row.id === selectedId ? "bg-accent/60" : "hover:bg-t1-gray-50"
                }`}
              >
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground">{row.name}</p>
                  <p className="text-xs text-t1-gray-400">{row.code}</p>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{row.unit}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <ProgressBar value={fillRate} className="w-16" />
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {row.filled}/{row.total} ({fillRate}%)
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {row.managerName ? (
                    <div className="flex items-center gap-2">
                      <Avatar name={row.managerName} size={22} />
                      <div className="min-w-0">
                        <p className="truncate text-foreground">{row.managerName}</p>
                        <p className="truncate text-xs text-t1-gray-400">{row.managerRole}</p>
                      </div>
                    </div>
                  ) : (
                    <span className="text-t1-gray-400">-</span>
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
                    className="cursor-not-allowed text-t1-gray-400 hover:text-muted-foreground"
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
