import Link from "next/link";
import { Card } from "@/components/ui/Card";
import {
  ArrowRightIcon,
  BellIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ClockIcon,
  ChartIcon,
  MegaphoneIcon,
  MoreIcon,
  SearchIcon,
  UsersIcon,
} from "@/components/ui/icons";
import { RENEWAL_STATUS_CLASSES, RENEWAL_STATUS_LABEL } from "../status-colors";
import { announcements, currentUserName, customers, overviewStats, renewals } from "../mock-data";
import { WorkspaceFooter } from "./WorkspaceFooter";

const TILES = [
  {
    label: "ลูกค้าทั้งหมด",
    value: overviewStats.totalCustomers,
    unit: "องค์กร",
    delta: `+${overviewStats.totalCustomersDelta} จากช่วงก่อน`,
    icon: UsersIcon,
    tone: "bg-blue-50 text-blue-600",
    href: "/customer-workspace/customers",
  },
  {
    label: "ครบกำหนดใน 30 วัน",
    value: overviewStats.dueIn30Days,
    unit: "รายการ",
    delta: `+${overviewStats.dueIn30DaysDelta} จากช่วงก่อน`,
    icon: ClockIcon,
    tone: "bg-orange-50 text-orange-600",
    href: "/customer-workspace/renewals",
  },
  {
    label: "เสร็จสิ้นแล้ว",
    value: overviewStats.completed,
    unit: "รายการ",
    delta: `+${overviewStats.completedDelta} จากช่วงก่อน`,
    icon: CheckCircleIcon,
    tone: "bg-emerald-50 text-emerald-600",
    href: "/customer-workspace/renewals",
  },
  {
    label: "แจ้งเตือน",
    value: overviewStats.alerts,
    unit: "รายการ",
    icon: BellIcon,
    tone: "bg-violet-50 text-violet-600",
  },
] as const;

const QUICK_ACTIONS = [
  { label: "เพิ่มลูกค้าใหม่", icon: UsersIcon, tone: "bg-blue-50 text-blue-600", href: "/customer-workspace/customers" },
  { label: "สร้างรายการต่ออายุ", icon: ClockIcon, tone: "bg-orange-50 text-orange-600", href: "/customer-workspace/renewals" },
  { label: "ค้นหาลูกค้า", icon: SearchIcon, tone: "bg-emerald-50 text-emerald-600", href: "/customer-workspace/customers" },
  { label: "ดูรายงาน", icon: ChartIcon, tone: "bg-violet-50 text-violet-600" },
] as const;

// Overview's own "งานต่ออายุที่ต้องดูแล" widget — the 5 renewals due soonest
// (mockup shows the same 5 rows the Renewals page's own "ครบกำหนดใน 30 วัน"
// tab does), not a separate dataset.
const dueRenewals = renewals.slice(0, 5);
// "ลูกค้าของฉัน" widget — mockup shows 5 customers, all tagged "ลูกค้าปัจจุบัน"
// (a static "currently active" badge, unrelated to each row's own renewal
// urgency — the Customers page's สถานะ column is the one that varies).
const myCustomers = customers.slice(0, 5);

