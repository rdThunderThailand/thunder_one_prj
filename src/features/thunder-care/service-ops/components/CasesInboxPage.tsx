"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button, buttonClasses } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/SearchInput";
import { FilterIcon, ImageIcon, XIcon } from "@/components/ui/icons";
import { CHANNEL_LABEL, INBOX_STATUS_LABEL, getCaseDetail, inboxCases, type InboxCase, type InboxStatus } from "../mock-data";
import { channelIcon, inboxStatusColor, priorityBadge, slaRiskTextColor } from "../status-colors";

// "เคสจากลูกค้า" — inbox เต็มของทุกเคสที่ลูกค้าส่งเข้ามาทุกช่องทาง (ผังหน้าจอ
// ที่ผู้ใช้ส่งมา 2569-09-08, หน้าที่ 2 ของชุดนี้). Tab/filter เป็นแค่ UI mock
// (ธรรมเนียมเดียวกับ people/personnel's PersonnelFilterBar — ตัวกรองจริงจะ
// ผูกกับ backend ทีหลัง), การเลือกแถวเพื่อดู panel ด้านขวาเป็น local state จริง.
const TABS: { key: "all" | InboxStatus; label: string }[] = [
  { key: "all", label: "ทั้งหมด" },
  { key: "unhandled", label: "ยังไม่ได้จัดการ" },
  { key: "waiting_customer", label: "รอข้อมูลลูกค้า" },
  { key: "pending_triage", label: "รอ Triage" },
];

function countFor(tab: "all" | InboxStatus): number {
  return tab === "all" ? inboxCases.length : inboxCases.filter((c) => c.status === tab).length;
}

function InboxStatTiles() {
  const byChannel = { web: 0, line: 0, phone: 0, email: 0 } as Record<InboxCase["channel"], number>;
  for (const c of inboxCases) byChannel[c.channel] += 1;
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      <Card className="flex flex-col gap-1 p-4">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">เคสเข้าใหม่ (ทั้งหมด)</p>
        <span className="text-2xl font-semibold text-indigo-600 dark:text-indigo-400">{inboxCases.length}</span>
        <p className="text-xs text-zinc-400">วันนี้ {inboxCases.length} รายการ</p>
      </Card>
      {(["web", "line", "email", "phone"] as const).map((channel) => (
        <Card key={channel} className="flex flex-col gap-1 p-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">จาก {CHANNEL_LABEL[channel]}</p>
          <span className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{byChannel[channel]}</span>
          <p className="text-xs text-zinc-400">รายการ</p>
        </Card>
      ))}
    </div>
  );
}

function FilterRow() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <SearchInput placeholder="ค้นหาในรายการนี้..." className="max-w-xs" />
      {["สถานะ: ทั้งหมด", "ความเร่งด่วน: ทั้งหมด", "ช่องทาง: ทั้งหมด", "ลูกค้า: ทั้งหมด"].map((label) => (
        <select key={label} disabled title="ยังไม่เปิดใช้งาน" className="cursor-not-allowed rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          <option>{label}</option>
        </select>
      ))}
      <button type="button" disabled title="ยังไม่เปิดใช้งาน" className="ml-auto flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        <FilterIcon className="h-3.5 w-3.5" /> ตัวกรองเพิ่มเติม
      </button>
    </div>
  );
}

