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
        <StarIcon key={i} filled={i < full} className={`h-3.5 w-3.5 ${i < full ? "text-warning" : "text-t1-gray-400"}`} />
      ))}
      <span className="ml-1 text-xs text-muted-foreground">{rating.toFixed(1)}</span>
    </span>
  );
}

function StatsRow() {
  const avgRating = (completedRows.reduce((sum, r) => sum + r.rating, 0) / completedRows.length).toFixed(1);
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      <Card className="flex flex-col gap-1 p-4">
        <p className="text-xs text-muted-foreground">เสร็จสิ้นทั้งหมด</p>
        <span className="text-2xl font-semibold text-primary">312</span>
        <p className="text-xs text-t1-gray-400">เดือนนี้ 76 รายการ · +18%</p>
      </Card>
      <Card className="flex flex-col gap-1 p-4">
        <p className="text-xs text-muted-foreground">ปิดตาม SLA</p>
        <span className="text-2xl font-semibold text-t1-green-700">278</span>
        <p className="text-xs text-t1-gray-400">89% ของทั้งหมด</p>
      </Card>
      <Card className="flex flex-col gap-1 p-4">
        <p className="text-xs text-muted-foreground">ปิดเกิน SLA</p>
        <span className="text-2xl font-semibold text-t1-red-700">34</span>
        <p className="text-xs text-t1-gray-400">11% ของทั้งหมด</p>
      </Card>
      <Card className="flex flex-col gap-1 p-4">
        <p className="text-xs text-muted-foreground">คะแนนความพึงพอใจ</p>
        <span className="text-2xl font-semibold text-warning">{avgRating} / 5</span>
        <p className="text-xs text-t1-gray-400">จาก {completedRows.length * 20} รีวิว (mock)</p>
      </Card>
      <Card className="flex flex-col justify-between gap-1 p-4">
        <p className="text-xs text-muted-foreground">ดาวน์โหลดรายงาน</p>
        <button type="button" disabled title="ยังไม่เปิดใช้งาน" className="w-fit cursor-not-allowed text-sm font-medium text-primary">
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
        <h1 className="text-xl font-semibold text-foreground">งานที่เสร็จสิ้น</h1>
        <p className="text-sm text-muted-foreground">ดูประวัติงานที่ปิดเคสแล้วทั้งหมด</p>
      </div>

      <StatsRow />

      <div className="flex gap-1 overflow-x-auto border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`shrink-0 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
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
              <select key={label} disabled title="ยังไม่เปิดใช้งาน" className="cursor-not-allowed rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground">
                <option>{label}</option>
              </select>
            ))}
            <button type="button" disabled title="ยังไม่เปิดใช้งาน" className="flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground">
              <FilterIcon className="h-3.5 w-3.5" /> ตัวกรองเพิ่มเติม
            </button>
          </div>
          <Card className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-border text-xs text-muted-foreground">
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
              <tbody className="divide-y divide-border">
                {completedRows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-2 py-2 font-medium text-foreground">{row.id}</td>
                    <td className="px-2 py-2 text-foreground">
                      <p>{row.issueTitle}</p>
                      <p className="text-xs text-t1-gray-400">{row.issueCategory}</p>
                    </td>
                    <td className="px-2 py-2 text-muted-foreground">{row.customerName}</td>
                    <td className="px-2 py-2 text-muted-foreground">
                      <p>{row.assetTag}</p>
                      <p className="text-xs text-t1-gray-400">{row.assetLabel}</p>
                    </td>
                    <td className="px-2 py-2 text-foreground">{row.assignee}</td>
                    <td className="whitespace-nowrap px-2 py-2 text-xs text-muted-foreground">{row.closedAtLabel}</td>
                    <td className="px-2 py-2">
                      <span className={`text-xs font-medium ${row.slaPassed ? "text-t1-green-700" : "text-t1-red-700"}`}>
                        {row.slaPassed ? "ผ่าน SLA" : "เกิน SLA"}
                      </span>
                      <p className="text-[11px] text-t1-gray-400">({row.slaDetailLabel})</p>
                    </td>
                    <td className="px-2 py-2">
                      <Stars rating={row.rating} />
                    </td>
                    <td className="px-2 py-2 text-xs text-muted-foreground">{row.attachmentCount} ไฟล์</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <p className="text-right text-xs text-t1-gray-400">แสดง 1-{completedRows.length} จาก 312 รายการ</p>
        </div>
        <div className="lg:col-span-1">
          <Card className="flex flex-col gap-3 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">ตัวกรองค้นหา</h2>
              <button type="button" disabled title="ยังไม่เปิดใช้งาน" className="cursor-not-allowed text-xs text-t1-gray-400">
                ล้างค่า
              </button>
            </div>
            {["ช่วงเวลาปิดงาน", "สถานะ", "SLA", "ประเภทปัญหา", "ลูกค้า", "Asset / อุปกรณ์", "ช่าง / ทีม"].map((label) => (
              <label key={label} className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
                {label}
                <select disabled title="ยังไม่เปิดใช้งาน" className="cursor-not-allowed rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground">
                  <option>ทั้งหมด</option>
                </select>
              </label>
            ))}
            <button type="button" disabled title="ยังไม่เปิดใช้งาน" className="cursor-not-allowed rounded-lg bg-t1-blue-300 px-4 py-2 text-sm font-medium text-primary-foreground">
              ค้นหา
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
}
