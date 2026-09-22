"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/SearchInput";
import { CheckCircleIcon, CheckIcon, FilterIcon, RepeatIcon } from "@/components/ui/icons";
import {
  CHANNEL_LABEL,
  COMPLEXITY_OPTIONS,
  ISSUE_CATEGORY_OPTIONS,
  RECOMMENDED_ACTION_OPTIONS,
  SERVICE_CATEGORY_OPTIONS,
  SERVICE_TYPE_OPTIONS,
  announcements,
  completenessChecklist,
  dashboardStats,
  slaRiskRows,
  triageQueueCases,
  waitingForCustomerRows,
  type DashboardStat,
  type ServiceCase,
} from "../mock-data";
import { channelIcon, priorityBadge, slaRiskTextColor } from "../status-colors";

// "Triage" — คิวเต็มของเคสที่รอตรวจสอบและจัดประเภท (ผังหน้าจอที่ผู้ใช้ส่งมา
// 2569-09-08, หน้าที่ 3) ค่าเริ่มต้นแสดงเป็นคิว/ตาราง; กด "Triage" ที่แถวไหน
// (หรือเข้ามาด้วย `?case=`) จะสลับไปโหมดรายละเอียด+ฟอร์ม Triage (ตรงกับ
// ขั้นตอน 2-3 ของ "ผังการใช้งาน Service Operator") — โต้ตอบได้จริงแค่ local
// state (เลือกเคส/กรอกฟอร์ม/กด "บันทึกและส่ง" แล้วเคสย้ายออกจากคิว) ไม่มี
// backend จริง เหมือน `DispatchControl`/`WorkOrderCard` ที่มีอยู่แล้วใน
// thunder-care/work-orders. Reload หน้าแล้วข้อมูลจะรีเซ็ตกลับที่เดิม.
const statColor: Record<DashboardStat["color"], string> = {
  zinc: "text-zinc-900 dark:text-zinc-50",
  amber: "text-amber-600 dark:text-amber-400",
  red: "text-red-600 dark:text-red-400",
  indigo: "text-indigo-600 dark:text-indigo-400",
  emerald: "text-emerald-600 dark:text-emerald-400",
};

const QUEUE_TABS = [
  { key: "pending-triage", label: "รอ Triage" },
  { key: "waiting-info", label: "รอข้อมูลลูกค้า" },
  { key: "sla-risk", label: "ใกล้/เกิน SLA" },
  { key: "new", label: "ทั้งหมด" },
] as const;

interface TriageFormState {
  serviceCategory: string;
  serviceType: string;
  issueCategory: string;
  priority: string;
  complexity: string;
  recommendedAction: string;
}

function initialFormState(serviceCase: ServiceCase): TriageFormState {
  const serviceCategory = SERVICE_CATEGORY_OPTIONS[0];
  return {
    serviceCategory,
    serviceType: SERVICE_TYPE_OPTIONS[serviceCategory][0],
    issueCategory: ISSUE_CATEGORY_OPTIONS[0],
    priority: serviceCase.priority === "high" ? "High" : serviceCase.priority === "medium" ? "Medium" : "Low",
    complexity: COMPLEXITY_OPTIONS[1],
    recommendedAction: RECOMMENDED_ACTION_OPTIONS[0],
  };
}

const selectClasses =
  "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";
const labelClasses = "flex flex-col gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400";

// ===== โหมดคิว (ค่าเริ่มต้นของหน้า) =====

function QueueStatsRow() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {dashboardStats.map((stat) => (
        <Card key={stat.id} className="flex flex-col gap-1 p-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{stat.id === "new" ? "เคสใหม่ (ทั้งหมด)" : stat.label}</p>
          <span className={`text-2xl font-semibold ${statColor[stat.color]}`}>{stat.value}</span>
          <p className="text-xs text-zinc-400">{stat.sublabel}</p>
        </Card>
      ))}
    </div>
  );
}

