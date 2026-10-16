import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import { ArrowRightIcon, BoxIcon, HeadsetIcon, RepeatIcon, WarningTriangleIcon } from "@/components/ui/icons";
import { JOB_STATUS_LABEL, techMapPins, techQuickActions, todayJobs } from "../mock-data";

// "หน้าหลัก" ของ Technician — แทนที่ MyWorkPage เดิม (English R&D placeholder)
// ที่ route เดิม (`/thunder-care/work-orders`) ทั้งหมด ตามผังหน้าจอ
// Technician (Web ↔ Mobile) ที่ผู้ใช้ส่งมา 2569-09-08. `mockWorkOrders`/
// `WorkOrder`/`getMockWorkOrders`/`WorkOrderCard` เดิมยังอยู่ครบ ไม่แตะ (ใช้
// จริงโดย asset-intelligence/assets, mission-control, intelligence,
// thunder-care/service-ops) — หน้านี้ใช้ `todayJobs`/`TechJob` ชุดใหม่แทน.
const statusBadgeColor: Record<string, "yellow" | "blue" | "green"> = {
  waiting: "yellow",
  in_progress: "blue",
  done: "green",
};

const quickActionIcon: Record<string, typeof BoxIcon> = {
  supplies: BoxIcon,
  issue: WarningTriangleIcon,
  help: HeadsetIcon,
  return: RepeatIcon,
};

function GreetingHeader() {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-xl font-semibold text-foreground">สวัสดีตอนเช้า 👋 นรินทร์ ส.</h1>
      <p className="text-sm text-muted-foreground">Technician · ออนไลน์</p>
    </div>
  );
}

function NextJobCard() {
  const next = todayJobs.find((j) => j.status !== "done") ?? todayJobs[0];
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">งานถัดไปของคุณ</h2>
        <span className="text-xs font-medium text-primary">อีก {next.etaLabel.replace("ประมาณ ", "")}</span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-foreground">{next.woId}</p>
          <p className="text-sm text-foreground">{next.title}</p>
          <p className="text-xs text-t1-gray-400">{next.customerName}</p>
        </div>
        <Link href="/thunder-care/work-orders/my-work" className={buttonClasses("primary")}>
          นำทาง
        </Link>
      </div>
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span>{next.statusTimeLabel}</span>
        <span>ระยะทาง {next.distanceLabel}</span>
        <span>{next.etaLabel}</span>
      </div>
      <Link href="/thunder-care/work-orders/my-work" className={buttonClasses("secondary", "w-fit")}>
        ดูรายละเอียดงาน
      </Link>
    </Card>
  );
}

function QuickActionsCard() {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <h2 className="text-sm font-semibold text-foreground">ต้องการทำอะไร?</h2>
      <div className="grid grid-cols-2 gap-3">
        {techQuickActions.map((action) => {
          const Icon = quickActionIcon[action.id];
          return (
            <button
              key={action.id}
              type="button"
              disabled
              title="ยังไม่เปิดใช้งาน"
              className="flex cursor-not-allowed flex-col items-center gap-1.5 rounded-xl border border-border p-3 text-center"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-primary">
                <Icon className="h-4 w-4" />
              </span>
              <span className="text-xs font-medium text-foreground">{action.title}</span>
              <span className="text-[11px] text-t1-gray-400">{action.detail}</span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function TodayJobsCard() {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">งานของฉันวันนี้ ({todayJobs.length} งาน)</h2>
        <Link href="/thunder-care/work-orders/my-work" className="text-xs font-medium text-primary hover:text-accent-foreground">
          ดูทั้งหมด
        </Link>
      </div>
      <ul className="flex flex-col divide-y divide-border">
        {todayJobs.map((job) => (
          <li key={job.woId} className="flex items-center justify-between gap-3 py-2.5">
            <span className="w-14 shrink-0 text-xs font-medium text-muted-foreground">{job.timeLabel}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {job.woId} · {job.title}
              </p>
              <p className="truncate text-xs text-t1-gray-400">{job.customerName}</p>
            </div>
            <Badge variant="pill" color={statusBadgeColor[job.status]}>
              {JOB_STATUS_LABEL[job.status]}
            </Badge>
            <span className="w-16 shrink-0 text-right text-xs text-t1-gray-400">{job.distanceLabel}</span>
            <ArrowRightIcon className="h-3.5 w-3.5 shrink-0 text-t1-gray-400" />
          </li>
        ))}
      </ul>
    </Card>
  );
}

function MiniMapCard() {
  const statusColor: Record<string, string> = { waiting: "bg-warning text-warning-foreground", in_progress: "bg-info text-info-foreground", done: "bg-success text-success-foreground" };
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">แผนที่งานวันนี้</h2>
        <span className="text-xs font-medium text-primary">ดูเส้นทางทั้งหมด</span>
      </div>
      <div className="relative h-56 overflow-hidden rounded-xl bg-muted">
        {techMapPins.map((pin, i) => (
          <span
            key={pin.woId}
            style={{ left: `${pin.xPercent}%`, top: `${pin.yPercent}%` }}
            className={`absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-[10px] font-semibold shadow ${statusColor[pin.status]}`}
          >
            {i + 1}
          </span>
        ))}
      </div>
      <div className="flex gap-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-warning" /> รอดำเนินการ
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-info" /> กำลังดำเนินการ
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-success" /> เสร็จสิ้น
        </span>
      </div>
    </Card>
  );
}

export function TechnicianHomePage() {
  return (
    <div className="flex flex-col gap-6">
      <GreetingHeader />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <NextJobCard />
        <QuickActionsCard />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TodayJobsCard />
        <MiniMapCard />
      </div>
    </div>
  );
}
