"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { SearchInput } from "@/components/ui/SearchInput";
import { CheckCircleIcon, EditIcon, FilterIcon } from "@/components/ui/icons";
import {
  TRACKING_STATUS_COLOR,
  TRACKING_STATUS_LABEL,
  getCaseTimeline,
  trackingRows,
  type TrackingRow,
  type TrackingStatus,
} from "../mock-data";
import { priorityBadge, slaRiskTextColor } from "../status-colors";

// "ติดตามเคส" — ภาพรวมความคืบหน้าของทุกเคสที่ผ่าน Triage ไปแล้ว (ผังหน้าจอ
// ที่ผู้ใช้ส่งมา 2569-09-08, หน้าที่ 4). Timeline ใน panel ขวาเป็น mock แบบ
// อ่านอย่างเดียว (ไม่มี backend จริงให้ trigger การเปลี่ยนสถานะ) — ปุ่ม
// "อัปเดตสถานะ" จึงปิดใช้งานตามธรรมเนียม "ยังไม่เปิดใช้งาน" ของโปรเจกต์.
const TABS: { key: "all" | TrackingStatus; label: string }[] = [
  { key: "all", label: "ทั้งหมด" },
  { key: "in_progress", label: TRACKING_STATUS_LABEL.in_progress },
  { key: "waiting_appointment", label: TRACKING_STATUS_LABEL.waiting_appointment },
  { key: "waiting_parts", label: TRACKING_STATUS_LABEL.waiting_parts },
  { key: "on_the_way", label: TRACKING_STATUS_LABEL.on_the_way },
];

function countFor(tab: "all" | TrackingStatus): number {
  return tab === "all" ? trackingRows.length : trackingRows.filter((r) => r.status === tab).length;
}

function TrackingStatsRow() {
  const stages: { id: TrackingStatus; label: string }[] = [
    { id: "in_progress", label: TRACKING_STATUS_LABEL.in_progress },
    { id: "waiting_appointment", label: "รอเข้าตรวจ/นัดหมาย" },
    { id: "waiting_parts", label: TRACKING_STATUS_LABEL.waiting_parts },
  ];
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      <Card className="flex flex-col gap-1 p-4">
        <p className="text-xs text-muted-foreground">ทั้งหมด</p>
        <span className="text-2xl font-semibold text-primary">{trackingRows.length}</span>
        <p className="text-xs text-t1-gray-400">รายการ</p>
      </Card>
      {stages.map((stage) => (
        <Card key={stage.id} className="flex flex-col gap-1 p-4">
          <p className="text-xs text-muted-foreground">{stage.label}</p>
          <span className="text-2xl font-semibold text-foreground">{countFor(stage.id)}</span>
          <p className="text-xs text-t1-gray-400">รายการ</p>
        </Card>
      ))}
      <Card className="flex flex-col gap-1 p-4">
        <p className="text-xs text-muted-foreground">ปิดแล้ว</p>
        <span className="text-2xl font-semibold text-t1-green-700">{countFor("closed")}</span>
        <p className="text-xs text-t1-gray-400">รายการ</p>
      </Card>
    </div>
  );
}

