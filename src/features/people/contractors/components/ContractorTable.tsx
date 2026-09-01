import { Avatar } from "@/components/ui/Avatar";
import { Badge, type BadgeColor } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EyeIcon, MoreIcon } from "@/components/ui/icons";
import type { ContractorRow, ContractorStatus } from "../mock-data";

const statusBadge: Record<ContractorStatus, { label: string; color: BadgeColor }> = {
  active: { label: "กำลังปฏิบัติงาน", color: "green" },
  "expiring-soon": { label: "ใกล้หมดสัญญา", color: "yellow" },
  expired: { label: "หมดสัญญาแล้ว", color: "red" },
  "pending-approval": { label: "รออนุมัติ", color: "zinc" },
};

export function ContractorTable({ rows }: { rows: ContractorRow[] }) {
  if (rows.length === 0) {
    return <Card className="p-10 text-center text-sm text-zinc-400">ไม่พบผู้ปฏิบัติงานภายนอกตามเงื่อนไขที่เลือก</Card>;
  }

  return (
    <Card className="overflow-x-auto">
      <table className="w-full min-w-[1080px] text-left text-sm">
        <thead className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          <tr>
            <th className="px-4 py-3 font-medium">ชื่อ-นามสกุล</th>
            <th className="px-4 py-3 font-medium">บริษัท / ผู้ว่าจ้าง</th>
            <th className="px-4 py-3 font-medium">หน้าที่ / Role</th>
            <th className="px-4 py-3 font-medium">ผู้ประสานงานภายใน</th>
            <th className="px-4 py-3 font-medium">วันที่เริ่ม - สิ้นสุดสัญญา</th>
            <th className="px-4 py-3 font-medium">สถานะ</th>
            <th className="px-4 py-3 font-medium">การดำเนินการ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <Avatar name={row.name} size={32} />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-zinc-900 dark:text-zinc-50">{row.name}</p>
                    <p className="truncate text-xs text-zinc-400">{row.code}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{row.company}</td>
              <td className="px-4 py-3">
                <p className="text-zinc-700 dark:text-zinc-200">{row.role}</p>
                <p className="text-xs text-zinc-400">{row.unit}</p>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <Avatar name={row.coordinatorName} size={22} />
                  <div className="min-w-0">
                    <p className="truncate text-zinc-700 dark:text-zinc-200">{row.coordinatorName}</p>
                    <p className="truncate text-xs text-zinc-400">{row.coordinatorRole}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                {row.contractStartLabel} - {row.contractEndLabel}
              </td>
              <td className="px-4 py-3">
                <Badge variant="pill" color={statusBadge[row.status].color}>
                  {statusBadge[row.status].label}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2 text-zinc-400">
                  <button type="button" title="ยังไม่เปิดใช้งาน" className="cursor-not-allowed hover:text-zinc-600 dark:hover:text-zinc-300">
                    <EyeIcon className="h-4 w-4" />
                  </button>
                  <button type="button" title="ยังไม่เปิดใช้งาน" className="cursor-not-allowed hover:text-zinc-600 dark:hover:text-zinc-300">
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
