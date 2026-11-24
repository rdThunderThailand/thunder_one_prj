import type { ReactNode } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, type BadgeColor } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import {
  BuildingIcon,
  ClipboardIcon,
  ClockIcon,
  CurrencyIcon,
  GlobeIcon,
  MoreIcon,
  RepeatIcon,
  TrendUpIcon,
  UsersIcon,
} from "@/components/ui/icons";
import type { ChangeStatus, ChangeType, ResolvedChangeRow } from "../mock-data";

const typeIcon: Record<ChangeType, ReactNode> = {
  transfer: <RepeatIcon className="h-4 w-4" />,
  position: <TrendUpIcon className="h-4 w-4" />,
  manager: <UsersIcon className="h-4 w-4" />,
  salary: <CurrencyIcon className="h-4 w-4" />,
  "employment-type": <ClipboardIcon className="h-4 w-4" />,
  location: <GlobeIcon className="h-4 w-4" />,
  "work-hours": <ClockIcon className="h-4 w-4" />,
  company: <BuildingIcon className="h-4 w-4" />,
};

export const statusBadge: Record<ChangeStatus, { label: string; color: BadgeColor }> = {
  "pending-approval": { label: "รออนุมัติ", color: "yellow" },
  "in-progress": { label: "อยู่ระหว่างดำเนินการ", color: "blue" },
  "needs-info": { label: "รอข้อมูลเพิ่มเติม", color: "indigo" },
  completed: { label: "เสร็จสิ้น", color: "green" },
  cancelled: { label: "ยกเลิก", color: "zinc" },
};

interface ChangeTableProps {
  rows: ResolvedChangeRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ChangeTable({ rows, selectedId, onSelect }: ChangeTableProps) {
  if (rows.length === 0) {
    return <Card className="p-10 text-center text-sm text-t1-gray-400">ไม่พบการเปลี่ยนแปลงตามเงื่อนไขที่เลือก</Card>;
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
            <th className="px-4 py-3 font-medium">ประเภทการเปลี่ยนแปลง</th>
            <th className="px-4 py-3 font-medium">รายละเอียด</th>
            <th className="px-4 py-3 font-medium">วันที่มีผล</th>
            <th className="px-4 py-3 font-medium">สถานะ</th>
            <th className="px-4 py-3 font-medium">ผู้ร้องขอ</th>
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
                row.id === selectedId ? "bg-accent/60" : "hover:bg-t1-gray-50"
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
                <div className="flex items-center gap-2 text-foreground">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    {typeIcon[row.changeType]}
                  </span>
                  {row.changeTypeLabel}
                </div>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                <span className="whitespace-nowrap">{row.fromValue}</span>
                <span className="mx-1.5 text-t1-gray-400">→</span>
                <span className="whitespace-nowrap">{row.toValue}</span>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{row.effectiveDateLabel}</td>
              <td className="px-4 py-3">
                <Badge variant="pill" color={statusBadge[row.resolvedStatus].color}>
                  {statusBadge[row.resolvedStatus].label}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <Avatar name={row.requesterName} size={22} />
                  <div className="min-w-0">
                    <p className="truncate text-foreground">{row.requesterName}</p>
                    {row.requesterRole && <p className="truncate text-xs text-t1-gray-400">{row.requesterRole}</p>}
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <p className="text-muted-foreground">{row.requestedDateLabel}</p>
                <p className="text-xs text-t1-gray-400">{row.updatedAgoLabel}</p>
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
