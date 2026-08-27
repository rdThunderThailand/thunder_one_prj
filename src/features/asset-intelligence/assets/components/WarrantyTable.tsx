import { Badge, type BadgeColor } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, EyeIcon, ImageIcon, MoreIcon } from "@/components/ui/icons";
import { warrantyPageSize, warrantyRows, warrantyTotalCount, warrantyTotalPages, type WarrantyStatus } from "../mock-data";

const statusColor: Record<WarrantyStatus, BadgeColor> = {
  อยู่ในประกัน: "green",
  ใกล้หมดอายุ: "yellow",
  หมดอายุแล้ว: "red",
};

// Row 1 stays visually selected — the row WarrantyDetailPanel shows (no
// real row-selection state exists yet, matching this table's other
// decorative controls).
export function WarrantyTable() {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px] text-left text-sm">
          <thead className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <tr>
              <th className="w-10 px-4 py-3">
                <input type="checkbox" className="rounded border-zinc-300" disabled title="Not built yet" />
              </th>
              <th className="px-2 py-3 font-medium">ทรัพย์สิน</th>
              <th className="px-4 py-3 font-medium">ประเภท</th>
              <th className="px-4 py-3 font-medium">Serial / Asset Tag</th>
              <th className="px-4 py-3 font-medium">Vendor</th>
              <th className="px-4 py-3 font-medium">สถานะ Warranty</th>
              <th className="px-4 py-3 font-medium">หมดอายุ</th>
              <th className="px-4 py-3 font-medium">เหลือ/เลย</th>
              <th className="px-4 py-3 font-medium">มูลค่าความคุ้มครอง (THB)</th>
              <th className="px-4 py-3 font-medium">การดำเนินการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
            {warrantyRows.map((row, index) => (
              <tr key={row.id} className={index === 0 ? "bg-indigo-50/60 dark:bg-indigo-500/10" : undefined}>
                <td className="px-4 py-3">
                  <input type="checkbox" className="rounded border-zinc-300" disabled title="Not built yet" />
                </td>
                <td className="px-2 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
                      <ImageIcon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-zinc-900 dark:text-zinc-50">{row.assetName}</p>
                      <p className="truncate text-xs text-zinc-400">Asset Tag: {row.assetTag}</p>
                      <p className="truncate text-xs text-zinc-400">{row.location}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{row.category}</td>
                <td className="px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400">{row.serial}</td>
                <td className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-200">{row.vendor}</td>
                <td className="px-4 py-3">
                  <Badge variant="pill" color={statusColor[row.status]}>
                    {row.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{row.expiryDate}</td>
                <td className={`px-4 py-3 ${row.status === "หมดอายุแล้ว" ? "text-red-500" : "text-zinc-600 dark:text-zinc-300"}`}>
                  {row.daysLabel}
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{row.coverageValueTHB.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <button type="button" title="Not built yet" className="cursor-not-allowed hover:text-zinc-600 dark:hover:text-zinc-300">
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    <button type="button" title="Not built yet" className="cursor-not-allowed hover:text-zinc-600 dark:hover:text-zinc-300">
                      <MoreIcon className="h-4 w-4" />
                    </button>
                  </div>
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
            {warrantyPageSize}
            <ChevronDownIcon className="h-3 w-3" />
          </span>
          รายการ
        </span>
        <span className="text-sm text-zinc-400">
          1-{warrantyRows.length} จาก {warrantyTotalCount.toLocaleString()} รายการ
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            title="Not built yet"
            className="flex h-7 w-7 cursor-not-allowed items-center justify-center rounded-lg border border-zinc-200 text-zinc-300 dark:border-zinc-700"
          >
            <ChevronLeftIcon className="h-3.5 w-3.5" />
          </button>
          {[1, 2, 3].map((page) => (
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
          <span className="px-1 text-zinc-300">...</span>
          <button
            type="button"
            title="Not built yet"
            className="flex h-7 w-7 cursor-not-allowed items-center justify-center rounded-lg border border-zinc-200 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
          >
            {warrantyTotalPages}
          </button>
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
