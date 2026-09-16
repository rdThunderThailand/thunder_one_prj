import { Badge, type BadgeColor } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { BoxIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, MonitorIcon, MoreIcon, PhoneIcon, VideoIcon } from "@/components/ui/icons";
import {
  categoryPageSize,
  categoryRows,
  categoryTotalCount,
  categoryTotalPages,
  type CategoryIcon,
  type CategoryStatus,
} from "../mock-data";

const iconFor: Record<CategoryIcon, React.ReactNode> = {
  laptop: <MonitorIcon />,
  desktop: <MonitorIcon />,
  printer: <BoxIcon />,
  mobile: <PhoneIcon />,
  tablet: <PhoneIcon />,
  monitor: <MonitorIcon />,
  furniture: <BoxIcon />,
  vehicle: <BoxIcon />,
  ac: <BoxIcon />,
  projector: <VideoIcon />,
};

const statusColor: Record<CategoryStatus, BadgeColor> = {
  ใช้งานอยู่: "green",
  ไม่ได้ใช้งาน: "red",
};

function formatTHB(value: number): string {
  return value.toLocaleString("en-US");
}

// The first row (Laptop) stays visually selected — the category
// CategoryDetailPanel shows (no real row-selection state exists yet,
// matching this table's other decorative controls).
export function CategoryTable() {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <tr>
              <th className="w-10 px-4 py-3">
                <input type="checkbox" className="rounded border-zinc-300" disabled title="Not built yet" />
              </th>
              <th className="px-4 py-3 font-medium">ประเภททรัพย์สิน</th>
              <th className="px-4 py-3 font-medium">รหัสประเภท</th>
              <th className="px-4 py-3 font-medium">หมวดหลัก</th>
              <th className="px-4 py-3 font-medium">จำนวนทรัพย์สิน</th>
              <th className="px-4 py-3 font-medium">มูลค่ารวม (ราคาทุน)</th>
              <th className="px-4 py-3 font-medium">สถานะ</th>
              <th className="px-4 py-3 font-medium">การดำเนินการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
            {categoryRows.map((row, index) => (
              <tr key={row.id} className={index === 0 ? "bg-indigo-50/60 dark:bg-indigo-500/10" : undefined}>
                <td className="px-4 py-3">
                  <input type="checkbox" className="rounded border-zinc-300" disabled title="Not built yet" />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                      {iconFor[row.icon]}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-zinc-900 dark:text-zinc-50">{row.name}</p>
                      <p className="truncate text-xs text-zinc-400">{row.nameEn}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400">{row.code}</td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{row.parent}</td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{row.assetCount.toLocaleString()}</td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{formatTHB(row.totalValueTHB)}</td>
                <td className="px-4 py-3">
                  <Badge variant="pill" color={statusColor[row.status]}>
                    {row.status}
                  </Badge>
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
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 px-4 py-3 dark:border-zinc-800">
        <span
          title="Not built yet"
          className="flex cursor-not-allowed items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400"
        >
          แสดง
          <span className="flex items-center gap-1 rounded-lg border border-zinc-200 px-2 py-1 dark:border-zinc-700">
            {categoryPageSize}
            <ChevronDownIcon className="h-3 w-3" />
          </span>
          รายการ
        </span>
        <span className="text-sm text-zinc-400">
          1-{categoryRows.length} จาก {categoryTotalCount.toLocaleString()} รายการ
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            title="Not built yet"
            className="flex h-7 w-7 cursor-not-allowed items-center justify-center rounded-lg border border-zinc-200 text-zinc-300 dark:border-zinc-700"
          >
            <ChevronLeftIcon className="h-3.5 w-3.5" />
          </button>
          {Array.from({ length: categoryTotalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              type="button"
              title="Not built yet"
              className={`flex h-7 w-7 cursor-not-allowed items-center justify-center rounded-lg text-sm ${
                page === 1
                  ? "bg-indigo-600 text-white"
                  : "border border-zinc-200 text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
              }`}
            >
              {page}
            </button>
          ))}
          <button
            type="button"
            title="Not built yet"
            className="flex h-7 w-7 cursor-not-allowed items-center justify-center rounded-lg border border-zinc-200 text-zinc-300 dark:border-zinc-700"
          >
            <ChevronRightIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </Card>
  );
}