function QueueTable({ onSelect }: { onSelect: (id: string) => void }) {
  return (
    <Card className="overflow-x-auto">
      <table className="w-full min-w-[820px] text-left text-sm">
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
            <th className="px-3 py-2 font-medium">จัดการ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
          {triageQueueCases.map((row) => {
            const ChannelIcon = channelIcon[row.channel];
            return (
              <tr key={row.id}>
                <td className="px-3 py-2.5">
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
                  <button
                    type="button"
                    onClick={() => onSelect(row.id)}
                    className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
                  >
                    Triage
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}

function QueueSlaRiskCard() {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">SLA Risk (ใกล้/เกิน SLA)</h2>
      <ul className="flex flex-col gap-3">
        {slaRiskRows.map((row) => (
          <li key={row.id} className="flex items-start gap-2.5">
            <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${row.risk === "overdue" ? "bg-red-500" : "bg-amber-500"}`} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{row.customerName}</p>
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{row.issueLabel}</p>
            </div>
            <span className="shrink-0 text-xs font-medium text-zinc-700 dark:text-zinc-200">{row.timeLabel}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function QueueWaitingInfoCard() {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">รายการที่รอข้อมูลลูกค้า</h2>
      <ol className="flex flex-col gap-2.5">
        {waitingForCustomerRows.map((row, index) => (
          <li key={row.id} className="flex items-center gap-2.5 text-sm">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[11px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-zinc-900 dark:text-zinc-50">{row.customerName}</p>
              <p className="truncate text-xs text-zinc-400">{row.reasonLabel}</p>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}

function QueueAnnouncementsCard() {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">ประกาศ / ข่าวสาร</h2>
      <ul className="flex flex-col gap-3">
        {announcements.slice(0, 2).map((row) => (
          <li key={row.id} className="flex flex-col gap-0.5">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{row.title}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{row.detail}</p>
            <p className="text-[11px] text-zinc-400">{row.dateLabel}</p>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function TriageQueueView({ onSelect }: { onSelect: (id: string) => void }) {
  const [activeTab, setActiveTab] = useState<(typeof QUEUE_TABS)[number]["key"]>("pending-triage");

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Triage</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">รายการเคสที่รอการตรวจสอบและจัดประเภท</p>
      </div>

      <QueueStatsRow />

      <div className="flex gap-1 border-b border-zinc-100 dark:border-zinc-800">
        {QUEUE_TABS.map((tab) => {
          const stat = dashboardStats.find((s) => s.id === tab.key);
          return (
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
              {tab.label} {stat?.value ?? ""}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-3 lg:col-span-2">
          <div className="flex flex-wrap items-center gap-2">
            <SearchInput placeholder="ค้นหาในรายการนี้..." className="max-w-xs" />
            {["สถานะ: ทั้งหมด", "ความเร่งด่วน: ทั้งหมด", "ช่องทาง: ทั้งหมด", "ลูกค้า: ทั้งหมด"].map((label) => (
              <select key={label} disabled title="ยังไม่เปิดใช้งาน" className="cursor-not-allowed rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                <option>{label}</option>
              </select>
            ))}
            <button type="button" disabled title="ยังไม่เปิดใช้งาน" className="flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
              <FilterIcon className="h-3.5 w-3.5" /> ตัวกรองเพิ่มเติม
            </button>
            <button type="button" disabled title="ยังไม่เปิดใช้งาน" className="cursor-not-allowed text-zinc-400">
              <RepeatIcon className="h-4 w-4" />
            </button>
          </div>
          <QueueTable onSelect={onSelect} />
          <p className="text-right text-xs text-zinc-400">แสดง 1-{triageQueueCases.length} จาก {triageQueueCases.length} รายการ</p>
        </div>
        <div className="flex flex-col gap-4">
          <QueueSlaRiskCard />
          <QueueWaitingInfoCard />
          <QueueAnnouncementsCard />
        </div>
      </div>
    </div>
  );
}

// ===== โหมดรายละเอียด + ฟอร์ม Triage (หลังเลือกเคส) =====

function CaseListItem({
  serviceCase,
  active,
  dispatched,
  onSelect,
}: {
  serviceCase: ServiceCase;
  active: boolean;
  dispatched: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={dispatched}
      className={`flex w-full flex-col gap-1 rounded-xl border p-3 text-left transition ${
        dispatched
          ? "cursor-not-allowed border-zinc-100 bg-zinc-50 opacity-60 dark:border-zinc-900 dark:bg-zinc-900/50"
          : active
            ? "border-indigo-300 bg-indigo-50/50 dark:border-indigo-500/40 dark:bg-indigo-500/10"
            : "border-zinc-100 hover:border-zinc-200 dark:border-zinc-800 dark:hover:border-zinc-700"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{serviceCase.id}</span>
        {dispatched ? (
          <Badge variant="pill" color="green">ส่งแล้ว</Badge>
        ) : (
          <Badge variant="pill" color={priorityBadge[serviceCase.priority].color}>
            {priorityBadge[serviceCase.priority].label}
          </Badge>
        )}
      </div>
      <p className="truncate text-xs text-zinc-600 dark:text-zinc-300">{serviceCase.title}</p>
      <p className="truncate text-xs text-zinc-400">{serviceCase.customerName}</p>
    </button>
  );
}

function CompletenessCard() {
  return (
    <Card className="flex flex-col gap-2 p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">ตรวจสอบความครบถ้วน</h3>
      <ul className="flex flex-col gap-1.5">
        {completenessChecklist.map((item) => (
          <li key={item.label} className="flex items-center gap-2 text-sm">
            <CheckIcon className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
            <span className="text-zinc-700 dark:text-zinc-200">{item.label}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function TriageForm({ serviceCase, onSubmit }: { serviceCase: ServiceCase; onSubmit: () => void }) {
  const [form, setForm] = useState<TriageFormState>(() => initialFormState(serviceCase));

  return (
    <Card className="flex flex-col gap-4 p-4">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Triage</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className={labelClasses}>
          Service Category
          <select
            value={form.serviceCategory}
            onChange={(e) => {
              const serviceCategory = e.target.value;
              setForm((prev) => ({ ...prev, serviceCategory, serviceType: SERVICE_TYPE_OPTIONS[serviceCategory][0] }));
            }}
            className={selectClasses}
          >
            {SERVICE_CATEGORY_OPTIONS.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
        <label className={labelClasses}>
          Service Type
          <select
            value={form.serviceType}
            onChange={(e) => setForm((prev) => ({ ...prev, serviceType: e.target.value }))}
            className={selectClasses}
          >
            {SERVICE_TYPE_OPTIONS[form.serviceCategory].map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
        <label className={labelClasses}>
          Issue Category
          <select
            value={form.issueCategory}
            onChange={(e) => setForm((prev) => ({ ...prev, issueCategory: e.target.value }))}
            className={selectClasses}
          >
            {ISSUE_CATEGORY_OPTIONS.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
        <label className={labelClasses}>
          Priority
          <select
            value={form.priority}
            onChange={(e) => setForm((prev) => ({ ...prev, priority: e.target.value }))}
            className={selectClasses}
          >
            {["High", "Medium", "Low"].map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
        <label className={labelClasses}>
          Complexity
          <select
            value={form.complexity}
            onChange={(e) => setForm((prev) => ({ ...prev, complexity: e.target.value }))}
            className={selectClasses}
          >
            {COMPLEXITY_OPTIONS.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
        <label className={labelClasses}>
          Recommended Action
          <select
            value={form.recommendedAction}
            onChange={(e) => setForm((prev) => ({ ...prev, recommendedAction: e.target.value }))}
            className={selectClasses}
          >
            {RECOMMENDED_ACTION_OPTIONS.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex justify-end">
        <Button variant="primary" onClick={onSubmit}>
          บันทึกและส่ง
        </Button>
      </div>
    </Card>
  );
}

function DispatchedConfirmation({ serviceCase }: { serviceCase: ServiceCase }) {
  return (
    <Card className="flex flex-col items-center gap-2 p-8 text-center">
      <CheckCircleIcon className="h-9 w-9 text-emerald-500" />
      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">ส่งสำเร็จ</p>
      <p className="text-xs text-zinc-400">Status: Ready to Dispatch</p>
      <p className="text-xs text-zinc-400">
        {serviceCase.id} · {serviceCase.title}
      </p>
    </Card>
  );
}

function TriageDetailView({ initialCaseId, onBack }: { initialCaseId: string; onBack: () => void }) {
  const [dispatchedIds, setDispatchedIds] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string>(initialCaseId);

  const selectedCase = triageQueueCases.find((c) => c.id === selectedId) ?? null;
  const isDispatched = dispatchedIds.has(selectedId);

  function handleDispatch() {
    setDispatchedIds((prev) => new Set(prev).add(selectedId));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Triage</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">ตรวจสอบความครบถ้วนแล้วจัดประเภท/ลำดับความสำคัญก่อนส่งต่อ Dispatcher</p>
        </div>
        <button type="button" onClick={onBack} className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
          ← กลับไปที่คิว
        </button>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="flex flex-col gap-2 p-3 lg:col-span-1">
          {triageQueueCases.map((c) => (
            <CaseListItem
              key={c.id}
              serviceCase={c}
              active={c.id === selectedId}
              dispatched={dispatchedIds.has(c.id)}
              onSelect={() => setSelectedId(c.id)}
            />
          ))}
        </Card>

        <div className="flex flex-col gap-4 lg:col-span-2">
          {!selectedCase ? (
            <Card className="p-10 text-center text-sm text-zinc-400">เลือกเคสจากรายการด้านซ้ายเพื่อเริ่ม Triage</Card>
          ) : (
            <>
              <Card className="flex flex-col gap-2 p-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {selectedCase.id} · {selectedCase.title}
                  </h2>
                  <span className={`text-xs font-medium ${slaRiskTextColor[selectedCase.slaRisk]}`}>SLA {selectedCase.slaRemainingLabel}</span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {selectedCase.customerName} · {selectedCase.branchLabel}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Asset: {selectedCase.assetTag} ({selectedCase.assetLabel})
                </p>
                <p className="text-xs text-zinc-400">
                  แจ้งเมื่อ {selectedCase.reportedAtLabel} · ผ่านช่องทาง {CHANNEL_LABEL[selectedCase.channel]}
                </p>
              </Card>

              <CompletenessCard />

              {isDispatched ? (
                <DispatchedConfirmation serviceCase={selectedCase} />
              ) : (
                <TriageForm serviceCase={selectedCase} onSubmit={handleDispatch} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ===== ตัวควบคุมโหมด (คิว ↔ รายละเอียด) =====

export function TriagePage({ initialCaseId }: { initialCaseId?: string }) {
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(
    initialCaseId && triageQueueCases.some((c) => c.id === initialCaseId) ? initialCaseId : null
  );

  if (selectedCaseId) {
    return <TriageDetailView initialCaseId={selectedCaseId} onBack={() => setSelectedCaseId(null)} />;
  }
  return <TriageQueueView onSelect={setSelectedCaseId} />;
}
