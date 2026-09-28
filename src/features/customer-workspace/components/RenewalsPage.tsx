"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ChevronDownIcon, ClockIcon, CurrencyIcon, MoreIcon, PlusIcon, SearchIcon, WarningTriangleIcon } from "@/components/ui/icons";
import { renewalStats, renewalTabCounts, renewals } from "../mock-data";
import { RENEWAL_STATUS_CLASSES, RENEWAL_STATUS_LABEL } from "../status-colors";
import { WorkspaceFooter } from "./WorkspaceFooter";

const TILES = [
  { label: "ครบกำหนดใน 30 วัน", value: `${renewalStats.dueIn30Days} รายการ`, delta: `+${renewalStats.dueIn30DaysDelta} จากช่วงก่อน`, icon: ClockIcon, tone: "bg-orange-50 text-orange-600" },
  { label: "เกินกำหนด", value: `${renewalStats.overdue} รายการ`, icon: WarningTriangleIcon, tone: "bg-red-50 text-red-600" },
  { label: "อยู่ระหว่างดำเนินการ", value: `${renewalStats.inProgress} รายการ`, icon: ClockIcon, tone: "bg-blue-50 text-blue-600" },
  {
    label: "มูลค่าที่จะต่ออายุ (30 วัน)",
    value: `${renewalStats.upcomingValue.toLocaleString("th-TH")} บาท`,
    delta: `+${renewalStats.upcomingValueDeltaPct}% จากช่วงก่อน`,
    icon: CurrencyIcon,
    tone: "bg-violet-50 text-violet-600",
  },
] as const;

const TABS = [
  { key: "all", label: "ทั้งหมด", count: renewalTabCounts.all },
  { key: "due", label: "ครบกำหนดใน 30 วัน", count: renewalTabCounts.dueIn30Days },
  { key: "overdue", label: "เกินกำหนด", count: renewalTabCounts.overdue },
  { key: "in-progress", label: "อยู่ระหว่างดำเนินการ", count: renewalTabCounts.inProgress },
  { key: "done", label: "เสร็จสิ้น", count: renewalTabCounts.done },
  { key: "cancelled", label: "ยกเลิก", count: renewalTabCounts.cancelled },
] as const;

// Same "real shape, inert controls" reasoning as CustomersPage — no Core
// integration for contracts/renewals exists yet.
export function RenewalsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-blue-600">Customer Workspace</p>
          <h1 className="text-2xl font-bold text-zinc-900">การต่ออายุ</h1>
          <p className="text-sm text-zinc-500">จัดการการต่ออายุลูกค้า เพื่อต่อยอดความสัมพันธ์และรายได้อย่างต่อเนื่อง</p>
        </div>
        <Button className="shrink-0 gap-1.5">
          <PlusIcon className="h-4 w-4" />
          สร้างการต่ออายุ
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
              <p className="text-sm text-zinc-500">{tile.label}</p>
              <p className="text-2xl font-bold text-zinc-900">{tile.value}</p>
            </div>
            <div className="flex items-center justify-between text-xs">
              {"delta" in tile ? <span className="font-medium text-emerald-600">↑ {tile.delta}</span> : <span />}
              <button type="button" className="font-medium text-blue-600 hover:text-blue-700">
                ดูรายละเอียด →
              </button>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px] flex-1">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="ค้นหาลูกค้า ชื่อสัญญา หมายเลขสัญญา..."
              className="w-full rounded-lg border border-zinc-200 py-2 pl-9 pr-3 text-sm text-zinc-700 placeholder:text-zinc-400 focus:border-blue-400 focus:outline-none"
            />
          </div>
          {["สถานะ", "ช่วงวันที่ครบกำหนด", "ผู้รับผิดชอบ", "ประเภท"].map((label) => (
            <button
              key={label}
              type="button"
              className="flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50"
            >
              {label}: ทั้งหมด
              <ChevronDownIcon className="h-3.5 w-3.5 text-zinc-400" />
            </button>
          ))}
          <Button className="px-5">ค้นหา</Button>
          <Button variant="secondary" className="px-5">
            รีเซ็ต
          </Button>
        </div>

        <div className="mt-4 flex gap-5 overflow-x-auto border-b border-zinc-100 text-sm">
          {TABS.map((tab, i) => (
            <button
              key={tab.key}
              type="button"
              className={`shrink-0 whitespace-nowrap border-b-2 pb-2.5 font-semibold ${
                i === 0 ? "border-blue-600 text-blue-600" : "border-transparent text-zinc-500 hover:text-zinc-700"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        <div className="mb-2 mt-4 flex items-center justify-between text-xs text-zinc-400">
          <span>
            แสดง 1 - {renewals.length} จาก {renewalTabCounts.all} รายการ
          </span>
          <button type="button" className="flex items-center gap-1 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-zinc-600 hover:bg-zinc-50">
            10 รายการต่อหน้า
            <ChevronDownIcon className="h-3 w-3" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-xs text-zinc-400">
                <th className="w-8 py-2">
                  <input type="checkbox" className="rounded border-zinc-300" />
                </th>
                <th className="py-2 font-medium">ลูกค้า / องค์กร</th>
                <th className="py-2 font-medium">สัญญา / ที่เกี่ยวข้อง</th>
                <th className="py-2 font-medium">วันที่ครบกำหนด</th>
                <th className="py-2 font-medium">มูลค่า</th>
                <th className="py-2 font-medium">สถานะ</th>
                <th className="py-2 font-medium">ผู้รับผิดชอบ</th>
                <th className="py-2 font-medium">ขั้นตอนถัดไป</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {renewals.map((row) => (
                <tr key={row.id}>
                  <td className="py-3">
                    <input type="checkbox" className="rounded border-zinc-300" />
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2.5">
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${row.badgeBg} ${row.badgeText}`}>
                        {row.badgeLabel}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-zinc-900">{row.orgName}</p>
                        <p className="truncate text-xs text-zinc-400">{row.orgNameEn}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3">
                    <p className="text-zinc-900">{row.contractNo}</p>
                    <p className="text-xs text-zinc-400">{row.contractName}</p>
                  </td>
                  <td className="py-3">
                    <p className="text-zinc-900">{row.dueDate}</p>
                    {row.daysNote && (
                      <p className={row.status === "overdue" ? "text-xs text-red-500" : "text-xs text-zinc-400"}>{row.daysNote}</p>
                    )}
                  </td>
                  <td className="py-3 text-zinc-900">{row.value.toLocaleString("th-TH")}</td>
                  <td className="py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${RENEWAL_STATUS_CLASSES[row.status]}`}>
                      {RENEWAL_STATUS_LABEL[row.status]}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={row.ownerName} size={24} />
                      <span className="text-zinc-700">{row.ownerName}</span>
                    </div>
                  </td>
                  <td className="py-3 text-zinc-600">
                    <div className="flex items-center justify-between gap-2">
                      {row.nextAction}
                      <MoreIcon className="h-4 w-4 shrink-0 text-zinc-400" />
                    </div>
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
