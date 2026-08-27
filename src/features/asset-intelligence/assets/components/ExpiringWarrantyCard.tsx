import { Card } from "@/components/ui/Card";
import { ArrowRightIcon, ImageIcon } from "@/components/ui/icons";
import { expiringWarrantyRows } from "../mock-data";

export function ExpiringWarrantyCard() {
  return (
    <Card className="flex h-full flex-col p-4">
      <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">ทรัพย์สินใกล้หมดอายุ Warranty</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] text-left text-sm">
          <thead className="border-b border-zinc-100 text-xs text-zinc-400 dark:border-zinc-800">
            <tr>
              <th className="py-2 pr-2 font-medium">ทรัพย์สิน</th>
              <th className="px-2 py-2 font-medium">Serial / Asset Tag</th>
              <th className="px-2 py-2 font-medium">หมดอายุ</th>
              <th className="px-2 py-2 font-medium">เหลือ</th>
              <th className="py-2 pl-2 text-right font-medium">มูลค่า (THB)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50 dark:divide-zinc-900">
            {expiringWarrantyRows.map((row) => (
              <tr key={row.id}>
                <td className="py-2 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
                      <ImageIcon className="h-3.5 w-3.5" />
                    </span>
                    <span className="truncate font-medium text-zinc-900 dark:text-zinc-50">{row.assetName}</span>
                  </div>
                </td>
                <td className="px-2 py-2 text-xs text-zinc-400">{row.serial}</td>
                <td className="px-2 py-2 text-zinc-600 dark:text-zinc-300">{row.expiryDate}</td>
                <td className="px-2 py-2 text-amber-600 dark:text-amber-400">{row.daysLabel}</td>
                <td className="py-2 pl-2 text-right text-zinc-600 dark:text-zinc-300">{row.valueTHB.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button className="mt-3 flex items-center gap-1 self-end text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
        ดูทั้งหมด 50 รายการ
        <ArrowRightIcon className="h-3 w-3" />
      </button>
    </Card>
  );
}
