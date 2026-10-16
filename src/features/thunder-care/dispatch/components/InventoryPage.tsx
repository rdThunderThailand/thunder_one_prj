"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/SearchInput";
import { EditIcon, FilterIcon, RepeatIcon } from "@/components/ui/icons";
import { STOCK_STATUS_COLOR, STOCK_STATUS_LABEL, inventoryItems, inventorySummary, inventoryUsageByCode, type InventoryItem } from "../mock-data";

// "คลังอะไหล่ / อุปกรณ์" — บริหารจัดการสต็อกอะไหล่และอุปกรณ์ของ Dispatcher
// (ผังหน้าจอที่ผู้ใช้ส่งมา 2569-09-08). แยกจาก Asset Intelligence's Asset —
// นี่คือ "ของที่ใช้ซ่อม" (อะไหล่/สต็อกสิ้นเปลือง) ไม่ใช่ "ของที่ติดตั้งอยู่ที่
// ลูกค้า" (asset).
function formatCurrency(amount: number): string {
  return amount.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const TABS = [
  { key: "all" as const, label: "ทั้งหมด" },
  { key: "available" as const, label: "พร้อมใช้งาน" },
  { key: "low" as const, label: "ใกล้หมดสต็อก" },
  { key: "out" as const, label: "หมดสต็อก" },
];

function filterItems(tab: (typeof TABS)[number]["key"]): InventoryItem[] {
  return tab === "all" ? inventoryItems : inventoryItems.filter((i) => i.status === tab);
}

function DetailPanel({ item }: { item: InventoryItem }) {
  const [tab, setTab] = useState<"general" | "history">("general");
  const usage = inventoryUsageByCode[item.code] ?? [];
  return (
    <Card className="flex flex-col gap-4 p-4">
      <div>
        <p className="text-sm font-semibold text-foreground">{item.code}</p>
        <p className="text-sm font-medium text-foreground">
          {item.name} <span className="text-xs text-t1-gray-400">{item.description}</span>
        </p>
        <Badge variant="pill" color={STOCK_STATUS_COLOR[item.status]} className="mt-1">
          {STOCK_STATUS_LABEL[item.status]}
        </Badge>
      </div>

      <div className="flex gap-1 border-b border-border text-xs">
        {[
          { key: "general" as const, label: "ข้อมูลทั่วไป" },
          { key: "history" as const, label: "ประวัติการเคลื่อนไหว" },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`border-b-2 px-2 py-1.5 font-medium ${tab === t.key ? "border-primary text-primary" : "border-transparent text-t1-gray-400"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "general" ? (
        <div className="flex flex-col gap-2.5 text-xs">
          <div>
            <p className="text-t1-gray-400">รหัสสินค้า</p>
            <p className="font-medium text-foreground">{item.code}</p>
          </div>
          <div>
            <p className="text-t1-gray-400">หมวดหมู่</p>
            <p className="font-medium text-foreground">{item.category}</p>
          </div>
          <div>
            <p className="text-t1-gray-400">คลัง</p>
            <p className="font-medium text-foreground">{item.warehouse}</p>
          </div>
          <div>
            <p className="text-t1-gray-400">หน่วย</p>
            <p className="font-medium text-foreground">{item.unit}</p>
          </div>
          <div>
            <p className="text-t1-gray-400">จำนวนคงเหลือ</p>
            <p className="font-medium text-foreground">
              {item.quantity} {item.unit}
            </p>
          </div>
          <div>
            <p className="text-t1-gray-400">จุดสั่งซื้อใหม่ (ROP)</p>
            <p className="font-medium text-foreground">
              {item.reorderPoint} {item.unit}
            </p>
          </div>
          <div>
            <p className="text-t1-gray-400">ราคา / หน่วย</p>
            <p className="font-medium text-foreground">{formatCurrency(item.unitPrice)} บาท</p>
          </div>
          <div>
            <p className="text-t1-gray-400">มูลค่าคงเหลือ</p>
            <p className="font-medium text-foreground">{formatCurrency(item.unitPrice * item.quantity)} บาท</p>
          </div>
        </div>
      ) : (
        <ul className="flex flex-col gap-2 text-xs">
          {usage.length === 0 ? (
            <li className="text-t1-gray-400">ยังไม่มีประวัติการใช้งานที่บันทึกไว้</li>
          ) : (
            usage.map((row) => (
              <li key={row.woId} className="flex items-center justify-between">
                <span className="font-medium text-primary">{row.woId}</span>
                <span className="text-muted-foreground">
                  ใช้งาน {row.quantityUsed} {row.unit}
                </span>
                <span className="text-t1-gray-400">{row.dateLabel}</span>
              </li>
            ))
          )}
        </ul>
      )}

      <div className="flex flex-col gap-2">
        <Button variant="secondary" disabled title="ยังไม่เปิดใช้งาน">
          แก้ไขข้อมูล
        </Button>
        <Button variant="primary" disabled title="ยังไม่เปิดใช้งาน">
          <RepeatIcon className="h-3.5 w-3.5" /> ปรับสต็อก
        </Button>
      </div>
    </Card>
  );
}

export function InventoryPage() {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]["key"]>("all");
  const [selectedCode, setSelectedCode] = useState<string | null>(inventoryItems[0]?.code ?? null);
  const rows = filterItems(activeTab);
  const selected = inventoryItems.find((i) => i.code === selectedCode) ?? null;
  const summary = inventorySummary();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">คลังอะไหล่ / อุปกรณ์</h1>
          <p className="text-sm text-muted-foreground">บริหารจัดการสต็อกอะไหล่และอุปกรณ์ขององค์กร</p>
        </div>
        <Button variant="primary" disabled title="ยังไม่เปิดใช้งาน">
          + เพิ่มรายการ
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Card className="flex flex-col gap-1 p-4">
          <p className="text-xs text-muted-foreground">มูลค่าสินค้าคงคลัง</p>
          <span className="text-2xl font-semibold text-primary">{formatCurrency(summary.totalValue)}</span>
          <p className="text-xs text-t1-gray-400">บาท</p>
        </Card>
        <Card className="flex flex-col gap-1 p-4">
          <p className="text-xs text-muted-foreground">รายการทั้งหมด</p>
          <span className="text-2xl font-semibold text-foreground">{summary.totalItems}</span>
          <p className="text-xs text-t1-gray-400">รายการ</p>
        </Card>
        <Card className="flex flex-col gap-1 p-4">
          <p className="text-xs text-muted-foreground">พร้อมใช้งาน</p>
          <span className="text-2xl font-semibold text-t1-green-700">{summary.available}</span>
          <p className="text-xs text-t1-gray-400">{Math.round((summary.available / summary.totalItems) * 100)}% ของทั้งหมด</p>
        </Card>
        <Card className="flex flex-col gap-1 p-4">
          <p className="text-xs text-muted-foreground">ใกล้หมดสต็อก</p>
          <span className="text-2xl font-semibold text-t1-amber-700">{summary.low}</span>
          <p className="text-xs text-t1-gray-400">รายการ</p>
        </Card>
        <Card className="flex flex-col gap-1 p-4">
          <p className="text-xs text-muted-foreground">หมดสต็อก</p>
          <span className="text-2xl font-semibold text-t1-red-700">{summary.out}</span>
          <p className="text-xs text-t1-gray-400">รายการ</p>
        </Card>
      </div>

      <div className="flex gap-1 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label} {filterItems(tab.key).length}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-3 lg:col-span-2">
          <div className="flex flex-wrap items-center gap-2">
            <SearchInput placeholder="ค้นหาอะไหล่ / อุปกรณ์, รหัสสินค้า..." className="max-w-sm" />
            {["หมวดหมู่: ทั้งหมด", "สถานะสต็อก: ทั้งหมด", "คลัง: คลังหลัก"].map((label) => (
              <select key={label} disabled title="ยังไม่เปิดใช้งาน" className="cursor-not-allowed rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground">
                <option>{label}</option>
              </select>
            ))}
            <button type="button" disabled title="ยังไม่เปิดใช้งาน" className="flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground">
              <FilterIcon className="h-3.5 w-3.5" /> ตัวกรองเพิ่มเติม
            </button>
          </div>
          <Card className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-b border-border text-xs text-muted-foreground">
                <tr>
                  <th className="w-8 px-2 py-2">
                    <input type="checkbox" className="rounded border-border" disabled title="ยังไม่เปิดใช้งาน" />
                  </th>
                  <th className="px-2 py-2 font-medium">รหัสสินค้า</th>
                  <th className="px-2 py-2 font-medium">รายการ / รายละเอียด</th>
                  <th className="px-2 py-2 font-medium">หมวดหมู่</th>
                  <th className="px-2 py-2 font-medium">คลัง</th>
                  <th className="px-2 py-2 font-medium">หน่วย</th>
                  <th className="px-2 py-2 font-medium">สถานะสต็อก</th>
                  <th className="px-2 py-2 font-medium">ราคา / หน่วย</th>
                  <th className="px-2 py-2 font-medium">มูลค่าคงเหลือ</th>
                  <th className="px-2 py-2 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((item) => (
                  <tr
                    key={item.code}
                    onClick={() => setSelectedCode(item.code)}
                    className={`cursor-pointer ${selectedCode === item.code ? "bg-accent/60" : "hover:bg-muted"}`}
                  >
                    <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" className="rounded border-border" disabled title="ยังไม่เปิดใช้งาน" />
                    </td>
                    <td className="px-2 py-2 font-medium text-foreground">{item.code}</td>
                    <td className="px-2 py-2 text-foreground">
                      <p>{item.name}</p>
                      <p className="text-xs text-t1-gray-400">{item.description}</p>
                    </td>
                    <td className="px-2 py-2 text-muted-foreground">{item.category}</td>
                    <td className="px-2 py-2 text-muted-foreground">{item.warehouse}</td>
                    <td className="px-2 py-2 text-muted-foreground">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="px-2 py-2">
                      <Badge variant="pill" color={STOCK_STATUS_COLOR[item.status]}>
                        {STOCK_STATUS_LABEL[item.status]}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-2 py-2 text-xs text-muted-foreground">{formatCurrency(item.unitPrice)}</td>
                    <td className="whitespace-nowrap px-2 py-2 text-xs font-medium text-foreground">{formatCurrency(item.unitPrice * item.quantity)}</td>
                    <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                      <EditIcon className="h-3.5 w-3.5 text-t1-gray-400" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <p className="text-right text-xs text-t1-gray-400">แสดง 1-{rows.length} จาก {rows.length} รายการ</p>
        </div>
        <div className="lg:col-span-1">{selected ? <DetailPanel item={selected} /> : <Card className="p-10 text-center text-sm text-t1-gray-400">เลือกรายการเพื่อดูรายละเอียด</Card>}</div>
      </div>
    </div>
  );
}
