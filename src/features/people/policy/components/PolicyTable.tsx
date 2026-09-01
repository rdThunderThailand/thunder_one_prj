import { Avatar } from "@/components/ui/Avatar";
import { Badge, type BadgeColor } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EyeIcon, MoreIcon } from "@/components/ui/icons";
import { policyRows, type PolicyStatus } from "../mock-data";

const statusBadge: Record<PolicyStatus, { label: string; color: BadgeColor }> = {
  published: { label: "ประกาศใช้", color: "green" },
  review: { label: "รอการทบทวน", color: "yellow" },
  draft: { label: "ร่าง", color: "indigo" },
  retired: { label: "ยกเลิก", color: "zinc" },
};

// A plain browsing list — no master/detail panel in this mockup, unlike
// people/new-hires or people/departures. View/kebab are both inert.
export function PolicyTable() {
  return (
    <Card className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          <tr>
            <th className="px-4 py-3 font-medium">ชื่อนโยบาย</th>
            <th className="px-4 py-3 font-medium">หมวดหมู่</th>
            <th className="px-4 py-3 font-medium">สถานะ</th>
            <th className="px-4 py-3 font-medium">เวอร์ชัน</th>
            <th className="px-4 py-3 font-medium">วันที่ประกาศ</th>
            <th className="px-4 py-3 font-medium">ประกาศโดย</th>
            <th className="px-4 py-3 font-medium">การดำเนินการ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
          {policyRows.map((row) => (
            <tr key={row.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900">
              <td className="px-4 py-3">
                <p className="font-medium text-zinc-900 dark:text-zinc-50">{row.title}</p>
                <p className="truncate text-xs text-zinc-400">{row.description}</p>
              </td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{row.categoryLabel}</td>
              <td className="px-4 py-3">
                <Badge variant="pill" color={statusBadge[row.status].color}>
                  {statusBadge[row.status].label}
                </Badge>
              </td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{row.version}</td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                {row.publishedDateLabel ?? <span className="text-zinc-300 dark:text-zinc-600">-</span>}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <Avatar name={row.publisherName} size={26} />
                  <div className="min-w-0">
                    <p className="truncate text-zinc-700 dark:text-zinc-200">{row.publisherName}</p>
                    <p className="truncate text-xs text-zinc-400">{row.publisherRole}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2 text-zinc-400">
                  <button
                    type="button"
                    title="Not built yet"
                    className="cursor-not-allowed hover:text-zinc-600 dark:hover:text-zinc-300"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    title="Not built yet"
                    className="cursor-not-allowed hover:text-zinc-600 dark:hover:text-zinc-300"
                  >
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
