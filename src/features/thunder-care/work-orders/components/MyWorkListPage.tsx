"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FilterIcon } from "@/components/ui/icons";
import { JOB_STATUS_LABEL, techJobStats, todayJobs, type JobStatus, type TechJob } from "../mock-data";

// "งานของฉัน" — รายการงานเต็มของ Technician (ผังหน้าจอที่ผู้ใช้ส่งมา
// 2569-09-08). ปุ่ม "เริ่มงาน"/"ดำเนินงาน"/"ดูรายงาน" เปลี่ยนตามสถานะ mock
// ล้วน (ไม่มี backend จริง) — ปุ่มเดียวที่โต้ตอบได้จริงคือสลับ tab/เลือกแถว.
const TABS = [
  { key: "today" as const, label: `วันนี้ (${techJobStats.totalToday})` },
  { key: "in_progress" as const, label: `กำลังดำเนินการ (${techJobStats.inProgress})` },
  { key: "done" as const, label: `เสร็จสิ้นวันนี้ (${techJobStats.doneToday})` },
  { key: "all" as const, label: "ทั้งหมด" },
];

function filterJobs(tab: (typeof TABS)[number]["key"]): TechJob[] {
  if (tab === "in_progress") return todayJobs.filter((j) => j.status === "in_progress");
  if (tab === "done") return todayJobs.filter((j) => j.status === "done");
  return todayJobs;
}

const statusColor: Record<JobStatus, "yellow" | "blue" | "green"> = { waiting: "yellow", in_progress: "blue", done: "green" };

function PriorityDots({ priority }: { priority: 1 | 2 | 3 }) {
  const color = priority === 3 ? "bg-red-500" : priority === 2 ? "bg-amber-500" : "bg-zinc-300 dark:bg-zinc-600";
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: priority }).map((_, i) => (
        <span key={i} className={`h-1.5 w-1.5 rounded-full ${color}`} />
      ))}
    </span>
  );
}

function primaryActionLabel(job: TechJob): string {
  if (job.status === "waiting") return "เริ่มงาน";
  if (job.status === "in_progress") return "ดำเนินงาน";
  return "ดูรายงาน";
}

export function MyWorkListPage() {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]["key"]>("today");
  const rows = filterJobs(activeTab);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">งานของฉัน</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">รายการงานทั้งหมดที่มอบหมายให้คุณ</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" disabled title="ยังไม่เปิดใช้งาน">
            ส่งออก
          </Button>
          <Button variant="primary" disabled title="ยังไม่เปิดใช้งาน">
            + งานใหม่
          </Button>
        </div>
      </div>

      <div className="flex gap-1 border-b border-zinc-100 dark:border-zinc-800">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key ? "border-indigo-600 text-indigo-600 dark:text-indigo-400" : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="flex flex-col gap-1 p-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">งานทั้งหมดวันนี้</p>
          <span className="text-2xl font-semibold text-indigo-600 dark:text-indigo-400">{techJobStats.totalToday}</span>
        </Card>
        <Card className="flex flex-col gap-1 p-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">รอดำเนินการวันนี้</p>
          <span className="text-2xl font-semibold text-amber-600 dark:text-amber-400">{techJobStats.waiting}</span>
        </Card>
        <Card className="flex flex-col gap-1 p-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">กำลังดำเนินการตอนนี้</p>
          <span className="text-2xl font-semibold text-blue-600 dark:text-blue-400">{techJobStats.inProgress}</span>
        </Card>
        <Card className="flex flex-col gap-1 p-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">เสร็จสิ้นวันนี้</p>
          <span className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">{techJobStats.doneToday}</span>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input disabled title="ยังไม่เปิดใช้งาน" value="21 พ.ค. 2568" readOnly className="cursor-not-allowed rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400" />
        <select disabled title="ยังไม่เปิดใช้งาน" className="cursor-not-allowed rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          <option>จัดเรียง: เวลาเริ่มงาน</option>
        </select>
        <button type="button" disabled title="ยังไม่เปิดใช้งาน" className="flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          <FilterIcon className="h-3.5 w-3.5" /> ตัวกรอง
        </button>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <tr>
              <th className="px-2 py-2 font-medium">เวลาเริ่มงาน</th>
              <th className="px-2 py-2 font-medium">WO / รายละเอียดงาน</th>
              <th className="px-2 py-2 font-medium">ลูกค้า / สถานที่</th>
              <th className="px-2 py-2 font-medium">ระยะทาง</th>
              <th className="px-2 py-2 font-medium">สถานะ</th>
              <th className="px-2 py-2 font-medium">ความสำคัญ</th>
              <th className="px-2 py-2 font-medium">การดำเนินการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
            {rows.map((job) => (
              <tr key={job.woId}>
                <td className="px-2 py-2 text-zinc-600 dark:text-zinc-300">{job.timeLabel}</td>
                <td className="px-2 py-2">
                  <p className="font-medium text-indigo-600 dark:text-indigo-400">{job.woId}</p>
                  <p className="text-zinc-700 dark:text-zinc-200">{job.title}</p>
                  <p className="text-xs text-zinc-400">
                    {job.category} · SN: {job.assetSerial}
                  </p>
                </td>
                <td className="px-2 py-2 text-zinc-600 dark:text-zinc-300">
                  <p>{job.customerName}</p>
                  <p className="max-w-[220px] truncate text-xs text-zinc-400">{job.addressLabel}</p>
                </td>
                <td className="px-2 py-2 text-xs text-zinc-500 dark:text-zinc-400">
                  {job.distanceLabel}
                  <br />
                  {job.etaLabel}
                </td>
                <td className="px-2 py-2">
                  <Badge variant="pill" color={statusColor[job.status]}>
                    {JOB_STATUS_LABEL[job.status]}
                  </Badge>
                  <p className="mt-0.5 text-[11px] text-zinc-400">{job.statusTimeLabel}</p>
                </td>
                <td className="px-2 py-2">
                  <PriorityDots priority={job.priority} />
                </td>
                <td className="px-2 py-2">
                  <div className="flex gap-1.5">
                    <button type="button" disabled title="ยังไม่เปิดใช้งาน" className="cursor-not-allowed rounded-lg border border-zinc-200 px-2.5 py-1 text-xs text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                      ดูรายละเอียด
                    </button>
                    <button
                      type="button"
                      disabled
                      title="ยังไม่เปิดใช้งาน"
                      className={`cursor-not-allowed rounded-lg px-2.5 py-1 text-xs font-medium text-white ${job.status === "done" ? "bg-zinc-300" : "bg-indigo-300"}`}
                    >
                      {primaryActionLabel(job)}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <p className="text-right text-xs text-zinc-400">แสดง 1-{rows.length} จาก {rows.length} งาน</p>
    </div>
  );
}
