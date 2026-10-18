import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EyeIcon, ImageIcon, MoreIcon } from "@/components/ui/icons";
import { allocationRows } from "../mock-data";

// Row 1 stays visually selected — it's the row AllocationDetailPanel shows
// (no real row-selection state exists yet, matching this table's other
// decorative controls).
export function AllocationTable() {
  return (
    <Card className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="border-b border-border text-xs text-muted-foreground">
          <tr>
            <th className="w-10 px-4 py-3">
              <input type="checkbox" className="rounded border-border" disabled title="Not built yet" />
            </th>
            <th className="px-4 py-3 font-medium">พนักงาน</th>
            <th className="px-2 py-3 font-medium">ทรัพย์สิน</th>
            <th className="px-4 py-3 font-medium">Serial / Tag</th>
            <th className="px-4 py-3 font-medium">ประเภททรัพย์สิน</th>
            <th className="px-4 py-3 font-medium">วันที่จัดสรร</th>
            <th className="px-4 py-3 font-medium">สถานะ</th>
            <th className="px-4 py-3 font-medium">การดำเนินการ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {allocationRows.map((row, index) => (
            <tr key={row.id} className={index === 0 ? "bg-accent/60" : undefined}>
              <td className="px-4 py-3">
                <input type="checkbox" className="rounded border-border" disabled title="Not built yet" />
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <Avatar name={row.employee} size={30} />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{row.employee}</p>
                    <p className="truncate text-xs text-t1-gray-400">{row.department}</p>
                  </div>
                </div>
              </td>
              <td className="px-2 py-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-t1-gray-400">
                    <ImageIcon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{row.assetName}</p>
                    <p className="truncate text-xs text-t1-gray-400">{row.assetModel}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground">{row.serial}</td>
              <td className="px-4 py-3">
                <p className="text-foreground">{row.category}</p>
                <p className="text-xs text-t1-gray-400">{row.subcategory}</p>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{row.allocatedDate}</td>
              <td className="px-4 py-3">
                <Badge variant="pill" color="green">
                  {row.status}
                </Badge>
              </td>
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
    </Card>
  );
}
