"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ChevronDownIcon, ClockIcon, CheckCircleIcon, MoreIcon, PlusIcon, SearchIcon, UsersIcon, WarningTriangleIcon } from "@/components/ui/icons";
import { customers, customerStats } from "../mock-data";
import { CUSTOMER_STATUS_CLASSES, CUSTOMER_STATUS_LABEL, CUSTOMER_TYPE_CLASSES, CUSTOMER_TYPE_LABEL } from "../status-colors";
import { WorkspaceFooter } from "./WorkspaceFooter";

const TILES = [
  { label: "ลูกค้าทั้งหมด", value: customerStats.total, icon: UsersIcon, tone: "bg-info-muted text-t1-blue-700" },
  { label: "ลูกค้าปัจจุบัน", value: customerStats.current, icon: CheckCircleIcon, tone: "bg-success-muted text-t1-green-700" },
  { label: "ใกล้ต่ออายุ (30 วัน)", value: customerStats.nearRenewal, icon: ClockIcon, tone: "bg-warning-muted text-t1-amber-700", detail: true },
  { label: "เกินกำหนดต่ออายุ", value: customerStats.overdue, icon: WarningTriangleIcon, tone: "bg-error-muted text-t1-red-700", detail: true },
] as const;

// This new workspace has no Core integration yet (no customer/contract
// tables exist there) — the filter/pagination controls below render the
// mockup's real shape but stay inert (no onClick/onChange), same "honest
// preview, not a fake-working control" treatment the rest of this app uses
// for anything without a real backend yet (e.g. mission-control's old
// BriefTeaserCard button before it got a real panel).
export function CustomersPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-t1-blue-700">Customer Workspace</p>
          <h1 className="text-2xl font-bold text-foreground">ลูกค้า</h1>
          <p className="text-sm text-muted-foreground">จัดการข้อมูลลูกค้าและความสัมพันธ์ เพื่อการดูแลลูกค้าอย่างต่อเนื่อง</p>
        </div>
        <Button className="shrink-0 gap-1.5">
          <PlusIcon className="h-4 w-4" />
          เพิ่มลูกค้า
          <ChevronDownIcon className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TILES.map((tile) => (
          <Card key={tile.label} className="flex flex-col gap-3 p-4">
            <span className={`flex h-10 w-10 items-center justify-center rounded-full ${tile.tone}`}>
              <tile.icon className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm text-muted-foreground">{tile.label}</p>
              <p className="text-2xl font-bold text-foreground">
                {tile.value}
                <span className="ml-1 text-sm font-normal text-t1-gray-400">องค์กร</span>
              </p>
            </div>
            {"detail" in tile && (
              <button type="button" className="text-left text-xs font-medium text-t1-blue-700 hover:text-t1-blue-700">
                ดูรายละเอียด →
              </button>
            )}
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px] flex-1">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-t1-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อองค์กร ชื่อผู้ติดต่อ เลขที่สัญญา..."
              className="w-full rounded-lg border border-border py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-t1-gray-400 focus:border-info focus:outline-none"
            />
          </div>
          {["สถานะ", "ผู้ดูแลหลัก", "ประเภทลูกค้า"].map((label) => (
            <button
              key={label}
              type="button"
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-t1-gray-50"
            >
              {label}: ทั้งหมด
              <ChevronDownIcon className="h-3.5 w-3.5 text-t1-gray-400" />
            </button>
          ))}
          <Button className="px-5">ค้นหา</Button>
          <Button variant="secondary" className="px-5">
            รีเซ็ต
          </Button>
        </div>

        <div className="mb-2 mt-4 flex items-center justify-between text-xs text-t1-gray-400">
          <span>
            แสดง 1 - {customers.length} จาก {customerStats.total} รายการ
          </span>
          <button type="button" className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-muted-foreground hover:bg-t1-gray-50">
            10 รายการต่อหน้า
            <ChevronDownIcon className="h-3 w-3" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-t1-gray-400">
                <th className="w-8 py-2">
                  <input type="checkbox" className="rounded border-border" />
                </th>
                <th className="py-2 font-medium">ลูกค้า / องค์กร</th>
                <th className="py-2 font-medium">ประเภทลูกค้า</th>
                <th className="py-2 font-medium">ผู้ติดต่อหลัก</th>
                <th className="py-2 font-medium">ผู้ดูแลหลัก</th>
                <th className="py-2 font-medium">การต่ออายุรั้งถัดไป</th>
                <th className="py-2 font-medium">สถานะ</th>
                <th className="py-2 font-medium">การดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {customers.map((row) => (
                <tr key={row.id}>
                  <td className="py-3">
                    <input type="checkbox" className="rounded border-border" />
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2.5">
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${row.badgeBg} ${row.badgeText}`}>
                        {row.badgeLabel}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground">{row.orgName}</p>
                        <p className="truncate text-xs text-t1-gray-400">{row.orgNameEn}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${CUSTOMER_TYPE_CLASSES[row.customerType]}`}>
                      {CUSTOMER_TYPE_LABEL[row.customerType]}
                    </span>
                  </td>
                  <td className="py-3">
                    <p className="text-foreground">{row.contactName}</p>
                    <p className="text-xs text-t1-gray-400">{row.contactEmail}</p>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={row.ownerName} size={24} />
                      <span className="text-foreground">{row.ownerName}</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <p className="text-foreground">{row.renewalDate}</p>
                    {row.daysNote && (
                      <p className={row.status === "overdue" ? "text-xs text-error" : "text-xs text-t1-gray-400"}>{row.daysNote}</p>
                    )}
                  </td>
                  <td className="py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${CUSTOMER_STATUS_CLASSES[row.status]}`}>
                      {CUSTOMER_STATUS_LABEL[row.status]}
                    </span>
                  </td>
                  <td className="py-3 text-t1-gray-400">
                    <MoreIcon className="h-4 w-4" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <WorkspaceFooter />
    </div>
  );
}
