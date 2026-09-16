import { Avatar } from "@/components/ui/Avatar";
import { Badge, type BadgeColor } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { MoreIcon } from "@/components/ui/icons";
import type { PersonnelRow, PersonnelType } from "../mock-data";

const typeBadge: Record<PersonnelType, { label: string; color: BadgeColor }> = {
  employee: { label: "พนักงาน", color: "green" },
  contractor: { label: "ผู้รับเหมา", color: "blue" },
  partner: { label: "พันธมิตร", color: "indigo" },
  guest: { label: "แขก", color: "yellow" },
  inactive: { label: "พ้นสภาพ/ไม่ใช้งาน", color: "zinc" },
};

interface PersonnelGridViewProps {
  rows: PersonnelRow[];
  onEditRow: (row: PersonnelRow) => void;
  onViewRow: (row: PersonnelRow) => void;
}

// The card-grid alternative to PersonnelTable — real since 2026-09-15, same
// rows/actions as the table, just laid out as cards. Not a second data
// source: both views read the exact same `rows` prop from PersonnelPage.
export function PersonnelGridView({ rows, onEditRow, onViewRow }: PersonnelGridViewProps) {
  if (rows.length === 0) {
    return <Card className="p-10 text-center text-sm text-zinc-400">ไม่พบบุคลากรตามเงื่อนไขที่เลือก</Card>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((row) => (
        <Card key={row.id} className="flex flex-col gap-3 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2.5">
              <Avatar name={row.name} src={row.avatarUrl} size={40} />
              <div className="min-w-0">
                <p className="truncate font-medium text-zinc-900 dark:text-zinc-50">{row.name}</p>
                <p className="truncate text-xs text-zinc-400">{row.email}</p>
              </div>
            </div>
            <button
              type="button"
              title="ยังไม่เปิดใช้งาน"
              className="shrink-0 cursor-not-allowed text-zinc-300 hover:text-zinc-400 dark:text-zinc-600"
            >
              <MoreIcon className="h-4 w-4" />
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="pill" color={typeBadge[row.type].color}>
              {typeBadge[row.type].label}
            </Badge>
          </div>
          <dl className="space-y-1.5 text-xs">
            <div className="flex justify-between gap-2">
              <dt className="text-zinc-400">รหัสพนักงาน</dt>
              <dd className="text-zinc-700 dark:text-zinc-200">{row.employeeCode}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-zinc-400">ตำแหน่ง</dt>
              <dd className="truncate text-zinc-700 dark:text-zinc-200">
                {row.position}
                {row.levelRole && <span className="text-zinc-400"> · {row.levelRole}</span>}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-zinc-400">หน่วยงาน</dt>
              <dd className="truncate text-zinc-700 dark:text-zinc-200">{row.unit}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-zinc-400">เริ่มงาน</dt>
              <dd className="text-zinc-700 dark:text-zinc-200">
                {row.startDateLabel} {row.tenureLabel && row.tenureLabel !== "-" ? `(${row.tenureLabel})` : ""}
              </dd>
            </div>
          </dl>
          <div className="mt-auto flex gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => onViewRow(row)}
              className="flex-1 rounded-lg border border-zinc-200 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              ดูรายละเอียด
            </button>
            <button
              type="button"
              onClick={() => onEditRow(row)}
              className="flex-1 rounded-lg border border-zinc-200 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              แก้ไข
            </button>
          </div>
        </Card>
      ))}
    </div>
  );
}