function TrackingTable({
  rows,
  selectedId,
  onSelect,
}: {
  rows: TrackingRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <Card className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead className="border-b border-border text-xs text-muted-foreground">
          <tr>
            <th className="w-8 px-3 py-2">
              <input type="checkbox" className="rounded border-border" disabled title="ยังไม่เปิดใช้งาน" />
            </th>
            <th className="px-3 py-2 font-medium">Ticket ID</th>
            <th className="px-3 py-2 font-medium">เรื่อง / ปัญหา</th>
            <th className="px-3 py-2 font-medium">ลูกค้า / สาขา</th>
            <th className="px-3 py-2 font-medium">Asset</th>
            <th className="px-3 py-2 font-medium">สถานะ</th>
            <th className="px-3 py-2 font-medium">ความเร่งด่วน</th>
            <th className="px-3 py-2 font-medium">SLA</th>
            <th className="px-3 py-2 font-medium">อัปเดตล่าสุด</th>
            <th className="px-3 py-2 font-medium">ผู้รับผิดชอบ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => (
            <tr
              key={row.id}
              onClick={() => onSelect(row.id)}
              className={`cursor-pointer ${selectedId === row.id ? "bg-accent/60" : "hover:bg-muted"}`}
            >
              <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                <input type="checkbox" className="rounded border-border" disabled title="ยังไม่เปิดใช้งาน" />
              </td>
              <td className="px-3 py-2.5 font-medium text-foreground">{row.id}</td>
              <td className="px-3 py-2.5 text-foreground">{row.title}</td>
              <td className="px-3 py-2.5 text-muted-foreground">
                <p>{row.customerName}</p>
                <p className="text-xs text-t1-gray-400">{row.branchLabel}</p>
              </td>
              <td className="px-3 py-2.5 text-muted-foreground">
                <p>{row.assetTag}</p>
                <p className="text-xs text-t1-gray-400">{row.assetLabel}</p>
              </td>
              <td className="px-3 py-2.5">
                <Badge variant="pill" color={TRACKING_STATUS_COLOR[row.status]}>
                  {TRACKING_STATUS_LABEL[row.status]}
                </Badge>
              </td>
              <td className="px-3 py-2.5">
                <Badge variant="pill" color={priorityBadge[row.priority].color}>
                  {priorityBadge[row.priority].label}
                </Badge>
              </td>
              <td className={`whitespace-nowrap px-3 py-2.5 text-xs font-medium ${slaRiskTextColor[row.slaRisk]}`}>{row.slaRemainingLabel}</td>
              <td className="whitespace-nowrap px-3 py-2.5 text-xs text-muted-foreground">{row.updatedAtLabel}</td>
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <Avatar name={row.assignee.name} size={22} />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-foreground">{row.assignee.name}</p>
                    <p className="truncate text-[11px] text-t1-gray-400">{row.assignee.role}</p>
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function TrackingDetailPanel({ row }: { row: TrackingRow }) {
  const timeline = getCaseTimeline(row.id);
  return (
    <Card className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-foreground">{row.id}</span>
        <Badge variant="pill" color={priorityBadge[row.priority].color}>
          {priorityBadge[row.priority].label}
        </Badge>
        <Badge variant="pill" color={TRACKING_STATUS_COLOR[row.status]}>
          {TRACKING_STATUS_LABEL[row.status]}
        </Badge>
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{row.title}</p>
        <p className="text-xs text-muted-foreground">
          {row.customerName} · {row.assetTag} · {row.branchLabel}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-t1-gray-400">วันเวลา</p>
          <p className="font-medium text-foreground">{row.reportedAtLabel}</p>
        </div>
        <div>
          <p className="text-t1-gray-400">SLA Response</p>
          <p className={`font-medium ${slaRiskTextColor[row.slaRisk]}`}>{row.slaRemainingLabel}</p>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg bg-muted p-3">
        <div className="flex items-center gap-2">
          <Avatar name={row.assignee.name} size={28} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{row.assignee.name}</p>
            <p className="truncate text-xs text-t1-gray-400">{row.assignee.role}</p>
          </div>
        </div>
        <button type="button" disabled title="ยังไม่เปิดใช้งาน" className="cursor-not-allowed text-xs font-medium text-primary">
          ดูรายละเอียดเพิ่มเติม
        </button>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-t1-gray-400">ความคืบหน้า (Timeline)</p>
        <ul className="flex flex-col gap-3">
          {timeline.map((step, i) => (
            <li key={i} className="flex items-start gap-2.5">
              {step.done ? (
                <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              ) : (
                <span className="mt-1 h-3 w-3 shrink-0 rounded-full border-2 border-border" />
              )}
              <div className="min-w-0">
                <p className={`text-sm ${step.done ? "text-foreground" : "text-muted-foreground"}`}>{step.label}</p>
                {step.atLabel && (
                  <p className="text-xs text-t1-gray-400">
                    {step.atLabel} {step.byLabel ? `โดย ${step.byLabel}` : ""}
                  </p>
                )}
                {step.extra && <p className="text-xs text-t1-gray-400">{step.extra}</p>}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-2">
        <Button variant="secondary" disabled title="ยังไม่เปิดใช้งาน">
          ต่อข้อความหาลูกค้า
        </Button>
        <Button variant="primary" disabled title="ยังไม่เปิดใช้งาน">
          <EditIcon className="h-3.5 w-3.5" /> อัปเดตสถานะ
        </Button>
      </div>
    </Card>
  );
}

export function CaseTrackingPage() {
  const [activeTab, setActiveTab] = useState<"all" | TrackingStatus>("all");
  const [selectedId, setSelectedId] = useState<string | null>(trackingRows[0]?.id ?? null);

  const rows = activeTab === "all" ? trackingRows : trackingRows.filter((r) => r.status === activeTab);
  const selected = trackingRows.find((r) => r.id === selectedId) ?? null;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-foreground">ติดตามเคส</h1>
        <p className="text-sm text-muted-foreground">ติดตามสถานะและความคืบหน้าของเคสทั้งหมด</p>
      </div>

      <TrackingStatsRow />

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
            {tab.label} {countFor(tab.key)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-3 lg:col-span-2">
          <div className="flex flex-wrap items-center gap-2">
            <SearchInput placeholder="ค้นหาในรายการนี้..." className="max-w-xs" />
            {["สถานะ: ทั้งหมด", "ความเร่งด่วน: ทั้งหมด", "ผู้รับผิดชอบ: ทั้งหมด"].map((label) => (
              <select key={label} disabled title="ยังไม่เปิดใช้งาน" className="cursor-not-allowed rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground">
                <option>{label}</option>
              </select>
            ))}
            <button type="button" disabled title="ยังไม่เปิดใช้งาน" className="ml-auto flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground">
              <FilterIcon className="h-3.5 w-3.5" /> ตัวกรองเพิ่มเติม
            </button>
          </div>
          <TrackingTable rows={rows} selectedId={selectedId} onSelect={setSelectedId} />
          <p className="text-right text-xs text-t1-gray-400">แสดง 1-{rows.length} จาก {rows.length} รายการ</p>
        </div>
        <div className="lg:col-span-1">
          {selected ? <TrackingDetailPanel row={selected} /> : <Card className="p-10 text-center text-sm text-t1-gray-400">เลือกเคสเพื่อดูความคืบหน้า</Card>}
        </div>
      </div>
    </div>
  );
}
