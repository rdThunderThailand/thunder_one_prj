"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { SearchInput } from "@/components/ui/SearchInput";
import { FilterIcon, StarIcon } from "@/components/ui/icons";
import { completedRows } from "../mock-data";

// "งานที่เสร็จสิ้น" — ประวัติงานที่ปิดเคสแล้วทั้งหมด (ผังหน้าจอที่ผู้ใช้ส่งมา
// 2569-09-08, persona Dispatcher).
const TABS = [
  { key: "all", label: "ทั้งหมด", count: 312 },
  { key: "today", label: "วันนี้", count: 12 },
  { key: "week", label: "สัปดาห์นี้", count: 28 },
  { key: "month", label: "เดือนนี้", count: 76 },
  { key: "last-month", label: "เดือนที่แล้ว", count: 120 },
  { key: "custom", label: "กำหนดเอง", count: null },
] as const;

function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <StarIcon key={i} filled={i < full} className={`h-3.5 w-3.5 ${i < full ? "text-amber-400" : "text-zinc-200 dark:text-zinc-700"}`} />
      ))}
      <span className="ml-1 text-xs text-zinc-500 dark:text-zinc-400">{rating.toFixed(1)}</span>
    </span>
  );
}

function StatsRow() {
  const avgRating = (completedRows.reduce((sum, r) => sum + r.rating, 0) / completedRows.length).toFixed(1);
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      <Card className="flex flex-col gap-1 p-4">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">เสร็จสิ้นทั้งหมด</p>
        <span className="text-2xl font-semibold text-indigo-600 dark:text-indigo-400">312</span>
        <p className="text-xs text-zinc-400">เดือนนี้ 76 รายการ · +18%</p>
      </Card>
      <Card className="flex flex-col gap-1 p-4">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">ปิดตาม SLA</p>
        <span className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">278</span>
        <p className="text-xs text-zinc-400">89% ของทั้งหมด</p>
      </Card>
      <Card className="flex flex-col gap-1 p-4">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">ปิดเกิน SLA</p>
        <span className="text-2xl font-semibold text-red-600 dark:text-red-400">34</span>
        <p className="text-xs text-zinc-400">11% ของทั้งหมด</p>
      </Card>
      <Card className="flex flex-col gap-1 p-4">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">คะแนนความพึงพอใจ</p>
        <span className="text-2xl font-semibold text-amber-500">{avgRating} / 5</span>
        <p className="text-xs text-zinc-400">จาก {completedRows.length * 20} รีวิว (mock)</p>
      </Card>
      <Card className="flex flex-col justify-between gap-1 p-4">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">ดาวน์โหลดรายงาน</p>
        <button type="button" disabled title="ยังไม่เปิดใช้งาน" className="w-fit cursor-not-allowed text-sm font-medium text-indigo-400">
          สรุป SLA / ประสิทธิภาพช่าง
        </button>
      </Card>
    </div>
  );
}

export function CompletedWorkPage() {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]["key"]>("all");

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">งานที่เสร็จสิ้น</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">ดูประวัติงานที่ปิดเคสแล้วทั้งหมด</p>
      </div>

      <StatsRow />

      <div className="flex gap-1 overflow-x-auto border-b border-zinc-100 dark:border-zinc-800">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`shrink-0 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            {tab.label} {tab.count !== null ? tab.count : ""}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="flex flex-col gap-3 lg:col-span-3">
          <div className="flex flex-wrap items-center gap-2">
            <SearchInput placeholder="ค้นหาในรายการนี้..." className="max-w-xs" />
            {["สถานะ: ปิดเรียบร้อย", "ประเภทปัญหา: ทั้งหมด", "ช่าง/ทีม: ทั้งหมด", "ลูกค้า: ทั้งหมด"].map((label) => (
              <select key={label} disabled title="ยังไม่เปิดใช้งาน" className="cursor-not-allowed rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                <option>{label}</option>
              </select>
            ))}
            <button type="button" disabled title="ยังไม่เปิดใช้งาน" className="flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
              <FilterIcon className="h-3.5 w-3.5" /> ตัวกรองเพิ่มเติม
            </button>
          </div>
          <Card className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                <tr>
                  <th className="px-2 py-2 font-medium">Ticket ID</th>
                  <th className="px-2 py-2 font-medium">เรื่อง / ปัญหา</th>
                  <th className="px-2 py-2 font-medium">ลูกค้า</th>
                  <th className="px-2 py-2 font-medium">Asset / อุปกรณ์</th>
                  <th className="px-2 py-2 font-medium">ช่าง / ทีม</th>
                  <th className="px-2 py-2 font-medium">ปิดเมื่อ</th>
                  <th className="px-2 py-2 font-medium">SLA</th>
                  <th className="px-2 py-2 font-medium">ความพึงพอใจ</th>
                  <th className="px-2 py-2 font-medium">เอกสารสรุป</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
                {completedRows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-2 py-2 font-medium text-zinc-900 dark:text-zinc-50">{row.id}</td>
                    <td className="px-2 py-2 text-zinc-700 dark:text-zinc-200">
                      <p>{row.issueTitle}</p>
                      <p className="text-xs text-zinc-400">{row.issueCategory}</p>
                    </td>
                    <td className="px-2 py-2 text-zinc-600 dark:text-zinc-300">{row.customerName}</td>
                    <td className="px-2 py-2 text-zinc-600 dark:text-zinc-300">
                      <p>{row.assetTag}</p>
                      <p className="text-xs text-zinc-400">{row.assetLabel}</p>
                    </td>
                    <td className="px-2 py-2 text-zinc-700 dark:text-zinc-200">{row.assignee}</td>
                    <td className="whitespace-nowrap px-2 py-2 text-xs text-zinc-500 dark:text-zinc-400">{row.closedAtLabel}</td>
                    <td className="px-2 py-2">
                      <span className={`text-xs font-medium ${row.slaPassed ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                        {row.slaPassed ? "ผ่าน SLA" : "เกิน SLA"}
                      </span>
                      <p className="text-[11px] text-zinc-400">({row.slaDetailLabel})</p>
                    </td>
                    <td className="px-2 py-2">
                      <Stars rating={row.rating} />
                    </td>
                    <td className="px-2 py-2 text-xs text-zinc-500 dark:text-zinc-400">{row.attachmentCount} ไฟล์</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <p className="text-right text-xs text-zinc-400">แสดง 1-{completedRows.length} จาก 312 รายการ</p>
        </div>
        <div className="lg:col-span-1">
          <Card className="flex flex-col gap-3 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">ตัวกรองค้นหา</h2>
              <button type="button" disabled title="ยังไม่เปิดใช้งาน" className="cursor-not-allowed text-xs text-zinc-400">
                ล้างค่า
              </button>
            </div>
            {["ช่วงเวลาปิดงาน", "สถานะ", "SLA", "ประเภทปัญหา", "ลูกค้า", "Asset / อุปกรณ์", "ช่าง / ทีม"].map((label) => (
              <label key={label} className="flex flex-col gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {label}
                <select disabled title="ยังไม่เปิดใช้งาน" className="cursor-not-allowed rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                  <option>ทั้งหมด</option>
                </select>
              </label>
            ))}
            <button type="button" disabled title="ยังไม่เปิดใช้งาน" className="cursor-not-allowed rounded-lg bg-indigo-300 px-4 py-2 text-sm font-medium text-white">
              ค้นหา
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
}
