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
    return <Card className="p-10 text-center text-sm text-zinc-400">ไม่พบการเปลี่ยนแปลงตามเงื่อนไขที่เลือก</Card>;
  }

  return (
    <Card className="overflow-x-auto">
      <table className="w-full min-w-[1080px] text-left text-sm">
        <thead className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          <tr>
            <th className="w-10 px-4 py-3">
              <input type="checkbox" className="rounded border-zinc-300" disabled title="Not built yet" />
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
              <td className="px-4 py-3">
                <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-200">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                    {typeIcon[row.changeType]}
                  </span>
                  {row.changeTypeLabel}
                </div>
              </td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                <span className="whitespace-nowrap">{row.fromValue}</span>
                <span className="mx-1.5 text-zinc-300">→</span>
                <span className="whitespace-nowrap">{row.toValue}</span>
              </td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{row.effectiveDateLabel}</td>
              <td className="px-4 py-3">
                <Badge variant="pill" color={statusBadge[row.resolvedStatus].color}>
                  {statusBadge[row.resolvedStatus].label}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <Avatar name={row.requesterName} size={22} />
                  <div className="min-w-0">
                    <p className="truncate text-zinc-700 dark:text-zinc-200">{row.requesterName}</p>
                    {row.requesterRole && <p className="truncate text-xs text-zinc-400">{row.requesterRole}</p>}
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <p className="text-zinc-600 dark:text-zinc-300">{row.requestedDateLabel}</p>
                <p className="text-xs text-zinc-400">{row.updatedAgoLabel}</p>
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
