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
        <thead className="border-b border-border text-xs text-muted-foreground">
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
        <tbody className="divide-y divide-border">
          {policyRows.map((row) => (
            <tr key={row.id} className="hover:bg-t1-gray-50">
              <td className="px-4 py-3">
                <p className="font-medium text-foreground">{row.title}</p>
                <p className="truncate text-xs text-t1-gray-400">{row.description}</p>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{row.categoryLabel}</td>
              <td className="px-4 py-3">
                <Badge variant="pill" color={statusBadge[row.status].color}>
                  {statusBadge[row.status].label}
                </Badge>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{row.version}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {row.publishedDateLabel ?? <span className="text-t1-gray-400">-</span>}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <Avatar name={row.publisherName} size={26} />
                  <div className="min-w-0">
                    <p className="truncate text-foreground">{row.publisherName}</p>
                    <p className="truncate text-xs text-t1-gray-400">{row.publisherRole}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2 text-t1-gray-400">
                  <button
                    type="button"
                    title="Not built yet"
                    className="cursor-not-allowed hover:text-muted-foreground"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    title="Not built yet"
                    className="cursor-not-allowed hover:text-muted-foreground"
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
