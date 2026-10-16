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
          <thead className="border-b border-border text-xs text-muted-foreground">
            <tr>
              <th className="w-10 px-4 py-3">
                <input type="checkbox" className="rounded border-border" disabled title="Not built yet" />
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
          <tbody className="divide-y divide-border">
            {warrantyRows.map((row, index) => (
              <tr key={row.id} className={index === 0 ? "bg-accent/60" : undefined}>
                <td className="px-4 py-3">
                  <input type="checkbox" className="rounded border-border" disabled title="Not built yet" />
                </td>
                <td className="px-2 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-t1-gray-400">
                      <ImageIcon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{row.assetName}</p>
                      <p className="truncate text-xs text-t1-gray-400">Asset Tag: {row.assetTag}</p>
                      <p className="truncate text-xs text-t1-gray-400">{row.location}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{row.category}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{row.serial}</td>
                <td className="px-4 py-3 font-medium text-foreground">{row.vendor}</td>
                <td className="px-4 py-3">
                  <Badge variant="pill" color={statusColor[row.status]}>
                    {row.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{row.expiryDate}</td>
                <td className={`px-4 py-3 ${row.status === "หมดอายุแล้ว" ? "text-error" : "text-muted-foreground"}`}>
                  {row.daysLabel}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{row.coverageValueTHB.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 text-t1-gray-400">
                    <button type="button" title="Not built yet" className="cursor-not-allowed hover:text-muted-foreground">
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    <button type="button" title="Not built yet" className="cursor-not-allowed hover:text-muted-foreground">
                      <MoreIcon className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
        <span
          title="Not built yet"
          className="flex cursor-not-allowed items-center gap-1.5 text-sm text-muted-foreground"
        >
          แสดง
          <span className="flex items-center gap-1 rounded-lg border border-border px-2 py-1">
            {warrantyPageSize}
            <ChevronDownIcon className="h-3 w-3" />
          </span>
          รายการ
        </span>
        <span className="text-sm text-t1-gray-400">
          1-{warrantyRows.length} จาก {warrantyTotalCount.toLocaleString()} รายการ
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            title="Not built yet"
            className="flex h-7 w-7 cursor-not-allowed items-center justify-center rounded-lg border border-border text-t1-gray-400"
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
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-muted-foreground"
              }`}
            >
              {page}
            </button>
          ))}
          <span className="px-1 text-t1-gray-400">...</span>
          <button
            type="button"
            title="Not built yet"
            className="flex h-7 w-7 cursor-not-allowed items-center justify-center rounded-lg border border-border text-sm text-muted-foreground"
          >
            {warrantyTotalPages}
          </button>
          <button
            type="button"
            title="Not built yet"
            className="flex h-7 w-7 cursor-not-allowed items-center justify-center rounded-lg border border-border text-t1-gray-400"
          >
            <ChevronRightIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </Card>
  );
}
