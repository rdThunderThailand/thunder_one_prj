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
  zinc: "text-foreground",
  amber: "text-t1-amber-700",
  red: "text-t1-red-700",
  indigo: "text-primary",
  emerald: "text-t1-green-700",
};

function GreetingHeader() {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-xl font-semibold text-foreground">สวัสดีครับ ณัฐวุฒิ 👋</h1>
      <p className="text-sm text-muted-foreground">
        Service Operator · Thunder Care Service Operations
      </p>
      <p className="text-xs text-t1-gray-400">วันนี้ 23 ส.ค. 2569 เวลา 10:30 น.</p>
    </div>
  );
}

function DashboardStatsRow() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {dashboardStats.map((stat) => (
        <Card key={stat.id} className="flex flex-col gap-1 p-4">
          <p className="text-xs text-muted-foreground">{stat.label}</p>
          <span className={`text-2xl font-semibold ${statColor[stat.color]}`}>{stat.value}</span>
          <p className="text-xs text-t1-gray-400">{stat.sublabel}</p>
        </Card>
      ))}
    </div>
  );
}

function PendingTriageTable() {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">เคสเข้าใหม่ (รอ Triage)</h2>
        <span className="text-xs text-t1-gray-400">{pendingTriageCases.length} รายการ</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="border-b border-border text-xs text-muted-foreground">
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
          <tbody className="divide-y divide-border">
            {pendingTriageCases.map((row) => {
              const ChannelIcon = channelIcon[row.channel];
              return (
                <tr key={row.id}>
                  <td className="px-3 py-2.5 font-medium text-foreground">{row.id}</td>
                  <td className="px-3 py-2.5 text-foreground">{row.title}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">
                    <p>{row.customerName}</p>
                    <p className="text-xs text-t1-gray-400">{row.branchLabel}</p>
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground">
                    <p>{row.assetTag}</p>
                    <p className="text-xs text-t1-gray-400">{row.assetLabel}</p>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-xs text-muted-foreground">
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
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <ChannelIcon className="h-3.5 w-3.5" />
                      {CHANNEL_LABEL[row.channel]}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <Link
                      href={`/thunder-care/service-ops/triage?case=${row.id}`}
                      className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
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
        <Link href="/thunder-care/service-ops/triage" className="text-xs font-medium text-primary hover:text-accent-foreground">
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
        <h2 className="text-sm font-semibold text-foreground">SLA Risk (ใกล้/เกิน SLA)</h2>
        <Link href="/thunder-care/service-ops/triage" className="text-xs font-medium text-primary hover:text-accent-foreground">
          ดูทั้งหมด
        </Link>
      </div>
      <ul className="flex flex-col gap-3">
        {slaRiskRows.map((row) => (
          <li key={row.id} className="flex items-start gap-2.5">
            <span
              className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${
                row.risk === "overdue" ? "bg-error" : "bg-warning"
              }`}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{row.customerName}</p>
              <p className="truncate text-xs text-muted-foreground">{row.issueLabel}</p>
              <p className={`text-xs font-medium ${row.risk === "overdue" ? "text-t1-red-700" : "text-t1-amber-700"}`}>
                {row.riskLabel}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs font-medium text-foreground">{row.timeLabel}</p>
              <p className="text-[11px] text-t1-gray-400">{row.deltaLabel}</p>
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
        <h2 className="text-sm font-semibold text-foreground">รายการที่รอข้อมูลลูกค้า</h2>
        <Link href="/thunder-care/service-ops/triage" className="text-xs font-medium text-primary hover:text-accent-foreground">
          ดูทั้งหมด
        </Link>
      </div>
      <ol className="flex flex-col gap-2.5">
        {waitingForCustomerRows.map((row, index) => (
          <li key={row.id} className="flex items-center gap-2.5 text-sm">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-medium text-muted-foreground">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-foreground">{row.customerName}</p>
              <p className="truncate text-xs text-t1-gray-400">{row.reasonLabel}</p>
            </div>
            <span className="shrink-0 text-xs text-t1-gray-400">{row.waitingDaysLabel}</span>
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
        <h2 className="text-sm font-semibold text-foreground">ประเภทปัญหายอดนิยม (วันนี้)</h2>
      </div>
      <div className="flex items-center gap-4">
        <DonutChart size={104} strokeWidth={16} segments={issueCategoryBreakdown} />
        <ul className="flex flex-1 flex-col gap-1.5 text-xs">
          {issueCategoryBreakdown.map((slice) => (
            <li key={slice.label} className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} />
                <span className="truncate">{slice.label}</span>
              </span>
              <span className="shrink-0 font-medium text-foreground">{slice.value}</span>
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
      <h2 className="text-sm font-semibold text-foreground">ช่องทางรับเรื่อง (วันนี้)</h2>
      <ul className="flex flex-col gap-2.5">
        {channelBreakdown.map((row) => {
          const ChannelIcon = channelIcon[row.channel];
          return (
            <li key={row.channel} className="flex items-center gap-2.5">
              <ChannelIcon className="h-3.5 w-3.5 shrink-0 text-t1-gray-400" />
              <span className="w-20 shrink-0 text-xs text-muted-foreground">{CHANNEL_LABEL[row.channel]}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${row.percent}%` }} />
              </div>
              <span className="w-16 shrink-0 text-right text-xs text-muted-foreground">
                {row.count} ({row.percent}%)
              </span>
            </li>
          );
        })}
      </ul>
      <p className="text-right text-xs text-t1-gray-400">รวมทั้งหมด {total} รายการ · 100%</p>
    </Card>
  );
}

function AnnouncementsCard() {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-1.5">
        <MegaphoneIcon className="h-4 w-4 text-t1-gray-400" />
        <h2 className="text-sm font-semibold text-foreground">ข่าวสาร / ประกาศ</h2>
      </div>
      <ul className="flex flex-col gap-3">
        {announcements.map((row) => (
          <li key={row.id} className="flex items-start gap-2.5">
            <ClipboardIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{row.title}</p>
              <p className="text-xs text-muted-foreground">{row.detail}</p>
              <p className="text-[11px] text-t1-gray-400">{row.dateLabel}</p>
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
