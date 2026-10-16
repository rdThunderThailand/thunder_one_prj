"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/SearchInput";
import { FilterIcon, PhoneIcon } from "@/components/ui/icons";
import { IN_PROGRESS_STATUS_LABEL, inProgressRows, workOrderUpdateLog, type InProgressRow } from "../mock-data";
import { priorityBadge } from "../status-colors";

// "งานที่กำลังดำเนินการ" — ติดตามงานทุก Work Order ที่จัดสรรแล้วแบบ real-time
// (ผังหน้าจอที่ผู้ใช้ส่งมา 2569-09-08, persona Dispatcher). อัปเดตล่าสุดใน
// panel ขวาเป็น mock เฉพาะ WO-30516 (ตัวที่ผังหน้าจอโชว์ตัวอย่างไว้) —
// เคสอื่นใช้ placeholder ทั่วไปแทน.
const TABS = [
  { key: "all" as const, label: "ทั้งหมด" },
  { key: "onsite" as const, label: "Onsite" },
  { key: "traveling_remote" as const, label: "Remote" },
  { key: "waiting_update" as const, label: "รออัปเดต" },
  { key: "sla_risk" as const, label: "เสี่ยงเกิน SLA" },
];

function filterRows(tab: (typeof TABS)[number]["key"]): InProgressRow[] {
  switch (tab) {
    case "onsite":
      return inProgressRows.filter((r) => r.statusKey === "onsite" || r.statusKey === "traveling");
    case "traveling_remote":
      return inProgressRows.filter((r) => r.assignee.startsWith("ทีม"));
    case "waiting_update":
      return inProgressRows.filter((r) => r.statusKey === "waiting_update" || r.statusKey === "waiting_info");
    case "sla_risk":
      return inProgressRows.filter((r) => r.slaAtRisk);
    default:
      return inProgressRows;
  }
}

function StatsRow() {
  const onsite = inProgressRows.filter((r) => r.statusKey === "onsite" || r.statusKey === "traveling").length;
  const remote = inProgressRows.length - onsite;
  const waitingUpdate = inProgressRows.filter((r) => r.statusKey === "waiting_update").length;
  const slaRisk = inProgressRows.filter((r) => r.slaAtRisk).length;
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      <Card className="flex flex-col gap-1 p-4">
        <p className="text-xs text-muted-foreground">กำลังดำเนินการทั้งหมด</p>
        <span className="text-2xl font-semibold text-primary">{inProgressRows.length}</span>
        <p className="text-xs text-t1-gray-400">Onsite {onsite} | Remote {remote}</p>
      </Card>
      <Card className="flex flex-col gap-1 p-4">
        <p className="text-xs text-muted-foreground">Onsite</p>
        <span className="text-2xl font-semibold text-foreground">{onsite}</span>
        <p className="text-xs text-t1-gray-400">ถึงหน้างานแล้ว 9</p>
      </Card>
      <Card className="flex flex-col gap-1 p-4">
        <p className="text-xs text-muted-foreground">Remote</p>
        <span className="text-2xl font-semibold text-foreground">{remote}</span>
        <p className="text-xs text-t1-gray-400">กำลังให้บริการ 5</p>
      </Card>
      <Card className="flex flex-col gap-1 p-4">
        <p className="text-xs text-muted-foreground">รออัปเดตจากช่าง</p>
        <span className="text-2xl font-semibold text-foreground">{waitingUpdate + 3}</span>
        <p className="text-xs text-t1-gray-400">เกิน 30 นาที 2</p>
      </Card>
      <Card className="flex flex-col gap-1 p-4">
        <p className="text-xs text-muted-foreground">เสี่ยงเกิน SLA</p>
        <span className="text-2xl font-semibold text-t1-red-700">{slaRisk}</span>
        <p className="text-xs text-t1-gray-400">ใกล้เกิน SLA 3 รายการ</p>
      </Card>
      <Card className="flex flex-col gap-1 p-4">
        <p className="text-xs text-muted-foreground">เสร็จวันนี้</p>
        <span className="text-2xl font-semibold text-t1-green-700">12</span>
        <p className="text-xs text-t1-gray-400">คาดว่าเสร็จ 18:00 น.</p>
      </Card>
    </div>
  );
}

