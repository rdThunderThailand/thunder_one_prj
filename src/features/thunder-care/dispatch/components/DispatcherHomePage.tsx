import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import { DonutChart } from "@/components/ui/DonutChart";
import { Avatar } from "@/components/ui/Avatar";
import { CalendarIcon, ChartIcon, GlobeIcon, UsersIcon, WarningTriangleIcon } from "@/components/ui/icons";
import {
  dashboardAvailableTechs,
  dashboardInProgressRows,
  dashboardSlaRisk,
  dashboardUnassignedRows,
  dispatcherAnnouncements,
  dispatcherStats,
  workStatusBreakdown,
  type DispatcherStat,
} from "../mock-data";
import { priorityBadge } from "../status-colors";

// "หน้าหลัก Dispatcher" — ผังหน้าจอที่ผู้ใช้ส่งมา 2569-09-08 (ชุดที่ 3 ของ
// Thunder Care Provider Side, persona Dispatcher). R&D — mock ล้วน ดู
// mock-data.ts's header comment สำหรับขอบเขต (Asset/คลังความรู้ ไม่ได้สร้าง
// ใหม่ในรอบนี้).
const statColor: Record<DispatcherStat["color"], string> = {
  zinc: "text-foreground",
  amber: "text-t1-amber-700",
  red: "text-t1-red-700",
  indigo: "text-primary",
  emerald: "text-t1-green-700",
  blue: "text-t1-blue-700",
};

function StatsRow() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {dispatcherStats.map((stat) => (
        <Card key={stat.id} className="flex flex-col gap-1 p-4">
          <p className="text-xs text-muted-foreground">{stat.label}</p>
          <span className={`text-2xl font-semibold ${statColor[stat.color]}`}>{stat.value}</span>
          <p className="text-xs text-t1-gray-400">{stat.sublabel}</p>
        </Card>
      ))}
    </div>
  );
}

function UnassignedTable() {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">งานรอจัดสรร (18)</h2>
        <Link href="/thunder-care/dispatch/unassigned" className="text-xs font-medium text-primary hover:text-accent-foreground">
          ดูทั้งหมด
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead className="border-b border-border text-xs text-muted-foreground">
            <tr>
              <th className="w-8 px-2 py-2">
                <input type="checkbox" className="rounded border-border" disabled title="ยังไม่เปิดใช้งาน" />
              </th>
              <th className="px-2 py-2 font-medium">Ticket ID</th>
              <th className="px-2 py-2 font-medium">เรื่อง / ปัญหา</th>
              <th className="px-2 py-2 font-medium">ลูกค้า</th>
              <th className="px-2 py-2 font-medium">Priority</th>
              <th className="px-2 py-2 font-medium">SLA</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {dashboardUnassignedRows.map((row) => (
              <tr key={row.id}>
                <td className="px-2 py-2">
                  <input type="checkbox" className="rounded border-border" disabled title="ยังไม่เปิดใช้งาน" />
                </td>
                <td className="px-2 py-2 font-medium text-foreground">{row.id}</td>
                <td className="px-2 py-2 text-foreground">{row.title}</td>
                <td className="px-2 py-2 text-muted-foreground">
                  <p>{row.customerName}</p>
                  <p className="text-xs text-t1-gray-400">{row.branchLabel}</p>
                </td>
                <td className="px-2 py-2">
                  <Badge variant="pill" color={priorityBadge[row.priority].color}>
                    {priorityBadge[row.priority].label}
                  </Badge>
                </td>
                <td className="whitespace-nowrap px-2 py-2 text-xs text-muted-foreground">
                  {row.slaRemainingLabel} · {row.reportedAtLabel}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Link href="/thunder-care/dispatch/unassigned" className={buttonClasses("primary", "w-fit")}>
        + สร้าง Work Order
      </Link>
    </Card>
  );
}

function WorkStatusCard() {
  const total = workStatusBreakdown.reduce((sum, s) => sum + s.value, 0);
  return (
    <Card className="flex flex-col items-center gap-3 p-4">
      <h2 className="self-start text-sm font-semibold text-foreground">สถานะงาน</h2>
      <div className="relative">
        <DonutChart size={140} strokeWidth={20} segments={workStatusBreakdown} />
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-semibold text-foreground">{total}</span>
          <span className="text-[11px] text-t1-gray-400">รายการ</span>
        </div>
      </div>
      <ul className="flex w-full flex-col gap-1.5 text-xs">
        {workStatusBreakdown.map((slice) => (
          <li key={slice.label} className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: slice.color }} />
              {slice.label}
            </span>
            <span className="font-medium text-foreground">{slice.value}</span>
          </li>
        ))}
      </ul>
      <Link href="/thunder-care/dispatch/completed" className="text-xs font-medium text-primary hover:text-accent-foreground">
        ดูรายงานทั้งหมด
      </Link>
    </Card>
  );
}

