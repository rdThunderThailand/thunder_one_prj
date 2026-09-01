import { Avatar } from "@/components/ui/Avatar";
import { Badge, type BadgeColor } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { MoreIcon } from "@/components/ui/icons";
import type { PersonnelRow, PersonnelType, WorkStatus } from "../mock-data";

const typeBadge: Record<PersonnelType, { label: string; color: BadgeColor }> = {
  employee: { label: "พนักงาน", color: "green" },
  contractor: { label: "ผู้รับเหมา", color: "blue" },
  partner: { label: "พันธมิตร", color: "indigo" },
  guest: { label: "แขก", color: "yellow" },
  inactive: { label: "พ้นสภาพ/ไม่ใช้งาน", color: "zinc" },
};

const statusDot: Record<WorkStatus, { label: string; color: BadgeColor }> = {
  active: { label: "ทำงานอยู่", color: "green" },
  "on-leave": { label: "ลาหยุด", color: "yellow" },
  invited: { label: "เชิญแล้ว", color: "zinc" },
  inactive: { label: "พ้นสภาพ", color: "red" },
};

export function PersonnelTable({ rows }: { rows: PersonnelRow[] }) {
  if (rows.length === 0) {
    return <Card className="p-10 text-center text-sm text-zinc-400">ไม่พบบุคลากรตามเงื่อนไขที่เลือก</Card>;
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
            <th className="px-4 py-3 font-medium">รหัสพนักงาน</th>
            <th className="px-4 py-3 font-medium">ตำแหน่ง</th>
            <th className="px-4 py-3 font-medium">หน่วยงาน / ทีม</th>
            <th className="px-4 py-3 font-medium">ประเภท</th>
            <th className="px-4 py-3 font-medium">สถานะ</th>
            <th className="px-4 py-3 font-medium">วันที่เริ่มงาน</th>
            <th className="px-4 py-3 font-medium">ผู้จัดการ</th>
            <th className="px-4 py-3 font-medium">การกระทำ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="px-4 py-3">
                <input type="checkbox" className="rounded border-zinc-300" disabled title="Not built yet" />
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <Avatar name={row.name} size={32} />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-zinc-900 dark:text-zinc-50">{row.name}</p>
                    <p className="truncate text-xs text-zinc-400">{row.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{row.employeeCode}</td>
              <td className="px-4 py-3 text-zinc-700 dark:text-zinc-200">{row.position}</td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{row.unit}</td>
              <td className="px-4 py-3">
                <Badge variant="pill" color={typeBadge[row.type].color}>
                  {typeBadge[row.type].label}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <Badge variant="dot" color={statusDot[row.workStatus].color}>
                  {statusDot[row.workStatus].label}
                </Badge>
              </td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{row.startDateLabel}</td>
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
                <button type="button" title="Not built yet" className="cursor-not-allowed text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
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
