import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DonutChart } from "@/components/ui/DonutChart";
import { ClipboardIcon, MegaphoneIcon } from "@/components/ui/icons";
import {
  CHANNEL_LABEL,
  announcements,
  channelBreakdown,
  dashboardStats,
  issueCategoryBreakdown,
  pendingTriageCases,
  slaRiskRows,
  waitingForCustomerRows,
  type DashboardStat,
} from "../mock-data";
import { channelIcon, priorityBadge, slaRiskTextColor } from "../status-colors";

// "หน้าหลัก" ของ Service Operator (Thunder Care Provider Side) — แทนที่
// ServiceOpsPage เดิม (English "Customer Health" placeholder) ทั้งหน้าตาม
// ผังหน้าจอ Service Operator ที่ผู้ใช้ส่งมา (2569-09-08). ทุกอย่างยังเป็น
// mock data — ยังไม่มี backend จริง (ดู mock-data.ts's header comment).
const statColor: Record<DashboardStat["color"], string> = {
  zinc: "text-zinc-900 dark:text-zinc-50",
  amber: "text-amber-600 dark:text-amber-400",
  red: "text-red-600 dark:text-red-400",
  indigo: "text-indigo-600 dark:text-indigo-400",
  emerald: "text-emerald-600 dark:text-emerald-400",
};

function GreetingHeader() {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">สวัสดีครับ ณัฐวุฒิ 👋</h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Service Operator · Thunder Care Service Operations
      </p>
      <p className="text-xs text-zinc-400">วันนี้ 23 ส.ค. 2569 เวลา 10:30 น.</p>
    </div>
  );
}

function DashboardStatsRow() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {dashboardStats.map((stat) => (
        <Card key={stat.id} className="flex flex-col gap-1 p-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{stat.label}</p>
          <span className={`text-2xl font-semibold ${statColor[stat.color]}`}>{stat.value}</span>
          <p className="text-xs text-zinc-400">{stat.sublabel}</p>
        </Card>
      ))}
    </div>
  );
}