export function OverviewPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">สวัสดีตอนเช้า 👋</h1>
          <p className="text-lg font-semibold text-zinc-900">{currentUserName}</p>
          <p className="text-sm text-zinc-500">นี่คือภาพรวมลูกค้าและการต่ออายุในพื้นที่ทำงานนี้</p>
        </div>
        <div className="flex items-center gap-3 text-sm text-zinc-500">
          <span>วันนี้ 12 พฤษภาคม 2569</span>
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            ช่วงเวลา: 30 วันข้างหน้า
            <ChevronDownIcon className="h-3.5 w-3.5 text-zinc-400" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TILES.map((tile) => (
          <Card key={tile.label} className="flex flex-col gap-3 p-4">
            <span className={`flex h-10 w-10 items-center justify-center rounded-full ${tile.tone}`}>
              <tile.icon className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm text-zinc-500">{tile.label}</p>
              <p className="text-2xl font-bold text-zinc-900">
                {tile.value}
                <span className="ml-1 text-sm font-normal text-zinc-400">{tile.unit}</span>
              </p>
            </div>
            {"delta" in tile && tile.delta && (
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-emerald-600">↑ {tile.delta}</span>
                {"href" in tile && tile.href && (
                  <Link href={tile.href} className="font-medium text-blue-600 hover:text-blue-700">
                    ดูรายละเอียด →
                  </Link>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card className="p-5">
            <div className="mb-1 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClockIcon className="h-4 w-4 text-orange-500" />
                <h2 className="text-sm font-bold text-zinc-900">งานต่ออายุที่ต้องดูแล</h2>
              </div>
              <Link href="/customer-workspace/renewals" className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700">
                ดูทั้งหมด
                <ArrowRightIcon className="h-3 w-3" />
              </Link>
            </div>
            <p className="mb-3 text-xs text-zinc-400">รายการที่ครบกำหนดใน 30 วันข้างหน้า หรือเกินกำหนดแล้ว</p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 text-xs text-zinc-400">
                    <th className="pb-2 font-medium">ลูกค้า</th>
                    <th className="pb-2 font-medium">รายการ</th>
                    <th className="pb-2 font-medium">วันที่ครบกำหนด</th>
                    <th className="pb-2 font-medium">มูลค่า</th>
                    <th className="pb-2 font-medium">สถานะ</th>
                    <th className="pb-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {dueRenewals.map((row) => (
                    <tr key={row.id}>
                      <td className="py-2.5">
                        <div className="flex items-center gap-2.5">
                          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${row.badgeBg} ${row.badgeText}`}>
                            {row.badgeLabel}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-zinc-900">{row.orgName}</p>
                            <p className="truncate text-xs text-zinc-400">{row.orgNameEn}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 text-zinc-600">{row.contractName}</td>
                      <td className="py-2.5">
                        <p className="text-zinc-900">{row.dueDate}</p>
                        {row.daysNote && (
                          <p className={row.status === "overdue" ? "text-xs text-red-500" : "text-xs text-zinc-400"}>{row.daysNote}</p>
                        )}
                      </td>
                      <td className="py-2.5 text-zinc-900">{row.value.toLocaleString("th-TH")}</td>
                      <td className="py-2.5">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${RENEWAL_STATUS_CLASSES[row.status]}`}>
                          {RENEWAL_STATUS_LABEL[row.status]}
                        </span>
                      </td>
                      <td className="py-2.5 text-right text-zinc-400">
                        <MoreIcon className="ml-auto h-4 w-4" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-orange-500">⚡</span>
              <h2 className="text-sm font-bold text-zinc-900">การดำเนินการด่วน</h2>
            </div>
            <p className="mb-3 text-xs text-zinc-400">เข้าสู่การใช้งานที่สำคัญ</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {QUICK_ACTIONS.map((action) =>
                "href" in action ? (
                  <Link
                    key={action.label}
                    href={action.href}
                    className={`flex flex-col items-center justify-center gap-2 rounded-xl border border-zinc-100 py-5 text-center text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 ${action.tone.split(" ")[0]}/40`}
                  >
                    <span className={`flex h-9 w-9 items-center justify-center rounded-full ${action.tone}`}>
                      <action.icon className="h-4 w-4" />
                    </span>
                    {action.label}
                  </Link>
                ) : (
                  <button
                    key={action.label}
                    type="button"
                    className={`flex flex-col items-center justify-center gap-2 rounded-xl border border-zinc-100 py-5 text-center text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 ${action.tone.split(" ")[0]}/40`}
                  >
                    <span className={`flex h-9 w-9 items-center justify-center rounded-full ${action.tone}`}>
                      <action.icon className="h-4 w-4" />
                    </span>
                    {action.label}
                  </button>
                )
              )}
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card className="p-5">
            <div className="mb-1 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UsersIcon className="h-4 w-4 text-blue-500" />
                <h2 className="text-sm font-bold text-zinc-900">ลูกค้าของฉัน</h2>
              </div>
              <Link href="/customer-workspace/customers" className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700">
                ดูทั้งหมด
                <ArrowRightIcon className="h-3 w-3" />
              </Link>
            </div>
            <p className="mb-3 text-xs text-zinc-400">เข้าถึงลูกค้าที่คุณดูแลล่าสุด</p>
            <ul className="flex flex-col divide-y divide-zinc-100">
              {myCustomers.map((row) => (
                <li key={row.id} className="flex items-center gap-2.5 py-2.5">
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${row.badgeBg} ${row.badgeText}`}>
                    {row.badgeLabel}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-zinc-900">{row.orgName}</p>
                    <p className="truncate text-xs text-zinc-400">{row.contactName}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-600">ลูกค้าปัจจุบัน</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-5">
            <div className="mb-1 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MegaphoneIcon className="h-4 w-4 text-violet-500" />
                <h2 className="text-sm font-bold text-zinc-900">ประกาศและข่าวสาร</h2>
              </div>
              {/* Inert — no announcements page exists yet. */}
              <button
                type="button"
                className="text-xs font-semibold text-zinc-300"
              >
                ดูทั้งหมด
              </button>
            </div>
            <ul className="flex flex-col divide-y divide-zinc-100">
              {announcements.map((item) => (
                <li key={item.id} className="flex items-start gap-2.5 py-2.5">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
                    <BellIcon className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-zinc-900">{item.title}</p>
                    <p className="truncate text-xs text-zinc-400">{item.detail}</p>
                  </div>
                  <span className="ml-auto shrink-0 text-xs text-zinc-400">{item.date}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <WorkspaceFooter />
    </div>
  );
}