function CaseDetailPanel({ serviceCase, onClose }: { serviceCase: InboxCase; onClose: () => void }) {
  const detail = getCaseDetail(serviceCase.id);
  return (
    <Card className="flex flex-col gap-4 p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{serviceCase.id}</span>
            <Badge variant="pill" color="indigo">ใหม่</Badge>
          </div>
          <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-50">{serviceCase.title}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="pill" color={priorityBadge[serviceCase.priority].color}>
            {priorityBadge[serviceCase.priority].label}
          </Badge>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
            <XIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-zinc-400">SLA</p>
          <p className={`font-medium ${slaRiskTextColor[serviceCase.slaRisk]}`}>{serviceCase.slaRemainingLabel}</p>
        </div>
        <div>
          <p className="text-zinc-400">เรื่อง</p>
          <p className="font-medium text-zinc-700 dark:text-zinc-200">{serviceCase.reportedAtLabel}</p>
        </div>
        <div>
          <p className="text-zinc-400">ลูกค้า</p>
          <p className="font-medium text-zinc-700 dark:text-zinc-200">{serviceCase.customerName}</p>
          <p className="text-zinc-400">{serviceCase.branchLabel}</p>
        </div>
        <div>
          <p className="text-zinc-400">Asset</p>
          <p className="font-medium text-zinc-700 dark:text-zinc-200">{serviceCase.assetTag}</p>
          <p className="text-zinc-400">{serviceCase.assetLabel}</p>
        </div>
      </div>

      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">รายละเอียดปัญหา</p>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">{detail.description}</p>
      </div>

      {detail.attachmentCount > 0 && (
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">ไฟล์แนบ ({detail.attachmentCount})</p>
          <div className="flex gap-2">
            {Array.from({ length: detail.attachmentCount }).map((_, i) => (
              <div key={i} className="flex h-16 w-16 items-center justify-center rounded-lg bg-zinc-100 text-zinc-300 dark:bg-zinc-800">
                <ImageIcon className="h-5 w-5" />
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">ประวัติความเคลื่อนไหว</p>
        <ul className="flex flex-col gap-1.5">
          {detail.activity.map((row, i) => (
            <li key={i} className="flex items-center justify-between text-xs">
              <span className="text-zinc-600 dark:text-zinc-300">
                <span className="font-medium">{row.actor}</span> {row.action}
              </span>
              <span className="shrink-0 text-zinc-400">{row.atLabel}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-2">
        <Link href={`/thunder-care/service-ops/triage?case=${serviceCase.id}`} className={buttonClasses("primary")}>
          เริ่ม Triage
        </Link>
        <Button variant="secondary" disabled title="ยังไม่เปิดใช้งาน">
          ต้องการข้อมูลเพิ่มเติม
        </Button>
      </div>
    </Card>
  );
}

export function CasesInboxPage() {
  const [activeTab, setActiveTab] = useState<"all" | InboxStatus>("all");
  const [selectedId, setSelectedId] = useState<string | null>(inboxCases[0]?.id ?? null);
  const rows = activeTab === "all" ? inboxCases : inboxCases.filter((c) => c.status === activeTab);
  const selected = inboxCases.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">เคสจากลูกค้า</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">รายการเคสทั้งหมดที่ส่งเข้ามาจากลูกค้าในทุกช่องทาง</p>
      </div>

      <InboxStatTiles />

      <div className="flex gap-1 border-b border-zinc-100 dark:border-zinc-800">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            {tab.label} {countFor(tab.key)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-3 lg:col-span-2">
          <FilterRow />
          <Card className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                <tr>
                  <th className="w-8 px-3 py-2">
                    <input type="checkbox" className="rounded border-zinc-300" disabled title="ยังไม่เปิดใช้งาน" />
                  </th>
                  <th className="px-3 py-2 font-medium">Ticket ID</th>
                  <th className="px-3 py-2 font-medium">เรื่อง / ปัญหา</th>
                  <th className="px-3 py-2 font-medium">ลูกค้า / สาขา</th>
                  <th className="px-3 py-2 font-medium">Asset</th>
                  <th className="px-3 py-2 font-medium">ช่องทาง</th>
                  <th className="px-3 py-2 font-medium">วันเวลา</th>
                  <th className="px-3 py-2 font-medium">ความเร่งด่วน</th>
                  <th className="px-3 py-2 font-medium">SLA</th>
                  <th className="px-3 py-2 font-medium">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
                {rows.map((row) => {
                  const ChannelIcon = channelIcon[row.channel];
                  return (
                    <tr
                      key={row.id}
                      onClick={() => setSelectedId(row.id)}
                      className={`cursor-pointer ${selectedId === row.id ? "bg-indigo-50/60 dark:bg-indigo-500/10" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/40"}`}
                    >
                      <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" className="rounded border-zinc-300" disabled title="ยังไม่เปิดใช้งาน" />
                      </td>
                      <td className="px-3 py-2.5">
                        <p className="font-medium text-zinc-900 dark:text-zinc-50">{row.id}</p>
                        <p className="text-[11px] text-indigo-500">ใหม่</p>
                      </td>
                      <td className="px-3 py-2.5 text-zinc-700 dark:text-zinc-200">{row.title}</td>
                      <td className="px-3 py-2.5 text-zinc-600 dark:text-zinc-300">
                        <p>{row.customerName}</p>
                        <p className="text-xs text-zinc-400">{row.branchLabel}</p>
                      </td>
                      <td className="px-3 py-2.5 text-zinc-600 dark:text-zinc-300">
                        <p>{row.assetTag}</p>
                        <p className="text-xs text-zinc-400">{row.assetLabel}</p>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="inline-flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                          <ChannelIcon className="h-3.5 w-3.5" />
                          {CHANNEL_LABEL[row.channel]}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-xs text-zinc-500 dark:text-zinc-400">{row.reportedAtLabel}</td>
                      <td className="px-3 py-2.5">
                        <Badge variant="pill" color={priorityBadge[row.priority].color}>
                          {priorityBadge[row.priority].label}
                        </Badge>
                      </td>
                      <td className={`whitespace-nowrap px-3 py-2.5 text-xs font-medium ${slaRiskTextColor[row.slaRisk]}`}>{row.slaRemainingLabel}</td>
                      <td className="px-3 py-2.5">
                        <Badge variant="pill" color={inboxStatusColor[row.status]}>
                          {INBOX_STATUS_LABEL[row.status]}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
          <p className="text-right text-xs text-zinc-400">
            แสดง 1-{rows.length} จาก {rows.length} รายการ
          </p>
        </div>

        <div className="lg:col-span-1">
          {selected ? (
            <CaseDetailPanel serviceCase={selected} onClose={() => setSelectedId(null)} />
          ) : (
            <Card className="p-10 text-center text-sm text-zinc-400">เลือกเคสจากตารางเพื่อดูรายละเอียด</Card>
          )}
        </div>
      </div>
    </div>
  );
}