function PendingTriageTable() {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">เคสเข้าใหม่ (รอ Triage)</h2>
        <span className="text-xs text-zinc-400">{pendingTriageCases.length} รายการ</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <tr>
              <th className="px-3 py-2 font-medium">Ticket ID</th>
              <th className="px-3 py-2 font-medium">เรื่อง / ปัญหา</th>
              <th className="px-3 py-2 font-medium">ลูกค้า / สาขา</th>
              <th className="px-3 py-2 font-medium">Asset</th>
              <th className="px-3 py-2 font-medium">วันเวลา</th>
              <th className="px-3 py-2 font-medium">ความเร่งด่วน</th>
              <th className="px-3 py-2 font-medium">SLA</th>
              <th className="px-3 py-2 font-medium">แหล่งแจ้งเตือน</th>
              <th className="px-3 py-2 font-medium">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
            {pendingTriageCases.map((row) => {
              const ChannelIcon = channelIcon[row.channel];
              return (
                <tr key={row.id}>
                  <td className="px-3 py-2.5 font-medium text-zinc-900 dark:text-zinc-50">{row.id}</td>
                  <td className="px-3 py-2.5 text-zinc-700 dark:text-zinc-200">{row.title}</td>
                  <td className="px-3 py-2.5 text-zinc-600 dark:text-zinc-300">
                    <p>{row.customerName}</p>
                    <p className="text-xs text-zinc-400">{row.branchLabel}</p>
                  </td>
                  <td className="px-3 py-2.5 text-zinc-600 dark:text-zinc-300">
                    <p>{row.assetTag}</p>
                    <p className="text-xs text-zinc-400">{row.assetLabel}</p>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-xs text-zinc-500 dark:text-zinc-400">
                    {row.reportedAtLabel}
                  </td>
                  <td className="px-3 py-2.5">
                    <Badge variant="pill" color={priorityBadge[row.priority].color}>
                      {priorityBadge[row.priority].label}
                    </Badge>
                  </td>
                  <td className={`whitespace-nowrap px-3 py-2.5 text-xs font-medium ${slaRiskTextColor[row.slaRisk]}`}>
                    {row.slaRemainingLabel}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="inline-flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                      <ChannelIcon className="h-3.5 w-3.5" />
                      {CHANNEL_LABEL[row.channel]}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <Link
                      href={`/thunder-care/service-ops/triage?case=${row.id}`}
                      className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
                    >
                      Triage
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end">
        <Link href="/thunder-care/service-ops/triage" className="text-xs font-medium text-indigo-600 hover:text-indigo-500">
          ดูทั้งหมด {pendingTriageCases.length} รายการ
        </Link>
      </div>
    </Card>
  );
}

function SlaRiskCard() {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">SLA Risk (ใกล้/เกิน SLA)</h2>
        <Link href="/thunder-care/service-ops/triage" className="text-xs font-medium text-indigo-600 hover:text-indigo-500">
          ดูทั้งหมด
        </Link>
      </div>
      <ul className="flex flex-col gap-3">
        {slaRiskRows.map((row) => (
          <li key={row.id} className="flex items-start gap-2.5">
            <span
              className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${
                row.risk === "overdue" ? "bg-red-500" : "bg-amber-500"
              }`}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{row.customerName}</p>
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{row.issueLabel}</p>
              <p className={`text-xs font-medium ${row.risk === "overdue" ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"}`}>
                {row.riskLabel}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs font-medium text-zinc-700 dark:text-zinc-200">{row.timeLabel}</p>
              <p className="text-[11px] text-zinc-400">{row.deltaLabel}</p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function WaitingForCustomerCard() {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">รายการที่รอข้อมูลลูกค้า</h2>
        <Link href="/thunder-care/service-ops/triage" className="text-xs font-medium text-indigo-600 hover:text-indigo-500">
          ดูทั้งหมด
        </Link>
      </div>
      <ol className="flex flex-col gap-2.5">
        {waitingForCustomerRows.map((row, index) => (
          <li key={row.id} className="flex items-center gap-2.5 text-sm">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[11px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-zinc-900 dark:text-zinc-50">{row.customerName}</p>
              <p className="truncate text-xs text-zinc-400">{row.reasonLabel}</p>
            </div>
            <span className="shrink-0 text-xs text-zinc-400">{row.waitingDaysLabel}</span>
          </li>
        ))}
      </ol>
    </Card>
  );
}

function IssueCategoryCard() {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">ประเภทปัญหายอดนิยม (วันนี้)</h2>
      </div>
      <div className="flex items-center gap-4">
        <DonutChart size={104} strokeWidth={16} segments={issueCategoryBreakdown} />
        <ul className="flex flex-1 flex-col gap-1.5 text-xs">
          {issueCategoryBreakdown.map((slice) => (
            <li key={slice.label} className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} />
                <span className="truncate">{slice.label}</span>
              </span>
              <span className="shrink-0 font-medium text-zinc-900 dark:text-zinc-50">{slice.value}</span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

function ChannelBreakdownCard() {
  const total = channelBreakdown.reduce((sum, row) => sum + row.count, 0);
  return (
    <Card className="flex flex-col gap-3 p-4">
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">ช่องทางรับเรื่อง (วันนี้)</h2>
      <ul className="flex flex-col gap-2.5">
        {channelBreakdown.map((row) => {
          const ChannelIcon = channelIcon[row.channel];
          return (
            <li key={row.channel} className="flex items-center gap-2.5">
              <ChannelIcon className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
              <span className="w-20 shrink-0 text-xs text-zinc-600 dark:text-zinc-300">{CHANNEL_LABEL[row.channel]}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div className="h-full rounded-full bg-indigo-500" style={{ width: `${row.percent}%` }} />
              </div>
              <span className="w-16 shrink-0 text-right text-xs text-zinc-500 dark:text-zinc-400">
                {row.count} ({row.percent}%)
              </span>
            </li>
          );
        })}
      </ul>
      <p className="text-right text-xs text-zinc-400">รวมทั้งหมด {total} รายการ · 100%</p>
    </Card>
  );
}

function AnnouncementsCard() {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-1.5">
        <MegaphoneIcon className="h-4 w-4 text-zinc-400" />
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">ข่าวสาร / ประกาศ</h2>
      </div>
      <ul className="flex flex-col gap-3">
        {announcements.map((row) => (
          <li key={row.id} className="flex items-start gap-2.5">
            <ClipboardIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-400" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{row.title}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{row.detail}</p>
              <p className="text-[11px] text-zinc-400">{row.dateLabel}</p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function ServiceOpsPage() {
  return (
    <div className="flex flex-col gap-6">
      <GreetingHeader />
      <DashboardStatsRow />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PendingTriageTable />
        </div>
        <div className="flex flex-col gap-4">
          <SlaRiskCard />
          <WaitingForCustomerCard />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <IssueCategoryCard />
        <ChannelBreakdownCard />
        <AnnouncementsCard />
      </div>
    </div>
  );
}
