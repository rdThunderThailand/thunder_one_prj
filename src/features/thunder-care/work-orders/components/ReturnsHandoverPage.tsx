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
          <h1 className="text-xl font-semibold text-foreground">การคืนและการส่งมอบ</h1>
          <p className="text-sm text-muted-foreground">ติดตามรายการคืนอุปกรณ์และการส่งมอบให้ลูกค้า</p>
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
          <p className="text-xs text-muted-foreground">ทั้งหมด</p>
          <span className="text-2xl font-semibold text-primary">{returnHandoverSummary.total}</span>
          <p className="text-xs text-t1-gray-400">รายการ</p>
        </Card>
        <Card className="flex flex-col gap-1 p-4">
          <p className="text-xs text-muted-foreground">รอคืนอุปกรณ์</p>
          <span className="text-2xl font-semibold text-t1-amber-700">{returnHandoverSummary.waitingReturn}</span>
          <p className="text-xs text-t1-gray-400">รายการ</p>
        </Card>
        <Card className="flex flex-col gap-1 p-4">
          <p className="text-xs text-muted-foreground">รอส่งมอบ</p>
          <span className="text-2xl font-semibold text-t1-blue-700">{returnHandoverSummary.waitingHandover}</span>
          <p className="text-xs text-t1-gray-400">รายการ</p>
        </Card>
        <Card className="flex flex-col gap-1 p-4">
          <p className="text-xs text-muted-foreground">คืนแล้วเสร็จ</p>
          <span className="text-2xl font-semibold text-t1-green-700">{returnHandoverSummary.done}</span>
          <p className="text-xs text-t1-gray-400">รายการ</p>
        </Card>
        <Card className="flex flex-col gap-1 p-4">
          <p className="text-xs text-muted-foreground">ยกเลิก</p>
          <span className="text-2xl font-semibold text-t1-red-700">{returnHandoverSummary.cancelled}</span>
          <p className="text-xs text-t1-gray-400">รายการ</p>
        </Card>
      </div>

      <div className="flex gap-1 border-b border-border">
        {[
          { key: "return" as const, label: "การคืนอุปกรณ์" },
          { key: "handover" as const, label: "การส่งมอบอุปกรณ์" },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput placeholder="ค้นหาเลขที่เอกสาร, WO, Asset, ลูกค้า..." className="max-w-sm" />
        {["ประเภท: ทั้งหมด", "สถานะ: ทั้งหมด"].map((label) => (
          <select key={label} disabled title="ยังไม่เปิดใช้งาน" className="cursor-not-allowed rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground">
            <option>{label}</option>
          </select>
        ))}
        <button type="button" disabled title="ยังไม่เปิดใช้งาน" className="flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground">
          <FilterIcon className="h-3.5 w-3.5" /> ตัวกรอง
        </button>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-border text-xs text-muted-foreground">
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
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-2 py-2 font-medium text-foreground">{row.id}</td>
                <td className="px-2 py-2 text-foreground">
                  <p>{row.itemName}</p>
                  <p className="text-xs text-t1-gray-400">SN: {row.serial}</p>
                </td>
                <td className="px-2 py-2 text-muted-foreground">
                  <p>{row.referenceLabel}</p>
                  <p className="text-xs text-primary">{row.referenceWoId}</p>
                </td>
                <td className="px-2 py-2 text-muted-foreground">
                  <p>{row.customerName}</p>
                  <p className="max-w-[200px] truncate text-xs text-t1-gray-400">{row.addressLabel}</p>
                </td>
                <td className="whitespace-nowrap px-2 py-2 text-xs text-muted-foreground">{row.dueDateLabel}</td>
                <td className="px-2 py-2">
                  <Badge variant="pill" color={RH_STATUS_COLOR[row.status]}>
                    {RH_STATUS_LABEL[row.kind][row.status]}
                  </Badge>
                  {row.statusDetailLabel && <p className="mt-0.5 text-[11px] text-t1-gray-400">{row.statusDetailLabel}</p>}
                </td>
                <td className="px-2 py-2">
                  <button type="button" disabled title="ยังไม่เปิดใช้งาน" className="cursor-not-allowed rounded-lg border border-border px-2.5 py-1 text-xs text-muted-foreground">
                    ดูรายละเอียด
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <p className="text-right text-xs text-t1-gray-400">แสดง 1-{rows.length} จาก {returnHandoverSummary.total} รายการ</p>
    </div>
  );
}
