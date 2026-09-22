"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/SearchInput";
import { FilterIcon } from "@/components/ui/icons";
import { RH_STATUS_COLOR, RH_STATUS_LABEL, returnHandoverRows, returnHandoverSummary, type ReturnHandoverKind } from "../mock-data";

// "การคืนและการส่งมอบ" — ติดตามรายการคืนอุปกรณ์และการส่งมอบให้ลูกค้าของ
// Technician (ผังหน้าจอที่ผู้ใช้ส่งมา 2569-09-08).
export function ReturnsHandoverPage() {
  const [activeTab, setActiveTab] = useState<ReturnHandoverKind>("return");
  const rows = returnHandoverRows.filter((r) => r.kind === activeTab);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">การคืนและการส่งมอบ</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">ติดตามรายการคืนอุปกรณ์และการส่งมอบให้ลูกค้า</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" disabled title="ยังไม่เปิดใช้งาน">
            ส่งออก
          </Button>
          <Button variant="primary" disabled title="ยังไม่เปิดใช้งาน">
            + สร้างรายการ
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Card className="flex flex-col gap-1 p-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">ทั้งหมด</p>
          <span className="text-2xl font-semibold text-indigo-600 dark:text-indigo-400">{returnHandoverSummary.total}</span>
          <p className="text-xs text-zinc-400">รายการ</p>
        </Card>
        <Card className="flex flex-col gap-1 p-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">รอคืนอุปกรณ์</p>
          <span className="text-2xl font-semibold text-amber-600 dark:text-amber-400">{returnHandoverSummary.waitingReturn}</span>
          <p className="text-xs text-zinc-400">รายการ</p>
        </Card>
        <Card className="flex flex-col gap-1 p-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">รอส่งมอบ</p>
          <span className="text-2xl font-semibold text-blue-600 dark:text-blue-400">{returnHandoverSummary.waitingHandover}</span>
          <p className="text-xs text-zinc-400">รายการ</p>
        </Card>
        <Card className="flex flex-col gap-1 p-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">คืนแล้วเสร็จ</p>
          <span className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">{returnHandoverSummary.done}</span>
          <p className="text-xs text-zinc-400">รายการ</p>
        </Card>
        <Card className="flex flex-col gap-1 p-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">ยกเลิก</p>
          <span className="text-2xl font-semibold text-red-600 dark:text-red-400">{returnHandoverSummary.cancelled}</span>
          <p className="text-xs text-zinc-400">รายการ</p>
        </Card>
      </div>

      <div className="flex gap-1 border-b border-zinc-100 dark:border-zinc-800">
        {[
          { key: "return" as const, label: "การคืนอุปกรณ์" },
          { key: "handover" as const, label: "การส่งมอบอุปกรณ์" },
        ].map((tab) => (
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

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput placeholder="ค้นหาเลขที่เอกสาร, WO, Asset, ลูกค้า..." className="max-w-sm" />
        {["ประเภท: ทั้งหมด", "สถานะ: ทั้งหมด"].map((label) => (
          <select key={label} disabled title="ยังไม่เปิดใช้งาน" className="cursor-not-allowed rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            <option>{label}</option>
          </select>
        ))}
        <button type="button" disabled title="ยังไม่เปิดใช้งาน" className="flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          <FilterIcon className="h-3.5 w-3.5" /> ตัวกรอง
        </button>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <tr>
              <th className="px-2 py-2 font-medium">เลขที่เอกสาร</th>
              <th className="px-2 py-2 font-medium">ประเภท / รายการ</th>
              <th className="px-2 py-2 font-medium">อ้างอิง</th>
              <th className="px-2 py-2 font-medium">ลูกค้า / สถานที่</th>
              <th className="px-2 py-2 font-medium">{activeTab === "return" ? "กำหนดคืน" : "กำหนดส่งมอบ"}</th>
              <th className="px-2 py-2 font-medium">สถานะ</th>
              <th className="px-2 py-2 font-medium">การดำเนินการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-2 py-2 font-medium text-zinc-900 dark:text-zinc-50">{row.id}</td>
                <td className="px-2 py-2 text-zinc-700 dark:text-zinc-200">
                  <p>{row.itemName}</p>
                  <p className="text-xs text-zinc-400">SN: {row.serial}</p>
                </td>
                <td className="px-2 py-2 text-zinc-600 dark:text-zinc-300">
                  <p>{row.referenceLabel}</p>
                  <p className="text-xs text-indigo-500">{row.referenceWoId}</p>
                </td>
                <td className="px-2 py-2 text-zinc-600 dark:text-zinc-300">
                  <p>{row.customerName}</p>
                  <p className="max-w-[200px] truncate text-xs text-zinc-400">{row.addressLabel}</p>
                </td>
                <td className="whitespace-nowrap px-2 py-2 text-xs text-zinc-500 dark:text-zinc-400">{row.dueDateLabel}</td>
                <td className="px-2 py-2">
                  <Badge variant="pill" color={RH_STATUS_COLOR[row.status]}>
                    {RH_STATUS_LABEL[row.kind][row.status]}
                  </Badge>
                  {row.statusDetailLabel && <p className="mt-0.5 text-[11px] text-zinc-400">{row.statusDetailLabel}</p>}
                </td>
                <td className="px-2 py-2">
                  <button type="button" disabled title="ยังไม่เปิดใช้งาน" className="cursor-not-allowed rounded-lg border border-zinc-200 px-2.5 py-1 text-xs text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                    ดูรายละเอียด
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <p className="text-right text-xs text-zinc-400">แสดง 1-{rows.length} จาก {returnHandoverSummary.total} รายการ</p>
    </div>
  );
}