function SlaRiskCard() {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">งานเสี่ยง SLA</h2>
        <Link href="/thunder-care/dispatch/in-progress" className="text-xs font-medium text-primary hover:text-accent-foreground">
          ดูทั้งหมด
        </Link>
      </div>
      <ul className="flex flex-col gap-2.5">
        {dashboardSlaRisk.map((row) => (
          <li key={row.id} className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-error" />
            <span className="min-w-0 flex-1 truncate text-sm text-foreground">{row.title}</span>
            <span className="shrink-0 text-xs text-t1-red-700">{row.slaLabel}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function MapPreviewCard() {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">แผนที่งาน (Map View)</h2>
        <Link href="/thunder-care/dispatch/map" className="text-xs font-medium text-primary hover:text-accent-foreground">
          ดูแผนที่เต็ม
        </Link>
      </div>
      <div className="flex h-40 items-center justify-center rounded-xl bg-muted text-t1-gray-400">
        <GlobeIcon className="h-8 w-8" />
      </div>
    </Card>
  );
}

function InProgressTable() {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">งานที่กำลังดำเนินการ (23)</h2>
        <Link href="/thunder-care/dispatch/in-progress" className="text-xs font-medium text-primary hover:text-accent-foreground">
          ดูทั้งหมด
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead className="border-b border-border text-xs text-muted-foreground">
            <tr>
              <th className="px-2 py-2 font-medium">WO / Ticket</th>
              <th className="px-2 py-2 font-medium">ลูกค้า</th>
              <th className="px-2 py-2 font-medium">ช่าง / ทีม</th>
              <th className="px-2 py-2 font-medium">สถานะ</th>
              <th className="px-2 py-2 font-medium">นัดหมาย</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {dashboardInProgressRows.map((row) => (
              <tr key={row.woId}>
                <td className="px-2 py-2">
                  <p className="font-medium text-primary">{row.woId}</p>
                  <p className="text-xs text-t1-gray-400">{row.ticketId}</p>
                </td>
                <td className="px-2 py-2 text-muted-foreground">{row.customerName}</td>
                <td className="px-2 py-2 text-foreground">{row.assignee}</td>
                <td className="px-2 py-2 text-xs text-muted-foreground">{row.status}</td>
                <td className="whitespace-nowrap px-2 py-2 text-xs text-muted-foreground">{row.appointmentLabel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function AvailableTechsCard() {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">ช่าง / ทีม พร้อมใช้งาน</h2>
        <Link href="/thunder-care/dispatch/technicians" className="text-xs font-medium text-primary hover:text-accent-foreground">
          ดูทั้งหมด
        </Link>
      </div>
      <ul className="flex flex-col gap-2.5">
        {dashboardAvailableTechs.map((tech) => (
          <li key={tech.name} className="flex items-center gap-2.5">
            {tech.isTeam ? (
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-t1-gray-400">
                <UsersIcon className="h-3.5 w-3.5" />
              </span>
            ) : (
              <Avatar name={tech.name} size={28} />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{tech.name}</p>
              <p className="text-xs text-t1-gray-400">{tech.mode}</p>
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">{tech.statusLabel}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function AnnouncementsCard() {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <h2 className="text-sm font-semibold text-foreground">แจ้งเตือนและประกาศ</h2>
      <ul className="flex flex-col gap-3">
        {dispatcherAnnouncements.map((row) => (
          <li key={row.id} className="flex items-start gap-2.5">
            <WarningTriangleIcon
              className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${
                row.kind === "warning" ? "text-warning" : row.kind === "stock" ? "text-error" : "text-primary"
              }`}
            />
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

function QuickActions() {
  const actions = [
    { label: "สร้าง Work Order", href: "/thunder-care/dispatch/unassigned", icon: ChartIcon },
    { label: "จัดสรรงานช่าง", href: "/thunder-care/dispatch/unassigned", icon: UsersIcon },
    { label: "เปิดแผนที่งาน", href: "/thunder-care/dispatch/map", icon: GlobeIcon },
    { label: "ตรวจสอบรายงาน", href: "/thunder-care/dispatch/completed", icon: CalendarIcon },
    { label: "รายงาน SLA", href: "/thunder-care/dispatch/completed", icon: WarningTriangleIcon },
  ];
  return (
    <Card className="p-4">
      <h2 className="mb-3 text-sm font-semibold text-foreground">ทางลัด (Quick Actions)</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {actions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="flex flex-col items-center gap-2 rounded-xl border border-border p-3 text-center hover:border-t1-gray-300"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-primary">
              <action.icon className="h-4 w-4" />
            </span>
            <span className="text-xs font-medium text-foreground">{action.label}</span>
          </Link>
        ))}
      </div>
    </Card>
  );
}

export function DispatcherHomePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">หน้าหลัก Dispatcher</h1>
        <p className="text-sm text-muted-foreground">ภาพรวมงานบริการและการจัดสรรงานวันนี้</p>
      </div>

      <StatsRow />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <UnassignedTable />
        </div>
        <WorkStatusCard />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <SlaRiskCard />
        <MapPreviewCard />
        <AvailableTechsCard />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <InProgressTable />
        </div>
        <AnnouncementsCard />
      </div>

      <QuickActions />
    </div>
  );
}
