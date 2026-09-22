"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SCHEDULER_HOURS, schedulerRows } from "../mock-data";

// "ตารางงาน (Scheduler)" — ภาพรวมและกำหนดการของช่าง/ทีม แบบ timeline รายวัน
// (ผังหน้าจอที่ผู้ใช้ส่งมา 2569-09-08, persona Dispatcher). Timeline วาดด้วย
// grid เปอร์เซ็นต์ตาม `SCHEDULER_HOURS`/`ScheduleBlock.startHour-endHour` —
// ไม่ใช่ calendar library จริง (ยังไม่ต่อ backend).
const HOUR_WIDTH = 90; // px ต่อ 1 ชั่วโมงบน timeline

function hourLabel(h: number): string {
  const hh = Math.floor(h).toString().padStart(2, "0");
  return `${hh}:00`;
}

function blockStyle(startHour: number, endHour: number) {
  const left = (startHour - SCHEDULER_HOURS[0]) * HOUR_WIDTH;
  const width = (endHour - startHour) * HOUR_WIDTH;
  return { left, width };
}

export function SchedulerPage() {
  const [view, setView] = useState<"day" | "week" | "month">("day");
  const totalToday = schedulerRows.reduce((sum, r) => sum + r.blocks.length, 0);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">ตารางงาน</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">ภาพรวมและกำหนดการของช่าง / ทีม</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Card className="flex flex-col gap-1 p-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">งานทั้งหมดวันนี้</p>
          <span className="text-2xl font-semibold text-indigo-600 dark:text-indigo-400">{totalToday}</span>
          <p className="text-xs text-zinc-400">รายการ</p>
        </Card>
        <Card className="flex flex-col gap-1 p-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">งานที่รับแล้ว</p>
          <span className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">7</span>
          <p className="text-xs text-zinc-400">39% ของทั้งหมด</p>
        </Card>
        <Card className="flex flex-col gap-1 p-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">รอดำเนินการวันนี้</p>
          <span className="text-2xl font-semibold text-amber-600 dark:text-amber-400">9</span>
          <p className="text-xs text-zinc-400">50% ของทั้งหมด</p>
        </Card>
        <Card className="flex flex-col gap-1 p-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">เสร็จสิ้นวันนี้</p>
          <span className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">2</span>
          <p className="text-xs text-zinc-400">11% ของทั้งหมด</p>
        </Card>
        <Card className="flex flex-col gap-1 p-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">ช่างปฏิบัติงานวันนี้</p>
          <span className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{schedulerRows.length} คน</span>
          <p className="text-xs text-zinc-400">จากทั้งหมด 32 คน</p>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg border border-zinc-200 dark:border-zinc-700">
          {(["day", "week", "month"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setView(key)}
              className={`px-3 py-1.5 text-sm font-medium first:rounded-l-lg last:rounded-r-lg ${
                view === key ? "bg-indigo-600 text-white" : "text-zinc-500 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              {key === "day" ? "วัน" : key === "week" ? "สัปดาห์" : "เดือน"}
            </button>
          ))}
        </div>
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">23 สิงหาคม 2569</span>
        <select disabled title="ยังไม่เปิดใช้งาน" className="ml-auto cursor-not-allowed rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          <option>ทั้งหมดทีม</option>
        </select>
        <Button variant="primary" disabled title="ยังไม่เปิดใช้งาน">
          + สร้างงาน
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <Card className="overflow-x-auto p-4 lg:col-span-3">
          <div style={{ minWidth: SCHEDULER_HOURS.length * HOUR_WIDTH + 160 }}>
            <div className="flex border-b border-zinc-100 pb-2 dark:border-zinc-800">
              <div className="w-40 shrink-0 text-xs font-medium text-zinc-400">ช่าง / ทีม</div>
              <div className="flex flex-1">
                {SCHEDULER_HOURS.map((h) => (
                  <div key={h} style={{ width: HOUR_WIDTH }} className="shrink-0 text-xs text-zinc-400">
                    {hourLabel(h)}
                  </div>
                ))}
              </div>
            </div>
            {schedulerRows.map((row) => (
              <div key={row.assignee} className="flex items-center border-b border-zinc-50 py-2.5 dark:border-zinc-900">
                <div className="w-40 shrink-0">
                  <p className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-100">{row.assignee}</p>
                  <p className="truncate text-[11px] text-zinc-400">{row.team}</p>
                </div>
                <div className="relative h-10 flex-1" style={{ width: SCHEDULER_HOURS.length * HOUR_WIDTH }}>
                  {row.blocks.map((block) => {
                    const style = blockStyle(block.startHour, block.endHour);
                    return (
                      <div
                        key={block.woId}
                        style={{ left: style.left, width: style.width }}
                        className={`absolute top-0 h-full overflow-hidden rounded-lg px-2 py-1 text-[11px] ${
                          block.mode === "remote"
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
                            : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                        }`}
                        title={`${block.woId} ${block.title}`}
                      >
                        <p className="truncate font-medium">{block.woId}</p>
                        <p className="truncate">{block.title}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="flex flex-col gap-3 p-4 lg:col-span-1">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">ตัวกรอง</h2>
          {["ทีม / ช่าง", "สถานะงาน", "ประเภทงาน", "ลูกค้า", "สถานที่", "ช่วงวันที่"].map((label) => (
            <label key={label} className="flex flex-col gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {label}
              <select disabled title="ยังไม่เปิดใช้งาน" className="cursor-not-allowed rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                <option>ทั้งหมด</option>
              </select>
            </label>
          ))}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">สถานะงาน</p>
            <ul className="flex flex-col gap-1.5 text-xs">
              {[
                ["กำลังดำเนินการ", "bg-emerald-500"],
                ["รอดำเนินการ", "bg-amber-500"],
                ["เสร็จสิ้น", "bg-zinc-400"],
                ["พัก / ลา", "bg-blue-500"],
              ].map(([label, dot]) => (
                <li key={label} className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${dot}`} />
                  <span className="text-zinc-600 dark:text-zinc-300">{label}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}