function DetailPanel({ row }: { row: InProgressRow }) {
  const log = workOrderUpdateLog[row.woId] ?? [{ atLabel: "-", text: "ยังไม่มีอัปเดตเพิ่มเติม" }];
  return (
    <Card className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">{row.woId}</span>
        <Badge variant="pill" color="green">
          {IN_PROGRESS_STATUS_LABEL[row.statusKey]}
        </Badge>
      </div>
      <p className="text-xs text-t1-gray-400">จาก Ticket {row.ticketId}</p>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="col-span-2">
          <p className="text-t1-gray-400">เรื่อง</p>
          <p className="font-medium text-foreground">{row.issueTitle}</p>
        </div>
        <div>
          <p className="text-t1-gray-400">ลูกค้า</p>
          <p className="font-medium text-foreground">{row.customerName}</p>
          <p className="text-t1-gray-400">{row.branchLabel}</p>
        </div>
        <div>
          <p className="text-t1-gray-400">Asset</p>
          <p className="font-medium text-foreground">{row.assetTag}</p>
        </div>
        <div>
          <p className="text-t1-gray-400">ความเร่งด่วน</p>
          <Badge variant="pill" color={priorityBadge[row.priority].color}>
            {priorityBadge[row.priority].label}
          </Badge>
        </div>
        <div>
          <p className="text-t1-gray-400">SLA</p>
          <p className={`font-medium ${row.slaAtRisk ? "text-t1-red-700" : "text-foreground"}`}>{row.slaLabel}</p>
        </div>
        <div className="col-span-2">
          <p className="text-t1-gray-400">นัดหมาย</p>
          <p className="font-medium text-foreground">{row.appointmentLabel}</p>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg bg-muted p-3">
        <span className="text-sm font-medium text-foreground">{row.assignee}</span>
        <PhoneIcon className="h-4 w-4 text-t1-gray-400" />
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-t1-gray-400">อัปเดตล่าสุด</p>
        <ul className="flex flex-col gap-2">
          {log.map((entry, i) => (
            <li key={i} className="flex items-start gap-2 text-xs">
              <span className="shrink-0 text-t1-gray-400">{entry.atLabel}</span>
              <span className="text-muted-foreground">{entry.text}</span>
            </li>
          ))}
        </ul>
      </div>

      <Button variant="primary">เปิด Work Order</Button>
    </Card>
  );
}

export function InProgressPage() {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]["key"]>("all");
  const [selectedId, setSelectedId] = useState<string | null>(inProgressRows[0]?.woId ?? null);
  const rows = filterRows(activeTab);
  const selected = inProgressRows.find((r) => r.woId === selectedId) ?? null;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-foreground">งานที่กำลังดำเนินการ</h1>
        <p className="text-sm text-muted-foreground">ติดตามสถานะงานที่กำลังดำเนินการทั้งหมด</p>
      </div>

      <StatsRow />

      <div className="flex gap-1 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label} ({filterRows(tab.key).length})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-3 lg:col-span-2">
          <div className="flex flex-wrap items-center gap-2">
            <SearchInput placeholder="ค้นหาในรายการนี้..." className="max-w-xs" />
            {["สถานะ: ทั้งหมด", "ประเภทปัญหา: ทั้งหมด", "ทีม/ช่าง: ทั้งหมด", "ความเร่งด่วน: ทั้งหมด"].map((label) => (
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
                  <th className="px-2 py-2 font-medium">เลขที่เรื่อง</th>
                  <th className="px-2 py-2 font-medium">ประเภทปัญหา</th>
                  <th className="px-2 py-2 font-medium">ลูกค้า</th>
                  <th className="px-2 py-2 font-medium">ช่าง / ทีม</th>
                  <th className="px-2 py-2 font-medium">สถานะ</th>
                  <th className="px-2 py-2 font-medium">ความคืบหน้า</th>
                  <th className="px-2 py-2 font-medium">SLA</th>
                  <th className="px-2 py-2 font-medium">นัดหมาย</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row) => (
                  <tr
                    key={row.woId}
                    onClick={() => setSelectedId(row.woId)}
                    className={`cursor-pointer ${selectedId === row.woId ? "bg-accent/60" : "hover:bg-muted"}`}
                  >
                    <td className="px-2 py-2">
                      <p className="font-medium text-primary">{row.woId}</p>
                      <p className="text-[11px] text-t1-gray-400">จาก {row.ticketId}</p>
                    </td>
                    <td className="px-2 py-2 text-foreground">
                      <p>{row.issueTitle}</p>
                      <p className="text-xs text-t1-gray-400">{row.assetTag} {row.assetLabel}</p>
                    </td>
                    <td className="px-2 py-2 text-muted-foreground">
                      <p>{row.customerName}</p>
                      <p className="text-xs text-t1-gray-400">{row.branchLabel}</p>
                    </td>
                    <td className="px-2 py-2 text-foreground">{row.assignee}</td>
                    <td className="px-2 py-2 text-xs text-muted-foreground">{IN_PROGRESS_STATUS_LABEL[row.statusKey]}</td>
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${row.progressPercent}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{row.progressPercent}%</span>
                      </div>
                    </td>
                    <td className={`whitespace-nowrap px-2 py-2 text-xs font-medium ${row.slaAtRisk ? "text-t1-red-700" : "text-muted-foreground"}`}>{row.slaLabel}</td>
                    <td className="whitespace-nowrap px-2 py-2 text-xs text-muted-foreground">{row.appointmentLabel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <p className="text-right text-xs text-t1-gray-400">แสดง 1-{rows.length} จาก {rows.length} รายการ</p>
        </div>
        <div className="lg:col-span-1">{selected ? <DetailPanel row={selected} /> : <Card className="p-10 text-center text-sm text-t1-gray-400">เลือกงานเพื่อดูรายละเอียด</Card>}</div>
      </div>
    </div>
  );
}
